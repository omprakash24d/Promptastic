
"use client";

import type React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Mic, MicOff, Maximize, Minimize, Loader2 } from 'lucide-react';
import { scrollSyncWithSpeech, type ScrollSyncWithSpeechInput } from '@/ai/flows/scroll-sync-with-speech';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';


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
  const [isAiSyncSupported, setIsAiSyncSupported] = useState(true); // Assume supported until checked

  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder)) {
      setIsAiSyncSupported(false);
      toast({
        title: "AI Sync Not Supported",
        description: "Your browser does not support the necessary features for AI Scroll Sync.",
        variant: "destructive",
        duration: 10000,
      });
    }
    // Cleanup on component unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [toast]);

  const handleAiSyncClick = useCallback(async () => {
    if (!isAiSyncSupported) {
      toast({
        title: "AI Sync Not Supported",
        description: "This feature is not available on your browser.",
        variant: "destructive",
      });
      return;
    }

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
        mediaRecorderRef.current.stop();
      }
      // isRecording will be set to false in onstop
      return;
    }

    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false); // Moved here to ensure it's set before async ops
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        // Stop tracks after blob creation
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
              isAutoSyncEnabled: true,
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
          setIsProcessingAiSync(false); 
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
      setIsRecording(false); // Ensure this is reset on error
      // Clean up stream if it was obtained but MediaRecorder failed
      audioStreamRef.current?.getTracks().forEach(track => track.stop()); 
      audioStreamRef.current = null;
    }
  }, [isAutoSyncEnabled, scriptText, toast, setScrollSpeed, isRecording, isAiSyncSupported, isProcessingAiSync]); // Added isProcessingAiSync

  const aiSyncButtonText = isRecording ? 'Stop Sync' : (isProcessingAiSync ? 'Syncing...' : 'AI Sync');
  const AiSyncIcon = isRecording ? MicOff : (isProcessingAiSync ? Loader2 : Mic);


  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-background/80 backdrop-blur-sm shadow-md rounded-lg">
      {permissionError && !isRecording && (
        <Alert variant="destructive" className="mb-3 w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Microphone Access Denied</AlertTitle>
          <AlertDescription>{permissionError}</AlertDescription>
        </Alert>
      )}
       {!isAiSyncSupported && (
        <Alert variant="destructive" className="mb-3 w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>AI Sync Not Supported</AlertTitle>
          <AlertDescription>
            Your browser does not support the required features for AI Scroll Sync.
            Please try a different browser or update your current one.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button
          onClick={() => togglePlayPause()}
          size="lg"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Spacebar/Backspace)' : 'Play (Spacebar/Backspace)'}
          disabled={isRecording || isProcessingAiSync}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>
        <Button
          onClick={resetScroll}
          variant="outline"
          size="lg"
          aria-label="Reset Scroll"
          title="Reset Scroll"
          disabled={isRecording || isProcessingAiSync}
        >
          <RotateCcw className="h-6 w-6" />
          <span className="ml-2">Reset</span>
        </Button>
        {isAutoSyncEnabled && isAiSyncSupported && (
          <Button
            onClick={handleAiSyncClick}
            variant="outline"
            size="lg"
            className={cn(
                "text-foreground",
                isRecording && "bg-red-600 hover:bg-red-700 border-red-700 text-white",
                !isRecording && !isProcessingAiSync && "bg-accent/20 hover:bg-accent/30 border-accent",
                isProcessingAiSync && "bg-blue-500 hover:bg-blue-600 text-white border-blue-600"
            )}
            aria-label={isRecording ? "Stop AI Sync Recording" : (isProcessingAiSync ? "AI Sync in progress" : "Start AI Sync with Speech")}
            title={isRecording ? "Stop AI Sync Recording" : (isProcessingAiSync ? "AI Sync in progress" : "Start AI Sync with Speech (requires microphone)")}
            disabled={(permissionError !== null && !isRecording) || isProcessingAiSync || !isAiSyncSupported }
          >
            <AiSyncIcon className={cn("h-6 w-6", isProcessingAiSync && "animate-spin")} />
            <span className="ml-2">{aiSyncButtonText}</span>
          </Button>
        )}
         <Button
            onClick={onToggleFullScreen}
            variant="outline"
            size="lg"
            aria-label={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
          >
          {isFullScreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
          <span className="ml-2 hidden sm:inline">{isFullScreen ? 'Exit Full' : 'Full Screen'}</span>
        </Button>
      </div>
    </div>
  );
}
