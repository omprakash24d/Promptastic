
"use client";

import type React from 'react';
import { useRef, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Mic, MicOff, Maximize, Minimize } from 'lucide-react';
import { scrollSyncWithSpeech, type ScrollSyncWithSpeechInput } from '@/ai/flows/scroll-sync-with-speech';
import { useToast } from '@/hooks/use-toast';

interface PlaybackControlsProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export function PlaybackControls({ isFullScreen, onToggleFullScreen }: PlaybackControlsProps) {
  const { toast } = useToast();
  const {
    isPlaying, togglePlayPause,
    resetScroll,
    scriptText, isAutoSyncEnabled, setScrollSpeed,
  } = useTeleprompterStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const requestMicPermission = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setPermissionError("Microphone access is required for AI Sync. Please enable it in your browser settings.");
      toast({
        title: "Microphone Permission Denied",
        description: "AI Sync needs microphone access. Please enable it in your browser settings and try again.",
        variant: "destructive",
        duration: 7000,
      });
      return false;
    }
  };

  const startRecording = async () => {
    if (!(await requestMicPermission())) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          await processAiSync(audioDataUri);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording...", description: "Speak a few lines from your script." });

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 5000);

    } catch (err) {
      console.error("Error starting recording:", err);
      toast({ title: "Recording Error", description: "Could not start audio recording.", variant: "destructive" });
      setIsRecording(false);
    }
  };

  const processAiSync = async (audioDataUri: string) => {
    toast({ title: "AI Syncing...", description: "Analyzing speech to adjust scroll speed." });
    try {
      const input: ScrollSyncWithSpeechInput = {
        scriptText,
        audioDataUri,
        isAutoSyncEnabled: true,
      };
      const output = await scrollSyncWithSpeech(input);

      const newSpeed = Math.max(10, Math.min(output.adjustedScrollSpeed, 200));
      setScrollSpeed(newSpeed);

      toast({
        title: "AI Sync Complete",
        description: `Scroll speed adjusted to ${newSpeed}. Detected speech rate: ${output.speechRate} WPM. (Note: Speech analysis is currently a placeholder).`,
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


  const handleAiSyncClick = async () => {
    if (!isAutoSyncEnabled) {
      toast({
        title: "AI Sync Disabled",
        description: "Please enable AI Scroll Sync in settings to use this feature.",
      });
      return;
    }
    if (!scriptText.trim()) {
      toast({ title: "Error", description: "Cannot sync scroll: Script is empty.", variant: "destructive" });
      return;
    }
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    await startRecording();
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
        <Button
          onClick={handleAiSyncClick}
          variant="outline"
          size="lg"
          className={`
            ${isRecording ? "bg-red-600 hover:bg-red-700 border-red-700 text-white"
                          : "bg-accent/20 hover:bg-accent/30 border-accent text-accent-foreground"}
          `}
          aria-label={isRecording ? "Stop AI Sync Recording" : "Start AI Sync with Speech"}
          disabled={permissionError !== null && !isRecording}
        >
          {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          <span className="ml-2">{isRecording ? 'Stop Sync' : 'AI Sync'}</span>
        </Button>
      )}
       <Button onClick={onToggleFullScreen} variant="outline" size="lg" aria-label={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}>
        {isFullScreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
        <span className="ml-2 hidden sm:inline">{isFullScreen ? 'Exit Full' : 'Full Screen'}</span>
      </Button>
    </div>
  );
}
