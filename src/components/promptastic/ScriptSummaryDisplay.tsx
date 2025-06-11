
"use client";

import type React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText, Loader2 } from 'lucide-react';

interface ScriptSummaryDisplayProps {
  summary: string | null;
  isSummarizing: boolean;
}

export function ScriptSummaryDisplay({ summary, isSummarizing }: ScriptSummaryDisplayProps) {
  if (!summary && !isSummarizing) {
    return null;
  }

  return (
    <Alert>
      <BookOpenText className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {isSummarizing ? "Generating Script Summary..." : "Script Summary"}
      </AlertTitle>
      <AlertDescription className="mt-1 text-sm">
        {isSummarizing ? (
          <div className="flex items-center justify-center h-[100px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : summary ? (
          <ScrollArea className="h-[100px] w-full rounded-md p-1 bg-muted/20 border">
            <p className="p-2 whitespace-pre-wrap">{summary}</p>
          </ScrollArea>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
