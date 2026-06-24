import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ComputeState {
  isComputeDashboardOpen: boolean;
  selectedExecutionPolicy: string;
}

interface ComputeActions {
  toggleComputeDashboard: (open?: boolean) => void;
  setExecutionPolicy: (policy: string) => void;
}

export const useComputeStore = create<ComputeState & ComputeActions>()(
  devtools(
    persist(
      (set, get) => ({
        isComputeDashboardOpen: false,
        selectedExecutionPolicy: "AUTO",
        
        toggleComputeDashboard: (open) => set({ 
          isComputeDashboardOpen: open !== undefined ? open : !get().isComputeDashboardOpen 
        }, false, 'toggleComputeDashboard'),

        setExecutionPolicy: (policy) => set({
          selectedExecutionPolicy: policy
        }, false, 'setExecutionPolicy')
      }),
      {
        name: 'compute-storage',
        partialize: (state) => ({ selectedExecutionPolicy: state.selectedExecutionPolicy })
      }
    )
  )
);
