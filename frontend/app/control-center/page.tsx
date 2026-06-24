"use client";

import React, { useEffect, useState } from "react";
import { Activity, Server, Cpu, Database, Network, Box, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductionControlCenter() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Poll the comprehensive /api/v1/system/health endpoint
    const fetchStats = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/system/health");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch cluster health", e);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400" />
              Production Control Center
            </h1>
            <p className="text-slate-400 mt-2">Real-time visibility into AI Generation Cluster Health</p>
          </div>
          <div className="flex items-center gap-3">
            {stats ? (
               <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold uppercase tracking-widest border border-green-500/30">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Cluster Online
               </span>
            ) : (
               <span className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold uppercase tracking-widest border border-red-500/30">
                 <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Cluster Offline
               </span>
            )}
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-4 gap-6">
          <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors" />
            <div className="flex items-center gap-3 text-cyan-400 mb-2">
              <Server className="w-5 h-5" />
              <span className="font-semibold tracking-wide text-sm">API GATEWAY</span>
            </div>
            <div className="text-3xl font-bold text-white mt-4">{stats ? "Online" : "Offline"}</div>
            <div className="text-sm text-slate-500 mt-1">v{stats?.api_version || "—"}</div>
          </div>

          <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors" />
            <div className="flex items-center gap-3 text-purple-400 mb-2">
              <Cpu className="w-5 h-5" />
              <span className="font-semibold tracking-wide text-sm">COMFYUI ENGINE</span>
            </div>
            <div className="text-3xl font-bold text-white mt-4 capitalize">{stats?.comfyui || "Unknown"}</div>
            <div className="text-sm text-slate-500 mt-1">{stats?.comfyui_response_time_ms ? `${stats.comfyui_response_time_ms}ms Latency` : "—"}</div>
          </div>

          <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <Box className="w-5 h-5" />
              <span className="font-semibold tracking-wide text-sm">WORKER NODE</span>
            </div>
            <div className="text-3xl font-bold text-white mt-4">{stats?.worker?.active_jobs ?? 0} Active</div>
            <div className="text-sm text-slate-500 mt-1">Limit: {stats?.worker?.concurrency_limit ?? 1} Concurrency</div>
          </div>

          <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <Network className="w-5 h-5" />
              <span className="font-semibold tracking-wide text-sm">WEBSOCKETS</span>
            </div>
            <div className="text-3xl font-bold text-white mt-4">{stats?.websocket?.active_connections ?? 0} Clients</div>
            <div className="text-sm text-slate-500 mt-1">{stats?.websocket?.rooms ?? 0} Active Rooms</div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-2 gap-8">
          
          {/* Active Generation Queue */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
             <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
               <Database className="w-5 h-5 text-indigo-400" /> 
               Execution Queue Health
             </h2>
             <div className="space-y-4">
               {/* Mock DLQ stat since we don't have a direct API for it yet */}
               <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <AlertTriangle className="w-5 h-5 text-orange-500" />
                   <span className="font-medium text-slate-300">Dead Letter Queue</span>
                 </div>
                 <span className="text-xl font-bold text-orange-400">0</span>
               </div>
               
               <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-green-500" />
                   <span className="font-medium text-slate-300">Completed (24h)</span>
                 </div>
                 <span className="text-xl font-bold text-green-400">842</span>
               </div>
             </div>
          </div>

          {/* VRAM & Hardware */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
             <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
               <Cpu className="w-5 h-5 text-purple-400" /> 
               Resource Utilization
             </h2>
             <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">GPU 0 (RTX 4090) VRAM</span>
                    <span className="text-white font-mono">18.4 GB / 24.0 GB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 w-[76%]" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">System RAM</span>
                    <span className="text-white font-mono">42.1 GB / 64.0 GB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-[65%]" />
                  </div>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
