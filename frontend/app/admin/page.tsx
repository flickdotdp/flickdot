"use client";

import React, { useState } from "react";
import { Shield, Users, Database, Key, Settings, Server, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-500" />
              Admin Console
            </h1>
            <p className="text-slate-400 mt-2">Enterprise Role-Based Access Control and System Configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-widest border border-indigo-500/30">
              Super Admin
            </span>
          </div>
        </div>

        {/* Layout */}
        <div className="flex gap-8">
          
          {/* Sidebar */}
          <div className="w-64 shrink-0 space-y-2">
            {[
              { id: "overview", icon: Database, label: "System Overview" },
              { id: "users", icon: Users, label: "User Management" },
              { id: "rbac", icon: Lock, label: "Roles & Permissions" },
              { id: "api-keys", icon: Key, label: "API Keys & Secrets" },
              { id: "infrastructure", icon: Server, label: "Infrastructure" },
              { id: "settings", icon: Settings, label: "Global Settings" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id 
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-3xl p-8 min-h-[600px]">
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-semibold">Security Posture</h2>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <div className="text-slate-400 text-sm font-medium mb-1">Active Users</div>
                    <div className="text-4xl font-bold text-white">124</div>
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <div className="text-slate-400 text-sm font-medium mb-1">Failed Logins (24h)</div>
                    <div className="text-4xl font-bold text-orange-400">3</div>
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <div className="text-slate-400 text-sm font-medium mb-1">Active API Keys</div>
                    <div className="text-4xl font-bold text-emerald-400">18</div>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-black/40 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-medium mb-4">Recent Audit Logs</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Admin generated new API Key for Production Service</span>
                      <span className="text-slate-500 font-mono">2 mins ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">System user 'service-worker' restarted ComfyUI process</span>
                      <span className="text-slate-500 font-mono">45 mins ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">User 'jane_doe' assigned to 'Creator' role</span>
                      <span className="text-slate-500 font-mono">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-slate-500">
                <Users className="w-16 h-16 mb-4 opacity-50" />
                <p>Enterprise Active Directory integration required to view external users.</p>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
