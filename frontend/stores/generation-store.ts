import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GenerationResponse, GenerationCreateRequest } from '../lib/api/generations';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export type WorkspaceMode = "empty" | "upload_preview" | "generating" | "completed" | "comparison" | "error";

interface GenerationState {
  // -------------------------------------------------------------------------
  // Workspace UI State
  // -------------------------------------------------------------------------
  workspaceMode: WorkspaceMode;
  
  // -------------------------------------------------------------------------
  // Active Generation Tracking
  // -------------------------------------------------------------------------
  activeGenerationId: string | null;
  comfyuiPromptId: string | null;
  isGenerating: boolean;
  progress: number;
  queuePosition: number | null;
  executionTime: number | null;
  errorMessage: string | null;

  // -------------------------------------------------------------------------
  // Media Canvas State
  // -------------------------------------------------------------------------
  sourceImageUrl: string | null;
  resultImageUrl: string | null;
  resultVideoUrl: string | null;
  isComparisonMode: boolean;

  // -------------------------------------------------------------------------
  // Gallery Selection State
  // -------------------------------------------------------------------------
  selectedGalleryItem: GenerationResponse | null;

  // -------------------------------------------------------------------------
  // Form/Parameter State (For UI restoration/reuse)
  // -------------------------------------------------------------------------
  lastSubmittedParams: Partial<GenerationCreateRequest> | null;

  // -------------------------------------------------------------------------
  // Filters & Sorting (For Gallery)
  // -------------------------------------------------------------------------
  galleryFilters: {
    type?: string;
    favorite?: boolean;
    searchQuery: string;
  };
}

interface GenerationActions {
  // Workspace Setters
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  toggleComparisonMode: () => void;
  
  // Media Management
  setSourceImage: (url: string | null) => void;
  setResultImage: (url: string | null) => void;
  setResultVideo: (url: string | null) => void;
  
  // Generation Lifecycle
  startGeneration: (params: Partial<GenerationCreateRequest>) => void;
  updateGenerationProgress: (progress: number, queuePosition?: number) => void;
  completeGeneration: (resultUrl: string, isVideo?: boolean, executionTime?: number) => void;
  failGeneration: (error: string) => void;
  cancelGeneration: () => void;
  
  // Active Tracking
  setActiveGenerationId: (id: string | null, comfyPromptId?: string | null) => void;
  
  // Gallery Interaction
  selectGalleryItem: (item: GenerationResponse | null) => void;
  updateGalleryFilters: (filters: Partial<GenerationState['galleryFilters']>) => void;
  
  // Reset/Cleanup
  clearWorkspace: () => void;
}

export type GenerationStore = GenerationState & GenerationActions;

// -------------------------------------------------------------------------
// Default Initial State
// -------------------------------------------------------------------------
const initialState: GenerationState = {
  workspaceMode: "empty",
  activeGenerationId: null,
  comfyuiPromptId: null,
  isGenerating: false,
  progress: 0,
  queuePosition: null,
  executionTime: null,
  errorMessage: null,
  sourceImageUrl: null,
  resultImageUrl: null,
  resultVideoUrl: null,
  isComparisonMode: false,
  selectedGalleryItem: null,
  lastSubmittedParams: null,
  galleryFilters: {
    searchQuery: "",
  }
};

// -------------------------------------------------------------------------
// Zustand Store Implementation
// -------------------------------------------------------------------------
export const useGenerationStore = create<GenerationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

      setWorkspaceMode: (mode) => set({ workspaceMode: mode }, false, 'setWorkspaceMode'),
      
      toggleComparisonMode: () => {
        const { isComparisonMode, sourceImageUrl, resultImageUrl } = get();
        // Only allow comparison if both images exist
        if (!isComparisonMode && (!sourceImageUrl || !resultImageUrl)) return;
        set({ 
          isComparisonMode: !isComparisonMode,
          workspaceMode: !isComparisonMode ? 'comparison' : 'completed'
        }, false, 'toggleComparisonMode');
      },

      setSourceImage: (url) => {
        set({ sourceImageUrl: url }, false, 'setSourceImage');
        const state = get();
        if (state.workspaceMode === 'empty' && url) {
          set({ workspaceMode: 'upload_preview' }, false, 'setWorkspaceMode/upload_preview');
        } else if (!url && state.workspaceMode === 'upload_preview') {
          set({ workspaceMode: 'empty' }, false, 'setWorkspaceMode/empty');
        }
      },

      setResultImage: (url) => set({ resultImageUrl: url, resultVideoUrl: null }, false, 'setResultImage'),
      setResultVideo: (url) => set({ resultVideoUrl: url, resultImageUrl: null }, false, 'setResultVideo'),

      // -------------------------------------------------------------------------
      // Lifecycle Actions
      // -------------------------------------------------------------------------
      startGeneration: (params) => set({
        isGenerating: true,
        workspaceMode: 'generating',
        progress: 0,
        queuePosition: null,
        errorMessage: null,
        executionTime: null,
        resultImageUrl: null,
        resultVideoUrl: null,
        isComparisonMode: false,
        lastSubmittedParams: params
      }, false, 'startGeneration'),

      updateGenerationProgress: (progress, queuePosition) => set((state) => ({
        progress,
        queuePosition: queuePosition !== undefined ? queuePosition : state.queuePosition
      }), false, 'updateGenerationProgress'),

      completeGeneration: (resultUrl, isVideo = false, executionTime) => set({
        isGenerating: false,
        workspaceMode: 'completed',
        progress: 100,
        resultImageUrl: isVideo ? null : resultUrl,
        resultVideoUrl: isVideo ? resultUrl : null,
        executionTime: executionTime ?? null,
      }, false, 'completeGeneration'),

      failGeneration: (error) => set({
        isGenerating: false,
        workspaceMode: 'error',
        errorMessage: error
      }, false, 'failGeneration'),

      cancelGeneration: () => set({
        isGenerating: false,
        workspaceMode: 'empty',
        progress: 0,
        errorMessage: "Generation cancelled by user."
      }, false, 'cancelGeneration'),

      setActiveGenerationId: (id, comfyPromptId) => set({
        activeGenerationId: id,
        comfyuiPromptId: comfyPromptId ?? null
      }, false, 'setActiveGenerationId'),

      // -------------------------------------------------------------------------
      // Gallery Actions
      // -------------------------------------------------------------------------
      selectGalleryItem: (item) => {
        if (!item) {
          set({ selectedGalleryItem: null }, false, 'selectGalleryItem/null');
          return;
        }

        // When a gallery item is selected, we load it into the workspace
        const isVideo = item.generation_type === 'text_to_video' || item.generation_type === 'image_to_video' || !!item.output_video_path;
        
        set({
          selectedGalleryItem: item,
          workspaceMode: 'completed',
          resultImageUrl: !isVideo ? item.output_image_path : null,
          resultVideoUrl: isVideo ? item.output_video_path : null,
          sourceImageUrl: item.source_image_path,
          isComparisonMode: false,
          executionTime: item.execution_time,
          activeGenerationId: item.id
        }, false, 'selectGalleryItem/hydrate');
      },

      updateGalleryFilters: (filters) => set((state) => ({
        galleryFilters: { ...state.galleryFilters, ...filters }
      }), false, 'updateGalleryFilters'),

      // -------------------------------------------------------------------------
      // Reset
      // -------------------------------------------------------------------------
      clearWorkspace: () => set({
        ...initialState,
        // Preserve gallery filters if needed, but clear workspace
        galleryFilters: get().galleryFilters
      }, false, 'clearWorkspace'),

      }),
      {
        name: 'generation-storage',
        partialize: (state) => ({
          workspaceMode: state.workspaceMode === 'upload_preview' ? 'empty' : state.workspaceMode, // Can't persist blob previews
          activeGenerationId: state.activeGenerationId,
          comfyuiPromptId: state.comfyuiPromptId,
          isGenerating: state.isGenerating,
          progress: state.progress,
          resultImageUrl: state.resultImageUrl,
          resultVideoUrl: state.resultVideoUrl,
          lastSubmittedParams: state.lastSubmittedParams,
        }),
      }
    ),
    { name: 'GenerationStore' }
  )
);
