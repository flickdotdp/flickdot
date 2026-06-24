"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { 
  Settings, Image as ImageIcon, Maximize2, Download, Heart, Loader2
} from "lucide-react";
import { useGenerationStore } from "../stores/generation-store";
import { useToggleFavorite, useGenerationDetails } from "../hooks/use-generation";
import { downloadImage } from "../lib/image-utils";
import { cn } from "../lib/utils";

export default function ImageWorkspace() {
  // Global State
  const { 
    activeGenerationId, 
    workspaceMode, 
    sourceImageUrl, 
    resultImageUrl, 
    progress, 
    completeGeneration, 
    failGeneration 
  } = useGenerationStore();
  
  const { mutate: toggleFavorite } = useToggleFavorite();

  // Local UI State
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const isGenerating = workspaceMode === 'generating';
  const hasOutput = !!resultImageUrl;
  const showComparison = hasOutput && sourceImageUrl;

  // Polling for generation status
  const { data: generationDetail } = useGenerationDetails(activeGenerationId, {
    refetchInterval: isGenerating ? 1500 : false,
  });

  const generationData = (generationDetail as any)?.data;

  // React to generation status changes
  useEffect(() => {
    if (isGenerating && generationData) {
      if (generationData.status === 'completed' && generationData.output_image_path) {
        completeGeneration(generationData.output_image_path, false, generationData.execution_time ?? undefined);
      } else if (generationData.status === 'failed') {
        failGeneration(generationData.error_message || "Generation failed.");
      }
    }
  }, [isGenerating, generationData, completeGeneration, failGeneration]);


  // Handlers
  const handleDownload = () => {
    if (resultImageUrl) {
      downloadImage(resultImageUrl, `generation-${activeGenerationId || 'output'}`);
    }
  };

  const handleFavorite = () => {
    if (activeGenerationId) {
      toggleFavorite(activeGenerationId);
    }
  };

  const handleSliderDrag = (event: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(info.point.x - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  return (
    <main className="flex-1 flex flex-col relative min-w-0 bg-background overflow-hidden">
      
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center justify-between px-6 bg-background/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isGenerating ? "Processing" : (hasOutput ? "Completed" : "Workspace")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center p-8 z-10" ref={containerRef}>
        
        <motion.div 
          className="relative w-full max-w-5xl aspect-square lg:aspect-[16/9] bg-card/30 rounded-lg overflow-hidden flex items-center justify-center border border-border"
          layoutId="main-canvas"
        >
          {isGenerating && (
            <div className="flex flex-col items-center justify-center w-full p-12 z-20 absolute bg-background/60 backdrop-blur-sm inset-0">
              <div className="relative w-full max-w-sm h-1 bg-secondary rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-primary"
                  animate={{ width: `${progress || 0}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{progress || 0}% Computing</p>
            </div>
          )}

          {!isGenerating && !hasOutput && (
            <div className="text-center z-0">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Ready to generate. Enter a prompt and press Generate.</p>
            </div>
          )}

          {/* Render Result Image */}
          {(hasOutput || isGenerating) && resultImageUrl && (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={resultImageUrl} 
                alt="Generation Output" 
                className={cn("w-full h-full object-contain", !isGenerating && "animate-image-reveal")}
              />
            </div>
          )}

          {/* Comparison Slider (Before / After) */}
          {showComparison && !isGenerating && (
            <>
              {/* Source Image Clipped */}
              <div 
                className="absolute top-0 left-0 h-full overflow-hidden" 
                style={{ width: `${sliderPosition}%` }}
              >
                <img 
                  src={sourceImageUrl!} 
                  alt="Source Before" 
                  className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                  style={{ width: containerRef.current?.getBoundingClientRect().width || '100vw' }}
                />
              </div>

              {/* Slider Handle */}
              <motion.div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
                drag="x"
                dragConstraints={containerRef}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleSliderDrag}
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-none">
                  <div className="flex gap-1">
                    <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                    <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
          
          {/* Action Bar overlay */}
          {!isGenerating && hasOutput && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-full bg-card/80 backdrop-blur-md border border-white/10 shadow-lg z-30"
            >
              <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Maximize">
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button onClick={handleFavorite} className={cn("p-2 rounded-full transition-colors", generationData?.is_favorite ? "text-magenta-500 bg-magenta-500/10" : "text-muted-foreground hover:bg-white/10 hover:text-white")} title="Favorite">
                <Heart className={cn("w-4 h-4", generationData?.is_favorite && "fill-current")} />
              </button>
            </motion.div>
          )}
        </motion.div>
        
      </div>
    </main>
  );
}
