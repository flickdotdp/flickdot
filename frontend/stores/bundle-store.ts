import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface BundleStoreState {
  // UI State
  isBundleMarketplaceOpen: boolean;
  toggleBundleMarketplace: (isOpen?: boolean) => void;

  // Favorites
  favoriteBundles: string[];
  
  // Recently Viewed
  recentlyViewedBundles: string[];
  
  // Active Filters
  searchQuery: string;
  activeTags: string[];
  showInstalledOnly: boolean;
  
  // Actions
  toggleFavoriteBundle: (id: string) => void;
  addRecentlyViewedBundle: (id: string) => void;
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  setShowInstalledOnly: (show: boolean) => void;
}

const MAX_RECENT = 10;

export const useBundleStore = create<BundleStoreState>()(
  devtools(
    persist(
      (set) => ({
        isBundleMarketplaceOpen: false,
        favoriteBundles: [],
        recentlyViewedBundles: [],
        searchQuery: '',
        activeTags: [],
        showInstalledOnly: false,

        toggleBundleMarketplace: (isOpen) =>
          set((state) => ({
            isBundleMarketplaceOpen: isOpen !== undefined ? isOpen : !state.isBundleMarketplaceOpen,
          }), false, 'toggleBundleMarketplace'),

        toggleFavoriteBundle: (id) =>
          set((state) => ({
            favoriteBundles: state.favoriteBundles.includes(id)
              ? state.favoriteBundles.filter((fid) => fid !== id)
              : [...state.favoriteBundles, id],
          }), false, 'toggleFavoriteBundle'),

        addRecentlyViewedBundle: (id) =>
          set((state) => {
            const filtered = state.recentlyViewedBundles.filter((rid) => rid !== id);
            return {
              recentlyViewedBundles: [id, ...filtered].slice(0, MAX_RECENT),
            };
          }, false, 'addRecentlyViewedBundle'),

        setSearchQuery: (query) => set({ searchQuery: query }, false, 'setSearchQuery'),

        toggleTag: (tag) =>
          set((state) => ({
            activeTags: state.activeTags.includes(tag)
              ? state.activeTags.filter((t) => t !== tag)
              : [...state.activeTags, tag],
          }), false, 'toggleTag'),
          
        setShowInstalledOnly: (show) => set({ showInstalledOnly: show }, false, 'setShowInstalledOnly'),
      }),
      {
        name: 'bundle-storage', // local storage key
        partialize: (state) => ({
          favoriteBundles: state.favoriteBundles,
          recentlyViewedBundles: state.recentlyViewedBundles,
          activeTags: state.activeTags,
          showInstalledOnly: state.showInstalledOnly
        }),
      }
    ),
    { name: 'BundleStore' }
  )
);
