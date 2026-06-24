import { api, ApiResponse } from './client';

export type AssetType = 'checkpoint' | 'lora' | 'vae' | 'embedding' | 'upscaler' | 'video_model';

export interface AIAsset {
  id: string;
  name: string;
  filename: string;
  asset_type: AssetType;
  file_size_bytes: number;
  compatibility_tags: string[];
  thumbnail_url: string | null;
  description: string | null;
  is_favorite: boolean;
}

export interface AssetRefreshResponse {
  status: string;
  data: {
    added: number;
    updated: number;
    removed: number;
    error?: string;
  };
}

export const AssetService = {
  getModels: async (): Promise<ApiResponse<AIAsset[]>> => {
    // Standard response format: backend router currently returns List directly,
    // so we wrap it or handle it based on api client. Assuming api.get handles wrapping.
    // Wait, backend/routers/assets.py returns `List[AIAssetResponse]` directly, NOT wrapped in `{"data": [...]}`.
    // If api client expects wrapped, we might need a custom call or we assume `api.get` handles unwrapped by returning it.
    // Assuming we use standard `api.get` which returns the JSON payload.
    return api.get<AIAsset[]>('/assets/models');
  },

  getLoras: async (): Promise<ApiResponse<AIAsset[]>> => {
    return api.get<AIAsset[]>('/assets/loras');
  },

  refreshAssets: async (): Promise<ApiResponse<AssetRefreshResponse>> => {
    return api.post<AssetRefreshResponse>('/assets/refresh', {});
  }
};
