import React from 'react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { useWorkflows } from '@/hooks/use-workflow';

export const WorkflowSelector = () => {
  const { selectedWorkflowId, toggleMarketplace } = useWorkflowStore();
  const { data: workflowsResponse } = useWorkflows();
  const workflows = workflowsResponse?.data;

  const selected = workflows?.find(w => w.id === selectedWorkflowId);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Active Engine</label>
      <button 
        onClick={() => toggleMarketplace(true)}
        className="flex items-center justify-between w-full p-3 bg-black/40 border border-white/10 rounded-xl hover:border-cyan-500/50 hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-900 border border-white/5">
            {selected?.thumbnail_url ? (
              <img src={selected.thumbnail_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cyan-900/30 flex items-center justify-center text-cyan-500">⚙️</div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-white">{selected?.name || 'Select Workflow'}</span>
            <span className="text-xs text-white/40">{selected?.category || 'No engine loaded'}</span>
          </div>
        </div>
        <div className="text-white/30 group-hover:text-cyan-400 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </button>
    </div>
  );
};
