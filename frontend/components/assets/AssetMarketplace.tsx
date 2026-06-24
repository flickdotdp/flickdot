import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModels, useLoras, useRefreshAssets } from '@/hooks/use-assets';
import { useAssetStore } from '@/stores/asset-store';
import { AIAsset } from '@/lib/api/assets';

const AssetCard = ({ asset, isFavorite, toggleFavorite }: { asset: AIAsset, isFavorite: boolean, toggleFavorite: (id: string) => void }) => {
  return (
    <div className="flex flex-col bg-black/40 border border-white/5 hover:border-white/20 rounded-xl overflow-hidden group transition-all duration-300">
      <div className="aspect-video w-full bg-gray-900 relative">
        <div className="absolute inset-0 flex items-center justify-center text-white/10 text-4xl font-black uppercase overflow-hidden whitespace-nowrap opacity-20 group-hover:scale-110 transition-transform duration-700">
          {asset.asset_type}
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[80%]">
          {asset.compatibility_tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-900/80 backdrop-blur border border-cyan-500/30 text-[10px] text-cyan-100 font-medium uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        
        {/* Favorite Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}
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
          <h3 className="font-medium text-white text-sm truncate" title={asset.name}>{asset.name}</h3>
        </div>
        <div className="flex justify-between items-center text-xs text-white/50">
          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
            {(asset.file_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
          </span>
          <span className="truncate max-w-[50%]" title={asset.filename}>{asset.filename}</span>
        </div>
      </div>
    </div>
  );
};

export const AssetMarketplace = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'loras'>('models');
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: models, isLoading: isLoadingModels } = useModels();
  const { data: loras, isLoading: isLoadingLoras } = useLoras();
  const { mutate: refreshAssets, isPending: isRefreshing } = useRefreshAssets();
  
  const { favoriteModels, favoriteLoras, toggleFavoriteModel, toggleFavoriteLora } = useAssetStore();

  const currentAssets = (activeTab === 'models' ? models?.data : loras?.data) || [];
  const currentFavorites = activeTab === 'models' ? favoriteModels : favoriteLoras;
  const currentToggle = activeTab === 'models' ? toggleFavoriteModel : toggleFavoriteLora;
  const isLoading = activeTab === 'models' ? isLoadingModels : isLoadingLoras;

  const filteredAssets = currentAssets.filter(asset => {
    if (search && !asset.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (showFavoritesOnly && !currentFavorites.includes(asset.id)) return false;
    return true;
  });

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
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Asset Library</h2>
                <p className="text-sm text-white/50 mt-1">Manage Models, LoRAs, and Checkpoints</p>
              </div>
              
              <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 ml-8">
                <button 
                  onClick={() => setActiveTab('models')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'models' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'}`}
                >
                  Models ({models?.data?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveTab('loras')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'loras' ? 'bg-purple-500/20 text-purple-400' : 'text-white/50 hover:text-white'}`}
                >
                  LoRAs ({loras?.data?.length || 0})
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => refreshAssets()}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isRefreshing ? 'Scanning...' : 'Refresh Registry'}
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors bg-white/5"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-white/5 flex gap-4 shrink-0 bg-black/20">
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 max-w-md bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <button 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors border ${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-transparent border-white/10 text-white/60 hover:text-white'}`}
            >
              ★ Favorites Only
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-white/50">Loading Assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-white/50 gap-4">
                <p>No assets found.</p>
                {search && <button onClick={() => setSearch('')} className="text-cyan-400 hover:underline">Clear Search</button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAssets.map(asset => (
                  <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    isFavorite={currentFavorites.includes(asset.id)}
                    toggleFavorite={currentToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
