
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { cn } from '@/lib/utils';
import type { ParsedLine } from '@/types';
import { PauseCircle, ChevronsDown } from 'lucide-react';

const VIEW_SSR_DEFAULT_TEXT_COLOR = 'hsl(0 0% 100%)';
const VIEW_SSR_DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
const VIEW_SSR_DEFAULT_DARK_MODE = true;

const PLAYBACK_START_GRACE_PERIOD_MS = 200;
const AVERAGE_WPM = 140; // Words per minute

const SCRIPT_CUE_REGEX = /(\/\/PAUSE\/\/|\/\/EMPHASIZE\/\/|\/\/SLOWDOWN\/\/)/g;

const parseLineForCues = (line: string): ParsedLine[] => {
  if (!line.trim()) return [{ type: 'text', content: '\u00A0' }]; 

  const parts = line.split(SCRIPT_CUE_REGEX).filter(Boolean);
  const parsed: ParsedLine[] = [];

  parts.forEach(part => {
    switch (part) {
      case '//PAUSE//':
        parsed.push({ type: 'pause', content: '', originalMarker: part });
        break;
      case '//EMPHASIZE//':
        break; 
      case '//SLOWDOWN//':
        parsed.push({ type: 'slowdown', content: '', originalMarker: part });
        break;
      default:
        parsed.push({ type: 'text', content: part });
    }
    if (part === '//EMPHASIZE//' && (parsed.length === 0 || parsed[parsed.length -1]?.type !== 'emphasize')) {
        // Add a placeholder that will be processed to wrap the next text segment
        parsed.push({ type: 'text', content: '//EMPHASIZE//_PLACEHOLDER_' }); 
    }
  });
  
  // Second pass to correctly apply emphasize to the next text segment
  const finalParsed: ParsedLine[] = [];
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].content === '//EMPHASIZE//_PLACEHOLDER_') {
      // If the next segment is text and not empty, mark it as emphasized
      if (i + 1 < parsed.length && parsed[i+1].type === 'text' && parsed[i+1].content.trim() !== '') {
        finalParsed.push({ type: 'emphasize', content: parsed[i+1].content });
        i++; // Skip the next segment as it's now part of the emphasize block
      } else {
         // If there's no text to emphasize, or it's an empty line, add a non-breaking space
         // to maintain line structure, especially if it's the last element.
         // Avoid adding if previous was already a structural cue like pause/slowdown without content.
         if (finalParsed.length > 0 && finalParsed[finalParsed.length -1]?.type !== 'pause' && finalParsed[finalParsed.length -1]?.type !== 'slowdown') {
            finalParsed.push({ type: 'text', content: '\u00A0' }); 
         }
      }
    } else {
      finalParsed.push(parsed[i]);
    }
  }

  return finalParsed.length > 0 ? finalParsed : [{ type: 'text', content: '\u00A0' }];
};


export function TeleprompterView() {
  const {
    scriptText,
    fontSize,
    lineHeight,
    isMirrored,
    darkMode,
    textColor,
    fontFamily,
  } = useTeleprompterStore(
    (state) => ({
      scriptText: state.scriptText,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      isMirrored: state.isMirrored,
      darkMode: state.darkMode,
      textColor: state.textColor,
      fontFamily: state.fontFamily,
    })
  );
  
  const focusLinePercentage = useTeleprompterStore(state => state.focusLinePercentage);
  const isPlaying = useTeleprompterStore(state => state.isPlaying);
  const setIsPlaying = useTeleprompterStore(state => state.setIsPlaying);
  const setCurrentScrollPosition = useTeleprompterStore(state => state.setCurrentScrollPosition);
  const scrollSpeed = useTeleprompterStore(state => state.scrollSpeed);
  const currentScrollPositionFromStore = useTeleprompterStore(state => state.currentScrollPosition);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const justStartedPlayingRef = useRef(false);
  const playbackStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState<number | null>(null);
  const [highlightedParagraphText, setHighlightedParagraphText] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  const scriptParagraphs = useMemo(() => scriptText.split('\n\n'), [scriptText]);

  const rawParagraphTexts = useMemo(() => {
    return scriptParagraphs.map(p => p.replace(SCRIPT_CUE_REGEX, ' ').trim());
  }, [scriptParagraphs]);

  useEffect(() => {
    if (highlightedParagraphIndex !== null && rawParagraphTexts[highlightedParagraphIndex]) {
      setHighlightedParagraphText(rawParagraphTexts[highlightedParagraphIndex]);
    } else {
      setHighlightedParagraphText("");
    }
  }, [highlightedParagraphIndex, rawParagraphTexts]);


  useEffect(() => {
    setIsMounted(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }
    const handleVisibilityChange = () => {
      if (document.hidden && useTeleprompterStore.getState().isPlaying) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (playbackStartTimerRef.current) clearTimeout(playbackStartTimerRef.current);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [setIsPlaying]);

  useEffect(() => {
    paragraphRefs.current = paragraphRefs.current.slice(0, scriptParagraphs.length);
  }, [scriptParagraphs]);

  const checkHighlightedParagraph = useCallback(() => {
    if (!isMounted || !scrollContainerRef.current || paragraphRefs.current.length === 0) {
      setHighlightedParagraphIndex(null);
      return;
    }
    const container = scrollContainerRef.current;
    const currentFocusLinePoint = container.scrollTop + container.clientHeight * focusLinePercentage;

    let newHighlightedIndex: number | null = null;

    if (container.scrollTop < 5 && paragraphRefs.current.length > 0 && paragraphRefs.current[0]) {
        const firstPRef = paragraphRefs.current[0];
        const pTop = firstPRef.offsetTop;
        const pBottom = pTop + firstPRef.offsetHeight;
        if (currentFocusLinePoint >= pTop && currentFocusLinePoint < pBottom) {
             newHighlightedIndex = 0;
        }
    }

    if (newHighlightedIndex === null) {
        for (let i = 0; i < paragraphRefs.current.length; i++) {
            const pRef = paragraphRefs.current[i];
            if (pRef) {
                const pTop = pRef.offsetTop;
                const pBottom = pTop + pRef.offsetHeight;
                if (currentFocusLinePoint >= pTop && currentFocusLinePoint < pBottom) {
                    newHighlightedIndex = i;
                    break;
                }
            }
        }
    }
    setHighlightedParagraphIndex(newHighlightedIndex);
  }, [focusLinePercentage, isMounted]);


  const scrollLoop = useCallback((timestamp: number) => {
    const store = useTeleprompterStore.getState(); 
    if (!store.isPlaying || !scrollContainerRef.current) {
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
    const newScrollTop = container.scrollTop + store.scrollSpeed * deltaTime;

    if (newScrollTop >= container.scrollHeight - container.clientHeight) {
      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      store.setCurrentScrollPosition(container.scrollTop);
      store.setIsPlaying(false);
    } else {
      container.scrollTop = newScrollTop;
      store.setCurrentScrollPosition(newScrollTop);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    }
    checkHighlightedParagraph();
  }, [checkHighlightedParagraph]); 

  useEffect(() => {
    if (!isMounted) return;
    const store = useTeleprompterStore.getState();
    if (store.isPlaying) {
      if (scrollContainerRef.current) {
        // Use fresh state for currentScrollPosition
        scrollContainerRef.current.scrollTop = useTeleprompterStore.getState().currentScrollPosition;
      }
      lastTimestampRef.current = 0;
      justStartedPlayingRef.current = true;
      if (playbackStartTimerRef.current) clearTimeout(playbackStartTimerRef.current);
      playbackStartTimerRef.current = setTimeout(() => {
        justStartedPlayingRef.current = false;
      }, PLAYBACK_START_GRACE_PERIOD_MS);
      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (playbackStartTimerRef.current) {
        clearTimeout(playbackStartTimerRef.current);
        playbackStartTimerRef.current = null;
      }
      justStartedPlayingRef.current = false;
      lastTimestampRef.current = 0;
      if (scrollContainerRef.current) { 
          checkHighlightedParagraph();
      }
    }
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (playbackStartTimerRef.current) clearTimeout(playbackStartTimerRef.current);
    };
  }, [isPlaying, scrollLoop, checkHighlightedParagraph, isMounted]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!isMounted || !container) return;

    const storeState = useTeleprompterStore.getState();
    const currentPhysicalScroll = container.scrollTop;
    
    if (justStartedPlayingRef.current && storeState.isPlaying) {
      // During grace period, do absolutely nothing. Let scrollLoop and useEffect manage.
      return;
    }
    
    if (!storeState.isPlaying) {
       storeState.setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph(); 
       return;
    }
    
    // For manual intervention check, we should use a reasonable threshold.
    // Pixels per second * a fraction of a second, e.g., 0.1s.
    // This means if user scrolls faster than ~0.1s worth of auto-scroll, it's intervention.
    const scrollDeltaThreshold = Math.max(5, storeState.scrollSpeed * 0.1); 

    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollDeltaThreshold) {
      storeState.setIsPlaying(false); 
      storeState.setCurrentScrollPosition(currentPhysicalScroll); // Sync store to the new manual position
    } else {
       // If not a large manual intervention, still sync the store to the physical position
       // This handles minor adjustments or if the scrollLoop somehow desynced slightly.
       if (container.scrollTop !== storeState.currentScrollPosition) {
           storeState.setCurrentScrollPosition(container.scrollTop);
       }
    }
    // checkHighlightedParagraph will be called by the useEffect listening to currentScrollPositionFromStore changes when not playing,
    // or by scrollLoop when playing.
  }, [checkHighlightedParagraph, isMounted]); 

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!isMounted || !container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isMounted]);


  // Effect to sync scrollTop FROM store and check highlight WHEN NOT PLAYING, or when relevant display props change
   useEffect(() => {
    if (!isMounted || !scrollContainerRef.current) return;

    const performSyncAndHighlight = () => {
      if (scrollContainerRef.current && !useTeleprompterStore.getState().isPlaying) {
        scrollContainerRef.current.scrollTop = currentScrollPositionFromStore;
      }
      checkHighlightedParagraph();
    };

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(performSyncAndHighlight).catch(err => {
        console.warn("Error waiting for fonts, performing sync & highlight immediately:", err);
        performSyncAndHighlight();
      });
    } else {
      // Fallback if document.fonts.ready is not supported or fails
      const timer = setTimeout(performSyncAndHighlight, 250); 
      return () => clearTimeout(timer);
    }
  }, [scriptText, fontFamily, fontSize, lineHeight, focusLinePercentage, currentScrollPositionFromStore, checkHighlightedParagraph, isMounted, isPlaying]);
  

  const handleParagraphClick = useCallback((paragraphIndex: number) => {
    const store = useTeleprompterStore.getState();
    if (store.isPlaying || !scrollContainerRef.current || !paragraphRefs.current[paragraphIndex]) return;

    const container = scrollContainerRef.current;
    const paragraphEl = paragraphRefs.current[paragraphIndex];
    if (!paragraphEl) return;

    let targetScrollTop = paragraphEl.offsetTop;
    // Adjust so the paragraph starts slightly above the focus line, or at the focus line.
    // The currentFocusLinePoint is `container.scrollTop + container.clientHeight * store.focusLinePercentage`
    // We want paragraphEl.offsetTop to be at that point.
    // So, new scrollTop should be paragraphEl.offsetTop - container.clientHeight * store.focusLinePercentage
    targetScrollTop = Math.max(0, paragraphEl.offsetTop - (container.clientHeight * store.focusLinePercentage));
    
    container.scrollTop = targetScrollTop; // Physical scroll
    store.setCurrentScrollPosition(targetScrollTop); // Update store
    container.focus(); // Shift focus back to the scroll container
    // checkHighlightedParagraph will be called by the useEffect listening to currentScrollPositionFromStore
  }, [focusLinePercentage]); 

  const formattedScriptText = useMemo(() => {
    return scriptParagraphs.map((paragraphBlock, blockIndex) => {
      const lines = paragraphBlock.split('\n');
      return (
        <div
          key={blockIndex}
          ref={(el) => (paragraphRefs.current[blockIndex] = el)}
          className={cn(
            "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out",
            highlightedParagraphIndex === blockIndex ? "opacity-100" : "opacity-60",
            !useTeleprompterStore.getState().isPlaying && "hover:opacity-80 cursor-pointer" 
          )}
          onClick={() => handleParagraphClick(blockIndex)}
          role="button"
          tabIndex={!useTeleprompterStore.getState().isPlaying ? 0 : -1} 
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !useTeleprompterStore.getState().isPlaying) { 
              e.preventDefault();
              handleParagraphClick(blockIndex);
            }
          }}
          aria-label={!useTeleprompterStore.getState().isPlaying ? `Start from paragraph: ${paragraphBlock.substring(0, 50)}...` : undefined} 
        >
          {lines.map((line, lineIndex) => {
            const parsedSegments = parseLineForCues(line);
            return (
              <p key={lineIndex} className="mb-1 last:mb-0 min-h-[1em]">
                {parsedSegments.map((segment, segmentIndex) => {
                  switch (segment.type) {
                    case 'pause':
                      return (
                        <span key={segmentIndex} className="inline-flex items-center mx-1 opacity-70 text-sm">
                          <PauseCircle className="h-4 w-4 mr-1 text-blue-400" />
                          <span className="italic">(pause)</span>
                        </span>
                      );
                    case 'emphasize':
                      return (
                        <strong key={segmentIndex} className="font-bold text-primary">
                          {segment.content}
                        </strong>
                      );
                    case 'slowdown':
                      return (
                        <span key={segmentIndex} className="inline-flex items-center mx-1 opacity-80">
                          <ChevronsDown className="h-4 w-4 mr-1 text-orange-400" />
                          <span className="italic">(slow down)</span>
                        </span>
                      );
                    default: 
                      return <span key={segmentIndex}>{segment.content}</span>;
                  }
                })}
              </p>
            );
          })}
        </div>
      );
    });
  }, [scriptParagraphs, highlightedParagraphIndex, handleParagraphClick]); 

  const currentTextColorToUse = !isMounted ? VIEW_SSR_DEFAULT_TEXT_COLOR : textColor;
  const currentFontFamilyToUse = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const currentDarkMode = !isMounted ? VIEW_SSR_DEFAULT_DARK_MODE : darkMode;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  const teleprompterContainerStyles: React.CSSProperties = {
    color: currentTextColorToUse,
    fontFamily: currentFontFamilyToUse,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
    position: 'relative', 
  };

  const focusLineStyle: React.CSSProperties = {
    position: 'absolute',
    top: `calc(${focusLinePercentage * 100}%)`,
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: 'hsla(var(--primary), 0.5)',
    pointerEvents: 'none',
    zIndex: 10,
    transition: 'top 0.3s ease-out', 
  };

  const estimatedReadingTime = useMemo(() => {
    if (!isMounted || !scriptText.trim()) return null;
    const words = scriptText.trim().split(/\s+/).filter(Boolean).length;
    if (words === 0) return null;
    const minutes = words / AVERAGE_WPM;
    const totalSeconds = Math.floor(minutes * 60);
    const displayMinutes = Math.floor(totalSeconds / 60);
    const displaySeconds = totalSeconds % 60;
    return `Est: ${displayMinutes}m ${displaySeconds}s`;
  }, [scriptText, isMounted]);

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "w-full h-full overflow-y-auto p-8 md:p-16 focus:outline-none",
        "transition-colors duration-300 ease-in-out",
        currentDarkMode ? "bg-gray-900" : "bg-gray-50",
      )}
      style={teleprompterContainerStyles}
      tabIndex={0} 
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {highlightedParagraphText}
      </div>
      {estimatedReadingTime && (
        <div 
          className="absolute top-2 right-4 text-xs px-2 py-1 rounded-md pointer-events-none z-20"
          style={{
            color: darkMode ? 'hsla(var(--foreground), 0.7)' : 'hsla(var(--foreground), 0.7)',
            backgroundColor: darkMode ? 'hsla(var(--background), 0.5)' : 'hsla(var(--background), 0.5)',
            backdropFilter: 'blur(2px)'
          }}
          aria-hidden="true"
        >
          {estimatedReadingTime}
        </div>
      )}
      <div style={focusLineStyle} data-testid="focus-line-overlay" />
      <div
        className="select-none" 
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

    
