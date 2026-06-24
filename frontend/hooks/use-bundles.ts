import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BundleService } from '../lib/api/bundles';
import toast from 'react-hot-toast';

export const bundleKeys = {
  all: ['bundles'] as const,
  lists: () => [...bundleKeys.all, 'list'] as const,
  details: () => [...bundleKeys.all, 'detail'] as const,
  detail: (id: string) => [...bundleKeys.details(), id] as const,
};

export const useBundles = () => {
  return useQuery({
    queryKey: bundleKeys.lists(),
    queryFn: () => BundleService.getBundles(),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useBundle = (id: string | null) => {
  return useQuery({
    queryKey: id ? bundleKeys.detail(id) : [],
    queryFn: () => id ? BundleService.getBundle(id) : Promise.reject('No ID'),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
};

export const useImportBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => BundleService.importBundle(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
      toast.success("Bundle imported successfully. Ready for installation.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to import bundle");
    }
  });
};

export const useExportBundle = () => {
  return useMutation({
    mutationFn: (workflowId: string) => BundleService.exportBundle(workflowId),
    onSuccess: (res) => {
      toast.success(`Bundle exported successfully to ${res.data?.file_path}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to export bundle");
    }
  });
};

export const useInstallBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bundleId: string) => BundleService.installBundle(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
      // Also invalidate workflows since a new one was just created
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success("Bundle installed! The workflow is now available.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to install bundle");
    }
  });
};

export const useDeleteBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => BundleService.deleteBundle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
      toast.success("Bundle removed from registry.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete bundle");
    }
  });
};
