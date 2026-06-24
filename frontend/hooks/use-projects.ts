import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ProjectService, 
  projectKeys, 
  ProjectCreateRequest, 
  ProjectUpdateRequest,
  ProjectSettings
} from '../lib/api/projects';
import { useProjectStore } from '../stores/project-store';
import toast from 'react-hot-toast';

// -------------------------------------------------------------------------
// Queries
// -------------------------------------------------------------------------

export const useProjectList = (page = 1, size = 20) => {
  // Syncs with Zustand filter state
  const filters = useProjectStore((state) => state.projectFilters);
  
  return useQuery({
    queryKey: [...projectKeys.lists(), page, size, filters],
    queryFn: () => ProjectService.listProjects(page, size, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProjectDetails = (id: string | null) => {
  return useQuery({
    queryKey: id ? projectKeys.detail(id) : [],
    queryFn: () => id ? ProjectService.getProjectById(id) : Promise.reject('No ID'),
    enabled: !!id,
  });
};

export const useRecentProjects = (limit = 5) => {
  return useQuery({
    queryKey: [...projectKeys.recent(), limit],
    queryFn: () => ProjectService.getRecentProjects(limit),
  });
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: projectKeys.dashboard(),
    queryFn: () => ProjectService.getDashboardSummary(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// -------------------------------------------------------------------------
// Mutations
// -------------------------------------------------------------------------

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const selectProject = useProjectStore((state) => state.selectProject);

  return useMutation({
    mutationFn: (data: ProjectCreateRequest) => ProjectService.createProject(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        queryClient.invalidateQueries({ queryKey: projectKeys.dashboard() });
        
        // Auto-select the newly created project
        selectProject(response.data.id, response.data.name);
        toast.success("Project created successfully");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project");
    }
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: ProjectUpdateRequest }) => ProjectService.updateProject(id, data),
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        // Invalidate specific project and lists
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        toast.success("Project updated");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update project");
    }
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { selectedProjectId, clearSelectedProject } = useProjectStore.getState();

  return useMutation({
    mutationFn: (id: string) => ProjectService.deleteProject(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.dashboard() });
      
      // If the user deleted the project they are currently viewing, clear it
      if (selectedProjectId === deletedId) {
        clearSelectedProject();
      }
      toast.success("Project deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete project");
    }
  });
};

export const useUpdateProjectSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, settings }: { id: string, settings: Partial<ProjectSettings> }) => 
      ProjectService.updateProjectSettings(id, settings),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      toast.success("Settings updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    }
  });
};
