
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback } from 'react';
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

  const formattedScriptText = scriptText.split('\n').map((paragraph, index) => (
    <p key={index} className="mb-2 last:mb-0">{paragraph || <>&nbsp;</>}</p>
  ));

  const scrollLoop = useCallback((timestamp: number) => {
    if (!isPlaying || !scrollContainerRef.current) {
      lastTimestampRef.current = 0; // Reset timestamp when paused
      return;
    }

    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp; // Initialize on first frame
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
      setIsPlaying(false); // Stop when end is reached
    } else {
      container.scrollTop = newScrollTop;
      setCurrentScrollPosition(newScrollTop);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    }
  }, [isPlaying, scrollSpeed, setCurrentScrollPosition, setIsPlaying]);

  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = 0; // Reset timestamp when play starts/resumes
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
  }, [currentScrollPosition]);
  
  // Handle manual scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isPlaying) { // If not playing, just update position
         setCurrentScrollPosition(container.scrollTop);
         return;
      }
      // If playing and scroll is not caused by animation loop (user scroll)
      // A small threshold to differentiate user scroll from animation scroll
      if (Math.abs(container.scrollTop - currentScrollPosition) > scrollSpeed / 60 * 2 ) { // scrollSpeed/60 is roughly px per frame
        if (isPlaying) {
            userInteractedRef.current = true;
            setIsPlaying(false); // Pause on manual scroll
        }
        setCurrentScrollPosition(container.scrollTop);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isPlaying, setIsPlaying, setCurrentScrollPosition, scrollSpeed, currentScrollPosition]);


  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900",
      )}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        transform: isMirrored ? 'scaleX(-1)' : 'none',
      }}
      tabIndex={0} // Make it focusable for potential keyboard controls
    >
      <div 
        className="select-none"
        style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }} // Counter-transform text if container is mirrored
      >
        {formattedScriptText}
      </div>
    </div>
  );
}
