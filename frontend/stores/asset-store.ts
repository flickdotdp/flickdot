import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AssetStoreState {
  // UI State
  isAssetMarketplaceOpen: boolean;
  toggleAssetMarketplace: (isOpen?: boolean) => void;

  // Favorites
  favoriteModels: string[];
  favoriteLoras: string[];
  
  // Recently Used
  recentlyUsedModels: string[];
  recentlyUsedLoras: string[];
  
  // Actions
  toggleFavoriteModel: (id: string) => void;
  toggleFavoriteLora: (id: string) => void;
  
  addRecentlyUsedModel: (id: string) => void;
  addRecentlyUsedLora: (id: string) => void;
}

const MAX_RECENT = 10;

export const useAssetStore = create<AssetStoreState>()(
  devtools(
    persist(
      (set) => ({
        isAssetMarketplaceOpen: false,
        favoriteModels: [],
        favoriteLoras: [],
        recentlyUsedModels: [],
        recentlyUsedLoras: [],

        toggleAssetMarketplace: (isOpen) =>
          set((state) => ({
            isAssetMarketplaceOpen: isOpen !== undefined ? isOpen : !state.isAssetMarketplaceOpen,
          }), false, 'toggleAssetMarketplace'),

        toggleFavoriteModel: (id) =>
          set((state) => ({
            favoriteModels: state.favoriteModels.includes(id)
              ? state.favoriteModels.filter((fid) => fid !== id)
              : [...state.favoriteModels, id],
          }), false, 'toggleFavoriteModel'),

        toggleFavoriteLora: (id) =>
          set((state) => ({
            favoriteLoras: state.favoriteLoras.includes(id)
              ? state.favoriteLoras.filter((fid) => fid !== id)
              : [...state.favoriteLoras, id],
          }), false, 'toggleFavoriteLora'),

        addRecentlyUsedModel: (id) =>
          set((state) => {
            const filtered = state.recentlyUsedModels.filter((rid) => rid !== id);
            return {
              recentlyUsedModels: [id, ...filtered].slice(0, MAX_RECENT),
            };
          }, false, 'addRecentlyUsedModel'),

        addRecentlyUsedLora: (id) =>
          set((state) => {
            const filtered = state.recentlyUsedLoras.filter((rid) => rid !== id);
            return {
              recentlyUsedLoras: [id, ...filtered].slice(0, MAX_RECENT),
            };
          }, false, 'addRecentlyUsedLora'),
      }),
      {
        name: 'asset-storage', // local storage key
        partialize: (state) => ({
          favoriteModels: state.favoriteModels,
          favoriteLoras: state.favoriteLoras,
          recentlyUsedModels: state.recentlyUsedModels,
          recentlyUsedLoras: state.recentlyUsedLoras,
        }),
      }
    ),
    { name: 'AssetStore' }
  )
);
