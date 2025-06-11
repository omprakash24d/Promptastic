
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { cn } from '@/lib/utils';

// SSR-safe defaults. These are used to prevent hydration mismatches
// if the client-side store initializes with different values than what SSR might imply.
// These constants are specific to this component for its pre-hydration rendering.
const VIEW_SSR_DEFAULT_TEXT_COLOR = 'hsl(0 0% 100%)'; // White (default for dark mode)
const VIEW_SSR_DEFAULT_FONT_FAMILY = 'Arial, sans-serif'; // Matches INITIAL_FONT_FAMILY from store
const VIEW_SSR_DEFAULT_DARK_MODE = true; // Dark mode

// Threshold for detecting user scroll intervention during active playback.
// (Scroll speed is pixels per second, this is approx 5 frames worth of scroll)
const USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR = 5 / 60;


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
  const userInteractedRef = useRef<boolean>(false); // Tracks if user manually scrolled during playback
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState<number | null>(null);

  // isMounted is used to ensure that browser-specific logic or
  // store-dependent styles are only applied after client-side hydration,
  // preventing mismatches with server-rendered HTML. This helps avoid
  // hydration errors if the client-side store (potentially loaded from localStorage)
  // has different initial values (e.g., for darkMode or textColor) than
  // what the server might have assumed for its initial render.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure paragraphRefs array is correctly sized for the current script
  useEffect(() => {
    paragraphRefs.current = paragraphRefs.current.slice(0, scriptText.split('\n\n').length);
  }, [scriptText]);

  // Determines which paragraph is currently in the "focus zone" (e.g., top third of the view)
  const checkHighlightedParagraph = useCallback(() => {
    if (!scrollContainerRef.current || paragraphRefs.current.length === 0) {
      setHighlightedParagraphIndex(null);
      return;
    }
    const container = scrollContainerRef.current;
    // Focus line is roughly 1/3rd down the visible area of the teleprompter.
    const focusLine = container.scrollTop + container.clientHeight / 3;

    let newHighlightedIndex: number | null = null;
    for (let i = 0; i < paragraphRefs.current.length; i++) {
      const pRef = paragraphRefs.current[i];
      if (pRef) {
        const pTop = pRef.offsetTop;
        const pBottom = pRef.offsetTop + pRef.offsetHeight;
        // If the focus line is within this paragraph's bounds
        if (focusLine >= pTop && focusLine < pBottom) {
          newHighlightedIndex = i;
          break;
        }
      }
    }
    // Special case: if scrolled to the very top, and the first paragraph is partially visible
    // and within the focus zone, highlight it.
     if (newHighlightedIndex === null && container.scrollTop === 0 && paragraphRefs.current.length > 0) {
      const firstPRef = paragraphRefs.current[0];
      if (firstPRef && firstPRef.offsetTop < container.clientHeight / 3 + firstPRef.offsetHeight / 2) {
        newHighlightedIndex = 0;
      }
    }
    setHighlightedParagraphIndex(newHighlightedIndex);
  }, []); // Dependencies: relies on paragraphRefs.current, which is updated based on scriptText

  // Memoize the formatted script text to avoid re-computation on every render
  // unless scriptText or highlightedParagraphIndex changes.
  const formattedScriptText = useMemo(() => {
    return scriptText.split('\n\n').map((paragraphBlock, index) => (
      <div
        key={index}
        ref={(el) => (paragraphRefs.current[index] = el)}
        className={cn(
          "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out", 
          highlightedParagraphIndex === index ? "opacity-100" : "opacity-60",
        )}
        // Consider adding aria-current="step" or similar if this paragraph is "active"
      >
        {paragraphBlock.split('\n').map((line, lineIndex) => (
          <p key={lineIndex} className="mb-1 last:mb-0"> 
            {line || <>&nbsp;</>} {/* Render non-breaking space for empty lines to maintain height */}
          </p>
        ))}
      </div>
    ));
  }, [scriptText, highlightedParagraphIndex]);

  // Main scroll animation loop
  const scrollLoop = useCallback((timestamp: number) => {
    if (!isPlaying || !scrollContainerRef.current) {
      lastTimestampRef.current = 0; // Reset timestamp if not playing
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp; // Initialize timestamp on first frame
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
      return;
    }
    
    const deltaTime = (timestamp - lastTimestampRef.current) / 1000; // Delta time in seconds
    lastTimestampRef.current = timestamp;

    const container = scrollContainerRef.current;
    const newScrollTop = container.scrollTop + scrollSpeed * deltaTime;

    // Stop if scrolled to the bottom
    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      setCurrentScrollPosition(container.scrollTop);
      setIsPlaying(false); // Auto-pause at the end
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    } else {
      container.scrollTop = newScrollTop;
      setCurrentScrollPosition(newScrollTop);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    }
    checkHighlightedParagraph(); // Update highlight based on new scroll position
  }, [isPlaying, scrollSpeed, setCurrentScrollPosition, setIsPlaying, checkHighlightedParagraph]);

  // Effect to start/stop the scroll animation loop based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = 0; // Reset for fresh delta calculation
      userInteractedRef.current = false; // Reset user interaction flag
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    // Cleanup function to cancel animation frame if component unmounts while playing
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isPlaying, scrollLoop]);

  // Effect to synchronize the container's scrollTop with currentScrollPosition from the store
  // This handles cases like programmatic scroll reset or initial load.
  useEffect(() => {
    if (scrollContainerRef.current) {
      if(!isPlaying) { // Only force scroll if not actively playing (to avoid conflicts with animation loop)
        scrollContainerRef.current.scrollTop = currentScrollPosition;
      }
    }
    checkHighlightedParagraph(); // Check highlight after potential scroll position change
  }, [currentScrollPosition, checkHighlightedParagraph, isPlaying]);
  
  // Effect to handle manual user scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPhysicalScroll = container.scrollTop;
      if (!isPlaying) {
         // If not playing, just update the store with the new manual scroll position
         setCurrentScrollPosition(currentPhysicalScroll);
      } else {
        // If playing, check if manual scroll significantly deviates from automated scroll.
        // This indicates user intervention.
        const scrollThreshold = scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
        if (Math.abs(currentPhysicalScroll - useTeleprompterStore.getState().currentScrollPosition) > scrollThreshold ) { 
          userInteractedRef.current = true; // Mark that user has interacted
          setIsPlaying(false); // Pause playback
          setCurrentScrollPosition(currentPhysicalScroll); // Update store with user's scroll position
        }
      }
      checkHighlightedParagraph(); // Update highlight on any scroll
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isPlaying, setIsPlaying, setCurrentScrollPosition, scrollSpeed, checkHighlightedParagraph]); 

  // Effect to re-check highlighted paragraph when script content or layout-affecting styles change.
  // This ensures the highlight is accurate after text/font changes.
  useEffect(() => {
    setHighlightedParagraphIndex(null); // Briefly clear highlight
    const timer = setTimeout(() => { // Recalculate after a tick to allow DOM updates
       checkHighlightedParagraph();
    }, 0);
    return () => clearTimeout(timer);
  }, [scriptText, checkHighlightedParagraph, fontFamily, fontSize, lineHeight]); 

  // Determine text color: Use SSR-safe default before hydration, then store value.
  const currentTextColor = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  // Determine font family: Use SSR-safe default before hydration.
  const currentFontFamily = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  // Determine transform for mirroring: Only apply after mount.
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  // Styles for the main scrollable teleprompter view
  const currentViewStyles: React.CSSProperties = {
    color: currentTextColor, 
    fontFamily: currentFontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
  };

  // Styles for the inner content div, to counteract the parent's mirror transform if active
  const innerContentStyles: React.CSSProperties = {
    transform: mirrorTransform, // Double-mirror to make text readable
  };

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        // Determine background color: Use SSR-safe default before hydration.
        // If not mounted, use VIEW_SSR_DEFAULT_DARK_MODE (true). If mounted, use actual darkMode from store.
        (!isMounted ? VIEW_SSR_DEFAULT_DARK_MODE : darkMode) ? "bg-gray-900" : "bg-gray-50",
      )}
      style={currentViewStyles}
      tabIndex={0} // Make it focusable for keyboard interactions (e.g., arrow key scrolling by browser)
      role="region" // Identifies this as a significant, navigable section
      aria-label="Teleprompter Script Viewport" // Provides an accessible name
    >
      <div 
        className="select-none" // Prevent text selection during scrolling
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

