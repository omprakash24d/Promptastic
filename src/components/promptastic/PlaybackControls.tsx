
"use client";

import type React from 'react';
import { useRef, useState, useEffect } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Mic, MicOff, Maximize, Minimize } from 'lucide-react';
import { scrollSyncWithSpeech, type ScrollSyncWithSpeechInput } from '@/ai/flows/scroll-sync-with-speech';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';


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
  const [isProcessingAiSync, setIsProcessingAiSync] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop(); // This will trigger onstop
      }
      // isRecording will be set to false in onstop
      return;
    }

    // Start recording
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream; // Store stream for cleanup
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = []; // Clear chunks for next recording

        // Stop the tracks of the current stream as it's no longer needed
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;


        if (audioBlob.size === 0) {
            toast({ title: "AI Sync", description: "No audio recorded. Please try speaking for a few seconds.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          
          setIsProcessingAiSync(true);
          toast({ title: "AI Syncing...", description: "Analyzing speech to adjust scroll speed." });
          try {
            const input: ScrollSyncWithSpeechInput = {
              scriptText,
              audioDataUri,
              isAutoSyncEnabled: true, // AI Sync button implies this is true
            };
            const output = await scrollSyncWithSpeech(input);
            const newSpeed = Math.max(10, Math.min(output.adjustedScrollSpeed, 200));
            setScrollSpeed(newSpeed);
            toast({
              title: "AI Sync Complete",
              description: `Scroll speed adjusted to ${newSpeed}. Speech rate: ${output.speechRate} WPM. (Note: Speech analysis is currently a placeholder).`,
            });
          } catch (error) {
            console.error("AI Sync Error:", error);
            toast({
              title: "AI Sync Error",
              description: "Could not sync scroll speed. " + (error instanceof Error ? error.message : "Unknown error."),
              variant: "destructive",
            });
          } finally {
            setIsProcessingAiSync(false);
          }
        };
        reader.onerror = () => {
          setIsProcessingAiSync(false); // Ensure this is reset on error
          toast({ title: "Error", description: "Could not process recorded audio.", variant: "destructive" });
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Click 'Stop Sync' to process." });

    } catch (err) {
      console.error("Microphone permission or recording error:", err);
      let message = "Could not start audio recording.";
      if (err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        message = "Microphone access is required for AI Sync. Please enable it in your browser settings and try again.";
        setPermissionError(message);
      }
      toast({ title: "Recording Error", description: message, variant: "destructive" });
      setIsRecording(false);
      audioStreamRef.current?.getTracks().forEach(track => track.stop()); // Ensure cleanup on error
      audioStreamRef.current = null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-background/80 backdrop-blur-sm shadow-md rounded-lg">
      {permissionError && !isRecording && (
        <Alert variant="destructive" className="mb-3 w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Microphone Access Denied</AlertTitle>
          <AlertDescription>{permissionError}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button onClick={togglePlayPause} size="lg" aria-label={isPlaying ? 'Pause' : 'Play'} disabled={isRecording || isProcessingAiSync}>
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>
        <Button onClick={resetScroll} variant="outline" size="lg" aria-label="Reset Scroll" disabled={isRecording || isProcessingAiSync}>
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
                            : "bg-accent/20 hover:bg-accent/30 border-accent text-foreground"}
            `}
            aria-label={isRecording ? "Stop AI Sync Recording" : "Start AI Sync with Speech"}
            disabled={(permissionError !== null && !isRecording) || isProcessingAiSync}
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
    </div>
  );
}
