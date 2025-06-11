
"use client";

import React from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Info, Palette, Type, AlignCenterVertical, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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

interface FontOption {
  label: string;
  value: string;
}

const FONT_OPTIONS: FontOption[] = [
  { label: "Arial (Default)", value: "Arial, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

export const SettingsPanel = React.memo(function SettingsPanel() {
  const { toast } = useToast();
  const {
    fontSize, setFontSize,
    scrollSpeed, setScrollSpeed,
    lineHeight, setLineHeight,
    isMirrored, setIsMirrored,
    darkMode, setDarkMode,
    isAutoSyncEnabled, setIsAutoSyncEnabled,
    textColor, setTextColor,
    fontFamily, setFontFamily,
    focusLinePercentage, setFocusLinePercentage,
    resetSettingsToDefaults,
  } = useTeleprompterStore();

  const handleResetSettings = () => {
    resetSettingsToDefaults();
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to their default values.",
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Palette className="mr-2 h-5 w-5" />Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="font-size" className="flex items-center text-sm">
                Font Size: {fontSize}px
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the text size in the teleprompter.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id="font-size"
                aria-label={`Font size: ${fontSize}px`}
                min={12}
                max={150}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="line-height" className="flex items-center text-sm">
                Line Spacing: {lineHeight.toFixed(1)}x
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the space between lines of text.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id="line-height"
                aria-label={`Line spacing: ${lineHeight.toFixed(1)}x`}
                min={1}
                max={3}
                step={0.1}
                value={[lineHeight]}
                onValueChange={(value) => setLineHeight(value[0])}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="font-family" className="flex items-center text-sm mb-1">
                Font Family
                 <Type className="ml-2 h-4 w-4 text-muted-foreground" />
              </Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="font-family" className="w-full mt-1" aria-label="Select font family">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(font => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="text-color" className="flex items-center text-sm">
                Text Color
                <Palette className="ml-2 h-4 w-4 text-muted-foreground" />
              </Label>
              <input
                id="text-color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-8 p-0.5 border border-input rounded-md bg-background cursor-pointer"
                aria-label="Choose text color"
              />
            </div>

            <div>
              <Label htmlFor="focus-line-percentage" className="flex items-center text-sm">
                Focus Line: {Math.round(focusLinePercentage * 100)}%
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlignCenterVertical className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the vertical position of the reading focus line (percentage from top).</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id="focus-line-percentage"
                aria-label={`Focus line position: ${Math.round(focusLinePercentage * 100)}% from top`}
                min={0.1} 
                max={0.9} 
                step={0.01}
                value={[focusLinePercentage]}
                onValueChange={(value) => setFocusLinePercentage(value[0])}
                className="mt-2"
              />
            </div>

             <div className="flex items-center justify-between pt-2">
              <Label htmlFor="mirror-mode" className="flex items-center text-sm">
                Mirror Mode
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Flip text horizontally for physical teleprompters.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Switch
                id="mirror-mode"
                checked={isMirrored}
                onCheckedChange={setIsMirrored}
                aria-label={`Mirror mode: ${isMirrored ? 'on' : 'off'}`}
              />
            </div>
             <div className="flex items-center justify-between pt-2">
              <Label htmlFor="dark-mode-toggle-button" className="flex items-center text-sm">
                Dark Mode
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle between light and dark themes.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Button id="dark-mode-toggle-button" variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)} aria-label={`Toggle dark mode: currently ${darkMode ? 'on' : 'off'}`} className="h-8 w-8">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Playback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div>
              <Label htmlFor="scroll-speed" className="flex items-center text-sm">
                Scroll Speed: {scrollSpeed}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust how fast the text scrolls (pixels/second).</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id="scroll-speed"
                aria-label={`Scroll speed: ${scrollSpeed}`}
                min={1}
                max={200}
                step={1}
                value={[scrollSpeed]}
                onValueChange={(value) => setScrollSpeed(value[0])}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync" className="flex items-center text-sm">
                AI Scroll Sync
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enable AI to adjust scroll speed based on speech (experimental).</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Switch
                id="auto-sync"
                checked={isAutoSyncEnabled}
                onCheckedChange={setIsAutoSyncEnabled}
                aria-label={`AI scroll sync: ${isAutoSyncEnabled ? 'on' : 'off'}`}
              />
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset All Settings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all appearance and playback settings to their default values. 
                    Dark mode setting will be preserved. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSettings} className="bg-destructive hover:bg-destructive/90">
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
});
