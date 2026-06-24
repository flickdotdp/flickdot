import { apiClient, ApiResponse } from './client';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface WorkflowParameterSchema {
  key: string;
  type: 'text' | 'textarea' | 'slider' | 'number' | 'dropdown' | 'checkbox' | 'image' | 'multi_image' | 'seed';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  options?: any[];
  description?: string;
  required_tags?: string[];
}

export interface WorkflowSchemaResponse {
  workflow_id: string;
  name: string;
  version: number;
  parameters: WorkflowParameterSchema[];
}

export interface WorkflowListResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  thumbnail_url?: string;
  latest_version: number;
  is_featured?: boolean;
  
  // Execution Metadata
  complexity?: string;
  estimated_runtime?: number;
  supported_models?: string[];
  pricing?: string;
  
  // Analytics
  executions?: number;
  success_rate?: number;
  average_time?: number;
  rating?: number;
  bookmarks?: number;
}

export interface WorkflowDetailResponse extends WorkflowListResponse {
  author: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parameters: WorkflowParameterSchema[];
}

// -------------------------------------------------------------------------
// React Query Keys
// -------------------------------------------------------------------------

export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (filters: string) => [...workflowKeys.lists(), { filters }] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
  schemas: () => [...workflowKeys.all, 'schema'] as const,
  schema: (id: string) => [...workflowKeys.schemas(), id] as const,
};

// -------------------------------------------------------------------------
// Service Calls
// -------------------------------------------------------------------------

export const WorkflowService = {
  getWorkflows: async (filters?: { search?: string, category?: string }): Promise<ApiResponse<WorkflowListResponse[]>> => {
    let url = `/workflows`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (params.toString()) url += `?${params.toString()}`;
    }
    const { data } = await apiClient.get(url);
    return data;
  },

  getWorkflowDetails: async (id: string): Promise<ApiResponse<WorkflowDetailResponse>> => {
    const { data } = await apiClient.get(`/workflows/${id}`);
    return data;
  },

  getWorkflowSchema: async (id: string): Promise<ApiResponse<WorkflowSchemaResponse>> => {
    const { data } = await apiClient.get(`/workflows/${id}/schema`);
    return data;
  },
};
