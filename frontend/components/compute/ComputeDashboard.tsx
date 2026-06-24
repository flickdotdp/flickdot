import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkers, useGPUs, useComputeMetrics } from '@/lib/api/compute';
import { useComputeStore } from '@/stores/compute-store';

export const ComputeDashboard = () => {
  const { isComputeDashboardOpen, toggleComputeDashboard, selectedExecutionPolicy, setExecutionPolicy } = useComputeStore();
  const { data: metrics } = useComputeMetrics();
  const { data: workers } = useWorkers();
  const { data: gpus } = useGPUs();

  return (
    <AnimatePresence>
      {isComputeDashboardOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-4 z-50 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">Compute Dashboard</h2>
              <p className="text-sm text-white/50 mt-1">Real-time distributed execution monitor</p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedExecutionPolicy}
                onChange={(e) => setExecutionPolicy(e.target.value)}
                className="px-4 py-2 bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 rounded-lg text-sm font-medium focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="AUTO">Policy: AUTO</option>
                <option value="ROUND_ROBIN">Policy: ROUND ROBIN</option>
                <option value="LEAST_LOADED">Policy: LEAST LOADED</option>
                <option value="VRAM_AWARE">Policy: VRAM AWARE</option>
              </select>
              <button onClick={() => toggleComputeDashboard(false)} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors bg-white/5">✕</button>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-4 border-b border-white/5 shrink-0 bg-black/40">
            <div className="p-4 border-r border-white/5 flex flex-col">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider mb-1">Workers Online</span>
              <span className="text-2xl text-green-400 font-mono">{metrics?.workers_online || 0}</span>
            </div>
            <div className="p-4 border-r border-white/5 flex flex-col">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider mb-1">GPUs Active</span>
              <span className="text-2xl text-cyan-400 font-mono">{metrics?.gpus_online || 0}</span>
            </div>
            <div className="p-4 border-r border-white/5 flex flex-col">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider mb-1">Queue Depth</span>
              <span className="text-2xl text-yellow-400 font-mono">{metrics?.queue_depth || 0}</span>
            </div>
            <div className="p-4 flex flex-col">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider mb-1">Running Jobs</span>
              <span className="text-2xl text-purple-400 font-mono">{metrics?.running_jobs || 0}</span>
            </div>
          </div>

          {/* Main Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 flex flex-col gap-8">
            
            {/* GPU Grid */}
            <div>
              <h3 className="text-sm text-white/50 uppercase font-bold tracking-wider mb-4">Available GPUs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {gpus?.map(gpu => (
                  <div key={gpu.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-bold text-sm truncate">{gpu.gpu_name}</h4>
                        <span className="text-xs text-white/40">Index: {gpu.gpu_index}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${gpu.temperature > 80 ? 'bg-red-500' : gpu.utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">VRAM</span>
                        <span className="text-white font-mono">{(gpu.vram_used / 1024).toFixed(1)} / {(gpu.vram_total / 1024).toFixed(1)} GB</span>
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${(gpu.vram_used / gpu.vram_total) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Utilization</span>
                        <span className="text-white font-mono">{gpu.utilization}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${gpu.utilization}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-white/50 mt-2 pt-2 border-t border-white/5">
                      <span>Temp: {gpu.temperature}°C</span>
                      <span>Queue: {gpu.queue_depth}</span>
                    </div>
                  </div>
                ))}
                {(!gpus || gpus.length === 0) && (
                  <div className="col-span-full py-8 text-center text-white/40 text-sm">No GPUs detected.</div>
                )}
              </div>
            </div>

            {/* Worker Nodes */}
            <div>
              <h3 className="text-sm text-white/50 uppercase font-bold tracking-wider mb-4">Worker Nodes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workers?.map(worker => (
                  <div key={worker.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-bold text-sm truncate">{worker.hostname}</h4>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold tracking-wider border ${worker.status === 'online' ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                        {worker.status}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mb-2">{worker.ip_address}</div>
                    
                    {worker.supported_workflow_tags && worker.supported_workflow_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {worker.supported_workflow_tags.map(tag => (
                          <span key={tag} className="text-[9px] bg-black/40 text-white/60 px-1.5 py-0.5 rounded uppercase border border-white/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!workers || workers.length === 0) && (
                  <div className="col-span-full py-8 text-center text-white/40 text-sm">No workers detected.</div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
