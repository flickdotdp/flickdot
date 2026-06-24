import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GenerationService, 
  generationKeys, 
  GenerationCreateRequest, 
  GenerationResponse 
} from '../lib/api/generations';
import { useGenerationStore } from '../stores/generation-store';
import toast from 'react-hot-toast';

// -------------------------------------------------------------------------
// Queries
// -------------------------------------------------------------------------

export const useGalleryItems = (page = 1, size = 50, filters?: { type?: string; favorite?: boolean }) => {
  return useQuery({
    queryKey: [...generationKeys.gallery(), page, size, filters],
    queryFn: () => GenerationService.getGalleryItems(page, size, filters),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useGenerationQueue = () => {
  return useQuery({
    queryKey: generationKeys.queue(),
    queryFn: () => GenerationService.getGenerationQueue(),
    staleTime: 1000 * 10, // 10 seconds (Queue changes rapidly)
  });
};

export const useGenerationDetails = (id: string | null, options?: any) => {
  return useQuery({
    queryKey: id ? generationKeys.detail(id) : [],
    queryFn: () => id ? GenerationService.getGenerationById(id) : Promise.reject('No ID'),
    enabled: !!id,
    ...options
  });
};

export const useRecentGenerations = (limit = 10) => {
  return useQuery({
    queryKey: [...generationKeys.lists(), 'recent', limit],
    queryFn: () => GenerationService.getRecentGenerations(limit),
  });
};

export const useGenerationStatistics = () => {
  return useQuery({
    queryKey: generationKeys.stats(),
    queryFn: () => GenerationService.getGenerationStatistics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// -------------------------------------------------------------------------
// Mutations
// -------------------------------------------------------------------------

export const useCreateGeneration = () => {
  const queryClient = useQueryClient();
  const startGeneration = useGenerationStore((state) => state.startGeneration);
  const setActiveGenerationId = useGenerationStore((state) => state.setActiveGenerationId);
  const failGeneration = useGenerationStore((state) => state.failGeneration);

  return useMutation({
    mutationFn: async ({ data, sourceImage }: { data: GenerationCreateRequest, sourceImage?: File | null }) => {
      // Optimistically set the UI to generating
      startGeneration(data);
      return GenerationService.createGeneration(data, sourceImage || undefined);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Tie the backend record to the Zustand state
        setActiveGenerationId(response.data.id, response.data.comfyui_prompt_id);
        
        // Invalidate queue to show the new item
        queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
        toast.success("Generation queued successfully!");
      }
    },
    onError: (error: any) => {
      const msg = error.message || "Failed to start generation";
      failGeneration(msg);
      toast.error(msg);
    }
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GenerationService.toggleFavorite(id),
    // Optimistic Update
    onMutate: async (id) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: generationKeys.all });

      // Snapshot the previous gallery states
      const previousGallery = queryClient.getQueriesData({ queryKey: generationKeys.gallery() });

      // Optimistically update all gallery lists
      queryClient.setQueriesData({ queryKey: generationKeys.gallery() }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item: GenerationResponse) => 
            item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
          )
        };
      });

      return { previousGallery };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousGallery) {
        context.previousGallery.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to toggle favorite");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure backend sync
      queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
    }
  });
};

export const useDeleteGeneration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GenerationService.deleteGeneration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
      toast.success("Generation deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete generation");
    }
  });
};

export const useCancelGeneration = () => {
  const queryClient = useQueryClient();
  const cancelState = useGenerationStore((state) => state.cancelGeneration);

  return useMutation({
    mutationFn: (id: string) => GenerationService.cancelGeneration(id),
    onSuccess: () => {
      cancelState();
      queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
      toast.success("Generation cancelled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel generation");
    }
  });
};
