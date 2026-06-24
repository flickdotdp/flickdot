import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// -------------------------------------------------------------------------
// Tailwind / UI Utilities
// -------------------------------------------------------------------------

/**
 * Merges Tailwind classes intelligently without conflicts.
 * Essential for reusable UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -------------------------------------------------------------------------
// Date & Time Formatting
// -------------------------------------------------------------------------

/**
 * Formats an ISO string into a human-readable local date and time.
 * e.g. "Oct 24, 2023, 2:30 PM"
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats an execution time (in seconds or ms) into a clean string.
 * e.g. "4.2s" or "1m 12s"
 */
export function formatExecutionTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "--";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

// -------------------------------------------------------------------------
// Formatting & Text Utilities
// -------------------------------------------------------------------------

/**
 * Formats file sizes from bytes to readable strings.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Truncates a long AI prompt for display in gallery cards.
 */
export function truncatePrompt(prompt: string | null | undefined, maxLength = 100): string {
  if (!prompt) return "";
  if (prompt.length <= maxLength) return prompt;
  return prompt.substring(0, maxLength).trimEnd() + "...";
}

/**
 * Converts a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -
}

/**
 * Highlights a search term within a larger string (returns HTML/React chunks).
 * Note: Implement with regex splitting when rendering in React.
 */
export function getHighlightedTextTokens(text: string, highlight: string): { text: string; isHighlight: boolean }[] {
  if (!highlight.trim()) return [{ text, isHighlight: false }];
  
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map(part => ({
    text: part,
    isHighlight: part.toLowerCase() === highlight.toLowerCase()
  }));
}

// -------------------------------------------------------------------------
// Image Generation Utilities
// -------------------------------------------------------------------------

/**
 * Generates a random 64-bit integer suitable for ComfyUI / Stable Diffusion seeds.
 * Returns a number up to MAX_SAFE_INTEGER (~9e15), which SD models handle perfectly.
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

/**
 * Formats workflow machine-names to human readable tags.
 * e.g. "sdxl_base_workflow" -> "SDXL Base"
 */
export function formatWorkflowName(name: string | null | undefined): string {
  if (!name) return "Unknown Workflow";
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace('Sdxl', 'SDXL')
    .replace('Sd', 'SD');
}

// -------------------------------------------------------------------------
// Performance / Logic Utilities
// -------------------------------------------------------------------------

/**
 * Sleeps for a given duration (useful for simulated delays or retry backoffs).
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Basic debounce implementation for rapid UI inputs (like search bars).
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Safely parses JSON without throwing fatal errors.
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return fallback;
  }
}
