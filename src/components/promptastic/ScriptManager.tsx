
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
      else setCurrentEditingScriptText(""); 
    } else {
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
    if (!activeScriptName) setNewScriptName("");
  };

  const handleLoad = (name: string) => {
    loadScript(name); 
    toast({ title: "Script Loaded", description: `Script "${name}" is now active.` });
  };

  const handleDelete = (name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const wasActive = activeScriptName === name;
      deleteScript(name);
      toast({ title: "Script Deleted", description: `Script "${name}" has been deleted.` });
      if (wasActive) {
        if (scripts.length > 1) { 
            const newActiveScript = scripts.find(s => s.name !== name); 
            if (newActiveScript) {
                loadScript(newActiveScript.name);
            }
        } else {
             setScriptText(""); 
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
    setActiveScriptName(null); 
    setScriptText(""); 
    setCurrentEditingScriptText(""); 
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
          setActiveScriptName(null); 
          setScriptText(content); 
          setCurrentEditingScriptText(content); 
          const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
          setNewScriptName(fileNameWithoutExtension); 
          toast({ title: "File Imported", description: `Content of "${file.name}" loaded. You can now save it.` });
        };
        reader.readAsText(file);
      } else {
        toast({ title: "Import Error", description: "Please select a .txt file.", variant: "destructive" });
      }
      if (event.target) event.target.value = ""; 
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {activeScriptName ? `Editing: ${activeScriptName}` : "New/Imported Script"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            id="script-textarea"
            value={currentEditingScriptText}
            onChange={(e) => setCurrentEditingScriptText(e.target.value)}
            placeholder="Paste or type your script here..."
            className="min-h-[150px] text-sm bg-background"
            rows={8}
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
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:gap-2">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> {activeScriptName ? 'Save Changes' : 'Save Script'}
            </Button>
            <Button onClick={handleNewScript} variant="outline" className="w-full sm:w-auto">
              <FilePlus2 className="mr-2 h-4 w-4" /> New
            </Button>
            <Button onClick={handleExportTxt} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="w-full sm:w-auto">
              <FileUp className="mr-2 h-4 w-4" /> Import
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".txt"
        className="hidden"
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
                      <div className="flex-grow flex items-center gap-2">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8 bg-background text-sm"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(script.name)}
                        />
                        <Button size="sm" onClick={() => handleRename(script.name)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenamingScript(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className={`cursor-pointer hover:underline truncate flex-1 ${activeScriptName === script.name ? 'font-semibold text-primary' : ''}`}
                          onClick={() => handleLoad(script.name)}
                          title={script.name}
                        >
                          {script.name}
                        </span>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRenamingScript(script.name); setRenameValue(script.name); }} aria-label="Rename script">
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(script.name)} aria-label="Delete script">
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
