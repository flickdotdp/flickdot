"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import GenerationControls from "../components/GenerationControls";
import ImageWorkspace from "../components/ImageWorkspace";
import VideoWorkspace from "../components/video/VideoWorkspace";
import GalleryPanel from "../components/GalleryPanel";
import { WorkflowMarketplace } from "../components/workflow/WorkflowMarketplace";
import { AssetMarketplace } from "../components/assets/AssetMarketplace";
import { BundleMarketplace } from "../components/bundles/BundleMarketplace";
import { ComputeDashboard } from "../components/compute/ComputeDashboard";
import { useWebSocket } from "../providers/websocket-provider";
import { useGenerationStore } from "../stores/generation-store";
import { useAssetStore } from "../stores/asset-store";
import { useBundleStore } from "../stores/bundle-store";
import { useComputeStore } from "../stores/compute-store";
import { GenerationService } from "../lib/api/generations";

export default function DashboardPage() {
  // Initialize WebSocket connection when the main studio mounts
  // This hook relies on the WebSocketProvider being present in layout.tsx
  const { } = useWebSocket();
  const { activeGenerationId, isGenerating, completeGeneration, failGeneration, resultVideoUrl } = useGenerationStore();
  const { isAssetMarketplaceOpen, toggleAssetMarketplace } = useAssetStore();
  const { isBundleMarketplaceOpen, toggleBundleMarketplace } = useBundleStore();
  const { isComputeDashboardOpen } = useComputeStore();

  useEffect(() => {
    // Restore state if we reconnect or refresh and we were generating
    if (activeGenerationId && isGenerating) {
      GenerationService.getGenerationById(activeGenerationId).then((response) => {
        const gen = response.data;
        if (!gen) return;

        if (gen.status === 'completed') {
          const isVideo = gen.generation_type === 'text_to_video' || gen.generation_type === 'image_to_video' || !!gen.output_video_path;
          const url = isVideo ? gen.output_video_path : gen.output_image_path;
          if (url) {
            completeGeneration(url, isVideo, gen.execution_time);
          }
        } else if (gen.status === 'failed' || gen.status === 'cancelled') {
          failGeneration(gen.error_message || 'Generation failed or cancelled while offline.');
        }
      }).catch(console.error);
    }
  }, [activeGenerationId, isGenerating, completeGeneration, failGeneration]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
      {/* Dynamic Overlay Panels */}
      <WorkflowMarketplace />
      <AssetMarketplace isOpen={isAssetMarketplaceOpen} onClose={() => toggleAssetMarketplace(false)} />
      <BundleMarketplace isOpen={isBundleMarketplaceOpen} onClose={() => toggleBundleMarketplace(false)} />
      <ComputeDashboard />

      {/* Left Panel: Configuration & Prompts */}
      <GenerationControls />

      {/* Center Panel: Canvas & Previews */}
      {resultVideoUrl ? <VideoWorkspace /> : <ImageWorkspace />}

      {/* Right Panel: History & Queue */}
      <GalleryPanel />
    </div>
  );
}
