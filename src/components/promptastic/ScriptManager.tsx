
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilePlus2, Save, Trash2, Edit3, Download } from 'lucide-react';
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

  useEffect(() => {
    setCurrentEditingScriptText(scriptText);
  }, [scriptText]);
  
  useEffect(() => {
    if (activeScriptName) {
      const active = scripts.find(s => s.name === activeScriptName);
      if (active) setCurrentEditingScriptText(active.content);
    }
  }, [activeScriptName, scripts]);


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
    setNewScriptName(""); // Clear input after saving new script
  };

  const handleLoad = (name: string) => {
    loadScript(name);
    toast({ title: "Script Loaded", description: `Script "${name}" is now active.` });
  };

  const handleDelete = (name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteScript(name);
      toast({ title: "Script Deleted", description: `Script "${name}" has been deleted.` });
    }
  };

  const handleRename = (name: string) => {
    if (!renameValue.trim()) {
      toast({ title: "Error", description: "New name cannot be empty.", variant: "destructive" });
      return;
    }
    if (scripts.some(s => s.name === renameValue.trim())) {
      toast({ title: "Error", description: `A script named "${renameValue.trim()}" already exists.`, variant: "destructive" });
      return;
    }
    renameScript(name, renameValue.trim());
    toast({ title: "Script Renamed", description: `Script "${name}" renamed to "${renameValue.trim()}".` });
    setRenamingScript(null);
    setRenameValue("");
  };

  const handleNewScript = () => {
    setScriptText("");
    setActiveScriptName(null);
    setCurrentEditingScriptText("");
    setNewScriptName("");
    toast({ title: "New Script", description: "Ready for your new script."});
  };
  
  const handleExportTxt = () => {
    if (!currentEditingScriptText) {
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


  return (
    <div className="space-y-6 p-4">
      <div>
        <Label htmlFor="script-textarea" className="text-lg font-semibold mb-2 block">Script Content</Label>
        <Textarea
          id="script-textarea"
          value={currentEditingScriptText}
          onChange={(e) => setCurrentEditingScriptText(e.target.value)}
          placeholder="Paste or type your script here..."
          className="min-h-[200px] text-base bg-background"
          rows={10}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-end">
        {!activeScriptName && (
           <div className="flex-grow">
            <Label htmlFor="new-script-name">New Script Name</Label>
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
          <FilePlus2 className="mr-2 h-4 w-4" /> New Script
        </Button>
         <Button onClick={handleExportTxt} variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Export .txt
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
                      />
                      <Button size="sm" onClick={() => handleRename(script.name)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenamingScript(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className={`cursor-pointer hover:underline ${activeScriptName === script.name ? 'font-bold text-primary' : ''}`}
                        onClick={() => handleLoad(script.name)}
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
