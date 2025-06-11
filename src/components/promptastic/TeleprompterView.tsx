
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { cn } from '@/lib/utils';

// SSR-safe defaults
const VIEW_SSR_DEFAULT_TEXT_COLOR = 'hsl(0 0% 100%)';
const VIEW_SSR_DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
const VIEW_SSR_DEFAULT_DARK_MODE = true;

// Threshold for detecting user scroll intervention during active playback.
const USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR = 0.5;
const MIN_SCROLL_INTERVENTION_THRESHOLD_PX = 5; // Minimum pixels for intervention
const PLAYBACK_START_GRACE_PERIOD_MS = 200; // Grace period for ignoring scroll events after play


export function TeleprompterView() {
  const {
    scriptText,
    fontSize,
    lineHeight,
    isMirrored,
    darkMode,
    textColor,
    fontFamily,
    isPlaying,
    setCurrentScrollPosition,
    setIsPlaying,
  } = useTeleprompterStore(
    (state) => ({
      scriptText: state.scriptText,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      isMirrored: state.isMirrored,
      darkMode: state.darkMode,
      textColor: state.textColor,
      fontFamily: state.fontFamily,
      isPlaying: state.isPlaying,
      setCurrentScrollPosition: state.setCurrentScrollPosition,
      setIsPlaying: state.setIsPlaying,
    })
  );
  const focusLinePercentage = useTeleprompterStore(state => state.focusLinePercentage);
  const scrollSpeed = useTeleprompterStore(state => state.scrollSpeed);
  const currentScrollPosition = useTeleprompterStore(state => state.currentScrollPosition);


  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const justStartedPlayingRef = useRef(false); // Flag for initial grace period after play
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [highlightedParagraphText, setHighlightedParagraphText] = useState("");


  useEffect(() => {
    setIsMounted(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }

    const handleVisibilityChange = () => {
      if (document.hidden && useTeleprompterStore.getState().isPlaying) {
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setIsPlaying]);

  useEffect(() => {
    paragraphRefs.current = paragraphRefs.current.slice(0, scriptText.split('\n\n').length);
  }, [scriptText]);

  const checkHighlightedParagraph = useCallback(() => {
    if (!scrollContainerRef.current || paragraphRefs.current.length === 0) {
      setHighlightedParagraphIndex(null);
      return;
    }
    const container = scrollContainerRef.current;
    const currentFocusLine = container.scrollTop + container.clientHeight * focusLinePercentage;

    let newHighlightedIndex: number | null = null;

    // Check first paragraph if at top
    if (container.scrollTop < 5 && paragraphRefs.current.length > 0 && paragraphRefs.current[0]) {
        const firstPRef = paragraphRefs.current[0];
        const pTop = firstPRef.offsetTop;
        const pBottom = pTop + firstPRef.offsetHeight;
        if (currentFocusLine >= pTop && currentFocusLine < pBottom) {
             newHighlightedIndex = 0;
        }
    }

    // Iterate if first paragraph not highlighted or not at top
    if (newHighlightedIndex === null) {
        for (let i = 0; i < paragraphRefs.current.length; i++) {
            const pRef = paragraphRefs.current[i];
            if (pRef) {
                const pTop = pRef.offsetTop;
                const pBottom = pTop + pRef.offsetHeight;
                if (currentFocusLine >= pTop && currentFocusLine < pBottom) {
                    newHighlightedIndex = i;
                    break;
                }
            }
        }
    }
    
    setHighlightedParagraphIndex(prevIndex => {
        if (prevIndex !== newHighlightedIndex) {
            if (newHighlightedIndex !== null && paragraphRefs.current[newHighlightedIndex]) {
                setHighlightedParagraphText(paragraphRefs.current[newHighlightedIndex]?.textContent || "");
            } else {
                setHighlightedParagraphText("");
            }
            return newHighlightedIndex;
        }
        return prevIndex;
    });

  }, [focusLinePercentage, setHighlightedParagraphIndex, setHighlightedParagraphText]);


  const scrollLoop = useCallback((timestamp: number) => {
    if (!useTeleprompterStore.getState().isPlaying || !scrollContainerRef.current) {
      lastTimestampRef.current = 0;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp;
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
      return;
    }

    const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    const container = scrollContainerRef.current;
    const currentStoreScrollSpeed = useTeleprompterStore.getState().scrollSpeed; // Get fresh scroll speed
    const newScrollTop = container.scrollTop + currentStoreScrollSpeed * deltaTime;

    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      setCurrentScrollPosition(container.scrollTop);
      setIsPlaying(false);
    } else {
      container.scrollTop = newScrollTop;
      setCurrentScrollPosition(newScrollTop);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    }
    checkHighlightedParagraph();
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const storeState = useTeleprompterStore.getState();

    // During grace period after play, do nothing, scrollLoop handles it.
    if (justStartedPlayingRef.current && storeState.isPlaying) {
      return;
    }
    
    const currentPhysicalScroll = container.scrollTop;

    if (!storeState.isPlaying) {
       setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph();
       return;
    }
    
    // Playback is active, and grace period is over. Check for user intervention.
    const calculatedThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
    const scrollThreshold = Math.max(MIN_SCROLL_INTERVENTION_THRESHOLD_PX, calculatedThreshold);

    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
      setIsPlaying(false); 
      setCurrentScrollPosition(currentPhysicalScroll); 
      // checkHighlightedParagraph() will be called by the isPlaying useEffect's cleanup/else path.
    } else {
      // Sync store's position, usually minor drift or scrollLoop itself.
      setCurrentScrollPosition(currentPhysicalScroll);
    }
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  useEffect(() => {
    let gracePeriodTimerId: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      if (scrollContainerRef.current) {
        // Sync physical scroll to store's position when playback starts
        scrollContainerRef.current.scrollTop = useTeleprompterStore.getState().currentScrollPosition;
      }

      lastTimestampRef.current = 0; 
      justStartedPlayingRef.current = true; 

      gracePeriodTimerId = setTimeout(() => {
        justStartedPlayingRef.current = false; 
      }, PLAYBACK_START_GRACE_PERIOD_MS);

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      // Cleanup when isPlaying becomes false
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (gracePeriodTimerId) {
        clearTimeout(gracePeriodTimerId);
      }
      justStartedPlayingRef.current = false; 
      lastTimestampRef.current = 0; 
      checkHighlightedParagraph(); 
    }

    return () => { 
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (gracePeriodTimerId) {
        clearTimeout(gracePeriodTimerId);
      }
      justStartedPlayingRef.current = false;
    };
  }, [isPlaying, scrollLoop, checkHighlightedParagraph]);


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setHighlightedParagraphIndex(null); // Reset before check
    if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.ready.then(() => {
            checkHighlightedParagraph();
        }).catch(err => {
            console.warn("Error waiting for fonts, checking highlight immediately:", err);
            checkHighlightedParagraph(); // Fallback if font ready promise fails
        });
    } else {
        // Fallback for environments without document.fonts (e.g. older browsers, some test runners)
        const timer = setTimeout(() => {
           checkHighlightedParagraph();
        }, 100); // Slightly longer delay if fonts API not available
        return () => clearTimeout(timer);
    }
  }, [scriptText, fontFamily, fontSize, lineHeight, checkHighlightedParagraph, focusLinePercentage]);


  const formattedScriptText = useMemo(() => {
    return scriptText.split('\n\n').map((paragraphBlock, index) => (
      <div
        key={index}
        ref={(el) => (paragraphRefs.current[index] = el)}
        className={cn(
          "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out",
          highlightedParagraphIndex === index ? "opacity-100" : "opacity-60",
        )}
      >
        {paragraphBlock.split('\n').map((line, lineIndex) => (
          <p key={lineIndex} className="mb-1 last:mb-0">
            {line.trim() === "" ? <>&nbsp;</> : (line || <>&nbsp;</>)}
          </p>
        ))}
      </div>
    ));
  }, [scriptText, highlightedParagraphIndex]);

  const currentTextColorToUse = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  const currentFontFamilyToUse = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const currentDarkMode = !isMounted ? VIEW_SSR_DEFAULT_DARK_MODE : darkMode;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  const teleprompterContainerStyles: React.CSSProperties = {
    color: currentTextColorToUse,
    fontFamily: currentFontFamilyToUse,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
    position: 'relative', 
  };

  const scriptContentStyles: React.CSSProperties = {}; 

  const focusLineStyle: React.CSSProperties = {
    position: 'absolute',
    top: `calc(${focusLinePercentage * 100}%)`,
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: 'hsla(var(--primary), 0.5)',
    pointerEvents: 'none',
    zIndex: 10,
    transition: 'top 0.3s ease-out', 
  };

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        currentDarkMode ? "bg-gray-900" : "bg-gray-50",
      )}
      style={teleprompterContainerStyles}
      tabIndex={0} 
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {highlightedParagraphText}
      </div>
      <div style={focusLineStyle} data-testid="focus-line-overlay" />
      <div
        className="select-none" 
        style={scriptContentStyles}
      >
        {scriptText.trim() === "" ? (
          <p className="text-center opacity-50">
            Your script is empty. Paste your content or load a script to begin.
          </p>
        ) : (
          formattedScriptText
        )}
      </div>
    </div>
  );
}

