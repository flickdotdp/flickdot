"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Briefcase, TrendingUp, Cpu, PieChart, Activity, ArrowRight, Wallet, Target } from "lucide-react";
import Link from "next/link";

export default function AgencyDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/agency/dashboard");
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!metrics) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white p-8 flex items-center justify-center">Loading Business Intelligence...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <PieChart className="w-8 h-8 text-blue-500" />
              Agency Command Center
            </h1>
            <p className="text-slate-400 mt-2">Executive Overview & Business Intelligence</p>
          </div>
          <div className="flex gap-4">
             <Link href="/agency/crm" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10">
               Manage CRM
             </Link>
             <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
               Create Proposal
             </button>
          </div>
        </div>

        {/* Top level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400"><DollarSign className="w-5 h-5"/></div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+12%</span>
            </div>
            <div className="text-sm text-slate-400 font-medium mb-1">Realized Revenue</div>
            <div className="text-3xl font-bold text-white">${metrics.total_revenue.toLocaleString()}</div>
          </div>
          
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400"><Target className="w-5 h-5"/></div>
            </div>
            <div className="text-sm text-slate-400 font-medium mb-1">Sales Pipeline</div>
            <div className="text-3xl font-bold text-white">${metrics.pipeline_value.toLocaleString()}</div>
          </div>
          
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400"><Cpu className="w-5 h-5"/></div>
            </div>
            <div className="text-sm text-slate-400 font-medium mb-1">GPU Compute Costs</div>
            <div className="text-3xl font-bold text-white">${metrics.gpu_compute_cost.toLocaleString()}</div>
          </div>
          
          <div className="bg-slate-900/50 border border-fuchsia-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp className="w-24 h-24 text-fuchsia-500" /></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 bg-fuchsia-500/20 rounded-xl flex items-center justify-center text-fuchsia-400"><Wallet className="w-5 h-5"/></div>
            </div>
            <div className="text-sm text-fuchsia-300 font-medium mb-1 relative z-10">Net Profitability</div>
            <div className="text-3xl font-bold text-white relative z-10">${metrics.profitability.toLocaleString()}</div>
            <div className="mt-2 text-sm text-fuchsia-400 relative z-10">{metrics.margin_percentage}% Margin</div>
          </div>
        </div>

        {/* Intelligence Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg">AI Production Efficiency</h3>
               <Activity className="w-5 h-5 text-slate-500" />
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="text-slate-400">Total Generations Run</div>
                  <div className="font-bold">{metrics.total_generations}</div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="text-slate-400">Avg Cost Per Asset</div>
                  <div className="font-bold">$0.05</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-slate-400">Workflow Success Rate</div>
                  <div className="font-bold text-emerald-400">98.2%</div>
                </div>
             </div>
           </div>
           
           <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg">Recent Invoices</h3>
               <Link href="/agency/financials" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">View All <ArrowRight className="w-4 h-4"/></Link>
             </div>
             
             {/* Mock List */}
             <div className="space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                   <div>
                     <div className="font-medium">Acme Corp Campaign</div>
                     <div className="text-xs text-slate-400">Due in {i * 5} days</div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-white">${(i * 1250).toLocaleString()}</div>
                     <div className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded inline-block mt-1">Pending</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
