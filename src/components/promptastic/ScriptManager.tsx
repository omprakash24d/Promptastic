
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilePlus2, Save, Trash2, Edit3, Download, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    setCurrentEditingScriptText(scriptText);
  }, [scriptText]);
  
  useEffect(() => {
    if (activeScriptName) {
      const active = scripts.find(s => s.name === activeScriptName);
      if (active) setCurrentEditingScriptText(active.content);
      else setCurrentEditingScriptText(""); // Clear if active script name is invalid/deleted
    } else {
      // If no active script name, reflect the global scriptText (e.g. after import or new script)
      setCurrentEditingScriptText(scriptText);
    }
  }, [activeScriptName, scripts, scriptText]);


  const handleSave = () => {
    if (!newScriptName.trim() && !activeScriptName) {
      toast({ title: "Error", description: "Please enter a name for the new script.", variant: "destructive" });
      return;
    }
    const nameToSave = activeScriptName || newScriptName.trim();
    if (!nameToSave) {
       toast({ title: "Error", description: "Script name cannot be empty.", variant: "destructive" });
       return;
    }
    saveScript(nameToSave, currentEditingScriptText);
    toast({ title: "Script Saved", description: `Script "${nameToSave}" has been saved.` });
    if (!activeScriptName) setNewScriptName(""); // Clear input only if it was a new script
  };

  const handleLoad = (name: string) => {
    loadScript(name); // This will update global scriptText and activeScriptName
    // The useEffect above will then update currentEditingScriptText
    toast({ title: "Script Loaded", description: `Script "${name}" is now active.` });
  };

  const handleDelete = (name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const wasActive = activeScriptName === name;
      deleteScript(name);
      toast({ title: "Script Deleted", description: `Script "${name}" has been deleted.` });
      if (wasActive) {
         // If the deleted script was active, try to load the first available script or clear
        if (scripts.length > 1) { // scripts array in store is already updated by deleteScript
            const newActiveScript = scripts.find(s => s.name !== name); // find first script that is not the deleted one
            if (newActiveScript) {
                loadScript(newActiveScript.name);
            }
        } else {
             setScriptText(""); // Clear script text if no other scripts are left
             setCurrentEditingScriptText("");
        }
      }
    }
  };

  const handleRename = (name: string) => {
    if (!renameValue.trim()) {
      toast({ title: "Error", description: "New name cannot be empty.", variant: "destructive" });
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
    setActiveScriptName(null); // Important: set this first
    setScriptText(""); // This updates global scriptText
    setCurrentEditingScriptText(""); // This updates local textarea content
    setNewScriptName("");
    toast({ title: "New Script", description: "Ready for your new script."});
  };
  
  const handleExportTxt = () => {
    if (!currentEditingScriptText.trim()) {
      toast({ title: "Error", description: "No script content to export.", variant: "destructive" });
      return;
    }
    const filename = (activeScriptName || "promptastic_script") + ".txt";
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setActiveScriptName(null); // Set active to null for imported script
          setScriptText(content); // Update global state
          setCurrentEditingScriptText(content); // Update local state for textarea
          const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
          setNewScriptName(fileNameWithoutExtension); // Suggest filename for saving
          toast({ title: "File Imported", description: `Content of "${file.name}" loaded. You can now save it.` });
        };
        reader.readAsText(file);
      } else {
        toast({ title: "Import Error", description: "Please select a .txt file.", variant: "destructive" });
      }
      // Reset file input to allow importing the same file again if needed
      if (event.target) event.target.value = ""; 
    }
  };


  return (
    <div className="space-y-6 p-4">
      <div>
        <Label htmlFor="script-textarea" className="text-lg font-semibold mb-2 block">
          {activeScriptName ? `Editing: ${activeScriptName}` : "Script Content (New/Imported)"}
        </Label>
        <Textarea
          id="script-textarea"
          value={currentEditingScriptText}
          onChange={(e) => setCurrentEditingScriptText(e.target.value)}
          placeholder="Paste or type your script here..."
          className="min-h-[200px] text-base bg-background"
          rows={10}
        />
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".txt"
        className="hidden"
      />

      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 items-end">
        {!activeScriptName && (
           <div className="flex-grow col-span-2 sm:col-auto">
            <Label htmlFor="new-script-name">Script Name (for saving)</Label>
            <Input
              id="new-script-name"
              value={newScriptName}
              onChange={(e) => setNewScriptName(e.target.value)}
              placeholder="Enter script name to save"
              className="bg-background"
            />
          </div>
        )}
         <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" /> {activeScriptName ? 'Save Changes' : 'Save New Script'}
        </Button>
        <Button onClick={handleNewScript} variant="outline" className="w-full sm:w-auto">
          <FilePlus2 className="mr-2 h-4 w-4" /> New
        </Button>
         <Button onClick={handleExportTxt} variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Export .txt
        </Button>
        <Button onClick={handleImportClick} variant="outline" className="w-full sm:w-auto">
          <FileUp className="mr-2 h-4 w-4" /> Import .txt
        </Button>
      </div>

      {scripts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Saved Scripts</h3>
          <ScrollArea className="h-[200px] w-full rounded-md border p-2 bg-muted/20">
            <ul className="space-y-2">
              {scripts.map((script) => (
                <li key={script.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  {renamingScript === script.name ? (
                    <div className="flex-grow flex items-center gap-2">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-8 bg-background"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(script.name)}
                      />
                      <Button size="sm" onClick={() => handleRename(script.name)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenamingScript(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className={`cursor-pointer hover:underline truncate flex-1 ${activeScriptName === script.name ? 'font-bold text-primary' : ''}`}
                        onClick={() => handleLoad(script.name)}
                        title={script.name}
                      >
                        {script.name}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setRenamingScript(script.name); setRenameValue(script.name); }} aria-label="Rename script">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(script.name)} aria-label="Delete script">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
