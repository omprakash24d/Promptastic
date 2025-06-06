
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { cn } from '@/lib/utils';

// Define SSR-safe defaults directly or import from a shared constants location if preferred
const SERVER_DEFAULT_TEXT_COLOR = 'hsl(0 0% 0%)'; // Black (matches INITIAL_TEXT_COLOR_LIGHT_MODE)
const SERVER_DEFAULT_FONT_FAMILY = 'Arial, sans-serif'; // Matches INITIAL_FONT_FAMILY
const SERVER_DEFAULT_DARK_MODE = false; // Light mode

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
  }, [scriptText]); 

  const formattedScriptText = scriptText.split('\n\n').map((paragraphBlock, index) => (
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
      if(!isPlaying) {
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
    }
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
        if (Math.abs(currentPhysicalScroll - useTeleprompterStore.getState().currentScrollPosition) > scrollSpeed / 60 * 5 ) { 
          userInteractedRef.current = true;
          setIsPlaying(false);
          setCurrentScrollPosition(currentPhysicalScroll); 
        }
      }
      checkHighlightedParagraph();
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isPlaying, setIsPlaying, setCurrentScrollPosition, scrollSpeed, checkHighlightedParagraph]); 

  useEffect(() => {
    setHighlightedParagraphIndex(null); 
    const timer = setTimeout(() => {
       checkHighlightedParagraph();
    }, 0);
    return () => clearTimeout(timer);
  }, [scriptText, checkHighlightedParagraph, fontFamily, fontSize, lineHeight]); 

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        // Use SSR-safe default for className logic before client hydration
        (!isMounted ? SERVER_DEFAULT_DARK_MODE : darkMode) ? "bg-gray-900" : "bg-gray-50",
      )}
      style={{
        // Use SSR-safe defaults for style properties before client hydration
        color: !isMounted ? SERVER_DEFAULT_TEXT_COLOR : textColor, 
        fontFamily: !isMounted ? SERVER_DEFAULT_FONT_FAMILY : fontFamily,
        fontSize: `${fontSize}px`, // fontSize is generally safe if its initial store value is static
        lineHeight: lineHeight,    // lineHeight is also generally safe
        transform: isMirrored ? 'scaleX(-1)' : 'none',
      }}
      tabIndex={0}
    >
      <div 
        className="select-none"
        style={{ 
          transform: isMirrored ? 'scaleX(-1)' : 'none',
        }}
      >
        {formattedScriptText}
      </div>
    </div>
  );
}
