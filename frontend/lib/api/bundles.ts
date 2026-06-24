import { api, ApiResponse } from './client';
import { AIAsset } from './assets';

export interface BundleDependency {
  asset_type: string;
  name: string;
  is_optional: boolean;
}

export interface BundleManifest {
  name: string;
  version: string;
  author: string;
  description: string;
  tags: string[];
  required_assets: BundleDependency[];
}

export interface Bundle {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  tags: string[];
  required_assets: BundleDependency[];
  installed_workflow_id: string | null;
  is_installed: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BundleCompatibilityReport {
  is_compatible: boolean;
  missing_required: BundleDependency[];
  missing_recommended: BundleDependency[];
  found_assets: AIAsset[];
}

export interface BundleImportResponse {
  status: string;
  bundle_id: string;
}

export interface BundleExportResponse {
  status: string;
  file_path: string;
}

export const BundleService = {
  getBundles: async (): Promise<ApiResponse<Bundle[]>> => {
    // Note: Assuming backend returns List[Bundle] without wrapping based on our router implementation
    return api.get<Bundle[]>('/bundles/');
  },

  getBundle: async (id: string): Promise<ApiResponse<Bundle>> => {
    return api.get<Bundle>(`/bundles/${id}`);
  },

  importBundle: async (file: File): Promise<ApiResponse<BundleImportResponse>> => {
    return api.upload<BundleImportResponse>('/bundles/import', file, {});
  },

  exportBundle: async (workflowId: string): Promise<ApiResponse<BundleExportResponse>> => {
    return api.post<BundleExportResponse>(`/bundles/${workflowId}/export`, {});
  },

  installBundle: async (id: string): Promise<ApiResponse<{ workflow_id: string }>> => {
    return api.post<{ workflow_id: string }>(`/bundles/${id}/install`, {});
  },
  
  deleteBundle: async (id: string): Promise<ApiResponse<null>> => {
    return api.delete<null>(`/bundles/${id}`);
  }
};

// -------------------------------------------------------------------------
// Compatibility Engine Utilities
// -------------------------------------------------------------------------
export const checkBundleCompatibility = (bundle: Bundle, availableAssets: AIAsset[]): BundleCompatibilityReport => {
  const missing_required: BundleDependency[] = [];
  const missing_recommended: BundleDependency[] = [];
  const found_assets: AIAsset[] = [];

  const availableAssetNames = new Set(availableAssets.map(a => a.filename));

  bundle.required_assets.forEach(dep => {
    // Very simple matcher: checks if the exact filename exists in the registry
    if (availableAssetNames.has(dep.name)) {
      const asset = availableAssets.find(a => a.filename === dep.name);
      if (asset) found_assets.push(asset);
    } else {
      if (dep.is_optional) {
        missing_recommended.push(dep);
      } else {
        missing_required.push(dep);
      }
    }
  });

  return {
    is_compatible: missing_required.length === 0,
    missing_required,
    missing_recommended,
    found_assets
  };
};
