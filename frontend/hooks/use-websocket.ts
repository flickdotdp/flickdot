import { useEffect } from 'react';
import { useWebSocket } from '../providers/websocket-provider';
import { WsEventType, WsMessageHandler } from '../lib/websocket/websocket-client';

// -------------------------------------------------------------------------
// Core Hooks
// -------------------------------------------------------------------------

/**
 * Direct access to connection state.
 * Useful for UI indicators (e.g., a green/red dot in the navbar).
 */
export const useConnectionStatus = () => {
  const { connectionState, reconnect } = useWebSocket();
  return { connectionState, reconnect };
};

/**
 * Register a generic raw event listener that cleans itself up on unmount.
 */
export const useWsListener = (event: WsEventType | string, handler: WsMessageHandler) => {
  const { registerHandler, unregisterHandler } = useWebSocket();

  useEffect(() => {
    registerHandler(event, handler);
    return () => {
      unregisterHandler(event, handler);
    };
  }, [event, handler, registerHandler, unregisterHandler]);
};

// -------------------------------------------------------------------------
// Targeted Subscription Hooks
// -------------------------------------------------------------------------

/**
 * Subscribes to targeted updates for a specific project.
 * Useful for Project Dashboard components.
 */
export const useProjectSubscription = (projectId: string | null | undefined) => {
  const { subscribeToProject, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (!projectId) return;

    subscribeToProject(projectId);
    
    // Cleanup subscription when component unmounts or projectId changes
    return () => {
      unsubscribe('project', projectId);
    };
  }, [projectId, subscribeToProject, unsubscribe]);
};

/**
 * Subscribes to targeted updates for a specific generation.
 * Useful for standalone Generation Detail pages or expanded views.
 * Note: The global WebSocketProvider already handles the Active Workspace generation automatically.
 */
export const useGenerationSubscription = (generationId: string | null | undefined) => {
  const { subscribeToGeneration, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (!generationId) return;

    subscribeToGeneration(generationId);
    
    return () => {
      unsubscribe('generation', generationId);
    };
  }, [generationId, subscribeToGeneration, unsubscribe]);
};

// -------------------------------------------------------------------------
// Global Analytics/Status Monitoring Hooks
// -------------------------------------------------------------------------

/**
 * Listens for system health or ComfyUI worker status changes.
 * Pass a callback to update local component state if needed.
 */
export const useSystemStatusSubscription = (onStatusChange?: (payload: any) => void) => {
  useWsListener(WsEventType.SYSTEM_STATUS_CHANGED, (payload) => {
    if (onStatusChange) onStatusChange(payload);
  });

  useWsListener(WsEventType.COMFYUI_STATUS_CHANGED, (payload) => {
    if (onStatusChange) onStatusChange(payload);
  });
};

/**
 * Forces a component to re-render or execute a callback when the global queue updates.
 */
export const useQueueSubscription = (onQueueUpdate?: () => void) => {
  useWsListener(WsEventType.QUEUE_UPDATE, () => {
    if (onQueueUpdate) onQueueUpdate();
  });
};
