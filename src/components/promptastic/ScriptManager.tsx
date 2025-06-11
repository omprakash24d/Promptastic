
"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilePlus2, Save, Trash2, Edit3, Download, FileUp, FileText, FileCode2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist/build/pdf.mjs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.mjs`;
}

interface FileTypeOption {
  label: string;
  accept: string;
  icon: React.ElementType;
  handler: (file: File) => Promise<string | null>;
}

export function ScriptManager() {
  const { toast } = useToast();
  const {
    scriptText, setScriptText,
    scripts, activeScriptName,
    loadScript, saveScript, deleteScript, renameScript,
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


  useEffect(() => {
    setCurrentEditingScriptText(scriptText);
    setIsDirty(false); 
  }, [scriptText]);

  useEffect(() => {
    if (currentEditingScriptText !== scriptText) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [currentEditingScriptText, scriptText]);

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
    if (isDirty) {
      setPendingAction(() => action);
      setShowConfirmDialog(true);
    } else {
      action();
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
    window.addEventListener('keydown', handleKeyDown);
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
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
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
             setScriptText(""); 
             setCurrentEditingScriptText("");
             setActiveScriptName(null);
        }
      }
       setIsDirty(false); // Ensure dirty flag is reset if active script was deleted
    }
  };

  const handleRename = (name: string) => {
    if (!renameValue.trim()) {
      toast({ title: "Error", description: "New name cannot be empty.", variant: "destructive" });
      return;
    }
    if (renameValue.trim() === name) {
        setRenamingScript(null);
        setRenameValue("");
        return; 
    }
    if (scripts.some(s => s.name === renameValue.trim() && s.name !== name)) {
      toast({ title: "Error", description: `A script named "${renameValue.trim()}" already exists.`, variant: "destructive" });
      return;
    }
    renameScript(name, renameValue.trim());
    toast({ title: "Script Renamed", description: `Script "${name}" renamed to "${renameValue.trim()}".` });
    setRenamingScript(null);
    setRenameValue("");
  };

  const handleNewScript = () => {
    executeOrConfirm(() => {
        setActiveScriptName(null); 
        setScriptText(""); 
        setCurrentEditingScriptText(""); 
        setNewScriptName("");
        toast({ title: "New Script", description: "Ready for your new script."});
    });
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
    setScriptText(content);
    const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    setNewScriptName(fileNameWithoutExtension);
    toast({ title: "File Imported", description: `Content of "${fileName}" loaded. You can now save it as a new script.` });
    setIsDirty(true); // Imported content is considered an unsaved change
  };

  const fileTypes: FileTypeOption[] = [
    { 
      label: "Import .txt", 
      accept: ".txt", 
      icon: FileUp,
      handler: async (file) => file.text(),
    },
    { 
      label: "Import .pdf", 
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

  return (
    <div className="space-y-6">
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
              Unsaved Changes
            </AlertDialogTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>
              {activeScriptName ? `Editing: ${activeScriptName}` : "New/Imported Script"}
            </span>
            {isDirty && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-2">(Unsaved changes)</span>}
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
            <Button onClick={handleSave} className="flex-grow sm:flex-grow-0">
              <Save className="mr-2 h-4 w-4" /> {activeScriptName ? 'Save Changes' : 'Save Script'}
            </Button>
            <Button onClick={handleNewScript} variant="outline" className="flex-grow sm:flex-grow-0">
              <FilePlus2 className="mr-2 h-4 w-4" /> New
            </Button>
             <Button onClick={handleExportTxt} variant="outline" className="flex-grow sm:flex-grow-0">
              <Download className="mr-2 h-4 w-4" /> Export .txt
            </Button>
            {fileTypes.map(ft => (
              <Button key={ft.label} onClick={() => triggerFileInput(ft.accept)} variant="outline" className="flex-grow sm:flex-grow-0">
                <ft.icon className="mr-2 h-4 w-4" /> {ft.label.replace("Import ", "")}
              </Button>
            ))}
        </CardFooter>
      </Card>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        // `accept` will be set dynamically by triggerFileInput
      />

      {scripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border p-1 bg-muted/20">
              <ul className="space-y-1">
                {scripts.map((script) => (
                  <li key={script.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm">
                    {renamingScript === script.name ? (
                      <div className="flex-grow flex items-center gap-2 min-w-0"> {/* Added min-w-0 here */}
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8 bg-background text-sm flex-1 min-w-0" // Added flex-1 and min-w-0 for input
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(script.name);
                            if (e.key === 'Escape') { setRenamingScript(null); setRenameValue("");}
                          }}
                        />
                        <Button size="sm" onClick={() => handleRename(script.name)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setRenamingScript(null); setRenameValue(""); }}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className={`cursor-pointer hover:underline truncate flex-1 min-w-0 ${activeScriptName === script.name ? 'font-semibold text-primary' : ''}`}
                          onClick={() => handleLoad(script.name)}
                          title={script.name}
                        >
                          {script.name}
                        </span>
                        <div className="flex gap-0.5 shrink-0"> {/* Added shrink-0 to button group */}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRenamingScript(script.name); setRenameValue(script.name); }} aria-label={`Rename script ${script.name}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(script.name)} aria-label={`Delete script ${script.name}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </>
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

