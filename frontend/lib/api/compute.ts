import { api, ApiResponse } from './client';
import { useQuery } from '@tanstack/react-query';

export interface WorkerNode {
  id: string;
  hostname: string;
  ip_address: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  last_seen: string | null;
  capabilities: Record<string, any>;
  supported_models: string[];
  supported_workflow_tags: string[];
}

export interface GPUDevice {
  id: string;
  worker_id: string;
  gpu_name: string;
  gpu_index: number;
  vram_total: number;
  vram_used: number;
  utilization: number;
  temperature: number;
  queue_depth: number;
}

export interface ComputeMetrics {
  workers_online: number;
  gpus_online: number;
  queue_depth: number;
  running_jobs: number;
}

export const ComputeService = {
  getWorkers: async (): Promise<WorkerNode[]> => {
    return api.get('/compute/workers') as any;
  },
  getGPUs: async (): Promise<GPUDevice[]> => {
    return api.get('/compute/gpus') as any;
  },
  getMetrics: async (): Promise<ComputeMetrics> => {
    return api.get('/compute/metrics') as any;
  }
};

export const computeKeys = {
  all: ['compute'] as const,
  workers: () => [...computeKeys.all, 'workers'] as const,
  gpus: () => [...computeKeys.all, 'gpus'] as const,
  metrics: () => [...computeKeys.all, 'metrics'] as const,
};

export const useWorkers = () => {
  return useQuery({
    queryKey: computeKeys.workers(),
    queryFn: async () => {
      return await ComputeService.getWorkers();
    },
    refetchInterval: 5000,
  });
};

export const useGPUs = () => {
  return useQuery({
    queryKey: computeKeys.gpus(),
    queryFn: async () => {
      return await ComputeService.getGPUs();
    },
    refetchInterval: 5000,
  });
};

export const useComputeMetrics = () => {
  return useQuery({
    queryKey: computeKeys.metrics(),
    queryFn: async () => {
      return await ComputeService.getMetrics();
    },
    refetchInterval: 3000,
  });
};
