"use client";

import React, { useState, useEffect } from "react";
import { Activity, Shield, List, AlertTriangle, Play, RefreshCcw, Database } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function OperationsCenter() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [health, setHealth] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [dlq, setDlq] = useState<any[]>([]);

  useEffect(() => {
    fetchHealth();
    fetchEvents();
    fetchDlq();
    const interval = setInterval(() => {
      fetchHealth();
      fetchEvents();
      fetchDlq();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/operations/health");
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/operations/events?limit=100");
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDlq = async () => {
    try {
      // Reusing executions endpoint to filter DLQ
      const res = await fetch("http://127.0.0.1:8000/api/v1/executions?limit=50&status=dead_letter");
      const data = await res.json();
      setDlq(data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const retryDlq = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/executions/${id}/retry`, { method: "POST" });
      fetchDlq();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Health Score */}
        <div className="flex items-center justify-between bg-slate-900/40 p-6 rounded-3xl border border-white/5">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400" />
              System Operations Center
            </h1>
            <p className="text-slate-400 mt-2">Unified Control, Audit, and Recovery Environment</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">System Health Score</div>
              <div className="flex items-end gap-2 justify-end">
                <span className={`text-5xl font-black ${health?.score >= 85 ? 'text-green-400' : health?.score >= 50 ? 'text-orange-400' : 'text-red-500'}`}>
                  {health?.score ?? "--"}
                </span>
                <span className="text-xl text-slate-500 mb-1">/ 100</span>
              </div>
            </div>
            
            {/* Status Radar */}
            <div className="relative w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
              <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className={`w-16 h-16 rounded-full blur-md ${health?.status === 'healthy' ? 'bg-green-500/30' : health?.status === 'degraded' ? 'bg-orange-500/30' : 'bg-red-500/30'}`} />
              <Database className={`absolute w-8 h-8 ${health?.status === 'healthy' ? 'text-green-400' : health?.status === 'degraded' ? 'text-orange-400' : 'text-red-400'}`} />
            </div>
          </div>
        </div>

        {/* Alerts Box */}
        {health?.alerts && health.alerts.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Active Operational Alerts</h3>
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-red-300">
                {health.alerts.map((alert: string, i: number) => <li key={i}>{alert}</li>)}
              </ul>
              {health.recommendations && health.recommendations.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <span className="text-sm font-semibold text-red-500">Action Required:</span>
                  <div className="flex gap-2">
                    {health.recommendations.map((rec: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs uppercase tracking-wider">{rec}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4">
          <button onClick={() => setActiveTab('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'timeline' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
            <List className="w-4 h-4" /> Activity Timeline
          </button>
          <button onClick={() => setActiveTab('dlq')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dlq' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'}`}>
            <AlertTriangle className="w-4 h-4" /> DLQ Console ({dlq.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No events recorded.</div>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className={`flex items-start gap-4 p-3 rounded-lg font-mono text-sm border border-transparent hover:border-white/5 hover:bg-white/5 transition-colors ${
                    ev.severity === 'error' ? 'text-red-400 bg-red-500/5' :
                    ev.severity === 'warning' ? 'text-orange-400' :
                    'text-slate-300'
                  }`}>
                    <span className="text-slate-600 shrink-0">{format(new Date(ev.created_at), "HH:mm:ss.SSS")}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                      ev.category === 'system' ? 'bg-cyan-500/20 text-cyan-400' :
                      ev.category === 'generation' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>{ev.category}</span>
                    <span className="flex-1 break-all">
                      <strong className="text-white font-medium mr-2">{ev.event_type}</strong>
                      {ev.message}
                    </span>
                    <span className="text-slate-600 shrink-0 text-xs truncate max-w-[100px]">{ev.trace_id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'dlq' && (
          <div className="space-y-4">
            {dlq.length === 0 ? (
              <div className="bg-slate-900/40 p-12 rounded-2xl border border-white/5 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">Dead Letter Queue is Empty</h3>
                <p className="text-slate-400 mt-2">All systems operating nominally.</p>
              </div>
            ) : (
              dlq.map(exec => (
                <div key={exec.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-200">Execution {exec.id.split("-")[0]}</h4>
                    <p className="text-sm text-red-400 mt-1 line-clamp-1">{exec.error_message}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Failed: {format(new Date(exec.updated_at || exec.created_at), "MMM d, HH:mm")}</span>
                      <span>Retries Exhausted: {exec.retry_count}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => retryDlq(exec.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Force Replay
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
