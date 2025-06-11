
"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { ScriptEditor } from './ScriptEditor';
import { ScriptList } from './ScriptList';
import { ScriptVersionHistory } from './ScriptVersionHistory';
import { ScriptSummaryDisplay } from './ScriptSummaryDisplay';
import { fileTypes as allFileTypes, type FileTypeOption } from '@/lib/fileParser';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
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

const AVERAGE_WPM = 140;

export function ScriptManager() {
  const { toast } = useToast();
  const {
    scriptText, setScriptText,
    scripts, activeScriptName,
    loadScript, saveScript, deleteScript, renameScript, duplicateScript,
    saveScriptVersion, loadScriptVersion,
    setActiveScriptName,
    LONGER_DEFAULT_SCRIPT_TEXT
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

  const defaultScriptText = useTeleprompterStore.getState().LONGER_DEFAULT_SCRIPT_TEXT;


  useEffect(() => {
    setCurrentEditingScriptText(scriptText);
    setScriptSummary(null);
    setIsDirty(false);
  }, [scriptText, activeScriptName]);

  useEffect(() => {
    if (activeScriptName && scripts.find(s => s.name === activeScriptName)?.content !== currentEditingScriptText) {
      setIsDirty(true);
    } else if (!activeScriptName && currentEditingScriptText !== "" && currentEditingScriptText !== defaultScriptText) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [currentEditingScriptText, scriptText, activeScriptName, scripts, defaultScriptText]);
  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (isDirty && currentEditingScriptText.trim() !== "" && currentEditingScriptText !== defaultScriptText) {
            event.preventDefault();
            event.returnValue = ''; 
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, currentEditingScriptText, defaultScriptText]);


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
    if (isDirty && currentEditingScriptText.trim() !== "" && currentEditingScriptText !== defaultScriptText) {
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
    // Toast for save success is handled within saveScript in the store
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
      document.removeEventListener('keydown', handleKeyDown);
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
      deleteScript(name);
      // Toast for delete success is handled within deleteScript in the store
    }
  };

  const handleStartRename = (name: string) => {
    setRenamingScript(name);
    setRenameValue(name);
  };

  const handleConfirmRename = (name: string) => {
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
    // Toast for rename success is handled within renameScript in the store
    setRenamingScript(null);
    setRenameValue("");
  };
  
  const handleCancelRename = () => {
    setRenamingScript(null);
    setRenameValue("");
  };

  const handleNewScript = () => {
    executeOrConfirm(() => {
      setActiveScriptName(null);
      setCurrentEditingScriptText(defaultScriptText);
      setNewScriptName("");
      setScriptSummary(null);
      toast({ title: "New Script", description: "Ready for your new script." });
    });
  };

  const handleDuplicate = (name: string) => {
    duplicateScript(name);
    // Toast for duplicate success is handled within duplicateScript in the store
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
    setActiveScriptName(null); // Mark as not an active saved script
    setCurrentEditingScriptText(content);
    const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    setNewScriptName(fileNameWithoutExtension); // Suggest name for saving
    toast({ 
      title: "File Imported", 
      description: `Content of "${fileName}" loaded into editor. Save it as a new script (suggested name: "${fileNameWithoutExtension}") or replace an existing one.` 
    });
    setIsDirty(true); // Imported content needs to be saved
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileExtension = "." + fileName.split('.').pop()?.toLowerCase();
      const selectedType = allFileTypes.find(ft => ft.accept.split(',').map(a => a.trim()).some(a => a === fileExtension || a === file.type));

      if (selectedType) {
        executeOrConfirm(async () => {
          try {
            toast({ title: "Importing...", description: `Processing ${fileName}. Please wait.`, duration: 5000});
            const content = await selectedType.handler(file);
            if (content !== null) {
              processFileContent(content, fileName);
            } else {
              toast({ title: "Import Error", description: `Could not extract text from "${fileName}". File might be empty or corrupted.`, variant: "destructive" });
            }
          } catch (error) {
            console.error("Error importing file:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error during import.";
            toast({ title: "Import Failed", description: `Could not import "${fileName}". ${errorMessage}`, variant: "destructive", duration: 7000 });
          }
        });
      } else {
        toast({ title: "Import Error", description: `Unsupported file type: "${fileExtension || file.type}". Please select .txt, .pdf, .docx or .md.`, variant: "destructive" });
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
      const { summarizeScript: genkitSummarize } = await import('@/ai/flows/summarize-script-flow');
      const result = await genkitSummarize({ scriptText: currentEditingScriptText });
      setScriptSummary(result.summary);
      toast({ title: "Script Summarized", description: "Summary generated." });
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
      // Toast for version save success is handled within saveScriptVersion in the store
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
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> Unsaved Changes
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
            aria-label="Version notes"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowVersionNotesDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveVersion}>Save Version</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScriptEditor
        scriptText={currentEditingScriptText}
        onScriptTextChange={setCurrentEditingScriptText}
        activeScriptName={activeScriptName}
        newScriptName={newScriptName}
        onNewScriptNameChange={setNewScriptName}
        estimatedReadingTime={estimatedReadingTime}
        isDirty={isDirty}
        onSave={handleSave}
        onNew={handleNewScript}
        onSaveVersion={openSaveVersionDialog}
        onSummarize={handleSummarizeScript}
        isSummarizing={isSummarizing}
        onTriggerImport={triggerFileInput}
        onExportTxt={handleExportTxt}
        importFileTypes={allFileTypes}
      />

      <ScriptSummaryDisplay summary={scriptSummary} isSummarizing={isSummarizing} />

      {activeScriptDetails && (
        <ScriptVersionHistory
          scriptName={activeScriptDetails.name}
          versions={activeScriptDetails.versions || []}
          onLoadVersion={handleLoadVersion}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        aria-hidden="true" 
      />

      <ScriptList
        scripts={scripts}
        activeScriptName={activeScriptName}
        renamingScript={renamingScript}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onLoad={handleLoad}
        onDelete={handleDelete}
        onStartRename={handleStartRename}
        onConfirmRename={handleConfirmRename}
        onCancelRename={handleCancelRename}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}

