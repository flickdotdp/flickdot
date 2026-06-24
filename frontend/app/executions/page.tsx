"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  Activity, CheckCircle2, XCircle, Clock, Search, RotateCcw, 
  Terminal, Image as ImageIcon, ChevronRight, Play, Server, AlertTriangle
} from "lucide-react";
import { GenerationService } from "../../lib/api/generations";
import Link from "next/link";

interface Execution {
  id: string;
  status: string;
  prompt: string;
  workflow_name: string;
  created_at: string;
  execution_time_seconds?: number;
  error_message?: string;
  current_node?: string;
  thumbnail_path?: string;
  retry_count?: number;
}

const statusColors: Record<string, string> = {
  queued: "text-slate-400 bg-slate-400/10",
  validating_workflow: "text-blue-400 bg-blue-400/10",
  resolving_models: "text-indigo-400 bg-indigo-400/10",
  loading_checkpoints: "text-purple-400 bg-purple-400/10",
  connecting: "text-fuchsia-400 bg-fuchsia-400/10",
  executing: "text-amber-400 bg-amber-400/10",
  saving_outputs: "text-emerald-400 bg-emerald-400/10",
  processing_assets: "text-teal-400 bg-teal-400/10",
  completed: "text-green-500 bg-green-500/10",
  failed: "text-red-500 bg-red-500/10",
  interrupted: "text-orange-500 bg-orange-500/10",
  retrying: "text-yellow-500 bg-yellow-500/10",
  cancelled: "text-slate-500 bg-slate-500/10",
};

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchExecutions = async () => {
    try {
      // In a real app we'd call the new /api/v1/executions, but we can reuse the generations endpoint for now
      // assuming it returns the required fields. Let's build the basic fetch.
      const res = await fetch(`http://127.0.0.1:8000/api/v1/executions?limit=50${filter !== "all" ? `&status=${filter}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/executions/${id}/retry`, { method: "POST" });
      fetchExecutions();
    } catch (e) {
      console.error("Retry failed", e);
    }
  };

  const handleInterrupt = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/executions/${id}/interrupt`, { method: "POST" });
      fetchExecutions();
    } catch (e) {
      console.error("Interrupt failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              Execution Pipeline
            </h1>
            <p className="text-slate-400 mt-2">Monitor, troubleshoot, and manage generation lifecycles.</p>
          </div>
          <Link href="/diagnostics">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
              View System Diagnostics
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "queued", "executing", "completed", "failed", "retrying"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === status ? "bg-primary text-black" : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading && executions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Loading execution history...</div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-slate-800/50 rounded-2xl border-dashed">
              No executions found matching criteria.
            </div>
          ) : (
            executions.map(exec => (
              <motion.div 
                key={exec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex gap-6 hover:bg-slate-900/60 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-lg bg-black/50 overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                  {exec.thumbnail_path ? (
                    <img src={`http://127.0.0.1:8000${exec.thumbnail_path}`} alt="thumb" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-700" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="truncate pr-4">
                        <span className="font-mono text-xs text-slate-500">{exec.id.split("-")[0]}</span>
                        <h3 className="font-medium text-slate-200 truncate">{exec.prompt || exec.workflow_name || "Untitled Execution"}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${statusColors[exec.status] || "text-slate-400 bg-slate-400/10"}`}>
                        {exec.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(new Date(exec.created_at), "MMM d, HH:mm:ss")}</span>
                      {exec.execution_time_seconds && (
                        <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> {exec.execution_time_seconds.toFixed(1)}s</span>
                      )}
                      {exec.current_node && exec.status !== "completed" && (
                        <span className="flex items-center gap-1.5 text-amber-400/80"><Activity className="w-3.5 h-3.5" /> {exec.current_node}</span>
                      )}
                      {(exec.retry_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1.5 text-orange-400"><RotateCcw className="w-3.5 h-3.5" /> Retry {exec.retry_count}</span>
                      )}
                    </div>
                  </div>

                  {exec.error_message && (
                    <div className="mt-2 text-xs text-red-400/90 bg-red-500/10 px-3 py-2 rounded flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{exec.error_message}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 justify-center">
                  {(exec.status === "failed" || exec.status === "interrupted" || exec.status === "cancelled") && (
                    <button 
                      onClick={() => handleRetry(exec.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors tooltip"
                      title="Retry Execution"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {(exec.status !== "completed" && exec.status !== "failed" && exec.status !== "cancelled" && exec.status !== "interrupted") && (
                    <button 
                      onClick={() => handleInterrupt(exec.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors tooltip"
                      title="Interrupt Execution"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
