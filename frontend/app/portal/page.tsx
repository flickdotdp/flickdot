"use client";

import React, { useState, useEffect } from "react";
import { Lock, Eye, Download, MessageSquare, CheckCircle, XCircle, FileImage, FileVideo, DownloadCloud } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

export default function ClientPortal() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "mock-token";
  
  const [auth, setAuth] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeAsset, setActiveAsset] = useState<any>(null);

  useEffect(() => {
    // In a real app, we'd fetch based on the token. 
    // If token exists, we authenticate them automatically.
    if (token) {
      setTimeout(() => {
        setAuth(true);
        // Mocking the payload from /api/v1/delivery/portal/{token}
        setData({
          package: { name: "Summer Campaign 2026", description: "Final hero selects for the summer collection." },
          assets: [
            { id: "1", name: "Hero_Image_01.png", asset_type: "image", approval_status: "pending", created_at: new Date().toISOString() },
            { id: "2", name: "Social_B-Roll_02.mp4", asset_type: "video", approval_status: "approved", created_at: new Date().toISOString() },
            { id: "3", name: "Website_Header_03.png", asset_type: "image", approval_status: "pending", created_at: new Date().toISOString() },
          ],
          link: { allow_download: true, allow_comments: true, allow_approval: true }
        });
      }, 800);
    }
  }, [token]);

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white/50" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Secure Review Portal</h1>
          <p className="text-slate-400 text-sm mb-8">Validating your secure access token...</p>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-white rounded-full animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      
      {/* Branded Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            {/* Mock Client Logo */}
            <span className="text-black font-black text-xl">C</span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-0.5">Deliverable Review</div>
            <h1 className="text-xl font-bold text-white">{data.package?.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
            <DownloadCloud className="w-4 h-4" /> Download All
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto p-8">
        <p className="text-slate-400 text-lg max-w-3xl mb-12">{data.package?.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {data.assets.map((asset: any) => (
            <div key={asset.id} className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/30 transition-all cursor-pointer" onClick={() => setActiveAsset(asset)}>
              
              {/* Asset Preview (Presentation Mode) */}
              <div className="aspect-[4/5] bg-black relative flex items-center justify-center">
                {asset.asset_type === 'video' ? <FileVideo className="w-12 h-12 text-slate-700" /> : <FileImage className="w-12 h-12 text-slate-700" />}
                
                {/* Watermark Overlay (If enabled) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                  <span className="text-4xl font-black text-white rotate-[-30deg]">CONFIDENTIAL</span>
                </div>
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                   <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
              
              {/* Minimal Info Bar */}
              <div className="p-5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-white truncate pr-4">{asset.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ${
                    asset.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {asset.approval_status}
                  </span>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                  {data.link.allow_approval && asset.approval_status !== 'approved' && (
                    <button className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {data.link.allow_comments && (
                    <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Asset Presentation Modal */}
      {activeAsset && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center">
          <button onClick={() => setActiveAsset(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
          
          <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl border border-white/5 shadow-2xl flex items-center justify-center relative overflow-hidden">
             <span className="text-slate-600 font-mono text-2xl">High-Fidelity Presentation Mode</span>
             
             {/* Bottom Control Bar */}
             <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex justify-between items-end">
               <div>
                 <h2 className="text-2xl font-bold text-white mb-1">{activeAsset.name}</h2>
                 <p className="text-sm text-slate-400">Added {format(new Date(activeAsset.created_at), "MMM d, yyyy")}</p>
               </div>
               
               <div className="flex gap-3">
                 {data.link.allow_download && (
                   <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                     <Download className="w-5 h-5" /> Download Master
                   </button>
                 )}
                 {data.link.allow_approval && (
                   <button className="px-8 py-3 bg-white text-black rounded-xl font-bold transition-colors flex items-center gap-2 hover:bg-slate-200">
                     <CheckCircle className="w-5 h-5" /> Approve Asset
                   </button>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
