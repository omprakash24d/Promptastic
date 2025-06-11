
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
const PLAYBACK_START_GRACE_PERIOD_MS = 200; // Increased grace period


export function TeleprompterView() {
  const {
    scriptText,
    fontSize,
    lineHeight,
    isMirrored,
    darkMode,
    textColor,
    fontFamily,
    // focusLinePercentage is selected separately for stable callback
    isPlaying,
    // currentScrollPosition is read fresh or set via setters
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


  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const userInteractedRef = useRef<boolean>(false);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const justStartedPlayingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    paragraphRefs.current = paragraphRefs.current.slice(0, scriptText.split('\n\n').length);
  }, [scriptText]);

  const checkHighlightedParagraph = useCallback(() => {
    if (!scrollContainerRef.current || paragraphRefs.current.length === 0) {
      setHighlightedParagraphIndex(null);
      return;
    }
    const container = scrollContainerRef.current;
    const currentFocusLinePercentage = focusLinePercentage; // Use value from selector
    const focusLine = container.scrollTop + container.clientHeight * currentFocusLinePercentage;

    let newHighlightedIndex: number | null = null;

    if (container.scrollTop < 5 && paragraphRefs.current.length > 0 && paragraphRefs.current[0]) {
        const firstPRef = paragraphRefs.current[0];
        const pTop = firstPRef.offsetTop;
        const pBottom = pTop + firstPRef.offsetHeight;
        if (focusLine >= pTop && focusLine < pBottom) {
             newHighlightedIndex = 0;
        }
    }

    if (newHighlightedIndex === null) {
        for (let i = 0; i < paragraphRefs.current.length; i++) {
            const pRef = paragraphRefs.current[i];
            if (pRef) {
            const pTop = pRef.offsetTop;
            const pBottom = pRef.offsetTop + pRef.offsetHeight;
            if (focusLine >= pTop && focusLine < pBottom) {
                newHighlightedIndex = i;
                break;
            }
            }
        }
    }
    // Only update state if the index actually changes
    setHighlightedParagraphIndex(prevIndex => prevIndex !== newHighlightedIndex ? newHighlightedIndex : prevIndex);
  }, [setHighlightedParagraphIndex, focusLinePercentage]);


  const scrollLoop = useCallback((timestamp: number) => {
    const currentStore = useTeleprompterStore.getState();
    if (!currentStore.isPlaying || !scrollContainerRef.current) {
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
    const newScrollTop = container.scrollTop + currentStore.scrollSpeed * deltaTime;

    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight); // Ensure not negative
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

    const storeState = useTeleprompterStore.getState(); // Get fresh state

    // If playback just started (within grace period) AND playback is intended,
    // DO NOTHING with the scroll event. The scrollLoop is responsible for updates.
    // The initial scroll position is set by the useEffect hook when isPlaying becomes true.
    if (justStartedPlayingRef.current && storeState.isPlaying) {
      return;
    }

    const currentPhysicalScroll = container.scrollTop;

    if (!storeState.isPlaying) {
       // This is a manual scroll when not playing.
       setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph();
       return;
    }

    // If we reach here, playback is active AND the grace period is over.
    // Check for user intervention.
    const calculatedThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
    const scrollThreshold = Math.max(MIN_SCROLL_INTERVENTION_THRESHOLD_PX, calculatedThreshold);

    // Compare physical scroll with the store's last known automated scroll position
    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
      userInteractedRef.current = true; // Mark that user has interacted
      setIsPlaying(false); // Stop playback
      setCurrentScrollPosition(currentPhysicalScroll); // Update to the new manual position
      // checkHighlightedParagraph() will be called by the isPlaying useEffect's else/cleanup.
    } else {
      // Scroll is within tolerance, likely from the scrollLoop or minor drift.
      // Sync store's position with the physical reality if it's not an intervention.
      setCurrentScrollPosition(currentPhysicalScroll);
      // Highlighting is primarily driven by scrollLoop, or when stopping.
    }
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  useEffect(() => {
    let gracePeriodTimerId: NodeJS.Timeout | null = null;
    // animationFrameId is managed by animationFrameIdRef now for consistent cleanup
    
    if (isPlaying) {
      if (scrollContainerRef.current) {
        // CRITICAL: Sync physical scroll to store's position when playback starts
        // Read the absolute latest scroll position from the store here.
        scrollContainerRef.current.scrollTop = useTeleprompterStore.getState().currentScrollPosition;
      }

      lastTimestampRef.current = 0; // Reset for scrollLoop
      userInteractedRef.current = false; // Reset intervention flag
      justStartedPlayingRef.current = true; // Set the grace period flag

      gracePeriodTimerId = setTimeout(() => {
        justStartedPlayingRef.current = false; // Clear the flag after grace period
      }, PLAYBACK_START_GRACE_PERIOD_MS);

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      // Cleanup when isPlaying becomes false (either by user, end of script, or intervention)
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (gracePeriodTimerId) {
        clearTimeout(gracePeriodTimerId);
      }
      justStartedPlayingRef.current = false; // Ensure flag is cleared if playback stops early
      lastTimestampRef.current = 0; // Reset last timestamp for next play
      
      // Always check highlight when playback stops for any reason.
      // This ensures the highlight is correct based on the final scroll position.
      checkHighlightedParagraph(); 
    }

    return () => { // Cleanup on unmount or before effect re-runs if isPlaying changes
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (gracePeriodTimerId) {
        clearTimeout(gracePeriodTimerId);
      }
      justStartedPlayingRef.current = false;
    };
  }, [isPlaying, scrollLoop, checkHighlightedParagraph]); // Dependencies are crucial


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Add passive: true for potentially better scroll performance on touch devices,
    // though not strictly necessary for mouse wheel.
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setHighlightedParagraphIndex(null); // Reset before check
    const timer = setTimeout(() => {
       checkHighlightedParagraph();
    }, 50); // Delay allows DOM to update before checking highlight
    return () => clearTimeout(timer);
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
            {/* Ensure empty lines still take up space */}
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
