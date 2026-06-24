"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient, WsConnectionState, WsEventType, WsMessageHandler } from "../lib/websocket/websocket-client";
import { useGenerationStore } from "../stores/generation-store";
import { useProjectStore } from "../stores/project-store";
import { generationKeys } from "../lib/api/generations";
import { projectKeys } from "../lib/api/projects";
import toast from "react-hot-toast";

// -------------------------------------------------------------------------
// Context Definition
// -------------------------------------------------------------------------
interface WebSocketContextValue {
  connectionState: WsConnectionState;
  
  // Expose core capabilities to the React tree
  sendMessage: (action: string, payload?: any) => void;
  subscribeToProject: (projectId: string) => void;
  subscribeToGeneration: (generationId: string) => void;
  unsubscribe: (type: 'project' | 'generation', id: string) => void;
  
  registerHandler: (event: WsEventType | string, handler: WsMessageHandler) => void;
  unregisterHandler: (event: WsEventType | string, handler: WsMessageHandler) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

// -------------------------------------------------------------------------
// Provider Component
// -------------------------------------------------------------------------
interface WebSocketProviderProps {
  children: ReactNode;
}

export default function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [connectionState, setConnectionState] = useState<WsConnectionState>('CLOSED');
  
  // Hooks to global state and cache
  const queryClient = useQueryClient();
  const generationStore = useGenerationStore();
  const projectStore = useProjectStore();

  // -------------------------------------------------------------------------
  // Connection Lifecycle
  // -------------------------------------------------------------------------
  useEffect(() => {
    // 1. Sync connection state to React component
    const unsubscribeState = wsClient.onStateChange((newState) => {
      setConnectionState(newState);
      
      // Notify user of critical connection events
      if (newState === 'RECONNECTING') {
        toast.loading("Connection lost. Reconnecting...", { id: "ws-status" });
      } else if (newState === 'OPEN') {
        toast.success("Connected to AI Engine", { id: "ws-status", duration: 3000 });
        
        // Re-subscribe to active contexts upon successful reconnection
        const activeProject = useProjectStore.getState().selectedProjectId;
        if (activeProject) wsClient.subscribeToProject(activeProject);
        
        const activeGen = useGenerationStore.getState().activeGenerationId;
        if (activeGen) wsClient.subscribeToGeneration(activeGen);

        // Sync queue and gallery after reconnect to prevent stale UI
        queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
        queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
        if (activeProject) {
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(activeProject) });
        }
      } else if (newState === 'CLOSED') {
        toast.error("Disconnected from backend", { id: "ws-status", duration: 4000 });
      }
    });

    // 2. Initialize connection
    wsClient.connect();

    // 3. Cleanup on unmount
    return () => {
      unsubscribeState();
      wsClient.disconnect();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Global Event Sync (Backend -> React State & Cache)
  // -------------------------------------------------------------------------
  useEffect(() => {
    
    const handleProgress = (payload: any) => {
      const { generation_id, progress_percent, current_step, max_steps, queue_position } = payload;
      
      // If this is the generation currently being viewed in the main workspace
      const storeState = useGenerationStore.getState();
      if (storeState.activeGenerationId === generation_id) {
        storeState.updateGenerationProgress(progress_percent, queue_position);
      }
    };

    const handleCompleted = (payload: any) => {
      const { generation_id, output_path, execution_time } = payload;
      
      const storeState = useGenerationStore.getState();
      if (storeState.activeGenerationId === generation_id) {
        storeState.completeGeneration(output_path, execution_time);
      }

      // Invalidate caches so Gallery and Project Views fetch the new image
      queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
      queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
      
      const activeProject = useProjectStore.getState().selectedProjectId;
      if (activeProject) {
        queryClient.invalidateQueries({ queryKey: generationKeys.project(activeProject) });
      }
      
      toast.success("Generation completed!");
    };

    const handleFailed = (payload: any) => {
      const { generation_id, error } = payload;
      
      const storeState = useGenerationStore.getState();
      if (storeState.activeGenerationId === generation_id) {
        storeState.failGeneration(error);
      }
      
      queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
      toast.error(`Generation failed: ${error}`);
    };

    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
    };

    const handleGalleryUpdate = () => {
      queryClient.invalidateQueries({ queryKey: generationKeys.gallery() });
    };

    const handleProjectUpdate = (payload: any) => {
      if (payload.project_id) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(payload.project_id) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    };

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------
    wsClient.registerHandler(WsEventType.GENERATION_PROGRESS, handleProgress);
    wsClient.registerHandler(WsEventType.GENERATION_COMPLETED, handleCompleted);
    wsClient.registerHandler(WsEventType.GENERATION_FAILED, handleFailed);
    wsClient.registerHandler(WsEventType.QUEUE_UPDATE, handleQueueUpdate);
    wsClient.registerHandler(WsEventType.GALLERY_UPDATE, handleGalleryUpdate);
    wsClient.registerHandler(WsEventType.PROJECT_UPDATE, handleProjectUpdate);

    return () => {
      wsClient.unregisterHandler(WsEventType.GENERATION_PROGRESS, handleProgress);
      wsClient.unregisterHandler(WsEventType.GENERATION_COMPLETED, handleCompleted);
      wsClient.unregisterHandler(WsEventType.GENERATION_FAILED, handleFailed);
      wsClient.unregisterHandler(WsEventType.QUEUE_UPDATE, handleQueueUpdate);
      wsClient.unregisterHandler(WsEventType.GALLERY_UPDATE, handleGalleryUpdate);
      wsClient.unregisterHandler(WsEventType.PROJECT_UPDATE, handleProjectUpdate);
    };
  }, [queryClient]); // Empty dependency arrays inside ensure safe closures via getState()

  // -------------------------------------------------------------------------
  // Context Value Construction
  // -------------------------------------------------------------------------
  const value: WebSocketContextValue = {
    connectionState,
    sendMessage: (action, payload) => wsClient.sendMessage(action, payload),
    subscribeToProject: (projectId) => wsClient.subscribeToProject(projectId),
    subscribeToGeneration: (generationId) => wsClient.subscribeToGeneration(generationId),
    unsubscribe: (type, id) => wsClient.unsubscribe(type, id),
    registerHandler: (event, handler) => wsClient.registerHandler(event, handler),
    unregisterHandler: (event, handler) => wsClient.unregisterHandler(event, handler),
    reconnect: () => wsClient.reconnect(),
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
