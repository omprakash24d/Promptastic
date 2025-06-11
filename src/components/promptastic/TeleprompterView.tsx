
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
  const justStartedPlayingRef = useRef(false); // Ref to ignore initial scroll events after play

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
    const focusLine = container.scrollTop + container.clientHeight / 3;

    let newHighlightedIndex: number | null = null;
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
     if (newHighlightedIndex === null && container.scrollTop === 0 && paragraphRefs.current.length > 0) {
      const firstPRef = paragraphRefs.current[0];
      if (firstPRef && firstPRef.offsetTop < container.clientHeight / 3 + firstPRef.offsetHeight / 2) {
        newHighlightedIndex = 0;
      }
    }
    setHighlightedParagraphIndex(newHighlightedIndex);
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
      setIsPlaying(false);
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
      lastTimestampRef.current = 0;
      userInteractedRef.current = false;
      justStartedPlayingRef.current = true;
      
      timerId = setTimeout(() => {
        justStartedPlayingRef.current = false;
      }, 150); // Ignore scroll events for 150ms after play starts

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      justStartedPlayingRef.current = false; // Ensure it's reset if isPlaying becomes false
    }
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timerId) {
        clearTimeout(timerId);
      }
      justStartedPlayingRef.current = false; // Cleanup on unmount or effect re-run
    };
  }, [isPlaying, scrollLoop]);


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // If justStartedPlayingRef is true, only update scroll position and highlight.
    // Do not consider this scroll event for pausing playback.
    if (justStartedPlayingRef.current) {
      setCurrentScrollPosition(container.scrollTop);
      checkHighlightedParagraph();
      return;
    }

    const currentPhysicalScroll = container.scrollTop;
    const storeState = useTeleprompterStore.getState(); // Get fresh state for decision making

    // If store says it's not playing, then any scroll is just updating position.
    if (!storeState.isPlaying) {
       setCurrentScrollPosition(currentPhysicalScroll);
    } else {
      // Store says it IS playing. This scroll MIGHT be a manual interruption.
      const scrollThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
      
      // Compare physical scroll with the store's last known auto-scroll position.
      if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
        // If deviation is large, assume user interaction.
        userInteractedRef.current = true; 
        setIsPlaying(false); // Stop playback
        setCurrentScrollPosition(currentPhysicalScroll); // Update store with new manual position
      } else {
        // If deviation is small, could be residual programmatic scroll or minor jitter.
        // Still update store's currentScrollPosition to physical reality for next check.
         setCurrentScrollPosition(currentPhysicalScroll);
      }
    }
    checkHighlightedParagraph();
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]); // Dependencies are stable


  useEffect(() => {
    if (scrollContainerRef.current) {
      if(!isPlaying) {
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
    }
    // checkHighlightedParagraph(); // This call might be redundant if currentScrollPosition already triggers it
  }, [currentScrollPosition, isPlaying]); // Removed checkHighlightedParagraph if it's covered


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]); // handleScroll is now memoized

  useEffect(() => {
    setHighlightedParagraphIndex(null); // Reset highlight
    const timer = setTimeout(() => {
       checkHighlightedParagraph(); // Check after other state updates settle
    }, 0);
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
            {line || <>&nbsp;</>}
          </p>
        ))}
      </div>
    ));
  }, [scriptText, highlightedParagraphIndex]);

  const currentTextColor = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  const currentFontFamily = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  const currentViewStyles: React.CSSProperties = {
    color: currentTextColor,
    fontFamily: currentFontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
  };

  const innerContentStyles: React.CSSProperties = {
    transform: mirrorTransform, 
  };

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        (!isMounted ? VIEW_SSR_DEFAULT_DARK_MODE : darkMode) ? "bg-gray-900" : "bg-gray-50",
      )}
      style={currentViewStyles}
      tabIndex={0}
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      <div
        className="select-none"
        style={innerContentStyles}
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
