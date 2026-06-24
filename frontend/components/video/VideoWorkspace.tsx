"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Maximize2, Download, Heart, Video as VideoIcon
} from "lucide-react";
import { useGenerationStore } from "@/stores/generation-store";
import { useToggleFavorite } from "@/hooks/use-generation";
import { cn } from "@/lib/utils";

export default function VideoWorkspace() {
  // Global State
  const { activeGenerationId, workspaceMode, progress, resultVideoUrl, selectedGalleryItem } = useGenerationStore();
  const { mutate: toggleFavorite } = useToggleFavorite();

  // Local UI State
  const videoRef = useRef<HTMLVideoElement>(null);

  const isGenerating = workspaceMode === 'generating';
  const hasOutput = !!resultVideoUrl;
  const isFavorite = selectedGalleryItem?.is_favorite || false;

  // Handlers
  const handleDownload = () => {
    if (resultVideoUrl) {
      // Create an anchor and trigger download
      const a = document.createElement('a');
      a.href = resultVideoUrl;
      a.download = `video-${activeGenerationId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleFavorite = () => {
    if (activeGenerationId) {
      toggleFavorite(activeGenerationId);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative min-w-0 bg-grid-pattern overflow-hidden">
      
      {/* Top bar */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Video Workspace: {isGenerating ? "Rendering..." : (hasOutput ? "Completed" : "Idle")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center p-8 z-10">
        
        <motion.div 
          className="relative w-full max-w-4xl aspect-video rounded-2xl glass-panel overflow-hidden flex items-center justify-center shadow-panel bg-black/50"
          layoutId="main-canvas-video"
        >
          {isGenerating && (
            <div className="flex flex-col items-center justify-center w-full p-12 z-20 absolute bg-background/80 backdrop-blur-sm inset-0">
              <div className="relative w-full max-w-md h-2 bg-input rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-cyan-500"
                  animate={{ width: `${progress || 0}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
                <motion.div 
                  className="absolute top-0 h-full w-4 bg-white/50 blur-[4px]"
                  animate={{ left: `calc(${progress || 0}% - 8px)` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
              <p className="text-sm font-mono text-cyan-400 neon-text">{progress || 0}% Rendering Video...</p>
            </div>
          )}

          {!isGenerating && !hasOutput && (
            <div className="text-center z-0">
              <VideoIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Ready to generate video. Enter parameters and press Generate.</p>
            </div>
          )}

          {/* Render Result Video */}
          {!isGenerating && hasOutput && resultVideoUrl && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <video 
                ref={videoRef}
                src={resultVideoUrl} 
                controls
                autoPlay
                loop
                className="max-w-full max-h-full object-contain animate-image-reveal"
              />
            </div>
          )}
          
          {/* Action Bar overlay */}
          {!isGenerating && hasOutput && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-full bg-glass backdrop-blur-glass border border-white/10 shadow-glass z-30"
            >
              <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" title="Maximize">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={handleFavorite} className={cn("p-2 rounded-full transition-colors", isFavorite ? "text-digitalgold bg-white/10" : "text-white hover:bg-white/10")} title="Favorite">
                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              </button>
            </motion.div>
          )}
        </motion.div>
        
      </div>
    </main>
  );
}
