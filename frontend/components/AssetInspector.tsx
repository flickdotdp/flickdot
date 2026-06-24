import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Maximize, MessageSquare, Info, Link2, Download, Send, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function AssetInspector({ assetId, onClose }: { assetId: string, onClose: () => void }) {
  const [lineage, setLineage] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("metadata");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (assetId) {
      fetchLineage();
      fetchComments();
    }
  }, [assetId]);

  const fetchLineage = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/dam/assets/${assetId}/lineage`);
      const data = await res.json();
      setLineage(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/dam/assets/${assetId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/dam/assets/${assetId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, author_name: "Art Director" })
      });
      setNewComment("");
      fetchComments();
    } catch (e) {
      console.error(e);
    }
  };

  if (!lineage) return null;
  const asset = lineage.asset;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex"
      >
        {/* Main Preview Area */}
        <div className="flex-1 relative flex items-center justify-center p-8">
          <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="absolute top-6 right-6 flex gap-2">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"><ZoomIn className="w-5 h-5" /></button>
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"><ZoomOut className="w-5 h-5" /></button>
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"><Maximize className="w-5 h-5" /></button>
          </div>

          <div className="w-full max-w-4xl aspect-video bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center">
            {/* Visual asset preview goes here */}
            <span className="text-slate-600 font-mono text-xl">Asset Preview Render</span>
          </div>
        </div>

        {/* Right Sidebar */}
        <motion.div 
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          className="w-[400px] bg-slate-900 border-l border-white/10 flex flex-col h-full"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white mb-2 truncate">{asset.name}</h2>
            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                asset.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                asset.approval_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>{asset.approval_status}</span>
              <span className="text-slate-400">{format(new Date(asset.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button onClick={() => setActiveTab('metadata')} className={`flex-1 py-4 text-sm font-medium flex justify-center gap-2 border-b-2 transition-colors ${activeTab === 'metadata' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              <Info className="w-4 h-4" /> Details
            </button>
            <button onClick={() => setActiveTab('lineage')} className={`flex-1 py-4 text-sm font-medium flex justify-center gap-2 border-b-2 transition-colors ${activeTab === 'lineage' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              <Link2 className="w-4 h-4" /> Lineage
            </button>
            <button onClick={() => setActiveTab('comments')} className={`flex-1 py-4 text-sm font-medium flex justify-center gap-2 border-b-2 transition-colors ${activeTab === 'comments' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              <MessageSquare className="w-4 h-4" /> Review
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeTab === 'metadata' && (
              <div className="space-y-6 text-sm">
                <div>
                  <div className="text-slate-500 mb-1">Original Prompt</div>
                  <div className="p-3 bg-black/40 rounded-lg text-slate-300 font-mono text-xs break-words">
                    {lineage.generation?.prompt || "No prompt data available"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-500 mb-1">Dimensions</div>
                    <div className="text-white">{asset.width || "N/A"} x {asset.height || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">File Type</div>
                    <div className="text-white">{asset.asset_type.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Seed</div>
                    <div className="text-white font-mono">{lineage.generation?.seed || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Steps</div>
                    <div className="text-white">{lineage.generation?.steps || "N/A"}</div>
                  </div>
                </div>
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> Download Original
                </button>
              </div>
            )}

            {activeTab === 'lineage' && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Provenance Graph</div>
                
                {[
                  { label: "Brand", data: lineage.brand?.name },
                  { label: "Campaign", data: lineage.campaign?.name },
                  { label: "Project", data: lineage.project?.project_name },
                  { label: "Workflow", data: lineage.workflow?.name },
                  { label: "Execution", data: lineage.generation?.id?.split("-")[0] },
                  { label: "Asset", data: asset.name, current: true }
                ].map((node, i) => node.data && (
                  <div key={i} className={`relative flex items-center gap-3 p-3 rounded-lg border ${node.current ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-white' : 'border-white/5 bg-black/20 text-slate-300'}`}>
                     {i > 0 && <div className="absolute -top-4 left-6 w-px h-4 bg-white/10" />}
                     <div className={`w-2 h-2 rounded-full ${node.current ? 'bg-fuchsia-400' : 'bg-slate-500'}`} />
                     <div>
                       <div className="text-[10px] uppercase tracking-widest opacity-50">{node.label}</div>
                       <div className="font-medium text-sm truncate">{node.data}</div>
                     </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 pb-4">
                  {comments.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10">No comments yet.</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-fuchsia-400">{c.author_name}</span>
                          <span className="text-xs text-slate-500">{format(new Date(c.created_at), "HH:mm")}</span>
                        </div>
                        <p className="text-sm text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Comment Input Footer */}
          {activeTab === 'comments' && (
            <div className="p-4 border-t border-white/10 bg-black/20">
               <form onSubmit={postComment} className="relative">
                 <input 
                   type="text" 
                   value={newComment}
                   onChange={e => setNewComment(e.target.value)}
                   placeholder="Add a comment..." 
                   className="w-full bg-slate-800 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                 />
                 <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-fuchsia-500 hover:bg-fuchsia-400 disabled:bg-slate-700 text-white rounded-lg transition-colors">
                   <Send className="w-4 h-4" />
                 </button>
               </form>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
