
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

const USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR = 0.5;
const MIN_SCROLL_INTERVENTION_THRESHOLD_PX = 5;
const PLAYBACK_START_GRACE_PERIOD_MS = 200; // Increased slightly

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
        parsed.push({ type: 'text', content: '//EMPHASIZE//_PLACEHOLDER_' }); 
    }
  });
  
  const finalParsed: ParsedLine[] = [];
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].content === '//EMPHASIZE//_PLACEHOLDER_') {
      if (i + 1 < parsed.length && parsed[i+1].type === 'text' && parsed[i+1].content.trim() !== '') {
        finalParsed.push({ type: 'emphasize', content: parsed[i+1].content });
        i++; 
      } else {
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
    focusLinePercentage,
  } = useTeleprompterStore(
    (state) => ({
      scriptText: state.scriptText,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      isMirrored: state.isMirrored,
      darkMode: state.darkMode,
      textColor: state.textColor,
      fontFamily: state.fontFamily,
      focusLinePercentage: state.focusLinePercentage,
    })
  );
  
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
  const [isMounted, setIsMounted] = useState(false);

  const scriptParagraphs = useMemo(() => scriptText.split('\n\n'), [scriptText]);

  const highlightedParagraphText = useMemo(() => {
    if (highlightedParagraphIndex !== null && scriptParagraphs[highlightedParagraphIndex]) {
      return scriptParagraphs[highlightedParagraphIndex].replace(SCRIPT_CUE_REGEX, ' ').trim();
    }
    return "";
  }, [highlightedParagraphIndex, scriptParagraphs]);


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
    const store = useTeleprompterStore.getState(); // Get fresh state
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
  }, [checkHighlightedParagraph]); // scrollSpeed removed from deps, uses store.scrollSpeed

  useEffect(() => {
    if (!isMounted) return;
    const store = useTeleprompterStore.getState();
    if (store.isPlaying) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = store.currentScrollPosition;
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
      if (scrollContainerRef.current) { // Check highlight when pausing
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
      // During grace period and intended play, ONLY sync store's position to physical.
      // Do not trigger stop.
      // storeState.setCurrentScrollPosition(currentPhysicalScroll); // Let scrollLoop handle this to avoid fight
      return;
    }
    
    if (!storeState.isPlaying) {
       storeState.setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph(); 
       return;
    }
    
    const calculatedThreshold = storeState.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
    const scrollThreshold = Math.max(MIN_SCROLL_INTERVENTION_THRESHOLD_PX, calculatedThreshold);

    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollThreshold) {
      storeState.setIsPlaying(false); 
      storeState.setCurrentScrollPosition(currentPhysicalScroll);
    } else {
       if (container.scrollTop !== storeState.currentScrollPosition) {
           storeState.setCurrentScrollPosition(container.scrollTop);
       }
    }
  }, [checkHighlightedParagraph, isMounted]); 

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!isMounted || !container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
  
    const performInitialSyncAndHighlight = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = currentScrollPositionFromStore;
        checkHighlightedParagraph();
      }
    };
  
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(performInitialSyncAndHighlight).catch(err => {
        console.warn("Error waiting for fonts, performing sync & highlight immediately:", err);
        performInitialSyncAndHighlight();
      });
    } else {
      const timer = setTimeout(performInitialSyncAndHighlight, 250);
      return () => clearTimeout(timer);
    }
  }, [scriptText, fontFamily, fontSize, lineHeight, focusLinePercentage, currentScrollPositionFromStore, checkHighlightedParagraph, isMounted]);
  

  const handleParagraphClick = useCallback((paragraphIndex: number) => {
    const store = useTeleprompterStore.getState();
    if (store.isPlaying || !scrollContainerRef.current || !paragraphRefs.current[paragraphIndex]) return;

    const container = scrollContainerRef.current;
    const paragraphEl = paragraphRefs.current[paragraphIndex];
    if (!paragraphEl) return;

    let targetScrollTop = paragraphEl.offsetTop;
    targetScrollTop = Math.max(0, targetScrollTop - (container.clientHeight * store.focusLinePercentage * 0.25));

    container.scrollTop = targetScrollTop; // Physical scroll
    store.setCurrentScrollPosition(targetScrollTop); // Update store
    // checkHighlightedParagraph will be called by the useEffect listening to currentScrollPositionFromStore
  }, [focusLinePercentage]); // Removed checkHighlightedParagraph, relying on useEffect

  const formattedScriptText = useMemo(() => {
    return scriptParagraphs.map((paragraphBlock, blockIndex) => {
      const lines = paragraphBlock.split('\n');
      return (
        <div
          key={blockIndex}
          ref={(el) => (paragraphRefs.current[blockIndex] = el)}
          className={cn(
            "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out cursor-default",
            highlightedParagraphIndex === blockIndex ? "opacity-100" : "opacity-60",
            !useTeleprompterStore.getState().isPlaying && "hover:opacity-80 cursor-pointer" // Get fresh isPlaying
          )}
          onClick={() => handleParagraphClick(blockIndex)}
          role="button"
          tabIndex={!useTeleprompterStore.getState().isPlaying ? 0 : -1} // Get fresh isPlaying
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !useTeleprompterStore.getState().isPlaying) { // Get fresh isPlaying
              e.preventDefault();
              handleParagraphClick(blockIndex);
            }
          }}
          aria-label={!useTeleprompterStore.getState().isPlaying ? `Start from paragraph: ${paragraphBlock.substring(0, 50)}...` : undefined} // Get fresh isPlaying
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

    