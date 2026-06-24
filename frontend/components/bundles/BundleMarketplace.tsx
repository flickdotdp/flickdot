import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBundles, useImportBundle, useInstallBundle, useDeleteBundle } from '@/hooks/use-bundles';
import { useBundleStore } from '@/stores/bundle-store';
import { checkBundleCompatibility, Bundle, BundleDependency } from '@/lib/api/bundles';
import { useAssets } from '@/hooks/use-assets';
import toast from 'react-hot-toast';

const BundleCard = ({ 
  bundle, 
  isFavorite, 
  toggleFavorite, 
  onClick 
}: { 
  bundle: Bundle, 
  isFavorite: boolean, 
  toggleFavorite: (id: string) => void,
  onClick: () => void 
}) => {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col bg-black/40 border border-white/5 hover:border-cyan-500/50 rounded-xl overflow-hidden group transition-all duration-300 cursor-pointer"
    >
      <div className="aspect-video w-full bg-gray-900 relative">
        <div className="absolute inset-0 flex items-center justify-center text-white/10 text-4xl font-black uppercase overflow-hidden whitespace-nowrap opacity-20 group-hover:scale-110 transition-transform duration-700">
          BUNDLE
        </div>
        
        {bundle.is_installed && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-900/80 backdrop-blur border border-green-500/30 text-[10px] text-green-100 font-medium uppercase tracking-wider">
            Installed
          </div>
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(bundle.id); }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
            isFavorite 
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
              : 'bg-black/40 text-white/40 hover:bg-white/10 hover:text-white'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </button>
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-white text-sm truncate" title={bundle.name}>{bundle.name}</h3>
        </div>
        <div className="flex justify-between items-center text-xs text-white/50">
          <span>v{bundle.version}</span>
          <span className="truncate max-w-[50%]" title={bundle.author}>by {bundle.author}</span>
        </div>
        {bundle.tags && bundle.tags.length > 0 && (
          <div className="flex gap-1 overflow-hidden mt-1">
            {bundle.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[9px] bg-white/5 text-white/60 px-1.5 py-0.5 rounded uppercase truncate">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BundleDetailsPanel = ({ bundle, onClose }: { bundle: Bundle, onClose: () => void }) => {
  const { data: assets } = useAssets();
  const { mutate: installBundle, isPending: isInstalling } = useInstallBundle();
  const { mutate: deleteBundle, isPending: isDeleting } = useDeleteBundle();
  
  const report = assets ? checkBundleCompatibility(bundle, assets) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="absolute top-0 right-0 bottom-0 w-96 bg-gray-950 border-l border-white/10 shadow-2xl flex flex-col z-20"
    >
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
        <h2 className="text-xl font-bold text-white tracking-wide truncate">{bundle.name}</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-xs text-white/50 uppercase tracking-wider font-bold mb-2">Description</h3>
          <p className="text-sm text-white/80 leading-relaxed">{bundle.description || "No description provided."}</p>
        </div>

        {report && (
          <div>
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-bold mb-2">Compatibility Report</h3>
            <div className="space-y-2">
              {report.missing_required.length > 0 && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md">
                  <span className="text-xs font-bold text-red-400 block mb-1">✗ Missing Required Assets</span>
                  <ul className="text-xs text-red-300/80 list-disc pl-4">
                    {report.missing_required.map((m, i) => <li key={i}>{m.name} ({m.asset_type})</li>)}
                  </ul>
                </div>
              )}
              {report.missing_recommended.length > 0 && (
                <div className="p-3 bg-yellow-950/30 border border-yellow-500/20 rounded-md">
                  <span className="text-xs font-bold text-yellow-400 block mb-1">⚠ Missing Recommended Assets</span>
                  <ul className="text-xs text-yellow-300/80 list-disc pl-4">
                    {report.missing_recommended.map((m, i) => <li key={i}>{m.name} ({m.asset_type})</li>)}
                  </ul>
                </div>
              )}
              {report.is_compatible && (
                <div className="p-3 bg-green-950/30 border border-green-500/20 rounded-md flex items-center gap-2">
                  <span className="text-green-400 text-lg">✓</span>
                  <span className="text-xs text-green-300">All required assets found</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-black/40 space-y-3 shrink-0">
        {!bundle.is_installed ? (
          <button 
            onClick={() => {
              if (report && !report.is_compatible) {
                toast.error("Cannot install: Missing required assets.");
                return;
              }
              installBundle(bundle.id, {
                onSuccess: onClose
              });
            }}
            disabled={isInstalling || (report && !report.is_compatible)}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isInstalling ? "Installing..." : "Install Bundle"}
          </button>
        ) : (
          <div className="w-full py-3 bg-green-900/30 text-green-400 text-center rounded-md font-bold border border-green-500/30">
            Installed
          </div>
        )}
        <button 
          onClick={() => deleteBundle(bundle.id, { onSuccess: onClose })}
          disabled={isDeleting}
          className="w-full py-2 bg-transparent hover:bg-red-950/50 text-red-400 rounded-md font-medium text-sm transition-colors"
        >
          Delete Bundle
        </button>
      </div>
    </motion.div>
  );
};

export const BundleMarketplace = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { data: bundles, isLoading } = useBundles();
  const { mutate: importBundle, isPending: isImporting } = useImportBundle();
  
  const { 
    favoriteBundles, 
    toggleFavoriteBundle,
    searchQuery, setSearchQuery,
    showInstalledOnly, setShowInstalledOnly
  } = useBundleStore();

  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBundles = (bundles?.data || []).filter(bundle => {
    if (searchQuery && !bundle.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (showInstalledOnly && !bundle.is_installed) return false;
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast.error("Must be a .zip bundle file");
        return;
      }
      importBundle(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-4 z-50 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">Workflow Bundles</h2>
              <p className="text-sm text-white/50 mt-1">Discover, install, and share portable workflows</p>
            </div>
            
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".zip" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import .ZIP'}
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors bg-white/5">✕</button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-white/5 flex gap-4 shrink-0 bg-black/20">
            <input 
              type="text" 
              placeholder="Search bundles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 max-w-md bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <button 
              onClick={() => setShowInstalledOnly(!showInstalledOnly)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors border ${showInstalledOnly ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-transparent border-white/10 text-white/60 hover:text-white'}`}
            >
              Installed Only
            </button>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              {isLoading ? (
                <div className="flex justify-center items-center h-full text-white/50">Loading Bundles...</div>
              ) : filteredBundles.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-white/50 gap-4">
                  <p>No bundles found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredBundles.map(bundle => (
                    <BundleCard 
                      key={bundle.id} 
                      bundle={bundle} 
                      isFavorite={favoriteBundles.includes(bundle.id)}
                      toggleFavorite={toggleFavoriteBundle}
                      onClick={() => setSelectedBundle(bundle)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details Panel Overlay */}
            <AnimatePresence>
              {selectedBundle && (
                <BundleDetailsPanel 
                  bundle={selectedBundle} 
                  onClose={() => setSelectedBundle(null)} 
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
