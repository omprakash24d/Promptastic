
"use client";

import type React from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Zap, Mic } from 'lucide-react';
import { scrollSyncWithSpeech, type ScrollSyncWithSpeechInput } from '@/ai/flows/scroll-sync-with-speech';
import { useToast } from '@/hooks/use-toast';

// A placeholder for a very short, silent WAV file encoded as a data URI.
// This specific URI might not represent valid audio but serves as a placeholder.
const MOCK_AUDIO_DATA_URI = "data:audio/wav;base66,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";


export function PlaybackControls() {
  const { toast } = useToast();
  const {
    isPlaying, togglePlayPause,
    resetScroll,
    scriptText, isAutoSyncEnabled, setScrollSpeed
  } = useTeleprompterStore();

  const handleAiSync = async () => {
    if (!isAutoSyncEnabled) {
      toast({
        title: "AI Sync Disabled",
        description: "Please enable AI Scroll Sync in settings to use this feature.",
        variant: "default",
      });
      return;
    }
    if (!scriptText.trim()) {
      toast({ title: "Error", description: "Cannot sync scroll: Script is empty.", variant: "destructive" });
      return;
    }

    toast({ title: "AI Syncing...", description: "Attempting to sync scroll speed with speech." });

    try {
      // In a real app, you'd get audioDataUri from a MediaRecorder or similar.
      const input: ScrollSyncWithSpeechInput = {
        scriptText,
        audioDataUri: MOCK_AUDIO_DATA_URI, // Placeholder
        isAutoSyncEnabled: true, // Assuming if button is clicked, user wants it
      };
      const output = await scrollSyncWithSpeech(input);
      
      // The AI output is 'adjustedScrollSpeed'. This needs to be mapped to the store's scrollSpeed concept.
      // The AI returns a number; let's assume it's a relative speed factor or target WPM.
      // For now, let's interpret `adjustedScrollSpeed` as a direct value for our `scrollSpeed`.
      // This might need calibration. The AI currently returns 50 if autoSync is off in input, or a value based on mock speech rate.
      // Let's cap it to a reasonable range, e.g. 10-200.
      const newSpeed = Math.max(10, Math.min(output.adjustedScrollSpeed, 200));
      setScrollSpeed(newSpeed);

      toast({
        title: "AI Sync Complete",
        description: `Scroll speed adjusted to ${newSpeed}. Detected speech rate: ${output.speechRate} WPM.`,
      });
    } catch (error) {
      console.error("AI Sync Error:", error);
      toast({
        title: "AI Sync Error",
        description: "Could not sync scroll speed. " + (error instanceof Error ? error.message : "Unknown error."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-background/80 backdrop-blur-sm shadow-md rounded-lg">
      <Button onClick={togglePlayPause} size="lg" aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>
      <Button onClick={resetScroll} variant="outline" size="lg" aria-label="Reset Scroll">
        <RotateCcw className="h-6 w-6" />
        <span className="ml-2">Reset</span>
      </Button>
      {isAutoSyncEnabled && (
        <Button onClick={handleAiSync} variant="outline" size="lg" className="bg-accent/20 hover:bg-accent/30 border-accent text-accent-foreground" aria-label="Sync with AI Speech">
          <Mic className="h-6 w-6" />
          <span className="ml-2">AI Sync</span>
        </Button>
      )}
    </div>
  );
}
