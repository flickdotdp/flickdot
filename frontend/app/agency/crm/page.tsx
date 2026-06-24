"use client";

import React, { useState, useEffect } from "react";
import { Users, Building2, Plus, Phone, Mail, MoreVertical } from "lucide-react";

export default function CRMBoard() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/agency/clients");
      const data = await res.json();
      setClients(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground p-8 flex flex-col h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Client Management
          </h1>
          <p className="text-slate-400 mt-2">CRM, Sales Pipeline, and Contacts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-5 h-5" /> New Client
        </button>
      </div>

      {/* Main Board */}
      <div className="flex-1 overflow-hidden flex gap-6 pb-8">
        
        {/* Column: Leads */}
        <div className="flex flex-col w-80 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-300">New Leads <span className="text-slate-500 font-normal ml-2">2</span></h3>
          </div>
          <div className="flex-1 bg-slate-900/30 rounded-2xl border border-white/5 p-3 space-y-3 overflow-y-auto">
            {/* Mock Card */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white">Stark Industries</h4>
                <button className="text-slate-500 opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4"/></button>
              </div>
              <div className="text-xs text-slate-400 mb-4">Aerospace / Defense</div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Proposal Stage</span>
                <span className="font-bold text-white">$12,500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column: Active Clients */}
        <div className="flex flex-col w-80 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-emerald-400">Active Clients <span className="text-emerald-500/50 font-normal ml-2">{clients.length}</span></h3>
          </div>
          <div className="flex-1 bg-slate-900/30 rounded-2xl border border-white/5 p-3 space-y-3 overflow-y-auto">
            {clients.length === 0 ? (
               <div className="text-center text-slate-500 text-sm mt-10">No active clients</div>
            ) : (
              clients.map(client => (
                <div key={client.id} className="bg-slate-800/80 p-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Building2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">{client.name}</h4>
                      <div className="text-xs text-slate-400">{client.industry || 'General'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-300 transition-colors"><Mail className="w-3.5 h-3.5"/></button>
                     <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-300 transition-colors"><Phone className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column: Churned */}
        <div className="flex flex-col w-80 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-500">Churned <span className="text-slate-600 font-normal ml-2">0</span></h3>
          </div>
          <div className="flex-1 bg-slate-900/30 rounded-2xl border border-white/5 p-3 space-y-3 overflow-y-auto">
             <div className="text-center text-slate-600 text-sm mt-10">No churned clients</div>
          </div>
        </div>

      </div>
    </div>
  );
}
