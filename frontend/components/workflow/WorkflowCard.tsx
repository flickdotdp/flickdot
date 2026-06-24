import React from 'react';
import { WorkflowListResponse } from '@/lib/api/workflows';
import { Play, Clock, TrendingUp, Users, Cpu, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: WorkflowListResponse;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const WorkflowCard = ({ workflow, isSelected, onSelect }: WorkflowCardProps) => {
  // Read real data directly from the backend model
  const rating = workflow.rating ? (workflow.rating / 10).toFixed(1) : "N/A";
  const executions = workflow.executions || 0;
  const complexity = workflow.complexity || "Beginner";
  const author = (workflow as any).author || "DP Studios"; // Fallback if list response doesn't have author
  const estTime = workflow.estimated_runtime ? `~${workflow.estimated_runtime}s` : "~30s";
  const model = workflow.supported_models && workflow.supported_models.length > 0 ? workflow.supported_models[0] : "AI Model";

  return (
    <div 
      onClick={() => onSelect(workflow.id)}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl cursor-pointer group transition-all duration-500",
        "border bg-card/40 hover:bg-card hover:shadow-2xl hover:-translate-y-1",
        isSelected 
          ? "border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.15)] ring-1 ring-primary/50" 
          : "border-white/5 hover:border-white/10"
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full bg-secondary/30 overflow-hidden shrink-0 border-b border-white/5">
        {workflow.thumbnail_url ? (
          <img 
            src={workflow.thumbnail_url} 
            alt={workflow.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background flex items-center justify-center">
            <Cpu className="w-12 h-12 text-white/10" />
          </div>
        )}
        
        {/* Gradients & Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
            {workflow.category || "Uncategorized"}
          </span>
          {rating !== "N/A" && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-yellow-500">
              <Star className="w-3 h-3 fill-current" /> {rating}
            </span>
          )}
        </div>

        {/* Hover Launch Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] bg-black/20">
          <div className="px-6 py-3 rounded-full bg-primary text-white font-medium shadow-glow flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-4 h-4 fill-current" />
            Launch Workflow
          </div>
        </div>
      </div>
      
      {/* Content Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-semibold text-white text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {workflow.name}
          </h3>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {workflow.description || `A powerful ${workflow.category?.toLowerCase() || 'generation'} workflow utilizing ${model} to create stunning high-resolution outputs.`}
        </p>

        {/* Tags */}
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {workflow.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-secondary/50 text-[10px] text-muted-foreground border border-white/5">
                {tag}
              </span>
            ))}
            {workflow.tags.length > 3 && (
              <span className="px-2 py-0.5 rounded-md bg-secondary/50 text-[10px] text-muted-foreground border border-white/5">
                +{workflow.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata Footer */}
        <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white/40" />
            <span className="truncate">By {author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span>{estTime} est.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-white/40" />
            <span>{executions >= 1000 ? (executions / 1000).toFixed(1) + 'k' : executions} uses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", 
              complexity === 'Beginner' ? "bg-green-500" :
              complexity === 'Intermediate' ? "bg-blue-500" :
              complexity === 'Advanced' ? "bg-yellow-500" : "bg-red-500"
            )} />
            <span>{complexity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
