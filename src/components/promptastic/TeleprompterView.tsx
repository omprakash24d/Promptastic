
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
    const focusLine = container.scrollTop + container.clientHeight / 3; // Consider top 1/3 of the screen as focus

    let newHighlightedIndex: number | null = null;

    // Special case: if at the very top, and first paragraph is in view
    if (container.scrollTop === 0 && paragraphRefs.current[0]) {
      const firstPRef = paragraphRefs.current[0];
      if (firstPRef.offsetTop + firstPRef.offsetHeight > container.clientHeight / 4 && firstPRef.offsetTop < container.clientHeight / 2) {
         newHighlightedIndex = 0;
      }
    }

    if (newHighlightedIndex === null) { // If not already set by the top-of-scroll check
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
    
    setHighlightedParagraphIndex(newHighlightedIndex);
  }, [setHighlightedParagraphIndex]); // Dependencies are stable, primarily state setter


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
      justStartedPlayingRef.current = false; 
    }
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timerId) {
        clearTimeout(timerId);
      }
      justStartedPlayingRef.current = false; 
    };
  }, [isPlaying, scrollLoop]);


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (justStartedPlayingRef.current) {
      setCurrentScrollPosition(container.scrollTop);
      checkHighlightedParagraph();
      return;
    }

    const currentPhysicalScroll = container.scrollTop;
    const storeState = useTeleprompterStore.getState(); 

    if (!storeState.isPlaying) {
       setCurrentScrollPosition(currentPhysicalScroll);
    } else {
      const scrollThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
      
      if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
        userInteractedRef.current = true; 
        setIsPlaying(false); 
        setCurrentScrollPosition(currentPhysicalScroll); 
      } else {
         setCurrentScrollPosition(currentPhysicalScroll);
      }
    }
    checkHighlightedParagraph();
  }, [setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);


  useEffect(() => {
    if (scrollContainerRef.current) {
      if(!isPlaying) {
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
    }
  }, [currentScrollPosition, isPlaying]);


  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setHighlightedParagraphIndex(null); // Reset highlight
    const timer = setTimeout(() => {
       checkHighlightedParagraph(); // Check after other state updates settle
    }, 50); // Short delay to allow DOM updates from scriptText/style changes
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
            {line || <>&nbsp;</>} {/* Render non-breaking space for empty lines to maintain height */}
          </p>
        ))}
      </div>
    ));
  }, [scriptText, highlightedParagraphIndex]);

  const currentTextColor = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  const currentFontFamily = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  // Renamed style objects
  const teleprompterContainerStyles: React.CSSProperties = {
    color: currentTextColor,
    fontFamily: currentFontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform, // Mirror mode applied to the outer scroll container
  };

  const scriptContentStyles: React.CSSProperties = {
    // No transform needed here if outer container is mirrored
    // transform: mirrorTransform,  // This would double-mirror if outer is also mirrored
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
      tabIndex={0}
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      <div
        className="select-none"
        style={scriptContentStyles} // Apply inner styles
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

