
"use client";

import type React from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="font-size" className="flex items-center text-sm">
              Font Size: {fontSize}px
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
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
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="line-height" className="flex items-center text-sm">
              Line Spacing: {lineHeight.toFixed(1)}x
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
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
              className="mt-2"
            />
          </div>

           <div className="flex items-center justify-between pt-2">
            <Label htmlFor="mirror-mode" className="flex items-center text-sm">
              Mirror Mode
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Flip text horizontally for physical teleprompters.</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playback & Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
            <Label htmlFor="scroll-speed" className="flex items-center text-sm">
              Scroll Speed: {scrollSpeed}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
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
              className="mt-2"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-sync" className="flex items-center text-sm">
              AI Scroll Sync
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enable AI to adjust scroll speed (experimental).</p>
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
           <div className="flex items-center justify-between pt-2">
            <Label htmlFor="dark-mode" className="flex items-center text-sm">
              Dark Mode
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle between light and dark themes.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode" className="h-8 w-8">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
