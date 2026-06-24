"use client";

import React, { useState, useEffect } from "react";
import { History, Image as ImageIcon, Heart, Loader2, Video as VideoIcon } from "lucide-react";
import { useInfiniteGallery } from "../hooks/use-gallery";
import { useGenerationQueue, useToggleFavorite } from "../hooks/use-generation";
import { useGenerationStore } from "../stores/generation-store";
import { cn } from "../lib/utils";

const GalleryCard = React.memo(({ gen, onSelect, onToggleFavorite }: any) => {
  return (
    <div 
      className="gallery-card aspect-auto bg-card rounded-xl relative overflow-hidden group cursor-pointer border border-border"
      onClick={() => onSelect(gen)}
    >
      <img 
        src={gen.thumbnail_url || gen.output_image_path || gen.output_url} 
        alt={gen.prompt} 
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      
      {(gen.generation_type === 'text_to_video' || gen.generation_type === 'image_to_video' || gen.output_video_path) && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <div className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
            <VideoIcon className="w-3 h-3 text-white ml-0.5" />
          </div>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="gallery-card-overlay">
        <div className="flex justify-between items-end">
          <div className="text-[10px] text-white/70 font-medium truncate max-w-[80px]">Seed: {gen.seed}</div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(gen.id); }}
            className={cn("text-white/70 hover:text-white transition-colors", gen.is_favorite && "text-magenta-500 hover:text-magenta-400")}
          >
            <Heart className={cn("w-3.5 h-3.5", gen.is_favorite && "fill-current")} />
          </button>
        </div>
      </div>
    </div>
  );
});
GalleryCard.displayName = "GalleryCard";

export default function GalleryPanel() {
  const { setActiveGenerationId, setWorkspaceMode, galleryFilters, updateGalleryFilters } = useGenerationStore();
  const showFavoritesOnly = galleryFilters.favorite === true;

  // Queries
  const { data: queueData } = useGenerationQueue();
  const { 
    data: galleryData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteGallery(20);

  const { mutate: toggleFavorite } = useToggleFavorite();

  // Flatten infinite scroll data
  const generations = galleryData?.pages.flatMap(page => page.data || []) || [];
  const totalCount = galleryData?.pages[0]?.total || 0;

  // Handle infinite scroll trigger
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 100;
    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const onSelectGeneration = (gen: any) => {
    const isVideo = gen.generation_type === 'text_to_video' || gen.generation_type === 'image_to_video' || !!gen.output_video_path;
    setActiveGenerationId(gen.id, gen.comfyui_prompt_id);
    useGenerationStore.getState().selectGalleryItem({
      ...gen,
      output_image_path: gen.output_image_path || (isVideo ? null : gen.output_url),
      output_video_path: gen.output_video_path || (isVideo ? gen.output_url : null)
    });
  };

  return (
    <aside className="hidden 2xl:flex w-80 flex-col bg-background border-l border-border relative z-10 h-full">
      <div className="p-5 flex flex-col gap-6 h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4" /> Gallery History
          </h2>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-mono">{totalCount}</span>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-input/50 p-1 rounded-lg shrink-0">
          <button 
            onClick={() => updateGalleryFilters({ favorite: undefined })}
            className={cn("flex-1 text-xs py-1.5 rounded-md transition-colors", !showFavoritesOnly ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-white")}
          >
            All
          </button>
          <button 
            onClick={() => updateGalleryFilters({ favorite: true })}
            className={cn("flex-1 text-xs py-1.5 rounded-md transition-colors flex items-center justify-center gap-1", showFavoritesOnly ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-white")}
          >
            <Heart className={cn("w-3 h-3", showFavoritesOnly && "fill-digitalgold text-digitalgold")} /> Favorites
          </button>
        </div>

        {/* Queue Skeleton / Monitor */}
        {queueData && queueData.data && queueData.data.length > 0 && (
          <div className="shrink-0">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> In Queue ({queueData.data.length})
            </h3>
            <div className="flex flex-col gap-2">
              {queueData.data.slice(0, 3).map((item: any) => (
                <div key={item.id} className="w-full h-12 bg-card rounded-md border border-border flex items-center px-3 gap-3 shadow-sm">
                  <div className="w-6 h-6 skeleton-box overflow-hidden relative">
                     {/* Processing overlay */}
                     {item.status === 'processing' && (
                       <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                     )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="w-3/4 h-2 skeleton-box" />
                    <div className="w-1/2 h-2 skeleton-box" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="masonry-grid pb-8">
              {generations.map((gen, index) => (
                <div 
                  key={gen.id} 
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className="masonry-item animate-slide-up opacity-0"
                >
                  <GalleryCard 
                    gen={gen} 
                    onSelect={onSelectGeneration} 
                    onToggleFavorite={toggleFavorite} 
                  />
                </div>
              ))}
              
              {isFetchingNextPage && (
                <div className="col-span-full flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
