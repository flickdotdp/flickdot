import { z } from 'zod';
import { FILE_CONSTANTS, QUERY_CONSTANTS } from './constants';

// -------------------------------------------------------------------------
// Zod Environment Schema
// -------------------------------------------------------------------------
const envSchema = z.object({
  // Required Application Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API & WebSocket URLs
  NEXT_PUBLIC_API_URL: z.string().url().default('http://127.0.0.1:8000'),
  NEXT_PUBLIC_WS_URL: z.string().url().default('ws://127.0.0.1:8000/api/v1/ws'),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_CLOUD_SYNC: z.coerce.boolean().default(false),
  NEXT_PUBLIC_ENABLE_TEAMS: z.coerce.boolean().default(false),
  NEXT_PUBLIC_ENABLE_WORKFLOW_BUILDER: z.coerce.boolean().default(false),
  
  // Advanced Settings (Optional overrides)
  NEXT_PUBLIC_MAX_UPLOAD_MB: z.coerce.number().optional().default(20),
});

// -------------------------------------------------------------------------
// Runtime Validation
// -------------------------------------------------------------------------
const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_ENABLE_CLOUD_SYNC: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC,
  NEXT_PUBLIC_ENABLE_TEAMS: process.env.NEXT_PUBLIC_ENABLE_TEAMS,
  NEXT_PUBLIC_ENABLE_WORKFLOW_BUILDER: process.env.NEXT_PUBLIC_ENABLE_WORKFLOW_BUILDER,
  NEXT_PUBLIC_MAX_UPLOAD_MB: process.env.NEXT_PUBLIC_MAX_UPLOAD_MB,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables. Check console for details.");
}

const env = _env.data;

// -------------------------------------------------------------------------
// Centralized Configuration Object
// -------------------------------------------------------------------------
export const config = {
  env: env.NODE_ENV,
  
  // Endpoints
  api: {
    baseUrl: env.NEXT_PUBLIC_API_URL,
    wsUrl: env.NEXT_PUBLIC_WS_URL,
  },
  
  // Limits
  uploads: {
    maxSizeMb: env.NEXT_PUBLIC_MAX_UPLOAD_MB || FILE_CONSTANTS.MAX_UPLOAD_SIZE_MB,
    maxSizeBytes: (env.NEXT_PUBLIC_MAX_UPLOAD_MB || FILE_CONSTANTS.MAX_UPLOAD_SIZE_MB) * 1024 * 1024,
    supportedTypes: FILE_CONSTANTS.SUPPORTED_IMAGE_TYPES,
  },
  
  // System Defaults
  monitoring: {
    healthPollInterval: QUERY_CONSTANTS.POLLING_INTERVAL_HEALTH,
  },
  
  // Feature Flags
  features: {
    cloudSync: env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC,
    teams: env.NEXT_PUBLIC_ENABLE_TEAMS,
    workflowBuilder: env.NEXT_PUBLIC_ENABLE_WORKFLOW_BUILDER,
  }
} as const;

// -------------------------------------------------------------------------
// Exported Utility Helpers
// -------------------------------------------------------------------------

export const isDevelopment = () => config.env === 'development';
export const isProduction = () => config.env === 'production';
export const isLocalMode = () => !config.features.cloudSync; // Defines pure local ComfyUI runtime
export const isCloudMode = () => config.features.cloudSync;

export const getApiUrl = () => config.api.baseUrl;
export const getWebSocketUrl = () => config.api.wsUrl;
export const getUploadLimits = () => config.uploads;
export const getMonitoringSettings = () => config.monitoring;

export const isFeatureEnabled = (feature: keyof typeof config.features) => config.features[feature];

/**
 * Console log helper for startup validation routines.
 */
export const getEnvironmentSummary = () => {
  return {
    Mode: config.env,
    API: config.api.baseUrl,
    WebSocket: config.api.wsUrl,
    UploadLimit: `${config.uploads.maxSizeMb}MB`,
    Features: Object.entries(config.features)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
      .join(', ') || 'None'
  };
};
