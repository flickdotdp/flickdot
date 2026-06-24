import { api, PaginatedResponse, ApiResponse } from './client';

// -------------------------------------------------------------------------
// TypeScript Interfaces (Mirroring backend schemas/generation.py)
// -------------------------------------------------------------------------

export type GenerationType = "text_to_image" | "image_to_image" | "inpainting" | "upscaling" | "controlnet" | "text_to_video" | "image_to_video";
export type GenerationStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface GenerationCreateRequest {
  workflow_id?: string;
  parameters?: Record<string, any>;
  generation_type: GenerationType;
  prompt?: string;
  negative_prompt?: string;
  project_id?: string;
  seed?: number;
  cfg_scale?: number;
  steps?: number;
  denoise_strength?: number;
  width?: number;
  height?: number;
  batch_size?: number;
  model_name?: string;
  workflow_name?: string;
  loras?: string[];
  controlnets?: string[];
}

export interface GenerationResponse {
  id: string;
  project_id: string | null;
  comfyui_prompt_id: string | null;
  status: GenerationStatus;
  generation_type: GenerationType;
  prompt: string;
  negative_prompt: string | null;
  seed: number | null;
  cfg_scale: number | null;
  steps: number | null;
  denoise_strength: number | null;
  width: number | null;
  height: number | null;
  model_name: string | null;
  workflow_name: string | null;
  source_image_path: string | null;
  output_image_path: string | null;
  output_video_path: string | null;
  thumbnail_path: string | null;
  is_favorite: boolean;
  error_message: string | null;
  execution_time: number | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationStatisticsResponse {
  total_generations: number;
  completed_generations: number;
  failed_generations: number;
  average_execution_time: number;
  total_favorites: number;
}

// -------------------------------------------------------------------------
// React Query Key Factories
// -------------------------------------------------------------------------
export const generationKeys = {
  all: ['generations'] as const,
  lists: () => [...generationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...generationKeys.lists(), { filters }] as const,
  details: () => [...generationKeys.all, 'detail'] as const,
  detail: (id: string) => [...generationKeys.details(), id] as const,
  project: (projectId: string) => [...generationKeys.all, 'project', projectId] as const,
  queue: () => [...generationKeys.all, 'queue'] as const,
  stats: () => [...generationKeys.all, 'stats'] as const,
  gallery: () => [...generationKeys.all, 'gallery'] as const,
};

// -------------------------------------------------------------------------
// Generation Service API
// -------------------------------------------------------------------------
export const GenerationService = {
  
  /**
   * Submits a new generation job. 
   * If sourceImage is provided, it uses the multipart/form-data upload.
   */
  createGeneration: async (data: GenerationCreateRequest, sourceImage?: File): Promise<ApiResponse<GenerationResponse>> => {
    if (sourceImage) {
      return api.upload<GenerationResponse>('/generations/', sourceImage, data as Record<string, any>);
    }
    return api.post<GenerationResponse>('/generations/', data);
  },

  getGenerationById: async (id: string): Promise<ApiResponse<GenerationResponse>> => {
    return api.get<GenerationResponse>(`/generations/${id}`);
  },

  listGenerations: async (page = 1, size = 20): Promise<PaginatedResponse<GenerationResponse>> => {
    return api.get<GenerationResponse[]>(`/generations/?page=${page}&size=${size}`) as Promise<PaginatedResponse<GenerationResponse>>;
  },

  searchGenerations: async (query: string, page = 1, size = 20): Promise<PaginatedResponse<GenerationResponse>> => {
    return api.get<GenerationResponse[]>(`/generations/action/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`) as Promise<PaginatedResponse<GenerationResponse>>;
  },

  getGenerationsByProject: async (projectId: string, page = 1, size = 20): Promise<PaginatedResponse<GenerationResponse>> => {
    return api.get<GenerationResponse[]>(`/projects/${projectId}/generations?page=${page}&size=${size}`) as Promise<PaginatedResponse<GenerationResponse>>;
  },

  getGalleryItems: async (page = 1, size = 50, filters?: { type?: string; favorite?: boolean }): Promise<PaginatedResponse<GenerationResponse>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters?.type) params.append('type', filters.type);
    if (filters?.favorite !== undefined) params.append('favorite', String(filters.favorite));
    
    return api.get<GenerationResponse[]>(`/generations/action/gallery?${params.toString()}`) as Promise<PaginatedResponse<GenerationResponse>>;
  },

  getGenerationQueue: async (): Promise<ApiResponse<GenerationResponse[]>> => {
    return api.get<GenerationResponse[]>('/generations/action/queue');
  },

  getRecentGenerations: async (limit = 10): Promise<ApiResponse<GenerationResponse[]>> => {
    return api.get<GenerationResponse[]>(`/generations/recent?limit=${limit}`);
  },

  getFailedGenerations: async (page = 1, size = 20): Promise<PaginatedResponse<GenerationResponse>> => {
    return api.get<GenerationResponse[]>(`/generations/failed?page=${page}&size=${size}`) as Promise<PaginatedResponse<GenerationResponse>>;
  },

  getCompletedGenerations: async (page = 1, size = 20): Promise<PaginatedResponse<GenerationResponse>> => {
    return api.get<GenerationResponse[]>(`/generations/completed?page=${page}&size=${size}`) as Promise<PaginatedResponse<GenerationResponse>>;
  },

  cancelGeneration: async (id: string): Promise<ApiResponse<GenerationResponse>> => {
    return api.post<GenerationResponse>(`/generations/${id}/cancel`);
  },

  retryGeneration: async (id: string): Promise<ApiResponse<GenerationResponse>> => {
    return api.post<GenerationResponse>(`/generations/${id}/retry`);
  },

  toggleFavorite: async (id: string): Promise<ApiResponse<GenerationResponse>> => {
    return api.put<GenerationResponse>(`/generations/${id}/favorite`);
  },

  validateOutputFiles: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.post<boolean>(`/generations/${id}/validate`);
  },

  deleteGeneration: async (id: string): Promise<ApiResponse<null>> => {
    return api.delete<null>(`/generations/${id}`);
  },

  getGenerationStatistics: async (): Promise<ApiResponse<GenerationStatisticsResponse>> => {
    return api.get<GenerationStatisticsResponse>('/generations/stats/general');
  },

  getModelUsageStatistics: async (): Promise<ApiResponse<Record<string, number>>> => {
    return api.get<Record<string, number>>('/generations/stats/models');
  },

  getWorkflowUsageStatistics: async (): Promise<ApiResponse<Record<string, number>>> => {
    return api.get<Record<string, number>>('/generations/stats/workflows');
  }
};
