// ============================================================================
// Core Utility Types
// ============================================================================
export type Nullable<T> = T | null;
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
export type Dictionary<T> = Record<string, T>;
export type EntityId = string;

export interface AsyncResult<T> {
  data?: T;
  error?: string;
  isLoading: boolean;
}

// ============================================================================
// Re-Exports: API & Backend Schemas
// ============================================================================
// The API layer acts as the absolute source of truth for backend contracts.
// We export them here so the rest of the application can import solely from "@/types"

export type {
  ApiResponse,
  PaginatedResponse,
  ApiError
} from '../lib/api/client';

export type {
  GenerationType,
  GenerationStatus,
  GenerationCreateRequest,
  GenerationResponse,
  GenerationStatisticsResponse
} from '../lib/api/generations';

export type {
  ProjectStatus,
  ProjectSettings,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectResponse,
  ProjectStatisticsResponse,
  ProjectDetailResponse,
  DashboardSummaryResponse
} from '../lib/api/projects';

// ============================================================================
// Re-Exports: State Management & UI Contexts
// ============================================================================

export type {
  WorkspaceMode,
  GenerationStore
} from '../stores/generation-store';

export type {
  ProjectStore
} from '../stores/project-store';

// ============================================================================
// Re-Exports: WebSocket & Real-Time Engine
// ============================================================================

export {
  WsEventType,
} from '../lib/websocket/websocket-client';

export type {
  WsMessage,
  WsConnectionState,
  WsMessageHandler
} from '../lib/websocket/websocket-client';

// ============================================================================
// Re-Exports: Infrastructure & Monitoring
// ============================================================================

export type {
  SystemHealthResponse
} from '../hooks/use-system-health';

// ============================================================================
// UI & Component Types (Strict Contracts)
// ============================================================================

export type ThemeMode = 'dark' | 'light' | 'system';
export type GalleryViewMode = 'grid' | 'list';
export type SortDirection = 'asc' | 'desc';
export type FilterOperator = 'eq' | 'contains' | 'in' | 'gt' | 'lt';
export type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

// ============================================================================
// Future Expansion: Models, Workflows & Assets
// ============================================================================

export interface ModelDefinition {
  id: string;
  name: string;
  filename: string;
  category: 'checkpoint' | 'lora' | 'controlnet' | 'vae';
  thumbnailUrl?: string;
  description?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'text-to-image' | 'image-to-image' | 'inpainting' | 'upscaling' | 'custom';
  nodes: Record<string, any>; // JSON definition of the ComfyUI workflow
  isCustom: boolean;
}

// ============================================================================
// Future Expansion: Collaboration & Ecosystem
// ============================================================================

export interface ActivityFeedItem {
  id: string;
  projectId: string;
  action: 'created' | 'updated' | 'deleted' | 'generated' | 'failed';
  timestamp: string;
  details?: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}
