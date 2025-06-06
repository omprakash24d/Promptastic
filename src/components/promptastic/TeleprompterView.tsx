
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
    darkMode,
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

  // Ensure paragraphRefs array has the correct length
  useEffect(() => {
    paragraphRefs.current = paragraphRefs.current.slice(0, scriptText.split('\n').length);
  }, [scriptText]);

  const checkHighlightedParagraph = useCallback(() => {
    if (!scrollContainerRef.current || paragraphRefs.current.length === 0) {
      setHighlightedParagraphIndex(null);
      return;
    }
    const container = scrollContainerRef.current;
    // Focus line is about 1/3rd from the top of the visible area
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
      // If at the top and nothing is highlighted, highlight the first paragraph if visible
      const firstPRef = paragraphRefs.current[0];
      if (firstPRef && firstPRef.offsetTop < container.clientHeight / 3) {
        newHighlightedIndex = 0;
      }
    }
    setHighlightedParagraphIndex(newHighlightedIndex);
  }, [scriptText]); // Re-evaluate if scriptText changes

  const formattedScriptText = scriptText.split('\n').map((paragraph, index) => (
    <p
      key={index}
      ref={(el) => (paragraphRefs.current[index] = el)}
      className={cn(
        "mb-2 last:mb-0 transition-colors duration-150 ease-in-out",
        highlightedParagraphIndex === index ? "text-primary" : (darkMode ? "text-gray-300" : "text-gray-700")
      )}
    >
      {paragraph || <>&nbsp;</>}
    </p>
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
  }, [isPlaying, scrollSpeed, setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph, scriptText]);

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
      scrollContainerRef.current.scrollTop = currentScrollPosition;
    }
    checkHighlightedParagraph(); // Check highlight when position changes programmatically
  }, [currentScrollPosition, checkHighlightedParagraph]);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isPlaying) {
         setCurrentScrollPosition(container.scrollTop);
      } else {
        if (Math.abs(container.scrollTop - currentScrollPosition) > scrollSpeed / 60 * 2 ) {
          if (isPlaying) {
              userInteractedRef.current = true;
              setIsPlaying(false);
          }
          setCurrentScrollPosition(container.scrollTop);
        }
      }
      checkHighlightedParagraph(); // Check highlight on any scroll
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isPlaying, setIsPlaying, setCurrentScrollPosition, scrollSpeed, currentScrollPosition, checkHighlightedParagraph]);

  // Initial highlight check or when script text changes
  useEffect(() => {
    setHighlightedParagraphIndex(null); // Reset on script change
    // Timeout to allow DOM to update with new paragraph refs
    const timer = setTimeout(() => {
       checkHighlightedParagraph();
    }, 0);
    return () => clearTimeout(timer);
  }, [scriptText, checkHighlightedParagraph]);


  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        darkMode ? "bg-gray-900" : "bg-gray-50", // Base text color is set by paragraph class
      )}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        transform: isMirrored ? 'scaleX(-1)' : 'none',
      }}
      tabIndex={0}
    >
      <div 
        className="select-none"
        style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
      >
        {formattedScriptText}
      </div>
    </div>
  );
}
