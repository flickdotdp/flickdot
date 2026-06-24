"use client";

import React, { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, Clock, Filter, MessageSquare, Maximize2 } from "lucide-react";
import { format } from "date-fns";

export default function CreativeReviewDashboard() {
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/dam/assets?approval_status=pending&limit=100");
      const data = await res.json();
      setPendingAssets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const approveAsset = async (id: string, status: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/dam/assets/${id}/approve?status=${status}`, { method: "POST" });
      fetchPending();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-emerald-500" />
              Creative Review
            </h1>
            <p className="text-slate-400 mt-2">Approve deliverables and manage revision requests.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-xl border border-white/5">
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white/10 text-white rounded-lg"><Filter className="w-4 h-4"/> All Campaigns</button>
          </div>
        </div>

        {/* Content */}
        {pendingAssets.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-24 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white">Inbox Zero</h2>
            <p className="text-slate-400 mt-2">All assets have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingAssets.map(asset => (
              <div key={asset.id} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col group">
                <div className="aspect-video bg-black/50 relative border-b border-white/5 flex items-center justify-center">
                   {/* Mock thumbnail or preview */}
                   <div className="absolute inset-0 bg-slate-800" />
                   <button className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                     <Maximize2 className="w-4 h-4" />
                   </button>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-white truncate pr-4">{asset.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">Generated {format(new Date(asset.created_at), "MMM d, HH:mm")}</p>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => approveAsset(asset.id, 'rejected')}
                      className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button 
                      onClick={() => approveAsset(asset.id, 'approved')}
                      className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
