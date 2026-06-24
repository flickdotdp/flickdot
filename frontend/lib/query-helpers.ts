import { QueryClient } from '@tanstack/react-query';

// -------------------------------------------------------------------------
// Global Cache Invalidation
// -------------------------------------------------------------------------

/**
 * Standardized helper to invalidate multiple query keys safely.
 * Useful when a major event happens (like deleting a project) and 
 * you need to flush the lists, dashboards, and details instantly.
 */
export const invalidateMultipleQueries = async (
  queryClient: QueryClient,
  keys: readonly any[][]
): Promise<void> => {
  const promises = keys.map(key => queryClient.invalidateQueries({ queryKey: key }));
  await Promise.allSettled(promises);
};

// -------------------------------------------------------------------------
// Optimistic Update Utilities
// -------------------------------------------------------------------------

export interface OptimisticUpdateContext<T> {
  previousData: T | undefined;
  queryKey: readonly any[];
}

/**
 * Generates the boilerplate required for a standard React Query optimistic update.
 * Usage inside useMutation:
 * onMutate: async (newItem) => handleOptimisticUpdate(queryClient, queryKey, (oldList) => [...oldList, newItem])
 */
export const handleOptimisticUpdate = async <T, V>(
  queryClient: QueryClient,
  queryKey: readonly any[],
  updateFn: (oldData: T | undefined, variables: V) => T,
  variables: V
): Promise<OptimisticUpdateContext<T>> => {
  
  // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
  await queryClient.cancelQueries({ queryKey });

  // 2. Snapshot the previous value
  const previousData = queryClient.getQueryData<T>(queryKey);

  // 3. Optimistically update to the new value
  queryClient.setQueryData<T>(queryKey, (old) => updateFn(old, variables));

  // 4. Return the context object with the snapshotted value
  return { previousData, queryKey };
};

/**
 * Standardized rollback mechanism for when an optimistic update fails.
 * Usage inside useMutation: onError: (err, variables, context) => rollbackOptimisticUpdate(queryClient, context)
 */
export const rollbackOptimisticUpdate = <T>(
  queryClient: QueryClient,
  context: OptimisticUpdateContext<T> | undefined
): void => {
  if (context) {
    queryClient.setQueryData(context.queryKey, context.previousData);
  }
};

// -------------------------------------------------------------------------
// Pagination & Infinite Scroll Helpers
// -------------------------------------------------------------------------

/**
 * Standardized getNextPageParam function for backend PaginatedResponse APIs.
 */
export const getNextPageParamFromResponse = (lastPage: any) => {
  if (lastPage && lastPage.has_next && lastPage.page) {
    return lastPage.page + 1;
  }
  return undefined;
};

// -------------------------------------------------------------------------
// Hydration & SSR Helpers
// -------------------------------------------------------------------------

/**
 * Helper to safely extract query data bypassing the hook cycle if absolutely necessary.
 * Mostly used in strict non-React contexts or advanced caching patterns.
 */
export const getSafeQueryData = <T>(queryClient: QueryClient, queryKey: readonly any[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};
