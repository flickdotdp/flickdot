// -------------------------------------------------------------------------
// Generation UI & Parameter Limits
// -------------------------------------------------------------------------
export const GENERATION_DEFAULTS = {
  CFG_SCALE: 7.0,
  STEPS: 20,
  DENOISE: 0.75,
  BATCH_SIZE: 1,
  WIDTH: 1024,
  HEIGHT: 1024,
  PROMPT: "",
  NEGATIVE_PROMPT: "text, watermark, low quality, worst quality, deformed, blurry",
};

export const GENERATION_LIMITS = {
  MIN_STEPS: 1,
  MAX_STEPS: 100,
  MIN_CFG: 1.0,
  MAX_CFG: 30.0,
  MIN_DENOISE: 0.0,
  MAX_DENOISE: 1.0,
  MAX_BATCH_SIZE: 8,
  MIN_RESOLUTION: 256,
  MAX_RESOLUTION: 2048,
};

// -------------------------------------------------------------------------
// Aspect Ratios & Resolution Presets
// -------------------------------------------------------------------------
export interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
  icon?: string;
}

export const ASPECT_RATIOS: Record<string, ResolutionPreset> = {
  "1:1": { label: "Square (1:1)", width: 1024, height: 1024 },
  "16:9": { label: "Cinematic (16:9)", width: 1536, height: 864 },
  "9:16": { label: "Portrait (9:16)", width: 864, height: 1536 },
  "4:3": { label: "Standard (4:3)", width: 1152, height: 864 },
  "3:4": { label: "Photo (3:4)", width: 864, height: 1152 },
  "21:9": { label: "Ultrawide (21:9)", width: 1536, height: 640 },
};

// -------------------------------------------------------------------------
// Upload & File Handling
// -------------------------------------------------------------------------
export const FILE_CONSTANTS = {
  MAX_UPLOAD_SIZE_MB: 20,
  MAX_UPLOAD_SIZE_BYTES: 20 * 1024 * 1024,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

// -------------------------------------------------------------------------
// React Query & Network Configuration
// -------------------------------------------------------------------------
export const QUERY_CONSTANTS = {
  POLLING_INTERVAL_HEALTH: 10000,     // 10 seconds
  STALE_TIME_GALLERY: 60000,          // 1 minute
  STALE_TIME_PROJECTS: 300000,        // 5 minutes
  STALE_TIME_STATS: 300000,           // 5 minutes
  PAGINATION_DEFAULT_SIZE: 20,
  PAGINATION_GALLERY_SIZE: 50,
};

// -------------------------------------------------------------------------
// Application Routing
// -------------------------------------------------------------------------
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  GALLERY: "/gallery",
  QUEUE: "/queue",
  SETTINGS: "/settings",
};

// -------------------------------------------------------------------------
// Animation & UI Delays
// -------------------------------------------------------------------------
export const UI_CONSTANTS = {
  TOAST_DURATION: 4000,
  DEBOUNCE_SEARCH_MS: 300,
  DEBOUNCE_SLIDER_MS: 150,
  ANIMATION_DURATION_FAST: 0.2, // seconds
  ANIMATION_DURATION_BASE: 0.3, // seconds
  Z_INDEX: {
    MODAL: 50,
    DRAWER: 40,
    TOOLTIP: 60,
    TOAST: 100,
  }
};

// -------------------------------------------------------------------------
// Feature Flags (For future extensibility)
// -------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  ENABLE_CLOUD_SYNC: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === 'true',
  ENABLE_TEAMS: process.env.NEXT_PUBLIC_ENABLE_TEAMS === 'true',
  ENABLE_WORKFLOW_BUILDER: process.env.NEXT_PUBLIC_ENABLE_WORKFLOW_BUILDER === 'true',
};
