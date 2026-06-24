import { api, PaginatedResponse, ApiResponse } from './client';
import { GenerationResponse } from './generations';

// -------------------------------------------------------------------------
// TypeScript Interfaces (Mirroring backend schemas/project.py)
// -------------------------------------------------------------------------

export type ProjectStatus = "active" | "archived" | "deleted";

export interface ProjectSettings {
  default_width: number;
  default_height: number;
  default_model?: string;
  default_workflow?: string;
  auto_save_generations: boolean;
  theme_preference: "dark" | "light" | "system";
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  tags?: string[];
  settings?: Partial<ProjectSettings>;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  tags?: string[];
  status?: ProjectStatus;
  is_favorite?: boolean;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  cover_image_path: string | null;
  status: ProjectStatus;
  is_favorite: boolean;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

export interface ProjectStatisticsResponse {
  total_generations: number;
  completed_generations: number;
  failed_generations: number;
  total_execution_time: number;
  last_generation_at: string | null;
}

export interface ProjectDetailResponse extends ProjectResponse {
  statistics: ProjectStatisticsResponse;
  recent_generations: GenerationResponse[];
}

export interface DashboardSummaryResponse {
  total_projects: number;
  active_projects: number;
  total_generations_all_time: number;
  generations_last_24h: number;
  success_rate: number;
  favorite_generations: number;
}

// -------------------------------------------------------------------------
// React Query Key Factories
// -------------------------------------------------------------------------
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (id: string) => [...projectKeys.detail(id), 'stats'] as const,
  dashboard: () => [...projectKeys.all, 'dashboard'] as const,
  recent: () => [...projectKeys.all, 'recent'] as const,
};

// -------------------------------------------------------------------------
// Project Service API
// -------------------------------------------------------------------------
export const ProjectService = {

  createProject: async (data: ProjectCreateRequest): Promise<ApiResponse<ProjectResponse>> => {
    return api.post<ProjectResponse>('/projects/', data);
  },

  getProjectById: async (id: string): Promise<ApiResponse<ProjectDetailResponse>> => {
    return api.get<ProjectDetailResponse>(`/projects/${id}`);
  },

  listProjects: async (page = 1, size = 20, filters?: { status?: ProjectStatus; favorite?: boolean; tag?: string }): Promise<PaginatedResponse<ProjectResponse>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.favorite !== undefined) params.append('favorite', String(filters.favorite));
    if (filters?.tag) params.append('tag', filters.tag);
    
    return api.get<ProjectResponse[]>(`/projects/?${params.toString()}`) as Promise<PaginatedResponse<ProjectResponse>>;
  },

  searchProjects: async (query: string, page = 1, size = 20): Promise<PaginatedResponse<ProjectResponse>> => {
    return api.get<ProjectResponse[]>(`/projects/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`) as Promise<PaginatedResponse<ProjectResponse>>;
  },

  updateProject: async (id: string, data: ProjectUpdateRequest): Promise<ApiResponse<ProjectResponse>> => {
    return api.put<ProjectResponse>(`/projects/${id}`, data);
  },

  updateProjectSettings: async (id: string, settings: Partial<ProjectSettings>): Promise<ApiResponse<ProjectResponse>> => {
    return api.put<ProjectResponse>(`/projects/${id}/settings`, settings);
  },

  updateCoverImage: async (id: string, imageFile: File): Promise<ApiResponse<ProjectResponse>> => {
    return api.upload<ProjectResponse>(`/projects/${id}/cover`, imageFile);
  },

  deleteProject: async (id: string): Promise<ApiResponse<null>> => {
    return api.delete<null>(`/projects/${id}`);
  },

  archiveProject: async (id: string): Promise<ApiResponse<ProjectResponse>> => {
    return api.post<ProjectResponse>(`/projects/${id}/archive`);
  },

  restoreProject: async (id: string): Promise<ApiResponse<ProjectResponse>> => {
    return api.post<ProjectResponse>(`/projects/${id}/restore`);
  },

  getProjectStatistics: async (id: string): Promise<ApiResponse<ProjectStatisticsResponse>> => {
    return api.get<ProjectStatisticsResponse>(`/projects/${id}/statistics`);
  },

  getDashboardSummary: async (): Promise<ApiResponse<DashboardSummaryResponse>> => {
    return api.get<DashboardSummaryResponse>('/projects/dashboard/summary');
  },

  getRecentProjects: async (limit = 5): Promise<ApiResponse<ProjectResponse[]>> => {
    return api.get<ProjectResponse[]>(`/projects/recent?limit=${limit}`);
  }
};
