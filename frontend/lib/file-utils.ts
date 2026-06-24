// -------------------------------------------------------------------------
// File Validation & Security
// -------------------------------------------------------------------------

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Removes dangerous characters from a string to ensure safe file storage.
 * Prevents directory traversal attacks via filename injection.
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace invalid chars with underscore
    .replace(/\.{2,}/g, '.')           // Prevent multiple dots
    .replace(/^\.+/, '')               // Prevent starting with a dot
    .trim();
};

/**
 * Validates generic files against maximum size constraints.
 */
export const validateFileSize = (file: File, maxSizeMb: number): FileValidationResult => {
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum size of ${maxSizeMb}MB.`
    };
  }
  return { valid: true };
};

// -------------------------------------------------------------------------
// JSON / Workflow Management (ComfyUI)
// -------------------------------------------------------------------------

/**
 * Reads a File object as text. Useful for importing JSON workflows.
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

/**
 * Safely parses an uploaded JSON workflow file.
 * Returns the parsed object if valid, throws a detailed error if not.
 */
export const parseWorkflowFile = async (file: File): Promise<any> => {
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    throw new Error("Invalid file type. Please upload a JSON workflow file.");
  }
  
  const text = await readFileAsText(file);
  try {
    const data = JSON.parse(text);
    // Basic validation to check if it looks like a ComfyUI workflow
    if (!data || typeof data !== 'object') {
      throw new Error("File does not contain a valid JSON object.");
    }
    return data;
  } catch (error) {
    throw new Error("Failed to parse JSON file. The file may be corrupted.");
  }
};

/**
 * Triggers a browser download of a JSON object (Useful for exporting workflows or settings).
 */
export const downloadJsonObject = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeFilename(filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Cleanup to prevent memory leaks
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// -------------------------------------------------------------------------
// Batch Upload & Progress Helpers
// -------------------------------------------------------------------------

/**
 * Calculates overall progress percentage for a batch of files.
 */
export const calculateBatchProgress = (
  totalBytes: number,
  loadedBytes: number
): number => {
  if (totalBytes === 0) return 0;
  const progress = Math.round((loadedBytes * 100) / totalBytes);
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
};

// -------------------------------------------------------------------------
// Checksum / Duplicate Detection Placeholder
// -------------------------------------------------------------------------

/**
 * Generates a fast SHA-256 hash of a file for duplicate detection.
 * Requires SubtleCrypto API (available in modern browsers).
 */
export const generateFileChecksum = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
