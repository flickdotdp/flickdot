"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider, DefaultOptions } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; // Uncomment for dev tools

// -------------------------------------------------------------------------
// Global Query Configuration
// -------------------------------------------------------------------------
const queryConfig: DefaultOptions = {
  queries: {
    // Determine how long data is considered "fresh" before triggering a background refetch
    staleTime: 1000 * 60 * 1, // 1 minute default
    
    // Determine how long inactive data is kept in memory before garbage collection
    gcTime: 1000 * 60 * 15, // 15 minutes default
    
    // Automatic Background Refetching Rules
    refetchOnWindowFocus: true, // Crucial for when users switch between ComfyUI tab and our UI
    refetchOnReconnect: true,
    refetchOnMount: true,
    
    // Intelligent Retry Strategy
    retry: (failureCount, error: any) => {
      // Don't retry client errors (4xx) except 408 Timeout or 429 Too Many Requests
      const status = error?.status || error?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
      // Maximum 3 retries for server/network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff up to 30s
  },
  mutations: {
    retry: 1, // Only retry mutations once by default (prevents accidental double-generation)
  }
};

// -------------------------------------------------------------------------
// Cache Invalidation Helpers
// -------------------------------------------------------------------------
/**
 * Since the QueryClient is instantiated inside the React component tree for SSR safety,
 * we export a generic type so other components (like WebSockets) can invalidate caches.
 */
export const invalidateQueries = (queryClient: QueryClient, queryKey: readonly any[]) => {
  return queryClient.invalidateQueries({ queryKey });
};

// -------------------------------------------------------------------------
// Provider Component
// -------------------------------------------------------------------------
interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // -------------------------------------------------------------------------
  // Instance Initialization
  // -------------------------------------------------------------------------
  // Instantiate QueryClient in state to ensure it survives React component lifecycles 
  // but doesn't leak across SSR requests (critical for Next.js App Router).
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: queryConfig }));

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* 
        [EXTENSION POINT]: React Query DevTools
        <ReactQueryDevtools initialIsOpen={false} position="bottom" /> 
      */}
      
      {/* 
        [EXTENSION POINT]: Future Offline Support Hydration 
        If implementing offline-first architecture, PersistQueryClientProvider 
        from @tanstack/react-query-persist-client would wrap this.
      */}
    </QueryClientProvider>
  );
}
