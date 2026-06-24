import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '../lib/api/client';
import { useConnectionStatus } from './use-websocket';

// -------------------------------------------------------------------------
// TypeScript Interfaces
// -------------------------------------------------------------------------
export interface SystemHealthResponse {
  status: string;
  api_version: string;
  comfyui: "online" | "offline";
  comfyui_endpoint?: string;
  comfyui_response_time_ms?: number;
  comfyui_error?: string | null;
  worker: {
    is_running: boolean;
    active_jobs: number;
    concurrency_limit: number;
  };
  websocket: {
    active_connections: number;
    total_connections_handled: number;
  };
}

// -------------------------------------------------------------------------
// Health Queries
// -------------------------------------------------------------------------

/**
 * Polls the system health endpoint.
 * Automatically polls faster (5s) if offline to quickly recover.
 */
export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const res: any = await api.get('/system/health');
      return res as SystemHealthResponse;
    },
    // Poll every 10s usually, or 5s if we know it might be offline
    refetchInterval: (query) => {
      if (query.state.data?.comfyui === 'offline') return 5000;
      return 10000;
    },
    refetchIntervalInBackground: false,
    retry: 1,
    staleTime: 5000,
  });
};

// -------------------------------------------------------------------------
// Derived Health Selectors
// -------------------------------------------------------------------------

/**
 * Comprehensive hook that aggregates API health and WebSocket status
 * to determine if the platform is fully ready to accept generation requests.
 */
export const usePlatformReadiness = () => {
  const { data: healthRes, isLoading, isError } = useSystemHealth();
  const { connectionState } = useConnectionStatus();

  // Extract the raw payload
  const health = healthRes;

  // Realtime Status
  const isRealtimeConnected = connectionState === 'OPEN';

  // Component Statuses
  const isDatabaseOnline = true; // Implied by backend response
  const isComfyUIOnline = health?.comfyui === 'online';
  const isWorkerHealthy = health?.worker?.is_running === true;

  // Overall backend readiness
  const isBackendHealthy = !isError && health?.status === 'healthy';

  // Queue Capacity
  const queueDepth = health?.worker?.active_jobs || 0;
  const queueCapacity = health?.worker?.concurrency_limit || 100;
  const hasQueueCapacity = queueDepth < queueCapacity;

  /**
   * The ultimate gatekeeper boolean.
   * True ONLY if everything required to successfully generate an image is online.
   */
  const canGenerateImages = 
    isRealtimeConnected && 
    isBackendHealthy && 
    isComfyUIOnline && 
    isWorkerHealthy && 
    hasQueueCapacity;

  return {
    // Flags
    isSystemHealthy: isBackendHealthy,
    isRealtimeConnected,
    isDatabaseOnline,
    isComfyUIOnline,
    isWorkerHealthy,
    hasQueueCapacity,
    canGenerateImages,
    
    // Raw Metrics
    queueDepth,
    queueCapacity,
    activeJobs: health?.worker?.active_jobs || 0,
    
    // Diagnostic Metrics
    comfyuiEndpoint: health?.comfyui_endpoint,
    comfyuiResponseTime: health?.comfyui_response_time_ms,
    comfyuiError: health?.comfyui_error,
    
    // Status Text Helper
    statusText: getStatusText(isBackendHealthy, isRealtimeConnected, isComfyUIOnline),
    
    // Loading State
    isCheckingHealth: isLoading,
    
    // Actions
    refetch: useSystemHealth().refetch
  };
};

// -------------------------------------------------------------------------
// Utility Helpers
// -------------------------------------------------------------------------
function getStatusText(backend: boolean, ws: boolean, comfy: boolean): string {
  if (!backend) return "Backend Offline";
  if (!ws) return "Reconnecting...";
  if (!comfy) return "ComfyUI Offline";
  return "System Online";
}
