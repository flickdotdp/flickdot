"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, AlertCircle, Loader2, Volume2, VolumeX, Maximize } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils";

// Add YT namespace to window
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
}

type PlayerState = "LOADING" | "BUFFERING" | "PLAYING" | "PAUSED" | "ENDED" | "ERROR" | "FALLBACK_EMBED" | "FALLBACK_THUMBNAIL";

// Analytics logger
const trackEvent = (eventName: string, details: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[YouTube Analytics] ${eventName}`, details);
  }
  // In production, wire this up to Mixpanel, Google Analytics, or Supabase
};



// Validate YouTube ID (11 chars)
const isValidYouTubeId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);

export function YouTubePlayer({
  videoId,
  autoplay = false,
  mute = false,
  loop = false,
  controls = true,
  className = "w-full h-full",
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playerState, setPlayerState] = useState<PlayerState>("LOADING");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(mute);

  const parsedVideoId = extractYouTubeId(videoId);

  const triggerFallback = useCallback((reason: string, isTerminal: boolean = false) => {
    trackEvent("fallback_triggered", { videoId: parsedVideoId, reason, isTerminal });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // If it's a terminal error (like restricted or deleted), go straight to thumbnail
    if (isTerminal) {
      setPlayerState("FALLBACK_THUMBNAIL");
    } else {
      // Otherwise, try the standard embed first as a middle layer
      setPlayerState("FALLBACK_EMBED");
    }
  }, [parsedVideoId]);

  useEffect(() => {
    if (!isValidYouTubeId(parsedVideoId)) {
      setErrorMessage("Invalid video ID");
      triggerFallback("invalid_id", true);
      return;
    }

    trackEvent("player_init", { videoId: parsedVideoId });
    setPlayerState("LOADING");

    // Watchdog Timer: If API takes > 5s to load, trigger standard embed fallback
    timeoutRef.current = setTimeout(() => {
      if (!playerRef.current) {
        console.warn("[YouTubePlayer] API load timeout. Falling back.");
        triggerFallback("api_timeout", false);
      }
    }, 5000);

    const initPlayer = () => {
      if (!containerRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: parsedVideoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            mute: mute ? 1 : 0,
            controls: 0,
            disablekb: 1,
            loop: loop ? 1 : 0,
            playlist: loop ? parsedVideoId : undefined,
            playsinline: 1,
            rel: 0,
            modestbranding: 0,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              setPlayerState(autoplay ? "BUFFERING" : "PAUSED");
              if (autoplay) {
                if (mute) event.target.mute();
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  setPlayerState("PLAYING");
                  trackEvent("playback_start", { videoId: parsedVideoId });
                  break;
                case window.YT.PlayerState.BUFFERING:
                  setPlayerState("BUFFERING");
                  trackEvent("playback_buffering", { videoId: parsedVideoId });
                  break;
                case window.YT.PlayerState.PAUSED:
                  setPlayerState("PAUSED");
                  break;
                case window.YT.PlayerState.ENDED:
                  setPlayerState("ENDED");
                  trackEvent("playback_completion", { videoId: parsedVideoId });
                  break;
              }
            },
            onError: (event: any) => {
              let errorMsg = "Unknown Error";
              let isTerminal = true;
              
              switch (event.data) {
                case 2: errorMsg = "Invalid parameter"; isTerminal = true; break;
                case 5: errorMsg = "HTML5 player error"; isTerminal = false; break;
                case 100: errorMsg = "Video not found or private"; isTerminal = true; break;
                case 101:
                case 150: errorMsg = "Embedding disabled by owner"; isTerminal = true; break;
              }
              
              console.error(`[YouTubePlayer] Error ${event.data}: ${errorMsg}`);
              setErrorMessage(errorMsg);
              trackEvent("playback_error", { videoId: parsedVideoId, errorCode: event.data, errorMsg });
              triggerFallback(`api_error_${event.data}`, isTerminal);
            },
          },
        });
      } catch (err) {
        console.error("[YouTubePlayer] Failed to instantiate YT.Player", err);
        triggerFallback("instantiation_failed", false);
      }
    };

    // Load the YouTube IFrame API script dynamically
    if (!window.YT || !window.YT.Player) {
      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // If the API hasn't set the callback, define it
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [parsedVideoId, autoplay, mute, loop, triggerFallback]);

  // Sync loop for current time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playerState === "PLAYING") {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
          setDuration(playerRef.current.getDuration());
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [playerState]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (playerState === "PLAYING") {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    const parent = containerRef.current.closest('.relative.bg-black.overflow-hidden');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (parent) {
      parent.requestFullscreen();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!playerRef.current || duration === 0) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    const newTime = percent * duration;
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle standard embed fallback failure via onLoad/onError isn't fully reliable for cross-origin iframes,
  // but we provide it as an intermediate layer.
  const handleStandardEmbedLoad = () => {
    // If we loaded the standard embed, we consider it "playing" or at least "ready"
    if (playerState === "FALLBACK_EMBED") {
      trackEvent("standard_embed_loaded", { videoId: parsedVideoId });
    }
  };

  if (playerState === "FALLBACK_THUMBNAIL") {
    // Ultimate Fallback UI
    return (
      <div className={`relative flex items-center justify-center bg-[#0a0a0a] overflow-hidden group ${className}`}>
        <Image
          src={`https://i.ytimg.com/vi/${parsedVideoId}/maxresdefault.jpg`}
          alt="Video Thumbnail"
          fill
          className="object-cover opacity-60 group-hover:opacity-30 transition-opacity duration-500 scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 backdrop-blur-[2px]" />
        
        <div className="relative z-10 flex flex-col items-center text-center p-8 bg-black/60 rounded-3xl border border-white/10 max-w-md backdrop-blur-xl shadow-2xl transform transition-transform duration-500 group-hover:scale-105">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-6">
             <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-white text-xl font-bold mb-3 tracking-wide">Playback Restricted</h3>
          <p className="text-gray-300 text-sm mb-8 leading-relaxed px-4">
            {errorMessage ? `(${errorMessage}) ` : ""}The creator has restricted playback outside of YouTube. Don't worry, you can still watch it directly on their platform.
          </p>
          <a 
            href={`https://www.youtube.com/watch?v=${parsedVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("user_redirected", { videoId: parsedVideoId })}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-full transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
          >
            <Play className="w-5 h-5 fill-white" />
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  if (playerState === "FALLBACK_EMBED") {
    // Intermediate Fallback: Standard iframe without JS API
    return (
      <div className={`relative bg-black overflow-hidden ${className}`}>
         <iframe 
            src={`https://www.youtube.com/embed/${parsedVideoId}?autoplay=${autoplay ? 1 : 0}&mute=${mute ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${loop ? parsedVideoId : ""}&rel=0`}
            className="absolute inset-0 w-full h-full border-0 pointer-events-auto z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleStandardEmbedLoad}
          />
      </div>
    );
  }

  // Active Player Container
  return (
    <div className={`relative bg-black overflow-hidden group ${className}`} onClick={togglePlay}>
      
      {/* Loading Skeleton */}
      {playerState === "LOADING" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#141414] animate-pulse">
           <div className="w-16 h-16 border-4 border-white/10 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Buffering Spinner */}
      {playerState === "BUFFERING" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
           <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
      )}

      {/* The actual YouTube IFrame API will attach to this inner div */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-500"
        style={{ opacity: playerState !== "LOADING" ? 1 : 0 }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 md:h-2 bg-white/20 rounded-full cursor-pointer relative group/progress"
          onClick={handleSeek}
        >
          <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all duration-300 group-hover/progress:h-3 -translate-y-[2px]" style={{ width: '100%' }} />
          <div 
            className="absolute left-0 top-0 h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all duration-300 group-hover/progress:h-3 -translate-y-[2px]"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between text-white mt-1">
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={togglePlay} className="hover:scale-110 transition-transform focus:outline-none">
              {playerState === "PLAYING" ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-white" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-white" />}
            </button>
            <button onClick={toggleMute} className="hover:scale-110 transition-transform focus:outline-none">
              {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <span className="text-xs md:text-sm font-medium opacity-80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform focus:outline-none">
            <Maximize className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
      
    </div>
  );
}
