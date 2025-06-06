
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { cn } from '@/lib/utils';

export function TeleprompterView() {
  const {
    scriptText,
    fontSize,
    scrollSpeed,
    lineHeight,
    isMirrored,
    darkMode, // Used for default text color if not overridden
    textColor, // New: from store
    fontFamily, // New: from store
    isPlaying,
    currentScrollPosition,
    setCurrentScrollPosition,
    setIsPlaying,
  } = useTeleprompterStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const userInteractedRef = useRef<boolean>(false);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState<number | null>(null);

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
      if (firstPRef && firstPRef.offsetTop < container.clientHeight / 3 + firstPRef.offsetHeight / 2) { // check if first para is in focus zone
        newHighlightedIndex = 0;
      }
    }
    setHighlightedParagraphIndex(newHighlightedIndex);
  }, [scriptText]); // scriptText dependency is important

  // Split by double newlines to treat blocks of text as paragraphs for highlighting
  const formattedScriptText = scriptText.split('\n\n').map((paragraphBlock, index) => (
    <div
      key={index}
      ref={(el) => (paragraphRefs.current[index] = el)}
      className={cn(
        "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out", // Use opacity for highlighting
        highlightedParagraphIndex === index ? "opacity-100" : "opacity-60",
      )}
    >
      {paragraphBlock.split('\n').map((line, lineIndex) => (
        <p key={lineIndex} className="mb-1 last:mb-0"> {/* Smaller margin between lines within a block */}
          {line || <>&nbsp;</>}
        </p>
      ))}
    </div>
  ));


  const scrollLoop = useCallback((timestamp: number) => {
    if (!isPlaying || !scrollContainerRef.current) {
      lastTimestampRef.current = 0;
      return;
    }

    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp;
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
      return;
    }
    
    const deltaTime = (timestamp - lastTimestampRef.current) / 1000; // seconds
    lastTimestampRef.current = timestamp;

    const container = scrollContainerRef.current;
    const newScrollTop = container.scrollTop + scrollSpeed * deltaTime;

    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      setCurrentScrollPosition(container.scrollTop);
      setIsPlaying(false);
    } else {
      container.scrollTop = newScrollTop;
      setCurrentScrollPosition(newScrollTop);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    }
    checkHighlightedParagraph();
  }, [isPlaying, scrollSpeed, setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);

  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = 0;
      userInteractedRef.current = false;
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, scrollLoop]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Only set scrollTop if not playing to allow animation to control it
      if(!isPlaying) {
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
    }
    // Always check highlight, even if scroll was set by animation
    checkHighlightedParagraph();
  }, [currentScrollPosition, checkHighlightedParagraph, isPlaying]);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPhysicalScroll = container.scrollTop;
      if (!isPlaying) {
         setCurrentScrollPosition(currentPhysicalScroll);
      } else {
        // If playing and user manually scrolls significantly, pause playback
        if (Math.abs(currentPhysicalScroll - get().currentScrollPosition) > scrollSpeed / 60 * 5 ) { // 5 frames worth of scroll
          userInteractedRef.current = true;
          setIsPlaying(false);
          setCurrentScrollPosition(currentPhysicalScroll); // Update store with user's scroll
        }
      }
      checkHighlightedParagraph();
    };
    
    // Debounce or throttle might be good here if performance issues arise
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isPlaying, setIsPlaying, setCurrentScrollPosition, scrollSpeed, checkHighlightedParagraph, useTeleprompterStore.getState]); // Add getState for direct access in listener

  useEffect(() => {
    setHighlightedParagraphIndex(null); 
    const timer = setTimeout(() => {
       checkHighlightedParagraph();
    }, 0);
    return () => clearTimeout(timer);
  }, [scriptText, checkHighlightedParagraph, fontFamily, fontSize, lineHeight]); // Re-check on style changes that affect layout

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        darkMode ? "bg-gray-900" : "bg-gray-50",
      )}
      style={{
        // Apply custom text color and font family from store
        color: textColor, 
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        transform: isMirrored ? 'scaleX(-1)' : 'none',
      }}
      tabIndex={0}
    >
      <div 
        className="select-none"
        style={{ 
          transform: isMirrored ? 'scaleX(-1)' : 'none',
          // Centering text can be nice for teleprompters
          // textAlign: 'center', // Uncomment if centered text is desired
        }}
      >
        {/* Ensure highlighted text has primary color if not using opacity based highlighting */}
        {/* This requires modifying the formattedScriptText logic if we bring back text-primary for highlight */}
        {formattedScriptText}
      </div>
    </div>
  );
}
