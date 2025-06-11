
"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilePlus2, Save, Trash2, Edit3, Download, FileUp, FileText, FileCode2, AlertTriangle, BookOpenText, Loader2, CopyPlus, History, Eye, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist/build/pdf.mjs';
import { summarizeScript } from '@/ai/flows/summarize-script-flow';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import type { ScriptVersion } from '@/types';

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.mjs`;
}

interface FileTypeOption {
  label: string;
  shortLabel: string;
  accept: string;
  icon: React.ElementType;
  handler: (file: File) => Promise<string | null>;
}

const AVERAGE_WPM = 140; // Words per minute

export function ScriptManager() {
  const { toast } = useToast();
  const {
    scriptText, setScriptText,
    scripts, activeScriptName,
    loadScript, saveScript, deleteScript, renameScript, duplicateScript,
    saveScriptVersion, loadScriptVersion,
    setActiveScriptName
  } = useTeleprompterStore();

  const [currentEditingScriptText, setCurrentEditingScriptText] = useState(scriptText);
  const [newScriptName, setNewScriptName] = useState("");
  const [renamingScript, setRenamingScript] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scriptSummary, setScriptSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [showVersionNotesDialog, setShowVersionNotesDialog] = useState(false);
  const [pendingVersionSaveAction, setPendingVersionSaveAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    setCurrentEditingScriptText(scriptText);
    setScriptSummary(null); 
    setIsDirty(false);
  }, [scriptText, activeScriptName]);

  useEffect(() => {
    if (activeScriptName && scripts.find(s => s.name === activeScriptName)?.content !== currentEditingScriptText) {
      setIsDirty(true);
    } else if (!activeScriptName && currentEditingScriptText !== "" && currentEditingScriptText !== useTeleprompterStore.getState().LONGER_DEFAULT_SCRIPT_TEXT) { 
      setIsDirty(true);
    }
     else {
      setIsDirty(false);
    }
  }, [currentEditingScriptText, scriptText, activeScriptName, scripts]);

  const estimatedReadingTime = useMemo(() => {
    if (!currentEditingScriptText.trim()) return "Est. reading time: 0 min 0 sec";
    const words = currentEditingScriptText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = words / AVERAGE_WPM;
    const totalSeconds = Math.floor(minutes * 60);
    const displayMinutes = Math.floor(totalSeconds / 60);
    const displaySeconds = totalSeconds % 60;
    return `Est. reading time: ${displayMinutes} min ${displaySeconds} sec`;
  }, [currentEditingScriptText]);

  const handleConfirmDiscard = () => {
    if (pendingAction) {
      pendingAction();
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
    setIsDirty(false);
  };

  const handleCancelDiscard = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const executeOrConfirm = (action: () => void) => {
    if (isDirty && currentEditingScriptText.trim() !== "" && currentEditingScriptText !== useTeleprompterStore.getState().LONGER_DEFAULT_SCRIPT_TEXT) {
      setPendingAction(() => action);
      setShowConfirmDialog(true);
    } else {
      action();
      setIsDirty(false);
    }
  };

  const handleSave = useCallback(() => {
    const nameToSave = activeScriptName || newScriptName.trim();
    if (!nameToSave) {
      toast({ title: "Error", description: "Script name cannot be empty.", variant: "destructive" });
      return;
    }
     if (!currentEditingScriptText.trim()) {
      toast({ title: "Error", description: "Cannot save an empty script.", variant: "destructive" });
      return;
    }

    if (!activeScriptName && scripts.some(s => s.name === nameToSave)) {
      toast({ title: "Error", description: `A script named "${nameToSave}" already exists. Please choose a different name.`, variant: "destructive" });
      return;
    }

    saveScript(nameToSave, currentEditingScriptText);
    toast({ title: "Script Saved", description: `Script "${nameToSave}" has been saved.` });
    if (!activeScriptName) setNewScriptName(""); 
    setIsDirty(false);
  }, [activeScriptName, newScriptName, currentEditingScriptText, saveScript, toast, scripts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);


  const handleLoad = (name: string) => {
     executeOrConfirm(() => {
        loadScript(name);
        toast({ title: "Script Loaded", description: `Script "${name}" is now active.` });
     });
  };

  const handleDelete = (name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`);
    if (confirmDelete) {
      const wasActive = activeScriptName === name;
      const remainingScripts = scripts.filter(s => s.name !== name);
      deleteScript(name);
      toast({ title: "Script Deleted", description: `Script "${name}" has been deleted.` });

      if (wasActive) {
        if (remainingScripts.length > 0) {
            const newActiveScript = remainingScripts[0];
            if (newActiveScript) {
                loadScript(newActiveScript.name);
            }
        } else {
             setCurrentEditingScriptText(useTeleprompterStore.getState().LONGER_DEFAULT_SCRIPT_TEXT);
             setActiveScriptName(null);
        }
      }
       setIsDirty(false);
    }
  };

  const handleRename = (name: string) => {
    const trimmedRenameValue = renameValue.trim();
    if (!trimmedRenameValue) {
      toast({ title: "Error", description: "New name cannot be empty.", variant: "destructive" });
      return;
    }
    if (trimmedRenameValue === name) {
        setRenamingScript(null);
        setRenameValue("");
        return;
    }
    if (scripts.some(s => s.name === trimmedRenameValue && s.name !== name)) {
      toast({ title: "Error", description: `A script named "${trimmedRenameValue}" already exists.`, variant: "destructive" });
      return;
    }
    renameScript(name, trimmedRenameValue);
    toast({ title: "Script Renamed", description: `Script "${name}" renamed to "${trimmedRenameValue}".` });
    setRenamingScript(null);
    setRenameValue("");
  };

  const handleNewScript = () => {
    executeOrConfirm(() => {
        setActiveScriptName(null);
        setCurrentEditingScriptText(useTeleprompterStore.getState().LONGER_DEFAULT_SCRIPT_TEXT);
        setNewScriptName("");
        setScriptSummary(null);
        toast({ title: "New Script", description: "Ready for your new script."});
    });
  };

  const handleDuplicate = (name: string) => {
    const newName = duplicateScript(name);
    if (newName) {
      toast({ title: "Script Duplicated", description: `Script "${name}" duplicated as "${newName}". New script is now active.` });
    } else {
      toast({ title: "Error", description: `Could not duplicate script "${name}".`, variant: "destructive" });
    }
  };

  const handleExportTxt = () => {
    if (!currentEditingScriptText.trim()) {
      toast({ title: "Error", description: "No script content to export.", variant: "destructive" });
      return;
    }
    const filename = (activeScriptName || newScriptName || "promptastic_script") + ".txt";
    const blob = new Blob([currentEditingScriptText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Script Exported", description: `Script exported as ${filename}.` });
  };

  const triggerFileInput = (acceptTypes: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptTypes;
      fileInputRef.current.click();
    }
  };

  const processFileContent = (content: string, fileName: string) => {
    setActiveScriptName(null); 
    setCurrentEditingScriptText(content);
    const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    setNewScriptName(fileNameWithoutExtension); 
    toast({ title: "File Imported", description: `Content of "${fileName}" loaded. You can now save it as a new script.` });
    setIsDirty(true); 
  };

  const fileTypes: FileTypeOption[] = [
    {
      label: "Import .txt",
      shortLabel: ".txt",
      accept: ".txt",
      icon: FileUp,
      handler: async (file) => file.text(),
    },
    {
      label: "Import .pdf",
      shortLabel: ".pdf",
      accept: ".pdf",
      icon: FileCode2,
      handler: async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({data: arrayBuffer}).promise;
        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => ('str' in item ? item.str : '')).join(" ") + "\n";
        }
        return textContent;
      }
    },
    {
      label: "Import .docx",
      shortLabel: ".docx",
      accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      icon: FileText,
      handler: async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }
    },
  ];

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileExtension = "." + fileName.split('.').pop()?.toLowerCase();
      const selectedType = fileTypes.find(ft => ft.accept.includes(fileExtension) || ft.accept.includes(file.type));

      if (selectedType) {
        executeOrConfirm(async () => {
          try {
            const content = await selectedType.handler(file);
            if (content !== null) {
              processFileContent(content, fileName);
            } else {
              toast({ title: "Import Error", description: `Could not extract text from "${fileName}". File might be empty or corrupted.`, variant: "destructive" });
            }
          } catch (error) {
            console.error("Error importing file:", error);
            toast({ title: "Import Error", description: `Could not read file "${fileName}". ${error instanceof Error ? error.message : "Unknown error."}`, variant: "destructive" });
          }
        });
      } else {
        toast({ title: "Import Error", description: "Unsupported file type. Please select .txt, .pdf, or .docx.", variant: "destructive" });
      }
      if (event.target) event.target.value = "";
    }
  };

  const handleSummarizeScript = async () => {
    if (!currentEditingScriptText.trim()) {
      toast({ title: "Cannot Summarize", description: "Script is empty.", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    setScriptSummary(null);
    try {
      const result = await summarizeScript({ scriptText: currentEditingScriptText });
      setScriptSummary(result.summary);
      toast({ title: "Script Summarized", description: "Summary generated below the script editor." });
    } catch (error) {
      console.error("Error summarizing script:", error);
      toast({ title: "Summarization Error", description: `Could not summarize script. ${error instanceof Error ? error.message : "Unknown error."}`, variant: "destructive" });
      setScriptSummary("Error generating summary.");
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const openSaveVersionDialog = () => {
    if (!activeScriptName) {
        toast({ title: "Cannot Save Version", description: "You must save the script first before saving versions.", variant: "destructive" });
        return;
    }
    setVersionNotes(""); 
    setShowVersionNotesDialog(true);
    setPendingVersionSaveAction(() => () => { 
        saveScriptVersion(activeScriptName, versionNotes);
        toast({ title: "Version Saved", description: `New version for "${activeScriptName}" saved.` });
        setShowVersionNotesDialog(false);
        setVersionNotes("");
    });
  };

  const handleConfirmSaveVersion = () => {
    if (pendingVersionSaveAction) {
        pendingVersionSaveAction();
    }
  };

  const handleLoadVersion = (scriptName: string, versionId: string) => {
    executeOrConfirm(() => {
        loadScriptVersion(scriptName, versionId);
        toast({ title: "Version Loaded", description: `Version loaded for script "${scriptName}".` });
    });
  };

  const activeScriptDetails = useMemo(() => {
    return scripts.find(s => s.name === activeScriptName);
  }, [scripts, activeScriptName]);


  return (
    <div className="space-y-6">
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
              Unsaved Changes
            </DialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to discard them and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDiscard}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showVersionNotesDialog} onOpenChange={setShowVersionNotesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <DialogTitle>Save New Version</DialogTitle>
            <AlertDialogDescription>
              Enter optional notes for this version of "{activeScriptName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={versionNotes}
            onChange={(e) => setVersionNotes(e.target.value)}
            placeholder="E.g., Final draft for client review"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowVersionNotesDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveVersion}>Save Version</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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
          <Textarea
            id="script-textarea"
            value={currentEditingScriptText}
            onChange={(e) => setCurrentEditingScriptText(e.target.value)}
            placeholder="Paste or type your script here..."
            className="min-h-[250px] text-sm bg-background"
            rows={15}
          />
          {!activeScriptName && (
            <div>
              <Label htmlFor="new-script-name" className="text-xs">Script Name (for saving new/imported)</Label>
              <Input
                id="new-script-name"
                value={newScriptName}
                onChange={(e) => setNewScriptName(e.target.value)}
                placeholder="Enter script name"
                className="bg-background mt-1 text-sm"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-start gap-2 pt-4">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> {activeScriptName ? 'Save Changes' : 'Save New Script'}
            </Button>
            {activeScriptName && (
                <Button onClick={openSaveVersionDialog} variant="outline">
                    <CopyPlus className="mr-2 h-4 w-4" /> Save Version
                </Button>
            )}
            <Button onClick={handleNewScript} variant="outline">
              <FilePlus2 className="mr-2 h-4 w-4" /> New
            </Button>
             <Button onClick={handleExportTxt} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export .txt
            </Button>
            {fileTypes.map(ft => (
              <Button key={ft.label} onClick={() => triggerFileInput(ft.accept)} variant="outline">
                <ft.icon className="mr-2 h-4 w-4" /> {ft.shortLabel}
              </Button>
            ))}
            <Button onClick={handleSummarizeScript} variant="outline" disabled={isSummarizing || !currentEditingScriptText.trim()}>
              {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpenText className="mr-2 h-4 w-4" />}
              {isSummarizing ? 'Summarizing...' : 'Summarize'}
            </Button>
        </CardFooter>
      </Card>
      
      {scriptSummary && (
        <Alert>
          <BookOpenText className="h-4 w-4" />
          <AlertTitle className="font-semibold">Script Summary</AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            <ScrollArea className="h-[100px] w-full rounded-md p-1 bg-muted/20 border">
             <p className="p-2 whitespace-pre-wrap">{scriptSummary}</p>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      {activeScriptDetails && activeScriptDetails.versions && activeScriptDetails.versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
                <History className="mr-2 h-5 w-5" /> Script Versions for "{activeScriptDetails.name}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px] w-full rounded-md border bg-muted/20">
              <ul className="space-y-1 p-1">
                {activeScriptDetails.versions.sort((a,b) => b.timestamp - a.timestamp).map((version) => (
                  <li key={version.versionId} className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm">
                    <div>
                      <span className="font-medium">{format(new Date(version.timestamp), "MMM d, yyyy HH:mm:ss")}</span>
                      {version.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{version.notes}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleLoadVersion(activeScriptDetails.name, version.versionId)}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Load
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}


      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
      />

      {scripts.length > 0 && (
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
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8 bg-background text-sm flex-1 min-w-0"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(script.name);
                            if (e.key === 'Escape') { setRenamingScript(null); setRenameValue("");}
                          }}
                        />
                        <Button size="sm" onClick={() => handleRename(script.name)} className="flex-shrink-0">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setRenamingScript(null); setRenameValue(""); }} className="flex-shrink-0">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <span
                            className={`block truncate cursor-pointer hover:underline ${activeScriptName === script.name ? 'font-semibold text-primary' : ''}`}
                            onClick={() => handleLoad(script.name)}
                            title={script.name}
                          >
                            {script.name}
                          </span>
                           <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                             <Clock className="h-3 w-3 mr-1" /> Last updated: {format(new Date(script.updatedAt), "MMM d, yyyy HH:mm")}
                           </span>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-0.5">
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(script.name)} aria-label={`Duplicate script ${script.name}`} title="Duplicate script">
                            <CopyPlus className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRenamingScript(script.name); setRenameValue(script.name); }} aria-label={`Rename script ${script.name}`} title="Rename script">
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(script.name)} aria-label={`Delete script ${script.name}`} title="Delete script">
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
      )}
    </div>
  );
}
