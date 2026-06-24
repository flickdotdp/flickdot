import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ProjectResponse, ProjectStatus } from '../lib/api/projects';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
interface ProjectFilters {
  status?: ProjectStatus;
  tag?: string;
  searchQuery: string;
  favorite?: boolean;
}

interface ProjectState {
  // -------------------------------------------------------------------------
  // Active Context
  // -------------------------------------------------------------------------
  /**
   * We only store the ID and minimal contextual data in Zustand.
   * The heavy lifting of caching the full project object, generation lists, 
   * and statistics is delegated to React Query.
   */
  selectedProjectId: string | null;
  selectedProjectName: string | null;

  // -------------------------------------------------------------------------
  // UI Filtering State
  // -------------------------------------------------------------------------
  projectFilters: ProjectFilters;
}

interface ProjectActions {
  // -------------------------------------------------------------------------
  // Context Setters
  // -------------------------------------------------------------------------
  selectProject: (id: string, name?: string) => void;
  clearSelectedProject: () => void;

  // -------------------------------------------------------------------------
  // Filter Management
  // -------------------------------------------------------------------------
  updateProjectFilters: (filters: Partial<ProjectFilters>) => void;
  resetProjectFilters: () => void;
}

export type ProjectStore = ProjectState & ProjectActions;

// -------------------------------------------------------------------------
// Default Initial State
// -------------------------------------------------------------------------
const defaultFilters: ProjectFilters = {
  searchQuery: '',
  status: 'active'
};

const initialState: ProjectState = {
  selectedProjectId: null,
  selectedProjectName: null,
  projectFilters: { ...defaultFilters }
};

// -------------------------------------------------------------------------
// Zustand Store Implementation
// -------------------------------------------------------------------------
export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // -------------------------------------------------------------------------
        // Actions
        // -------------------------------------------------------------------------
        selectProject: (id, name) => set({ 
          selectedProjectId: id,
          selectedProjectName: name || null
        }, false, 'selectProject'),

        clearSelectedProject: () => set({ 
          selectedProjectId: null,
          selectedProjectName: null
        }, false, 'clearSelectedProject'),

        updateProjectFilters: (filters) => set((state) => ({
          projectFilters: { ...state.projectFilters, ...filters }
        }), false, 'updateProjectFilters'),

        resetProjectFilters: () => set({ 
          projectFilters: { ...defaultFilters } 
        }, false, 'resetProjectFilters'),

      }),
      {
        // -------------------------------------------------------------------------
        // Persistence Configuration
        // -------------------------------------------------------------------------
        name: 'project-store',
        // Only persist the selected project so the user resumes where they left off
        partialize: (state) => ({ 
          selectedProjectId: state.selectedProjectId,
          selectedProjectName: state.selectedProjectName
        })
      }
    ),
    { name: 'ProjectStore' }
  )
);
