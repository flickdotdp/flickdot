"use client";

import React, { useState, useEffect } from "react";
import { Folder, Briefcase, Tag, Clock, ChevronRight, Plus, Building2, Workflow } from "lucide-react";
import { format } from "date-fns";

export default function CreativeProjects() {
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/creative/brands");
      const data = await res.json();
      setBrands(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-500" />
              Creative Organization
            </h1>
            <p className="text-slate-400 mt-2">Manage Brands, Campaigns, and Creative Projects</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
            <Plus className="w-5 h-5" /> New Brand
          </button>
        </div>

        {/* Content */}
        {brands.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-16 text-center">
            <Briefcase className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white">No Brands Created</h2>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">Start organizing your creative assets by creating your first Brand or Client profile.</p>
            <button className="mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-slate-200 transition-colors">Create Brand</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {brands.map(brand => (
               <div key={brand.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
                 <div className="flex items-start justify-between mb-4">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                     <Building2 className="w-6 h-6 text-indigo-400" />
                   </div>
                   <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-slate-400">12 Campaigns</span>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-1">{brand.name}</h3>
                 <p className="text-sm text-slate-400 line-clamp-2">{brand.description || "No description provided."}</p>
                 
                 <div className="mt-6 pt-4 border-t border-white/5">
                   <button className="w-full flex items-center justify-between text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                     View Campaigns <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
