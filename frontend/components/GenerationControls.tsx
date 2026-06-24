"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Play, Loader2
} from "lucide-react";

import { useCreateGeneration } from "../hooks/use-generation";
import { usePlatformReadiness } from "../hooks/use-system-health";
import { useGenerationStore } from "../stores/generation-store";
import { useWorkflowStore } from "../stores/workflow-store";
import { useAssetStore } from "../stores/asset-store";
import { useBundleStore } from "../stores/bundle-store";
import { useComputeStore } from "../stores/compute-store";
import { useWorkflowSchema } from "../hooks/use-workflow";
import { WorkflowSelector } from "./workflow/WorkflowSelector";
import { DynamicParameterRenderer } from "./workflow/DynamicParameterRenderer";
import { cn } from "../lib/utils";
import { DiagnosticsModal } from "./DiagnosticsModal";

export default function GenerationControls() {
  // -------------------------------------------------------------------------
  // Global State & Hooks
  // -------------------------------------------------------------------------
  const { mutate: createGeneration, isPending } = useCreateGeneration();
  const { 
    canGenerateImages, 
    statusText, 
    isSystemHealthy, 
    isComfyUIOnline, 
    isWorkerHealthy, 
    isRealtimeConnected 
  } = usePlatformReadiness();
  const { setWorkspaceMode } = useGenerationStore();
  const { selectedWorkflowId, savedParameters, setWorkflowParameter } = useWorkflowStore();
  const { toggleAssetMarketplace } = useAssetStore();
  const { toggleBundleMarketplace } = useBundleStore();
  const { toggleComputeDashboard } = useComputeStore();
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  
  const { data: schema, isLoading: isSchemaLoading } = useWorkflowSchema(selectedWorkflowId);

  // -------------------------------------------------------------------------
  // Local Derived State
  // -------------------------------------------------------------------------
  const currentParams = selectedWorkflowId ? (savedParameters[selectedWorkflowId] || {}) : {};

  // Build defaults if they don't exist in saved parameters
  const resolvedParams = useMemo(() => {
    const params = { ...currentParams };
    if (schema?.data?.parameters) {
      for (const p of schema.data.parameters) {
        if (params[p.key] === undefined && p.default !== undefined) {
          params[p.key] = p.default;
        }
      }
    }
    return params;
  }, [schema, currentParams]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleParameterChange = (key: string, value: any) => {
    if (selectedWorkflowId) {
      setWorkflowParameter(selectedWorkflowId, key, value);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId || !canGenerateImages) return;

    // TODO: Extract actual base64 assets if needed from dynamic image parameters.
    // Right now, parameters contains all user inputs.

    createGeneration({
      data: {
        workflow_id: selectedWorkflowId,
        parameters: resolvedParams,
        // Pass other required fields empty for backward compatibility if needed
        prompt: resolvedParams.prompt || "Dynamic Generation", 
        generation_type: "text_to_image" as any,
      } 
    }, {
      onSuccess: () => {
        setWorkspaceMode('generating');
      }
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <aside className="hidden lg:flex w-80 xl:w-96 flex-col bg-background border-r border-border overflow-y-auto custom-scrollbar relative z-10 h-full">
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-6 h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-sm font-semibold tracking-wide">AI Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleComputeDashboard(true)}
              className="text-[10px] font-medium text-muted-foreground hover:text-white bg-secondary/50 hover:bg-secondary px-2 py-1 rounded transition-colors"
              title="Open Compute Dashboard"
            >
              Cluster
            </button>
            <button
              type="button"
              onClick={() => toggleBundleMarketplace(true)}
              className="text-[10px] font-medium text-muted-foreground hover:text-white bg-secondary/50 hover:bg-secondary px-2 py-1 rounded transition-colors"
              title="Open Bundle Marketplace"
            >
              Bundles
            </button>
            <button
              type="button"
              onClick={() => toggleAssetMarketplace(true)}
              className="text-[10px] font-medium text-muted-foreground hover:text-white bg-secondary/50 hover:bg-secondary px-2 py-1 rounded transition-colors"
              title="Open Asset Library"
            >
              Assets
            </button>
            <button 
              type="button"
              onClick={() => setIsDiagnosticsOpen(true)}
              className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md flex items-center cursor-pointer transition-colors hover:brightness-110", isComfyUIOnline ? "text-green-400 bg-green-400/10" : "text-destructive bg-destructive/10")}
            >
              {isComfyUIOnline ? "ONLINE" : "COMFYUI OFFLINE"}
            </button>
          </div>
        </div>

        {/* Workflow Selection UI */}
        <div className="ai-control-section">
          <WorkflowSelector />
        </div>

        {/* Dynamic Parameter Rendering */}
        <div className="ai-control-section flex-1">
          {isSchemaLoading ? (
            <div className="text-center text-white/50 text-sm py-4">Loading workflow parameters...</div>
          ) : !selectedWorkflowId ? (
            <div className="text-center text-white/50 text-sm py-4">Select a workflow to configure generation parameters.</div>
          ) : (
            <DynamicParameterRenderer 
              parameters={schema?.data?.parameters || []}
              values={resolvedParams}
              onChange={handleParameterChange}
            />
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4 sticky bottom-0 bg-transparent pb-4 shrink-0 z-20 flex flex-col gap-2">
          {!canGenerateImages && (
            <div className="text-xs p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive/90 space-y-1.5">
              <div className="font-semibold text-destructive">System Offline</div>
              {!isSystemHealthy && <div>• Backend API is unreachable.</div>}
              {isSystemHealthy && !isComfyUIOnline && <div>• ComfyUI is offline. Start ComfyUI on port 8188.</div>}
              {isSystemHealthy && isComfyUIOnline && !isWorkerHealthy && <div>• Generation worker is stopped.</div>}
              {!isRealtimeConnected && <div>• Realtime connection lost. Reconnecting...</div>}
            </div>
          )}
          <motion.button 
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={!canGenerateImages || isPending || !selectedWorkflowId}
            className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ${
              (!canGenerateImages || isPending || !selectedWorkflowId) 
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover shadow-glow"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Queuing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Generate
              </>
            )}
          </motion.button>
        </div>
        
      </form>
      <DiagnosticsModal 
        isOpen={isDiagnosticsOpen} 
        onClose={() => setIsDiagnosticsOpen(false)} 
      />
    </aside>
  );
}
