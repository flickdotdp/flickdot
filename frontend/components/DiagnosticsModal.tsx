"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Activity, Server, Database, Network, RefreshCw, Cpu
} from "lucide-react";
import { usePlatformReadiness } from "../hooks/use-system-health";
import { cn } from "../lib/utils";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticsModal({ isOpen, onClose }: DiagnosticsModalProps) {
  const { 
    isSystemHealthy, 
    isComfyUIOnline, 
    isWorkerHealthy, 
    isRealtimeConnected,
    isDatabaseOnline,
    activeJobs,
    queueCapacity,
    comfyuiEndpoint,
    comfyuiResponseTime,
    comfyuiError,
    isCheckingHealth,
    refetch
  } = usePlatformReadiness();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-clear refresh animation state
  useEffect(() => {
    if (isRefreshing && !isCheckingHealth) {
      const timer = setTimeout(() => setIsRefreshing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isCheckingHealth, isRefreshing]);

  const handleReconnect = () => {
    setIsRefreshing(true);
    refetch();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">System Diagnostics</h2>
                <p className="text-xs text-muted-foreground">Real-time health monitoring & connectivity</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            
            {/* Backend API Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-white">Backend API</div>
                  <div className="text-xs text-muted-foreground">Main orchestration server</div>
                </div>
              </div>
              <StatusBadge isOnline={isSystemHealthy} />
            </div>

            {/* ComfyUI Status */}
            <div className={cn("p-4 rounded-lg border", isComfyUIOnline ? "bg-secondary/50 border-border" : "bg-destructive/10 border-destructive/20")}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Cpu className={cn("w-5 h-5", isComfyUIOnline ? "text-muted-foreground" : "text-destructive")} />
                  <div>
                    <div className="text-sm font-medium text-white">ComfyUI Engine</div>
                    <div className="text-xs text-muted-foreground">Local image generation worker</div>
                  </div>
                </div>
                <StatusBadge isOnline={isComfyUIOnline} />
              </div>
              
              <div className="pl-8 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <span className="font-mono text-white/80">{comfyuiEndpoint || 'Unknown'}</span>
                </div>
                {isComfyUIOnline && comfyuiResponseTime !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ping Latency:</span>
                    <span className="font-mono text-white/80">{comfyuiResponseTime} ms</span>
                  </div>
                )}
                {!isComfyUIOnline && comfyuiError && (
                  <div className="mt-2 p-2 rounded bg-destructive/20 text-destructive-foreground font-mono text-[10px] break-words">
                    {comfyuiError}
                  </div>
                )}
              </div>
            </div>

            {/* Worker Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-white">Generation Queue</div>
                  <div className="text-xs text-muted-foreground">
                    {activeJobs} / {queueCapacity} Jobs Processing
                  </div>
                </div>
              </div>
              <StatusBadge isOnline={isWorkerHealthy} />
            </div>

            {/* WebSocket Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-white">Realtime Stream</div>
                  <div className="text-xs text-muted-foreground">WebSocket connection</div>
                </div>
              </div>
              <StatusBadge isOnline={isRealtimeConnected} />
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-border bg-card/50 flex justify-end">
            <button
              onClick={handleReconnect}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Testing Connection..." : "Reconnect & Test"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function StatusBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={cn(
      "px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full flex items-center gap-1.5",
      isOnline ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-destructive bg-destructive/10 border border-destructive/20"
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-400" : "bg-destructive animate-pulse")} />
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}
