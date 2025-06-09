"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilePlus2, Save, Trash2, Edit3, Download, FileUp, FileText, FileCode2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist/build/pdf.mjs';

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.mjs`;
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

  useEffect(() => {
    setCurrentEditingScriptText(scriptText);
  }, [scriptText]);
  

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
    setScriptText(content); // This will update the store's scriptText
    // setCurrentEditingScriptText(content); // This will be handled by useEffect on scriptText
    const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    setNewScriptName(fileNameWithoutExtension);
    toast({ title: "File Imported", description: `Content of "${fileName}" loaded. You can now save it.` });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      try {
        if (file.type === "text/plain") {
          const content = await file.text();
          processFileContent(content, fileName);
        } else if (file.type === "application/pdf") {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await getDocument({data: arrayBuffer}).promise;
          let textContent = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(item => ('str' in item ? item.str : '')).join(" ") + "\n";
          }
          processFileContent(textContent, fileName);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
           const arrayBuffer = await file.arrayBuffer();
           const result = await mammoth.extractRawText({ arrayBuffer });
           processFileContent(result.value, fileName);
        } else {
          toast({ title: "Import Error", description: "Unsupported file type. Please select .txt, .pdf, or .docx.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error importing file:", error);
        toast({ title: "Import Error", description: "Could not read file content. " + (error instanceof Error ? error.message : ""), variant: "destructive" });
      }
      if (event.target) event.target.value = ""; 
    }
  };

  return (
    <div className="space-y-6">
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
            <Button onClick={() => triggerFileInput('.txt')} variant="outline" className="flex-grow sm:flex-grow-0">
              <FileUp className="mr-2 h-4 w-4" /> Import .txt
            </Button>
            <Button onClick={() => triggerFileInput('.pdf')} variant="outline" className="flex-grow sm:flex-grow-0">
              <FileCode2 className="mr-2 h-4 w-4" /> Import .pdf
            </Button>
            <Button onClick={() => triggerFileInput('.docx')} variant="outline" className="flex-grow sm:flex-grow-0">
              <FileText className="mr-2 h-4 w-4" /> Import .docx
            </Button>
        </CardFooter>
      </Card>
      
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