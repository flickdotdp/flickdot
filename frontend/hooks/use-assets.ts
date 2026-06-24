import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetService } from '../lib/api/assets';
import toast from 'react-hot-toast';

export const assetKeys = {
  all: ['assets'] as const,
  models: () => [...assetKeys.all, 'models'] as const,
  loras: () => [...assetKeys.all, 'loras'] as const,
};

export const useModels = () => {
  return useQuery({
    queryKey: assetKeys.models(),
    queryFn: () => AssetService.getModels(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLoras = () => {
  return useQuery({
    queryKey: assetKeys.loras(),
    queryFn: () => AssetService.getLoras(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAssets = () => {
  const models = useModels();
  const loras = useLoras();

  const isLoading = models.isLoading || loras.isLoading;
  const isError = models.isError || loras.isError;
  const data = [...(models.data?.data || []), ...(loras.data?.data || [])];

  return {
    data,
    isLoading,
    isError
  };
};

export const useRefreshAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AssetService.refreshAssets(),
    onSuccess: (response) => {
      // Invalidate both models and loras so they refetch immediately
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      
      if (response.data?.data) {
        const { added, updated, removed } = response.data.data;
        if (added === 0 && updated === 0 && removed === 0) {
          toast.success("Asset registry is up to date");
        } else {
          toast.success(`Registry refreshed: ${added} added, ${updated} updated, ${removed} removed`);
        }
      } else {
        toast.success("Asset registry refreshed");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to refresh assets");
    }
  });
};
