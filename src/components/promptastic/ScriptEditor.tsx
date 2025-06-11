
"use client";

import type React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FilePlus2, Save, Download, FileUp, BookOpenText, Loader2, CopyPlus, FileText, FileCode2, FileType as MdIcon } from 'lucide-react';
import type { FileTypeOption } from '@/lib/fileParser';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ScriptEditorProps {
  scriptText: string;
  onScriptTextChange: (text: string) => void;
  activeScriptName: string | null;
  newScriptName: string;
  onNewScriptNameChange: (name: string) => void;
  estimatedReadingTime: string;
  isDirty: boolean;
  onSave: () => void;
  onNew: () => void;
  onSaveVersion: () => void;
  onSummarize: () => void;
  isSummarizing: boolean;
  onTriggerImport: (acceptTypes: string) => void;
  onExportTxt: () => void;
  importFileTypes: FileTypeOption[];
}

export function ScriptEditor({
  scriptText,
  onScriptTextChange,
  activeScriptName,
  newScriptName,
  onNewScriptNameChange,
  estimatedReadingTime,
  isDirty,
  onSave,
  onNew,
  onSaveVersion,
  onSummarize,
  isSummarizing,
  onTriggerImport,
  onExportTxt,
  importFileTypes,
}: ScriptEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>
            {activeScriptName ? `Editing: ${activeScriptName}` : "New/Imported Script"}
          </span>
          <div className="flex items-center">
            {isDirty && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-2 mr-2">(Unsaved changes)</span>}
            <span className="text-xs font-normal text-muted-foreground">{estimatedReadingTime}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label htmlFor="script-textarea" className="sr-only">Script Content</Label>
        <Textarea
          id="script-textarea"
          value={scriptText}
          onChange={(e) => onScriptTextChange(e.target.value)}
          placeholder="Paste or type your script here..."
          className="min-h-[250px] text-sm bg-background"
          rows={15}
          aria-label="Script content editor"
        />
        {!activeScriptName && (
          <div>
            <Label htmlFor="new-script-name" className="text-xs">Script Name (for saving new/imported)</Label>
            <Input
              id="new-script-name"
              value={newScriptName}
              onChange={(e) => onNewScriptNameChange(e.target.value)}
              placeholder="Enter script name"
              className="bg-background mt-1 text-sm"
              aria-label="New script name"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-start gap-2 pt-4">
        <Button onClick={onSave} aria-label={activeScriptName ? 'Save changes to current script' : 'Save as new script'}>
          <Save className="mr-2 h-4 w-4" /> {activeScriptName ? 'Save Changes' : 'Save New Script'}
        </Button>
        {activeScriptName && (
          <Button onClick={onSaveVersion} variant="outline" aria-label="Save current content as a new version of this script">
            <CopyPlus className="mr-2 h-4 w-4" /> Save Version
          </Button>
        )}
        <Button onClick={onNew} variant="outline" aria-label="Create a new blank script">
          <FilePlus2 className="mr-2 h-4 w-4" /> New
        </Button>
        <Button onClick={onExportTxt} variant="outline" aria-label="Export current script as a .txt file">
          <Download className="mr-2 h-4 w-4" /> Export .txt
        </Button>
        {importFileTypes.map(ft => (
          <Button key={ft.label} onClick={() => onTriggerImport(ft.accept)} variant="outline" aria-label={`Import script from a ${ft.shortLabel} file`}>
            <ft.icon className="mr-2 h-4 w-4" /> {ft.shortLabel}
          </Button>
        ))}
        <Button onClick={onSummarize} variant="outline" disabled={isSummarizing || !scriptText.trim()} aria-label="Generate AI summary for current script">
          {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpenText className="mr-2 h-4 w-4" />}
          {isSummarizing ? 'Summarizing...' : 'Summarize'}
        </Button>
      </CardFooter>
    </Card>
  );
}
