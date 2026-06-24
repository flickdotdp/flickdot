import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract YouTube ID from URL or return the string if it's already an ID
export const extractYouTubeId = (urlOrId: string) => {
  if (!urlOrId) return "";
  // Decode in case it's URL encoded
  const decoded = decodeURIComponent(urlOrId);
  // Match standard IDs
  if (/^[a-zA-Z0-9_-]{11}$/.test(decoded)) return decoded;
  
  const regExp = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?"\s>]+)/;
  const match = decoded.match(regExp);
  return (match && match[1].length === 11) ? match[1] : decoded;
};
