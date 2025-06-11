
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
const PLAYBACK_START_GRACE_PERIOD_MS = 200;

const SCRIPT_CUE_REGEX = /(\/\/PAUSE\/\/|\/\/EMPHASIZE\/\/|\/\/SLOWDOWN\/\/)/g;

const parseLineForCues = (line: string): ParsedLine[] => {
  if (!line.trim()) return [{ type: 'text', content: '\u00A0' }]; // Keep empty lines for spacing

  const parts = line.split(SCRIPT_CUE_REGEX).filter(Boolean);
  const parsed: ParsedLine[] = [];

  parts.forEach(part => {
    switch (part) {
      case '//PAUSE//':
        parsed.push({ type: 'pause', content: '', originalMarker: part });
        break;
      case '//EMPHASIZE//':
        // This marker will affect the next text segment. We'll handle it by peeking.
        // For now, just mark its position. If it's followed by text, that text gets emphasized.
        // If it's alone or followed by another marker, it might not render visibly but is a placeholder.
        break; // Handled by the next text part
      case '//SLOWDOWN//':
        parsed.push({ type: 'slowdown', content: '', originalMarker: part });
        break;
      default:
        // Check if the previous part was an emphasize marker
        const lastPushed = parsed[parsed.length -1];
        if (parsed.length > 0 && lastPushed && lastPushed.type === 'text' && lastPushed.content === '//EMPHASIZE//_PLACEHOLDER_') {
          parsed.pop(); // remove placeholder
          parsed.push({ type: 'emphasize', content: part });
        } else if (part === '//EMPHASIZE//_PLACEHOLDER_') { 
          // If emphasize was at end of line or before another marker
          parsed.push({ type: 'text', content: '' }); // Effectively ignore if no text follows
        }
         else {
          // If the current part is where an //EMPHASIZE// marker *was*, it means the next actual text part should be emphasized
          // This requires a slightly different logic in the rendering part.
          // For simplicity in parsing, we check if the *original line part* should be emphasized.
          parsed.push({ type: 'text', content: part });
        }
    }
     // If an emphasize marker was encountered but not immediately followed by text, mark it for potential emphasis
    if (part === '//EMPHASIZE//' && (parsed.length === 0 || parsed[parsed.length -1]?.type !== 'emphasize')) {
        parsed.push({ type: 'text', content: '//EMPHASIZE//_PLACEHOLDER_' }); // Placeholder
    }
  });
  
  // Post-process to combine EMPHASIZE markers with subsequent text
  const finalParsed: ParsedLine[] = [];
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].content === '//EMPHASIZE//_PLACEHOLDER_') {
      if (i + 1 < parsed.length && parsed[i+1].type === 'text' && parsed[i+1].content.trim() !== '') {
        finalParsed.push({ type: 'emphasize', content: parsed[i+1].content });
        i++; // Skip next element as it's consumed
      } else {
        // EMPHASIZE marker not followed by text, or at end, effectively ignored or rendered as minor space
         if (parsed[i-1]?.type !== 'pause' && parsed[i-1]?.type !== 'slowdown') {
            finalParsed.push({ type: 'text', content: '\u00A0' }); // Add a non-breaking space if it's not after another cue
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
    isPlaying,
    setCurrentScrollPosition,
    setIsPlaying,
    focusLinePercentage, // Already selected
  } = useTeleprompterStore(
    (state) => ({
      scriptText: state.scriptText,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      isMirrored: state.isMirrored,
      darkMode: state.darkMode,
      textColor: state.textColor,
      fontFamily: state.fontFamily,
      isPlaying: state.isPlaying,
      setCurrentScrollPosition: state.setCurrentScrollPosition,
      setIsPlaying: state.setIsPlaying,
      focusLinePercentage: state.focusLinePercentage,
    })
  );
  // Select scrollSpeed and currentScrollPosition individually for stability in callbacks
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
  const [highlightedParagraphText, setHighlightedParagraphText] = useState("");

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
    paragraphRefs.current = paragraphRefs.current.slice(0, scriptText.split('\n\n').length);
  }, [scriptText]);

  const checkHighlightedParagraph = useCallback(() => {
    if (!scrollContainerRef.current || paragraphRefs.current.length === 0) {
      setHighlightedParagraphIndex(null);
      setHighlightedParagraphText("");
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
    
    setHighlightedParagraphIndex(prevIndex => {
        if (prevIndex !== newHighlightedIndex) {
            if (newHighlightedIndex !== null && paragraphRefs.current[newHighlightedIndex]) {
                setHighlightedParagraphText(paragraphRefs.current[newHighlightedIndex]?.textContent || "");
            } else {
                setHighlightedParagraphText("");
            }
            return newHighlightedIndex;
        }
        return prevIndex;
    });

  }, [focusLinePercentage, setHighlightedParagraphIndex, setHighlightedParagraphText]);


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
  }, [checkHighlightedParagraph]); // setCurrentScrollPosition, setIsPlaying removed as they are stable actions from store

  useEffect(() => {
    if (isPlaying) {
      const scrollPos = useTeleprompterStore.getState().currentScrollPosition;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollPos;
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
      checkHighlightedParagraph();
    }
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (playbackStartTimerRef.current) clearTimeout(playbackStartTimerRef.current);
    };
  }, [isPlaying, scrollLoop, checkHighlightedParagraph]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const store = useTeleprompterStore.getState();
    const currentPhysicalScroll = container.scrollTop;

    if (justStartedPlayingRef.current && store.isPlaying) {
      // During grace period and intended play, ONLY sync store's position to physical.
      // Do NOT trigger stop or highlight checks. scrollLoop handles store updates.
      // This line was causing immediate pause: store.setCurrentScrollPosition(currentPhysicalScroll);
      return;
    }
    
    if (!store.isPlaying) {
       store.setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph(); // Check highlight when manually scrolling while paused
       return;
    }
    
    // If playing and outside grace period, check for user intervention
    const calculatedThreshold = store.scrollSpeed * USER_SCROLL_INTERVENTION_THRESHOLD_FACTOR;
    const scrollThreshold = Math.max(MIN_SCROLL_INTERVENTION_THRESHOLD_PX, calculatedThreshold);

    // store.currentScrollPosition should be updated by scrollLoop.
    // We compare physical scroll to the store's authoritative position.
    if (Math.abs(currentPhysicalScroll - store.currentScrollPosition) > scrollThreshold) {
      store.setIsPlaying(false); 
      store.setCurrentScrollPosition(currentPhysicalScroll); 
    } else {
       // If the difference isn't large enough for intervention, but physical scroll changed,
       // update the store to reflect the minor adjustment.
       // This can happen with programmatic scrolls that aren't part of the main loop (e.g. click-to-start)
       if (container.scrollTop !== store.currentScrollPosition) {
           store.setCurrentScrollPosition(container.scrollTop);
       }
    }
    // checkHighlightedParagraph is called by scrollLoop or by manual scroll when paused
  }, [checkHighlightedParagraph]); // Dependencies like setIsPlaying, setCurrentScrollPosition are stable store actions

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setHighlightedParagraphIndex(null);
    if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.ready.then(() => {
            if (scrollContainerRef.current) { // ensure ref is current
                 scrollContainerRef.current.scrollTop = useTeleprompterStore.getState().currentScrollPosition;
            }
            checkHighlightedParagraph();
        }).catch(err => {
            console.warn("Error waiting for fonts, checking highlight immediately:", err);
            if (scrollContainerRef.current) {
                 scrollContainerRef.current.scrollTop = useTeleprompterStore.getState().currentScrollPosition;
            }
            checkHighlightedParagraph();
        });
    } else {
        const timer = setTimeout(() => {
           if (scrollContainerRef.current) {
               scrollContainerRef.current.scrollTop = useTeleprompterStore.getState().currentScrollPosition;
           }
           checkHighlightedParagraph();
        }, 250); 
        return () => clearTimeout(timer);
    }
  // Add currentScrollPositionFromStore to ensure re-sync if it changes externally while view is static
  }, [scriptText, fontFamily, fontSize, lineHeight, checkHighlightedParagraph, focusLinePercentage, currentScrollPositionFromStore]);


  const handleParagraphClick = useCallback((paragraphIndex: number) => {
    const store = useTeleprompterStore.getState();
    if (store.isPlaying || !scrollContainerRef.current || !paragraphRefs.current[paragraphIndex]) return;

    const container = scrollContainerRef.current;
    const paragraphEl = paragraphRefs.current[paragraphIndex];
    if (!paragraphEl) return;

    // Calculate target scroll to bring the top of the paragraph a bit above the focus line
    // Or simply to its top, letting focus line naturally align.
    let targetScrollTop = paragraphEl.offsetTop;
    // Adjust so the focus line is near the top of the clicked paragraph
    targetScrollTop = Math.max(0, targetScrollTop - (container.clientHeight * store.focusLinePercentage * 0.25));


    container.scrollTop = targetScrollTop;
    store.setCurrentScrollPosition(targetScrollTop);
    checkHighlightedParagraph(); // Update highlight immediately
  }, [checkHighlightedParagraph]); // focusLinePercentage is stable through store selector

  const formattedScriptText = useMemo(() => {
    return scriptText.split('\n\n').map((paragraphBlock, blockIndex) => {
      const lines = paragraphBlock.split('\n');
      return (
        <div
          key={blockIndex}
          ref={(el) => (paragraphRefs.current[blockIndex] = el)}
          className={cn(
            "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out cursor-default",
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
                    default: // text
                      return <span key={segmentIndex}>{segment.content}</span>;
                  }
                })}
              </p>
            );
          })}
        </div>
      );
    });
  }, [scriptText, highlightedParagraphIndex, handleParagraphClick]); // isPlaying via store for hover effect

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
