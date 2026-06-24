import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// -------------------------------------------------------------------------
// Global Constants & Configurations
// -------------------------------------------------------------------------
// We use relative URLs so requests go through the Next.js dev server proxy
// defined in next.config.mjs → rewrites → /api/* → http://127.0.0.1:8000/api/*
// This eliminates all browser CORS issues since requests go server-to-server.
const BASE_URL = '';
const API_PREFIX = '/api/v1';

// -------------------------------------------------------------------------
// Standard Backend Response Interfaces (matching common.py)
// -------------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  status: number;
}

// -------------------------------------------------------------------------
// Axios Client Initialization
// -------------------------------------------------------------------------
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 30000, // 30s timeout for standard requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure cookies are sent if we implement auth later
  withCredentials: true,
});

// -------------------------------------------------------------------------
// Request Interceptors
// -------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    // 1. Inject Correlation IDs for tracing requests through the backend
    config.headers['X-Correlation-ID'] = crypto.randomUUID();
    
    // 2. [EXTENSION POINT] Future Auth Tokens
    // const token = useAuthStore.getState().token;
    // if (token) { config.headers['Authorization'] = `Bearer ${token}`; }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// -------------------------------------------------------------------------
// Response Interceptors
// -------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Directly return the data payload if it matches our ApiResponse schema
    return response;
  },
  (error: AxiosError) => {
    // Structured Error Mapping
    let mappedError: ApiError = {
      message: 'An unexpected network error occurred.',
      status: error.response?.status || 500,
    };

    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const serverData = error.response.data as any;
      let errMsg = serverData?.message || serverData?.detail || mappedError.message;
      
      // If the detail is an array of FastAPI validation objects, format them into a string
      if (Array.isArray(errMsg) && errMsg.length > 0 && errMsg[0].msg) {
        errMsg = errMsg.map((err: any) => `${err.loc?.join('.')} ${err.msg}`).join(', ');
      } else if (typeof errMsg === 'object') {
        errMsg = JSON.stringify(errMsg);
      }
      
      mappedError.message = errMsg;
      mappedError.details = serverData?.error || serverData?.errors;
    } else if (error.request) {
      // The request was made but no response was received
      mappedError.message = 'No response received from the server. Is the backend running?';
    } else {
      // Something happened in setting up the request
      mappedError.message = error.message;
    }

    // 1. [EXTENSION POINT] Handle 401 Unauthorized globally
    if (mappedError.status === 401) {
      // e.g., trigger logout or token refresh
    }

    // Comprehensive logging hook for dev
    console.error(`[API Error ${mappedError.status}] ${configToUrl(error.config)}:`, mappedError.message);

    return Promise.reject(mappedError);
  }
);

// -------------------------------------------------------------------------
// Utility Helpers
// -------------------------------------------------------------------------
const configToUrl = (config?: AxiosRequestConfig) => {
  if (!config) return 'Unknown URL';
  return `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`;
};

/**
 * Transforms an absolute or relative backend image path into a fully qualified frontend URL.
 * Routes through the Next.js proxy to bypass CORS.
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already fully qualified
  // We strip the trailing slash from BASE_URL to prevent double slashes
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${safePath}`;
};

// -------------------------------------------------------------------------
// Core API Wrappers
// -------------------------------------------------------------------------
export const api = {
  /** Generic GET request wrapper */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  /** Generic POST request wrapper */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /** Generic PUT request wrapper */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /** Generic DELETE request wrapper */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  },

  /** 
   * Specialized upload handler with robust FormData generation and progress tracking.
   * Useful for sending Source Images for Image-to-Image / Inpainting workflows.
   */
  async upload<T>(
    url: string, 
    file: File, 
    additionalData?: Record<string, any>,
    onProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        // Serialize nested objects to JSON strings so FastAPI can parse them
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
      // Uploads can take longer depending on file size
      timeout: 120000, 
    });

    return response.data;
  }
};
