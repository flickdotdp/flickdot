import { FILE_CONSTANTS, ASPECT_RATIOS, GENERATION_LIMITS } from './constants';

// -------------------------------------------------------------------------
// Image Validation & Upload Prep
// -------------------------------------------------------------------------

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file against size and mime-type constraints.
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (file.size > FILE_CONSTANTS.MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum upload size of ${FILE_CONSTANTS.MAX_UPLOAD_SIZE_MB}MB.`
    };
  }

  if (!FILE_CONSTANTS.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported file type. Please upload a JPEG, PNG, or WebP image."
    };
  }

  return { valid: true };
};

// -------------------------------------------------------------------------
// Memory & ObjectURL Management
// -------------------------------------------------------------------------

/**
 * Creates a safe browser object URL for previewing local uploads.
 * CRITICAL: Must be paired with revokePreviewUrl to prevent memory leaks.
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Cleans up a previously generated ObjectURL from browser memory.
 */
export const revokePreviewUrl = (url: string | null | undefined): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// -------------------------------------------------------------------------
// Dimensions & Aspect Ratios
// -------------------------------------------------------------------------

/**
 * Asynchronously extracts the true pixel dimensions of an uploaded file.
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const url = createPreviewUrl(file);
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      revokePreviewUrl(url); // Cleanup immediately after measuring
    };
    
    img.onerror = () => {
      revokePreviewUrl(url);
      reject(new Error("Failed to load image dimensions"));
    };
    
    img.src = url;
  });
};

/**
 * Given a width and height, calculates the nearest preset aspect ratio string.
 */
export const getClosestAspectRatio = (width: number, height: number): string => {
  const actualRatio = width / height;
  let closestPreset = "1:1";
  let minDiff = Infinity;

  Object.entries(ASPECT_RATIOS).forEach(([ratioKey, dimensions]) => {
    const presetRatio = dimensions.width / dimensions.height;
    const diff = Math.abs(presetRatio - actualRatio);
    if (diff < minDiff) {
      minDiff = diff;
      closestPreset = ratioKey;
    }
  });

  return closestPreset;
};

/**
 * Normalizes user-input resolutions to fit within hard API limits.
 */
export const clampResolution = (value: number): number => {
  return Math.max(
    GENERATION_LIMITS.MIN_RESOLUTION, 
    Math.min(GENERATION_LIMITS.MAX_RESOLUTION, value)
  );
};

// -------------------------------------------------------------------------
// Browser Download Helpers
// -------------------------------------------------------------------------

/**
 * Programmatically triggers a file download in the user's browser.
 */
export const downloadImage = async (url: string, defaultFilename: string = 'generation.png') => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image for download");
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = generateDownloadFilename(defaultFilename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};

/**
 * Creates a unique filename for downloaded generations to prevent overwrite.
 */
export const generateDownloadFilename = (baseName: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `ai-${timestamp}-${baseName}`;
};

// -------------------------------------------------------------------------
// UI Canvas Calculation Helpers
// -------------------------------------------------------------------------

/**
 * Calculates responsive sizing for the ImageWorkspace canvas based on actual viewport space.
 */
export const calculateFitDimensions = (
  imgWidth: number, 
  imgHeight: number, 
  containerWidth: number, 
  containerHeight: number
) => {
  const widthRatio = containerWidth / imgWidth;
  const heightRatio = containerHeight / imgHeight;
  const bestRatio = Math.min(widthRatio, heightRatio, 1); // Don't scale up past 100%

  return {
    width: imgWidth * bestRatio,
    height: imgHeight * bestRatio,
    scale: bestRatio
  };
};
