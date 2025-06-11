
"use client";

import type React from 'react';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { cn } from '@/lib/utils';
import type { ParsedSegment, FocusLineStyle } from '@/types';
import { PauseCircle, ChevronsDown } from 'lucide-react';

const VIEW_SSR_DEFAULT_TEXT_COLOR = 'hsl(0 0% 100%)'; // White for SSR default (dark mode)
const VIEW_SSR_DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
const VIEW_SSR_DEFAULT_DARK_MODE = true; // Assume SSR defaults to dark mode context
const VIEW_SSR_DEFAULT_FOCUS_LINE_STYLE: FocusLineStyle = 'line';


const PLAYBACK_START_GRACE_PERIOD_MS = 200;
const AVERAGE_WPM = 140; // Words per minute

// Regex for script cues and basic markdown-like formatting
const SCRIPT_CUE_AND_FORMATTING_REGEX = /(\/\/(?:PAUSE|EMPHASIZE|SLOWDOWN)\/\/)|(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|_(.*?)_)/g;

const parseLineToSegments = (line: string): ParsedSegment[] => {
  if (!line.trim()) return [{ type: 'text', content: '\u00A0' }];

  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  // Helper to push plain text segments
  const pushTextSegment = (text: string, bold?: boolean, italic?: boolean, underline?: boolean) => {
    if (text) {
      segments.push({
        type: 'text',
        content: text,
        isBold: bold,
        isItalic: italic,
        isUnderline: underline,
      });
    }
  };
  
  // First pass for Markdown-like formatting, then cues
  // This is a simplified parser. For complex nesting, a more robust solution (e.g., AST) would be needed.
  // Current approach: Cues take precedence if they are at the start of a formatted block.

  const parts = line.split(/(\/\/(?:PAUSE|EMPHASIZE|SLOWDOWN)\/\/)/g).filter(Boolean);
  
  parts.forEach(part => {
    if (part === '//PAUSE//') {
      segments.push({ type: 'pause', content: '', originalMarker: part });
    } else if (part === '//EMPHASIZE//') {
      segments.push({ type: 'emphasize', content: '', originalMarker: part });
    } else if (part === '//SLOWDOWN//') {
      segments.push({ type: 'slowdown', content: '', originalMarker: part });
    } else {
      // Process this text part for markdown
      let subLastIndex = 0;
      const subSegments: ParsedSegment[] = [];
      
      part.replace(/(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|_(.*?)_)/g, (match, _fullMatch, tripleStarContent, doubleStarContent, singleStarContent, underscoreContent, offset) => {
        // Text before match
        if (offset > subLastIndex) {
          subSegments.push({ type: 'text', content: part.substring(subLastIndex, offset) });
        }
        
        if (tripleStarContent !== undefined) {
          subSegments.push({ type: 'text', content: tripleStarContent, isBold: true, isItalic: true });
        } else if (doubleStarContent !== undefined) {
          subSegments.push({ type: 'text', content: doubleStarContent, isBold: true });
        } else if (singleStarContent !== undefined) {
          subSegments.push({ type: 'text', content: singleStarContent, isItalic: true });
        } else if (underscoreContent !== undefined) {
          subSegments.push({ type: 'text', content: underscoreContent, isUnderline: true });
        }
        subLastIndex = offset + match.length;
        return match; // Necessary for replace
      });

      // Remaining text after last match
      if (subLastIndex < part.length) {
        subSegments.push({ type: 'text', content: part.substring(subLastIndex) });
      }
      segments.push(...subSegments);
    }
  });


  return segments.length > 0 ? segments.filter(s => s.content !== '' || s.type !== 'text') : [{ type: 'text', content: '\u00A0' }];
};


export function TeleprompterView() {
  const {
    scriptText,
    fontSize,
    lineHeight,
    isMirrored,
    darkMode,
    textColor, // User-configurable text color from store
    fontFamily,
    focusLineStyle,
    horizontalPadding,
    enableHighContrast, // Get high contrast state
  } = useTeleprompterStore(
    (state) => ({
      scriptText: state.scriptText,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      isMirrored: state.isMirrored,
      darkMode: state.darkMode,
      textColor: state.textColor,
      fontFamily: state.fontFamily,
      focusLineStyle: state.focusLineStyle,
      horizontalPadding: state.horizontalPadding,
      enableHighContrast: state.enableHighContrast,
    })
  );
  
  const focusLinePercentage = useTeleprompterStore(state => state.focusLinePercentage);
  const isPlaying = useTeleprompterStore(state => state.isPlaying);
  const setIsPlaying = useTeleprompterStore(state => state.setIsPlaying);
  const setCurrentScrollPosition = useTeleprompterStore(state => state.setCurrentScrollPosition);
  const scrollSpeed = useTeleprompterStore(state => state.scrollSpeed);
  const currentScrollPositionFromStore = useTeleprompterStore(state => state.currentScrollPosition);
  const countdownValue = useTeleprompterStore(state => state.countdownValue);
  const setCountdownValue = useTeleprompterStore(state => state.setCountdownValue);


  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const justStartedPlayingRef = useRef(false);
  const playbackStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const scriptParagraphs = useMemo(() => scriptText.split('\n\n'), [scriptText]);

  const rawParagraphTexts = useMemo(() => {
     return scriptParagraphs.map(p => 
        p.replace(SCRIPT_CUE_AND_FORMATTING_REGEX, (match, cue, formatting, _t, _d, _s, _u) => {
            if (cue) return ' '; // Replace cues with a space or empty
            if (formatting) { // Return the content of the formatting
                 return _t || _d || _s || _u || '';
            }
            return ' ';
        }).replace(/\s+/g, ' ').trim()
    );
  }, [scriptParagraphs]);
  
  const highlightedParagraphText = useMemo(() => {
    if (highlightedParagraphIndex !== null && rawParagraphTexts[highlightedParagraphIndex]) {
      return rawParagraphTexts[highlightedParagraphIndex];
    }
    return "";
  }, [highlightedParagraphIndex, rawParagraphTexts]);


  useEffect(() => {
    setIsMounted(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }
    const handleVisibilityChange = () => {
      if (document.hidden && useTeleprompterStore.getState().isPlaying) {
        setIsPlaying(false);
        if(useTeleprompterStore.getState().countdownValue !== null) {
           setCountdownValue(null); // Also clear countdown if tab becomes hidden
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (playbackStartTimerRef.current) clearTimeout(playbackStartTimerRef.current);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [setIsPlaying, setCountdownValue]);


  // Countdown logic
  useEffect(() => {
    if (countdownValue === null || countdownValue < 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    if (countdownValue === 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setCountdownValue(null);
      setIsPlaying(true); // Start actual playback
      return;
    }

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); // Clear existing before setting new
    countdownIntervalRef.current = setInterval(() => {
      setCountdownValue(getNonNullCountdown => getNonNullCountdown !== null ? getNonNullCountdown - 1 : null);
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdownValue, setIsPlaying, setCountdownValue]);


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
        if (firstPRef) { 
          const pTop = firstPRef.offsetTop;
          const pBottom = pTop + firstPRef.offsetHeight;
          if (currentFocusLinePoint >= pTop && currentFocusLinePoint < pBottom) {
               newHighlightedIndex = 0;
          }
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
    if (!store.isPlaying || !scrollContainerRef.current || store.countdownValue !== null) { // Also check for countdown
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
    
    if (isPlaying && countdownValue === null) { // Only start scrollLoop if not counting down
      if (scrollContainerRef.current) {
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
  }, [isPlaying, scrollLoop, checkHighlightedParagraph, isMounted, countdownValue]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!isMounted || !container) return;

    const storeState = useTeleprompterStore.getState();
    const currentPhysicalScroll = container.scrollTop;
    
    if (justStartedPlayingRef.current && storeState.isPlaying) {
      return;
    }
    
    if (!storeState.isPlaying) {
       storeState.setCurrentScrollPosition(currentPhysicalScroll);
       checkHighlightedParagraph(); 
       return;
    }
    
    const scrollDeltaThreshold = Math.max(5, storeState.scrollSpeed * 0.1); 

    if (Math.abs(currentPhysicalScroll - storeState.currentScrollPosition) > scrollDeltaThreshold) {
      storeState.setIsPlaying(false); 
      storeState.setCountdownValue(null); // Stop countdown if manual scroll occurs
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
      const timer = setTimeout(performSyncAndHighlight, 250); 
      return () => clearTimeout(timer);
    }
  }, [scriptText, fontFamily, fontSize, lineHeight, focusLinePercentage, currentScrollPositionFromStore, checkHighlightedParagraph, isMounted, isPlaying, horizontalPadding]);
  

  const handleParagraphClick = useCallback((paragraphIndex: number) => {
    const store = useTeleprompterStore.getState();
    if (store.isPlaying || !scrollContainerRef.current || !paragraphRefs.current[paragraphIndex]) return;

    const container = scrollContainerRef.current;
    const paragraphEl = paragraphRefs.current[paragraphIndex];
    if (!paragraphEl) return;

    let targetScrollTop = Math.max(0, paragraphEl.offsetTop - (container.clientHeight * store.focusLinePercentage));
    
    container.scrollTop = targetScrollTop; 
    store.setCurrentScrollPosition(targetScrollTop); 
    container.focus(); 
  }, [focusLinePercentage]); 

  const formattedScriptContent = useMemo(() => {
    return scriptParagraphs.map((paragraphBlock, blockIndex) => {
      const lines = paragraphBlock.split('\n');
      const isHighlighted = highlightedParagraphIndex === blockIndex;
      return (
        <div
          key={blockIndex}
          ref={(el) => (paragraphRefs.current[blockIndex] = el)}
          className={cn(
            "mb-4 last:mb-0 transition-opacity duration-200 ease-in-out",
            focusLineStyle === 'line' && (isHighlighted ? "opacity-100" : "opacity-60"),
            focusLineStyle === 'shadedParagraph' && isHighlighted && "bg-primary/10 dark:bg-primary/20 rounded-md p-1 -m-1",
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
            const parsedSegments = parseLineToSegments(line);
            let emphasizeNext = false;
            return (
              <p key={lineIndex} className="mb-1 last:mb-0 min-h-[1em]">
                {parsedSegments.map((segment, segmentIndex) => {
                  let content = <>{segment.content}</>;
                  if (segment.isUnderline) content = <u>{content}</u>;
                  if (segment.isItalic) content = <em>{content}</em>;
                  if (segment.isBold) content = <strong>{content}</strong>;
                  
                  let segmentClassName = "";
                  if (emphasizeNext && segment.type === 'text') {
                    segmentClassName = "text-primary";
                    emphasizeNext = false; 
                  }

                  switch (segment.type) {
                    case 'pause':
                      emphasizeNext = false;
                      return (
                        <span key={segmentIndex} className="inline-flex items-center mx-1 opacity-70 text-sm">
                          <PauseCircle className="h-4 w-4 mr-1 text-blue-400" />
                          <span className="italic">(pause)</span>
                        </span>
                      );
                    case 'emphasize':
                      emphasizeNext = true; // Mark next text segment for emphasis
                      return null; // The cue itself is not rendered, it affects next segment
                    case 'slowdown':
                       emphasizeNext = false;
                      return (
                        <span key={segmentIndex} className="inline-flex items-center mx-1 opacity-80">
                          <ChevronsDown className="h-4 w-4 mr-1 text-orange-400" />
                          <span className="italic">(slow down)</span>
                        </span>
                      );
                    default: // text
                      return <span key={segmentIndex} className={segmentClassName}>{content}</span>;
                  }
                })}
              </p>
            );
          })}
        </div>
      );
    });
  }, [scriptParagraphs, highlightedParagraphIndex, handleParagraphClick, focusLineStyle, parseLineToSegments]);


  const finalTeleprompterTextColor = useMemo(() => {
    if (!isMounted) {
      // For SSR, use a default based on assumed server-side dark mode preference
      return VIEW_SSR_DEFAULT_DARK_MODE ? VIEW_SSR_DEFAULT_TEXT_COLOR : 'hsl(0 0% 0%)';
    }
    if (enableHighContrast) {
      // In high contrast mode, let CSS theme variables take precedence.
      // Returning undefined means no inline style for color will be applied.
      return undefined;
    }
    if (!darkMode) { // Light mode, and not high contrast
      return 'hsl(0 0% 0%)'; // Force black for light mode
    }
    // Dark mode, and not high contrast
    return textColor; // Use the user-selected or default dark mode text color from store
  }, [isMounted, darkMode, textColor, enableHighContrast]);
  
  const currentFontFamilyToUse = !isMounted ? VIEW_SSR_DEFAULT_FONT_FAMILY : fontFamily;
  const mirrorTransform = isMounted && isMirrored ? 'scaleX(-1)' : 'none';

  const teleprompterContainerStyles: React.CSSProperties = {
    fontFamily: currentFontFamilyToUse,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    transform: mirrorTransform,
    position: 'relative', 
  };

  if (finalTeleprompterTextColor !== undefined) {
    teleprompterContainerStyles.color = finalTeleprompterTextColor;
  }

  const currentBgClass = useMemo(() => {
    if (!isMounted) return VIEW_SSR_DEFAULT_DARK_MODE ? "bg-gray-900" : "bg-gray-50";
    if (enableHighContrast) return "bg-background"; // High contrast theme handles this
    return darkMode ? "bg-gray-900" : "bg-gray-50";
  }, [isMounted, darkMode, enableHighContrast]);


  const estimatedReadingTimeDisplay = useMemo(() => {
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
        "w-full h-full overflow-y-auto focus:outline-none relative",
        "transition-colors duration-300 ease-in-out",
        currentBgClass, // Use dynamic background class
      )}
      style={teleprompterContainerStyles}
      tabIndex={0} 
      role="region"
      aria-label="Teleprompter Script Viewport. Press Space or Backspace to play or pause scrolling."
    >
      {countdownValue !== null && countdownValue > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 pointer-events-none">
          <span className="text-9xl font-bold text-white opacity-80 tabular-nums">{countdownValue}</span>
        </div>
      )}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {highlightedParagraphText}
      </div>
      {estimatedReadingTimeDisplay && (
        <div 
          className="absolute top-2 right-4 text-xs px-2 py-1 rounded-md pointer-events-none z-20"
          style={{
            // Respect current theme for this little info box
            color: 'hsla(var(--foreground), 0.7)', 
            backgroundColor: 'hsla(var(--background), 0.5)',
            backdropFilter: 'blur(2px)'
          }}
          aria-hidden="true"
        >
          {estimatedReadingTimeDisplay}
        </div>
      )}
      {focusLineStyle === 'line' && !enableHighContrast && ( // Only show default focus line if not high contrast
        <div style={{
            position: 'absolute',
            top: `calc(${focusLinePercentage * 100}%)`,
            left: `${horizontalPadding}%`,
            right: `${horizontalPadding}%`,
            height: '2px',
            backgroundColor: 'hsla(var(--primary), 0.5)', // Use primary theme color
            pointerEvents: 'none',
            zIndex: 10,
            transition: 'top 0.3s ease-out',
        }} data-testid="focus-line-overlay" />
      )}
      <div
        className="select-none px-8 md:px-16 py-8 md:py-16" 
        style={{
           paddingLeft: `${horizontalPadding}%`,
           paddingRight: `${horizontalPadding}%`,
        }}
      >
        {scriptText.trim() === "" ? (
          <p className="text-center opacity-50">
            Your script is empty. Paste your content or load a script to begin.
          </p>
        ) : (
          formattedScriptContent
        )}
      </div>
    </div>
  );
}
