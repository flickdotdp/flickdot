"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global UI Crash:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <div className="w-full max-w-md bg-card/50 backdrop-blur-md border border-border p-8 rounded-2xl shadow-panel text-center">
        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <h2 className="text-xl font-bold mb-2 tracking-tight">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground mb-8">
          A critical error occurred in the AI Studio UI. Don't worry, your backend generations are likely still processing.
        </p>
        
        <div className="p-4 bg-background/50 rounded-lg border border-border/50 text-left mb-8 overflow-auto max-h-32">
          <code className="text-xs text-destructive font-mono">
            {error.message || "Unknown rendering error"}
          </code>
        </div>
        
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    </div>
  );
}
