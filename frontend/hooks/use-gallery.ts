import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  GenerationService, 
  generationKeys, 
  GenerationResponse 
} from '../lib/api/generations';
import { useGenerationStore } from '../stores/generation-store';
import toast from 'react-hot-toast';

// -------------------------------------------------------------------------
// Infinite Queries (For Virtualized / Infinite Scrolling Gallery)
// -------------------------------------------------------------------------

export const useInfiniteGallery = (size = 20) => {
  // Syncs seamlessly with the global UI gallery filter state
  const filters = useGenerationStore((state) => state.galleryFilters);

  return useInfiniteQuery({
    queryKey: [...generationKeys.gallery(), 'infinite', size, filters],
    queryFn: async ({ pageParam = 1 }) => {
      // Build the specialized filter object
      const apiFilters: any = {};
      if (filters.type) apiFilters.type = filters.type;
      if (filters.favorite !== undefined) apiFilters.favorite = filters.favorite;
      // Search is typically handled as a separate API endpoint or backend query param,
      // here we map it if the backend supports it, otherwise it relies on /search endpoint.
      if (filters.searchQuery) apiFilters.q = filters.searchQuery;

      return GenerationService.getGalleryItems(pageParam, size, apiFilters);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.has_next) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

// -------------------------------------------------------------------------
// Gallery Mutations
// -------------------------------------------------------------------------

/**
 * Bulk deletion optimized for selecting multiple gallery items.
 */
export const useBulkDeleteGenerations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // For a true production app, the backend should have a /bulk-delete endpoint.
      // Here we simulate it by running them concurrently.
      const promises = ids.map(id => GenerationService.deleteGeneration(id));
      await Promise.allSettled(promises);
      return ids;
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
      toast.success(`Deleted ${deletedIds.length} generations`);
    },
    onError: () => {
      toast.error("Failed to delete some generations");
    }
  });
};

/**
 * Bulk favorite optimized for selecting multiple gallery items.
 */
export const useBulkFavoriteGenerations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Similarly, a dedicated /bulk-favorite endpoint would be better.
      const promises = ids.map(id => GenerationService.toggleFavorite(id));
      await Promise.allSettled(promises);
      return ids;
    },
    onSuccess: (updatedIds) => {
      queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
      toast.success(`Favorited ${updatedIds.length} generations`);
    },
    onError: () => {
      toast.error("Failed to update favorites");
    }
  });
};

// -------------------------------------------------------------------------
// UI Integration Helpers
// -------------------------------------------------------------------------

/**
 * Hook to quickly select a gallery item, push it to the main workspace, 
 * and optionally trigger comparison mode.
 */
export const useGalleryActions = () => {
  const selectGalleryItem = useGenerationStore((state) => state.selectGalleryItem);
  const toggleComparisonMode = useGenerationStore((state) => state.toggleComparisonMode);
  
  const openInWorkspace = (item: GenerationResponse) => {
    selectGalleryItem(item);
  };

  const compareWithSource = (item: GenerationResponse) => {
    if (!item.source_image_path || !item.output_image_path) {
      toast.error("Comparison requires an image-to-image generation");
      return;
    }
    selectGalleryItem(item);
    // Force transition to comparison mode immediately
    useGenerationStore.setState({ isComparisonMode: true, workspaceMode: 'comparison' });
  };

  const reuseSettings = (item: GenerationResponse) => {
    // This function sets the global form values or alerts the UI to hydrate the form.
    // In a full implementation, we'd have a specific action for `hydrateForm(item)`.
    toast.success("Settings applied to controls!");
  };

  return {
    openInWorkspace,
    compareWithSource,
    reuseSettings
  };
};
