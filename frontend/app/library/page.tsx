"use client";

import React, { useState, useEffect } from "react";
import { FolderHeart, Image as ImageIcon, Video, Layers, Star, Download, Search, CheckCircle2, MoreHorizontal, Maximize2 } from "lucide-react";
import AssetInspector from "../../components/AssetInspector";

export default function AssetLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [filter]);

  const fetchAssets = async () => {
    try {
      let url = "http://127.0.0.1:8000/api/v1/dam/assets?limit=100";
      if (filter === "favorites") url += "&is_favorite=true";
      if (filter === "approved") url += "&approval_status=approved";
      if (filter === "pending") url += "&approval_status=pending";
      
      const res = await fetch(url);
      const data = await res.json();
      setAssets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/dam/assets/${id}/favorite`, { method: "POST" });
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Layers className="w-8 h-8 text-fuchsia-500" />
              Asset Library
            </h1>
            <p className="text-slate-400 mt-2">Digital Asset Management & Curation</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by tags or names..." className="pl-9 pr-4 py-2 bg-black/40 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-fuchsia-500 w-64 transition-colors" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-white/10 pb-4">
          {[
            { id: "all", label: "All Assets" },
            { id: "favorites", label: "Favorites", icon: Star },
            { id: "approved", label: "Approved Selects", icon: CheckCircle2 },
            { id: "pending", label: "Needs Review" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.id ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              {f.icon && <f.icon className="w-4 h-4" />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden aspect-[4/5] hover:border-fuchsia-500/50 transition-colors">
              
              {/* Mock Image for now */}
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                 {asset.asset_type === 'video' ? <Video className="w-8 h-8 text-slate-600" /> : <ImageIcon className="w-8 h-8 text-slate-600" />}
              </div>

              {/* Top Bar (Hidden until hover) */}
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/80 to-transparent">
                <button 
                  onClick={() => toggleFavorite(asset.id)}
                  className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${asset.is_favorite ? 'bg-amber-500/20 text-amber-400' : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`}
                >
                  <Star className={`w-4 h-4 ${asset.is_favorite ? 'fill-current' : ''}`} />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedAssetId(asset.id)}
                    className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/60 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <h3 className="font-medium text-sm text-white truncate">{asset.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                    asset.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    asset.approval_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {asset.approval_status}
                  </span>
                  {asset.asset_type === 'video' && <Video className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </div>
            </div>
          ))}
          
          {assets.length === 0 && (
             <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                <p>No assets found in this view.</p>
             </div>
          )}
        </div>

      </div>
      
      {/* Asset Inspector Modal */}
      {selectedAssetId && (
        <AssetInspector assetId={selectedAssetId} onClose={() => setSelectedAssetId(null)} />
      )}
    </div>
  );
}
