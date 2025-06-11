
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


export function TeleprompterView() {
  const {
    scriptText,
    fontSize,
    scrollSpeed,
    lineHeight,
    isMirrored,
    darkMode,
    textColor,
    fontFamily,
    isPlaying,
    currentScrollPosition,
    setCurrentScrollPosition,
    setIsPlaying,
  } = useTeleprompterStore();

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
    const focusLine = container.scrollTop + container.clientHeight / 3; // Focus line is 1/3 down the viewport

    let newHighlightedIndex: number | null = null;

    // Special handling for the very top: if scrolled to top, and first paragraph is in view
    if (container.scrollTop < 5 && paragraphRefs.current[0]) {
        const firstPRef = paragraphRefs.current[0];
        // Check if the first paragraph is sufficiently visible and near the top focus area
        if (firstPRef.offsetTop < container.clientHeight / 2 && firstPRef.offsetTop + firstPRef.offsetHeight > container.clientHeight / 4) {
             newHighlightedIndex = 0;
        }
    }
    
    // If not handled by the top case, iterate through paragraphs
    if (newHighlightedIndex === null) {
        for (let i = 0; i < paragraphRefs.current.length; i++) {
            const pRef = paragraphRefs.current[i];
            if (pRef) {
            const pTop = pRef.offsetTop;
            const pBottom = pRef.offsetTop + pRef.offsetHeight;
            // Check if the focus line is within this paragraph
            if (focusLine >= pTop && focusLine < pBottom) {
                newHighlightedIndex = i;
                break;
            }
            }
        }
    }
    
    // Only update state if the highlighted paragraph actually changes
    // This check is internal to the callback, so highlightedParagraphIndex dependency is not strictly needed
    // but setHighlightedParagraphIndex is stable.
    setHighlightedParagraphIndex(prevIndex => {
        if (prevIndex !== newHighlightedIndex) {
            return newHighlightedIndex;
        }
        return prevIndex;
    });
  }, [setHighlightedParagraphIndex]);


  const scrollLoop = useCallback((timestamp: number) => {
    const currentIsPlaying = useTeleprompterStore.getState().isPlaying; // Get fresh state
    if (!currentIsPlaying || !scrollContainerRef.current) {
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
    const currentScrollSpeed = useTeleprompterStore.getState().scrollSpeed; // Get fresh state
    const newScrollTop = container.scrollTop + currentScrollSpeed * deltaTime;

    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      setCurrentScrollPosition(container.scrollTop);
      setIsPlaying(false); // Stop playback at the end
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    } else {
      container.scrollTop = newScrollTop;
      setCurrentScrollPosition(newScrollTop);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    }
    checkHighlightedParagraph();
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (isPlaying) {
      if (scrollContainerRef.current) {
        // Ensure scroll position is synced before starting animation
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
      
      lastTimestampRef.current = 0; // Reset for scrollLoop
      userInteractedRef.current = false; // Reset interaction flag
      justStartedPlayingRef.current = true; // Set the flag
      
      // Clear the flag after a short delay
      timerId = setTimeout(() => {
        justStartedPlayingRef.current = false;
      }, 150); // 150ms window

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      // Cleanup if playback stops
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timerId) {
        clearTimeout(timerId); // Clear timeout if playback stops before it fires
      }
      justStartedPlayingRef.current = false; // Ensure flag is false if stopped
    }
    
    return () => { // Cleanup on unmount or before effect re-runs
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


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentPhysicalScroll = container.scrollTop;

    // If playback just started (within the 150ms window),
    // only update position and check highlight. Do NOT treat as intervention.
    if (justStartedPlayingRef.current) {
      setCurrentScrollPosition(currentPhysicalScroll);
      checkHighlightedParagraph();
      return; 
    }

    // Get current playing state from the store
    const storeState = useTeleprompterStore.getState(); 

    // If store says not playing (e.g., paused by user, reached end, or already intervened)
    // then simply update our current scroll position.
    if (!storeState.isPlaying) {
       setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph();
       return;
    }
    
    // If we reach here, storeState.isPlaying is true AND justStartedPlayingRef.current is false.
    // This is the window where we check for genuine manual scroll intervention.
    const calculatedThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
    const scrollThreshold = Math.max(MIN_SCROLL_INTERVENTION_THRESHOLD_PX, calculatedThreshold);
    
    // Compare physical scroll with the store's last known automated scroll position.
    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
      userInteractedRef.current = true; 
      setIsPlaying(false); // Stop playback
      setCurrentScrollPosition(currentPhysicalScroll); // Update to user's position
    } else {
      // Scroll is within automated range or too small, just update position.
      setCurrentScrollPosition(currentPhysicalScroll);
    }

    checkHighlightedParagraph();
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  useEffect(() => {
    if (scrollContainerRef.current) {
      // Only force scroll position if not playing. If playing, scrollLoop handles it.
      if(!isPlaying) {
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
    }
  }, [currentScrollPosition, isPlaying]);


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Debounce or throttle could be added here if scroll events are too frequent
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]); // handleScroll is now stable if its dependencies are stable

  // Recalculate highlight when script or styling changes
  useEffect(() => {
    setHighlightedParagraphIndex(null); // Reset first
    const timer = setTimeout(() => {
       checkHighlightedParagraph(); // Then recalculate
    }, 50); // Small delay to allow DOM updates
    return () => clearTimeout(timer);
  }, [scriptText, fontFamily, fontSize, lineHeight, checkHighlightedParagraph]);


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
            {/* Render a non-breaking space for empty lines to maintain layout and height */}
            {line.trim() === "" && paragraphBlock.split('\n').length > 1 ? <>&nbsp;</> : (line || <>&nbsp;</>)}
          </p>
        ))}
      </div>
    ));
  }, [scriptText, highlightedParagraphIndex]);

  const currentTextColor = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  const currentFontFamily = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  const teleprompterContainerStyles: React.CSSProperties = {
    color: currentTextColor,
    fontFamily: currentFontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
  };

  const scriptContentStyles: React.CSSProperties = {};

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        (!isMounted ? VIEW_SSR_DEFAULT_DARK_MODE : darkMode) ? "bg-gray-900" : "bg-gray-50",
      )}
      style={teleprompterContainerStyles}
      tabIndex={0} // Allows the div to be focused, potentially for keyboard events (though global listener is used)
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      <div
        className="select-none" // Prevents text selection during scrolling
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

