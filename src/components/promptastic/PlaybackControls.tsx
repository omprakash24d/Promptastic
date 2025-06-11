
"use client";

import type React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Mic, MicOff, Maximize, Minimize, Loader2, BookOpenText } from 'lucide-react';
import { scrollSyncWithSpeech, type ScrollSyncWithSpeechInput } from '@/ai/flows/scroll-sync-with-speech';
import { summarizeScript, type SummarizeScriptInput, type SummarizeScriptOutput } from '@/ai/flows/summarize-script-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as DialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';


interface PlaybackControlsProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  // isPresentationMode and onTogglePresentationMode are removed as per request
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
  const [isAiSyncSupported, setIsAiSyncSupported] = useState(true); 

  const [isSummarizingFooter, setIsSummarizingFooter] = useState(false);
  const [summaryResultFooter, setSummaryResultFooter] = useState<string | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder)) {
      setIsAiSyncSupported(false);
      if (isAutoSyncEnabled) { 
        toast({
          title: "AI Sync Not Supported",
          description: "Your browser does not support the necessary features for AI Scroll Sync.",
          variant: "destructive",
          duration: 10000,
        });
      }
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [toast, isAutoSyncEnabled]);

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
        setIsRecording(false); 
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
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
      setIsRecording(false); 
      audioStreamRef.current?.getTracks().forEach(track => track.stop()); 
      audioStreamRef.current = null;
    }
  }, [isAutoSyncEnabled, scriptText, toast, setScrollSpeed, isRecording, isAiSyncSupported, isProcessingAiSync]); 

  const handleSummarizeFooter = async () => {
    if (!scriptText.trim()) {
      toast({ title: "Cannot Summarize", description: "Script is empty.", variant: "destructive" });
      return;
    }
    setIsSummarizingFooter(true);
    setSummaryResultFooter(null);
    setShowSummaryDialog(true); 
    try {
      const result: SummarizeScriptOutput = await summarizeScript({ scriptText });
      setSummaryResultFooter(result.summary);
    } catch (error) {
      console.error("Error summarizing script from footer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error.";
      setSummaryResultFooter(`Error generating summary: ${errorMessage}`);
      toast({ title: "Summarization Error", description: `Could not summarize script. ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsSummarizingFooter(false);
    }
  };


  const aiSyncButtonText = isRecording ? 'Stop Sync' : (isProcessingAiSync ? 'Syncing...' : 'AI Sync');
  const AiSyncIcon = isRecording ? MicOff : (isProcessingAiSync ? Loader2 : Mic);


  return (
    <>
      <div className="flex flex-col items-center gap-3 p-4 bg-background/80 backdrop-blur-sm shadow-md rounded-lg">
        {permissionError && !isRecording && (
          <Alert variant="destructive" className="mb-3 w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Microphone Access Denied</AlertTitle>
            <AlertDescription>{permissionError}</AlertDescription>
          </Alert>
        )}
        {!isAiSyncSupported && isAutoSyncEnabled && (
          <Alert variant="destructive" className="mb-3 w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>AI Sync Not Supported</AlertTitle>
            <AlertDescription>
              Your browser does not support the required features for AI Scroll Sync.
              Please try a different browser or update your current one.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Button
            onClick={() => togglePlayPause()}
            size="lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Spacebar/Backspace)' : 'Play (Spacebar/Backspace)'}
            disabled={isRecording || isProcessingAiSync}
            className="px-4"
          >
            {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
            <span className="ml-2 hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>
          <Button
            onClick={resetScroll}
            variant="outline"
            size="lg"
            aria-label="Reset Scroll"
            title="Reset Scroll"
            disabled={isRecording || isProcessingAiSync}
            className="px-4"
          >
            <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="ml-2 hidden sm:inline">Reset</span>
          </Button>
          {isAutoSyncEnabled && isAiSyncSupported && (
            <Button
              onClick={handleAiSyncClick}
              variant="outline"
              size="lg"
              className={cn(
                  "text-foreground px-4",
                  isRecording && "bg-red-600 hover:bg-red-700 border-red-700 text-white",
                  !isRecording && !isProcessingAiSync && "bg-accent/20 hover:bg-accent/30 border-accent",
                  isProcessingAiSync && "bg-blue-500 hover:bg-blue-600 text-white border-blue-600"
              )}
              aria-label={isRecording ? "Stop AI Sync Recording" : (isProcessingAiSync ? "AI Sync in progress" : "Start AI Sync with Speech")}
              title={isRecording ? "Stop AI Sync Recording" : (isProcessingAiSync ? "AI Sync in progress" : "Start AI Sync with Speech (requires microphone)")}
              disabled={(permissionError !== null && !isRecording) || isProcessingAiSync || !isAiSyncSupported }
            >
              <AiSyncIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", isProcessingAiSync && "animate-spin")} />
              <span className="ml-2 hidden sm:inline">{aiSyncButtonText}</span>
            </Button>
          )}
          <Button
              onClick={handleSummarizeFooter}
              variant="outline"
              size="lg"
              aria-label="Get Script Summary"
              title="Get Script Summary"
              disabled={isSummarizingFooter || !scriptText.trim()}
              className="px-4"
          >
              {isSummarizingFooter && showSummaryDialog ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : <BookOpenText className="h-5 w-5 sm:h-6 sm:w-6" />}
              <span className="ml-2 hidden sm:inline">Summary</span>
          </Button>
          <Button
              onClick={onToggleFullScreen}
              variant="outline"
              size="lg"
              aria-label={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
              className="px-4"
            >
            {isFullScreen ? <Minimize className="h-5 w-5 sm:h-6 sm:w-6" /> : <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />}
            <span className="ml-2 hidden sm:inline">{isFullScreen ? 'Exit Full' : 'Full Screen'}</span>
          </Button>
        </div>
      </div>
      
      {showSummaryDialog && (
        <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <DialogTitle className="flex items-center">
                <BookOpenText className="mr-2 h-5 w-5" /> Script Summary
              </DialogTitle>
              <AlertDialogDescription>
                {isSummarizingFooter
                  ? "Generating summary, please wait..."
                  : "Here is the AI-generated summary of your script:"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {isSummarizingFooter ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              summaryResultFooter && (
                <ScrollArea className="max-h-[40vh] rounded-md border p-3 bg-muted/30 my-2">
                  <p className="text-sm whitespace-pre-wrap">{summaryResultFooter}</p>
                </ScrollArea>
              )
            )}
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowSummaryDialog(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
