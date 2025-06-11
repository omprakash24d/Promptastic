
"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Eye } from 'lucide-react';
import type { ScriptVersion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface ScriptVersionHistoryProps {
  scriptName: string | null;
  versions: ScriptVersion[];
  onLoadVersion: (scriptName: string, versionId: string) => void;
}

export function ScriptVersionHistory({ scriptName, versions, onLoadVersion }: ScriptVersionHistoryProps) {
  if (!scriptName || !versions || versions.length === 0) {
    return null; // Don't render if no active script or no versions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <History className="mr-2 h-5 w-5" /> Script Versions for "{scriptName}"
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[150px] w-full rounded-md border bg-muted/20">
          <ul className="space-y-1 p-1">
            {versions.sort((a, b) => b.timestamp - a.timestamp).map((version) => (
              <li key={version.versionId} className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm">
                <div>
                  <span className="font-medium">{format(new Date(version.timestamp), "MMM d, yyyy HH:mm:ss")}</span>
                  {version.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{version.notes}</p>}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onLoadVersion(scriptName, version.versionId)}
                  aria-label={`Load version from ${format(new Date(version.timestamp), "MMM d, yyyy HH:mm:ss")}`}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Load
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
