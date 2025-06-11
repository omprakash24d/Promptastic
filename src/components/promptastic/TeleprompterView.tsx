
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
    focusLinePercentage, // Get new setting
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
    // Use focusLinePercentage from store
    const focusLine = container.scrollTop + container.clientHeight * focusLinePercentage; 

    let newHighlightedIndex: number | null = null;

    // Special handling for the very top: if scrolled to top, and first paragraph is in view
    if (container.scrollTop < 5 && paragraphRefs.current[0]) {
        const firstPRef = paragraphRefs.current[0];
        // Check if the first paragraph is sufficiently visible and near the top focus area
        if (firstPRef.offsetTop < container.clientHeight * focusLinePercentage + firstPRef.offsetHeight * 0.5 && 
            firstPRef.offsetTop + firstPRef.offsetHeight > container.clientHeight * focusLinePercentage - firstPRef.offsetHeight * 0.5) {
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
    const currentIsPlaying = useTeleprompterStore.getState().isPlaying; 
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
    const currentScrollSpeed = useTeleprompterStore.getState().scrollSpeed; 
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
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
      
      lastTimestampRef.current = 0; 
      userInteractedRef.current = false; 
      justStartedPlayingRef.current = true; 
      
      timerId = setTimeout(() => {
        justStartedPlayingRef.current = false;
      }, 150); 

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timerId) {
        clearTimeout(timerId); 
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
  }, [isPlaying, scrollLoop, currentScrollPosition]);


  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentPhysicalScroll = container.scrollTop;

    if (justStartedPlayingRef.current) {
      setCurrentScrollPosition(currentPhysicalScroll);
      checkHighlightedParagraph();
      return; 
    }

    const storeState = useTeleprompterStore.getState(); 

    if (!storeState.isPlaying) {
       setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph();
       return;
    }
    
    const calculatedThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
    const scrollThreshold = Math.max(MIN_SCROLL_INTERVENTION_THRESHOLD_PX, calculatedThreshold);
    
    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
      userInteractedRef.current = true; 
      setIsPlaying(false); 
      setCurrentScrollPosition(currentPhysicalScroll); 
    } else {
      setCurrentScrollPosition(currentPhysicalScroll);
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
    setHighlightedParagraphIndex(null); 
    const timer = setTimeout(() => {
       checkHighlightedParagraph(); 
    }, 50); 
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
    position: 'relative', // Needed for absolute positioning of the focus line
  };

  const scriptContentStyles: React.CSSProperties = {};
  
  const focusLineStyle: React.CSSProperties = {
    position: 'absolute',
    top: `calc(${focusLinePercentage * 100}%)`,
    left: '0',
    right: '0',
    height: '2px', // Make it a bit more visible
    backgroundColor: 'hsla(var(--primary), 0.5)', // Use primary color with alpha
    pointerEvents: 'none',
    zIndex: 10, // Ensure it's above the text but below controls if any were overlaid
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

