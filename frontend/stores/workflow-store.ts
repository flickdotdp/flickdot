import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WorkflowState {
  // Navigation & UI State
  isMarketplaceOpen: boolean;
  
  // Selection State
  selectedWorkflowId: string | null;
  savedParameters: Record<string, Record<string, any>>;
  
  // Actions
  toggleMarketplace: (isOpen?: boolean) => void;
  selectWorkflow: (id: string) => void;
  clearSelection: () => void;
  setWorkflowParameter: (workflowId: string, key: string, value: any) => void;
}

const initialState = {
  isMarketplaceOpen: false,
  selectedWorkflowId: null,
  savedParameters: {},
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        toggleMarketplace: (isOpen) => 
          set((state) => ({ 
            isMarketplaceOpen: isOpen !== undefined ? isOpen : !state.isMarketplaceOpen 
          }), false, 'toggleMarketplace'),

        selectWorkflow: (id) => 
          set({ selectedWorkflowId: id, isMarketplaceOpen: false }, false, 'selectWorkflow'),

        clearSelection: () => 
          set({ selectedWorkflowId: null }, false, 'clearSelection'),
          
        setWorkflowParameter: (workflowId, key, value) =>
          set((state) => ({
            savedParameters: {
              ...state.savedParameters,
              [workflowId]: {
                ...(state.savedParameters[workflowId] || {}),
                [key]: value
              }
            }
          }), false, 'setWorkflowParameter'),
      }),
      {
        name: 'workflow-storage',
        partialize: (state) => ({
          selectedWorkflowId: state.selectedWorkflowId,
          savedParameters: state.savedParameters,
        }),
      }
    ),
    { name: 'WorkflowStore' }
  )
);
