"use client";

import { Maximize, Minimize } from "lucide-react";
import { useState, useEffect } from "react";

export function FullscreenButton({ targetId }: { targetId: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const el = document.getElementById(targetId);
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div 
      onClick={toggleFullscreen}
      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer backdrop-blur-md transition-colors"
      title="Toggle Fullscreen"
    >
      {isFullscreen ? (
        <Minimize className="w-4 h-4 text-white" />
      ) : (
        <Maximize className="w-4 h-4 text-white" />
      )}
    </div>
  );
}
