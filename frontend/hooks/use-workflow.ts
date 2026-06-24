import { useQuery } from '@tanstack/react-query';
import { WorkflowService, workflowKeys } from '../lib/api/workflows';

// -------------------------------------------------------------------------
// Hooks
// -------------------------------------------------------------------------

export const useWorkflows = (filters?: { search?: string, category?: string }) => {
  return useQuery({
    queryKey: filters ? workflowKeys.list(JSON.stringify(filters)) : workflowKeys.lists(),
    queryFn: () => WorkflowService.getWorkflows(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useWorkflowDetails = (id: string | null) => {
  return useQuery({
    queryKey: id ? workflowKeys.detail(id) : [],
    queryFn: () => id ? WorkflowService.getWorkflowDetails(id) : Promise.reject('No ID'),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useWorkflowSchema = (id: string | null) => {
  return useQuery({
    queryKey: id ? workflowKeys.schema(id) : [],
    queryFn: () => id ? WorkflowService.getWorkflowSchema(id) : Promise.reject('No ID'),
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // Schemas rarely change, cache for an hour
  });
};
