import React, { useState, useMemo, useCallback } from 'react';
import { useWorkflows } from '@/hooks/use-workflow';
import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowCard } from './WorkflowCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Layers, Flame, Star, Clock, RefreshCw, AlertCircle, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const HARDCODED_CATEGORIES = [
  "Image Generation",
  "Video Production",
  "Product Photography",
  "Fashion Campaigns",
  "Cinematic Storytelling",
  "Character Creation",
  "Social Media Ads",
  "Multi-Agent Automation",
  "Enterprise Production",
];

// ---- Loading Skeleton Card ----
const WorkflowCardSkeleton = () => (
  <div className="relative flex flex-col overflow-hidden rounded-2xl bg-card/40 border border-white/5 animate-pulse">
    <div className="aspect-[16/10] w-full bg-white/5" />
    <div className="p-5 flex flex-col gap-3">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-full" />
      <div className="h-3 bg-white/5 rounded w-2/3" />
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-16 bg-white/5 rounded-md" />
        <div className="h-5 w-12 bg-white/5 rounded-md" />
      </div>
    </div>
  </div>
);

export const WorkflowMarketplace = () => {
  const { isMarketplaceOpen, toggleMarketplace, selectWorkflow, selectedWorkflowId } = useWorkflowStore();
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Trending' | 'Favorites' | 'Recent'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: workflowsResponse, isLoading, isError, error, refetch, isFetching } = useWorkflows({ 
    search: search || undefined, 
    category: categoryFilter || undefined 
  });
  const workflows = workflowsResponse?.data;

  const categories = useMemo(() => {
    const dynamicCats = workflows?.map(w => w.category).filter(Boolean) as string[] || [];
    return Array.from(new Set([...HARDCODED_CATEGORIES, ...dynamicCats]));
  }, [workflows]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setCategoryFilter(null);
  }, []);

  const hasFilters = search.length > 0 || categoryFilter !== null;

  return (
    <AnimatePresence>
      {isMarketplaceOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-3xl flex flex-col"
        >
          {/* Header */}
          <header className="relative shrink-0 border-b border-white/5 bg-background/50">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="container mx-auto px-6 py-8 relative">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Workflow Marketplace</h1>
                  <p className="text-lg text-muted-foreground">Select a workflow engine to power your creative generation pipeline.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors disabled:opacity-40"
                    title="Refresh workflows"
                  >
                    <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                  </button>
                  <button 
                    onClick={() => toggleMarketplace(false)}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs + Search */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-secondary/50 p-1 rounded-xl backdrop-blur-md border border-white/5">
                  {[
                    { id: 'All', icon: Layers, label: 'Discover' },
                    { id: 'Trending', icon: Flame, label: 'Trending' },
                    { id: 'Favorites', icon: Star, label: 'Favorites' },
                    { id: 'Recent', icon: Clock, label: 'Recent' },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                          isActive ? "bg-card text-white shadow-md border border-white/5" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search workflows, models, or tags..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-secondary/30 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/70"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden container mx-auto px-6 py-8 gap-8">
            
            {/* Sidebar */}
            <aside className="w-64 shrink-0 flex flex-col gap-6 overflow-y-auto pr-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => setCategoryFilter(null)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      !categoryFilter ? "bg-primary/10 text-primary font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map(c => (
                    <button 
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        categoryFilter === c ? "bg-primary/10 text-primary font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* API status pill */}
              <div className="mt-auto">
                <div className={cn(
                  "px-3 py-2 rounded-lg text-xs flex items-center gap-2",
                  isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : isLoading
                    ? "bg-white/5 text-muted-foreground"
                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isError ? "bg-destructive" : isLoading ? "bg-white/30 animate-pulse" : "bg-green-400"
                  )} />
                  {isError ? "API Error" : isLoading ? "Loading..." : `${workflows?.length ?? 0} workflows loaded`}
                </div>
              </div>
            </aside>

            {/* Grid */}
            <main className="flex-1 overflow-y-auto pb-12 pr-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <WorkflowCardSkeleton key={i} />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Workflows</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Could not connect to the backend API. Ensure the backend is running on port 8000.
                    </p>
                    {(error as any)?.message && (
                      <p className="text-xs text-destructive/80 mt-2 font-mono bg-destructive/5 px-3 py-2 rounded-lg max-w-md mx-auto">
                        {(error as any).message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Connection
                  </button>
                </div>
              ) : !workflows || workflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <div className="w-24 h-24 rounded-2xl bg-secondary/30 border border-white/5 flex items-center justify-center">
                    <Cpu className="w-12 h-12 text-white/10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {hasFilters ? "No Matching Workflows" : "No Workflows Yet"}
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      {hasFilters
                        ? "No workflows match your current filters. Try adjusting your search or category."
                        : "Your workflow registry is empty. Restart the backend to trigger auto-registration of preset workflows."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="px-6 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      onClick={() => refetch()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-sm transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {workflows.map((wf, idx) => (
                      <motion.div
                        key={wf.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: idx * 0.04 }}
                      >
                        <WorkflowCard 
                          workflow={wf} 
                          isSelected={selectedWorkflowId === wf.id}
                          onSelect={(id) => {
                            selectWorkflow(id);
                            toggleMarketplace(false);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
