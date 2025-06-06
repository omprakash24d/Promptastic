
"use client";

import type React from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SettingsPanel() {
  const {
    fontSize, setFontSize,
    scrollSpeed, setScrollSpeed,
    lineHeight, setLineHeight,
    isMirrored, setIsMirrored,
    darkMode, setDarkMode,
    isAutoSyncEnabled, setIsAutoSyncEnabled,
  } = useTeleprompterStore();

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-semibold border-b pb-2">Teleprompter Settings</h2>
      
      <div>
        <Label htmlFor="font-size" className="flex items-center">
          Font Size: {fontSize}px
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adjust the text size in the teleprompter.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Slider
          id="font-size"
          min={12}
          max={150}
          step={1}
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="scroll-speed" className="flex items-center">
          Scroll Speed: {scrollSpeed}
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adjust how fast the text scrolls (pixels/second).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Slider
          id="scroll-speed"
          min={1}
          max={200}
          step={1}
          value={[scrollSpeed]}
          onValueChange={(value) => setScrollSpeed(value[0])}
           className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="line-height" className="flex items-center">
          Line Spacing: {lineHeight.toFixed(1)}x
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adjust the space between lines of text.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
         <Slider
          id="line-height"
          min={1}
          max={3}
          step={0.1}
          value={[lineHeight]}
          onValueChange={(value) => setLineHeight(value[0])}
           className="mt-1"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="mirror-mode" className="flex items-center">
          Mirror Mode
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Flip text horizontally for use with physical teleprompter mirrors.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Switch
          id="mirror-mode"
          checked={isMirrored}
          onCheckedChange={setIsMirrored}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="dark-mode" className="flex items-center">
          Dark Mode
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle between light and dark themes.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
          {darkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-sync" className="flex items-center">
          AI Scroll Sync
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enable AI to automatically adjust scroll speed based on your speech (experimental).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Switch
          id="auto-sync"
          checked={isAutoSyncEnabled}
          onCheckedChange={setIsAutoSyncEnabled}
        />
      </div>
    </div>
  );
}
