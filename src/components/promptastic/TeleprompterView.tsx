
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
    isPlaying,
    currentScrollPosition,
    setCurrentScrollPosition,
    setIsPlaying,
  } = useTeleprompterStore(
    // Selector to pick only the necessary state, helps with re-renders if other parts of store change
    (state) => ({
      scriptText: state.scriptText,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      isMirrored: state.isMirrored,
      darkMode: state.darkMode,
      textColor: state.textColor,
      fontFamily: state.fontFamily,
      focusLinePercentage: state.focusLinePercentage, // Will be used by checkHighlightedParagraph
      isPlaying: state.isPlaying,
      currentScrollPosition: state.currentScrollPosition,
      setCurrentScrollPosition: state.setCurrentScrollPosition,
      setIsPlaying: state.setIsPlaying,
    })
  );
  // Get focusLinePercentage separately for checkHighlightedParagraph dependency
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
    // Read focusLinePercentage from the hook's captured value
    const currentFocusLinePercentage = focusLinePercentage;
    const focusLine = container.scrollTop + container.clientHeight * currentFocusLinePercentage;

    let newHighlightedIndex: number | null = null;

    // Check if at the very top and first paragraph should be highlighted
    if (container.scrollTop < 5 && paragraphRefs.current[0]) {
        const firstPRef = paragraphRefs.current[0];
        const pTop = firstPRef.offsetTop;
        const pBottom = pTop + firstPRef.offsetHeight;
        // Check if the focus line is within the vertical bounds of the first paragraph
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

    setHighlightedParagraphIndex(prevIndex => {
        if (prevIndex !== newHighlightedIndex) {
            return newHighlightedIndex;
        }
        return prevIndex;
    });
  }, [setHighlightedParagraphIndex, focusLinePercentage]);


  const scrollLoop = useCallback((timestamp: number) => {
    const currentIsPlayingState = useTeleprompterStore.getState().isPlaying;
    if (!currentIsPlayingState || !scrollContainerRef.current) {
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
    const currentStoreScrollSpeed = useTeleprompterStore.getState().scrollSpeed;
    const newScrollTop = container.scrollTop + currentStoreScrollSpeed * deltaTime;

    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      setCurrentScrollPosition(container.scrollTop);
      setIsPlaying(false); // This will trigger the useEffect for isPlaying to clean up
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

    // If playback just started (within grace period), DO NOTHING.
    // The scrollLoop is responsible for scroll updates.
    // This prevents click-induced scrolls from stopping playback.
    if (justStartedPlayingRef.current) {
      return;
    }

    const currentPhysicalScroll = container.scrollTop;
    const storeState = useTeleprompterStore.getState();

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

    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
      userInteractedRef.current = true;
      setIsPlaying(false); // This will trigger the useEffect for isPlaying to clean up
      setCurrentScrollPosition(currentPhysicalScroll);
      checkHighlightedParagraph(); // Check highlight after stopping and setting new position
    } else {
      // Scroll is within tolerance, likely from the scrollLoop or minor drift not considered intervention.
      // Sync position to the store.
      setCurrentScrollPosition(currentPhysicalScroll);
      // Highlight check will be driven by scrollLoop, or if it was just paused by intervention (handled above)
    }
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (isPlaying) {
      if (scrollContainerRef.current) {
        // Sync physical scroll to store's position when playback starts
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }

      lastTimestampRef.current = 0;
      userInteractedRef.current = false;
      justStartedPlayingRef.current = true; // Set the flag

      timerId = setTimeout(() => {
        justStartedPlayingRef.current = false; // Clear the flag after grace period
      }, PLAYBACK_START_GRACE_PERIOD_MS);

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      // Cleanup when isPlaying becomes false (either by user, end of script, or intervention)
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timerId) {
        clearTimeout(timerId);
      }
      justStartedPlayingRef.current = false; // Ensure flag is cleared
    }

    return () => { // Cleanup on unmount or before effect re-runs if isPlaying changes
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timerId) {
        clearTimeout(timerId);
      }
      justStartedPlayingRef.current = false;
    };
  }, [isPlaying, scrollLoop, currentScrollPosition]);


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

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
            {line.trim() === "" ? <>&nbsp;</> : (line || <>&nbsp;</>)}
          </p>
        ))}
      </div>
    ));
  }, [scriptText, highlightedParagraphIndex]);

  const currentTextColorToUse = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  const currentFontFamilyToUse = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  const teleprompterContainerStyles: React.CSSProperties = {
    color: currentTextColorToUse,
    fontFamily: currentFontFamilyToUse,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
    position: 'relative', // For the focus line overlay
  };

  const scriptContentStyles: React.CSSProperties = {}; // Kept for potential future use

  const focusLineStyle: React.CSSProperties = {
    position: 'absolute',
    top: `calc(${focusLinePercentage * 100}%)`,
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: 'hsla(var(--primary), 0.5)',
    pointerEvents: 'none',
    zIndex: 10,
    transition: 'top 0.3s ease-out', // Smooth transition if percentage changes
  };

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        (!isMounted ? VIEW_SSR_DEFAULT_DARK_MODE : darkMode) ? "bg-gray-900" : "bg-gray-50",
      )}
      style={teleprompterContainerStyles}
      tabIndex={0} // Make it focusable for keyboard events if needed directly on this div
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      <div style={focusLineStyle} data-testid="focus-line-overlay" />
      <div
        className="select-none" // Prevent text selection during scrolling
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
