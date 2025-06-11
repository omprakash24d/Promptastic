
"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Edit3, CopyPlus, Clock } from 'lucide-react';
import type { Script } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface ScriptListProps {
  scripts: Script[];
  activeScriptName: string | null;
  renamingScript: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onStartRename: (name: string) => void;
  onConfirmRename: (name: string) => void;
  onCancelRename: () => void;
  onDuplicate: (name: string) => void;
}

export function ScriptList({
  scripts,
  activeScriptName,
  renamingScript,
  renameValue,
  onRenameValueChange,
  onLoad,
  onDelete,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onDuplicate,
}: ScriptListProps) {
  if (scripts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No scripts saved yet. Create or import a script to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Saved Scripts</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/20">
          <ul className="space-y-1 p-1">
            {scripts.sort((a, b) => b.updatedAt - a.updatedAt).map((script) => (
              <li key={script.name} className="p-2 rounded-md hover:bg-muted text-sm">
                {renamingScript === script.name ? (
                  <div className="flex flex-grow items-center gap-2 min-w-0">
                    <Input
                      value={renameValue}
                      onChange={(e) => onRenameValueChange(e.target.value)}
                      className="h-8 bg-background text-sm flex-1 min-w-0"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onConfirmRename(script.name);
                        if (e.key === 'Escape') onCancelRename();
                      }}
                      aria-label={`New name for script ${script.name}`}
                    />
                    <Button size="sm" onClick={() => onConfirmRename(script.name)} aria-label="Save new name">Save</Button>
                    <Button size="sm" variant="ghost" onClick={onCancelRename} aria-label="Cancel rename">Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <span
                        className={`block truncate cursor-pointer hover:underline ${activeScriptName === script.name ? 'font-semibold text-primary' : ''}`}
                        onClick={() => onLoad(script.name)}
                        title={`Load script: ${script.name}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLoad(script.name); }}
                      >
                        {script.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                        <Clock className="h-3 w-3 mr-1" /> Last updated: {format(new Date(script.updatedAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(script.name)} aria-label={`Duplicate script ${script.name}`} title="Duplicate script">
                        <CopyPlus className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onStartRename(script.name)} aria-label={`Rename script ${script.name}`} title="Rename script">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(script.name)} aria-label={`Delete script ${script.name}`} title="Delete script">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
