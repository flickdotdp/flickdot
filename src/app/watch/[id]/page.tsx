import { ArrowLeft, X, Play, SkipBack, SkipForward, Volume2, Subtitles, Layers, Cast, ShoppingBag, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { YouTubePlayer } from "@/components/ui/YouTubePlayer";
import { FullscreenButton } from "@/components/ui/FullscreenButton";
import { extractYouTubeId } from "@/lib/utils";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const rawVideoId = resolvedParams.id;
  const videoId = extractYouTubeId(rawVideoId);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a] font-sans">
      
      {/* Background Netflix Standard */}
      <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-full h-[80vh]">
          <Image 
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt="Netflix Standard Background"
            fill
            className="object-cover opacity-60"
            unoptimized
          />
          {/* Netflix Signature Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-[#0a0a0a]/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a]/80 via-transparent to-transparent" />
        </div>
      </div>

      {/* Floating Close Button */}
      <Link href="/home" className="absolute top-8 right-8 z-50">
        <div className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full cursor-pointer transition-all hover:scale-110 group">
          <X className="w-6 h-6 text-white/80 group-hover:text-white" />
        </div>
      </Link>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[90rem] mx-auto flex flex-col md:flex-row items-center justify-center gap-8 px-8 py-12">
        
        {/* Left Floating Sidebar (Vision Pro style) */}
        <div className="hidden md:flex flex-col items-center gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full py-8 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
           <Link href="/home" className="p-3 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors shadow-inner">
             <Play className="w-5 h-5 text-white fill-white ml-0.5" />
           </Link>
           <Link href="/mystuff" className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <Layers className="w-5 h-5" />
           </Link>
           <Link href="#" className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <Cast className="w-5 h-5" />
           </Link>
           <Link href="/store" className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <ShoppingBag className="w-5 h-5" />
           </Link>
           <Link href="/search" className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <Search className="w-5 h-5" />
           </Link>
        </div>

        {/* Center Main Player Window (Acting as the Theatre Screen) */}
        <div className="flex-1 w-full flex flex-col items-center gap-8 z-20">
          
          <div id="player-container" className="relative w-full max-w-5xl md:max-w-6xl aspect-video bg-black rounded-2xl shadow-[0_0_150px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col group transition-all duration-700">
            
            {/* Top Bar (Auto-hides in reality, but we keep it slightly visible) */}
            <div className="flex items-center justify-between px-6 py-5 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Link href="/home">
                <div className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer backdrop-blur-md transition-colors">
                  <ArrowLeft className="w-4 h-4 text-white" />
                </div>
              </Link>
              <h2 className="text-white/90 font-medium tracking-wide text-sm md:text-base shadow-sm">Flickdot Presentation</h2>
              <FullscreenButton targetId="player-container" />
            </div>

            {/* Video Iframe */}
            <div className="flex-1 w-full h-full relative bg-black">
              <Image 
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} 
                alt="Player Placeholder" 
                fill 
                className="object-cover absolute inset-0 z-0 opacity-50" 
                unoptimized 
              />
              <YouTubePlayer 
                videoId={videoId} 
                autoplay={true} 
                controls={true}
                className="absolute inset-0 w-full h-full z-10"
              />
            </div>
          </div>

        </div>

        {/* Right Floating Sidebar (Related Videos) */}
        <div className="hidden xl:flex flex-col gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide w-72">
           <h3 className="text-white/80 font-medium text-sm px-1 mb-1 tracking-wide">Up Next</h3>
           
           {[
             { id: "GX1vz0T-dIE", title: "Behind the Scenes" },
             { id: "j20LIzXytJ4", title: "Director's Cut" },
             { id: "OBAeyeYSjFQ", title: "Visual Effects Breakdown" },
             { id: "LtOwx_tqJsw", title: "Official Trailer" }
           ].map((vid, i) => (
             <Link key={i} href={`/watch/${vid.id}`} className="flex flex-col gap-2 group cursor-pointer">
               <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors shadow-lg">
                 <Image src={`https://i.ytimg.com/vi/${vid.id}/mqdefault.jpg`} alt="Related" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                 <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-medium">10:24</div>
               </div>
               <div className="px-1">
                 <h4 className="text-white/90 text-sm font-medium line-clamp-1 group-hover:text-white">{vid.title}</h4>
                 <p className="text-white/50 text-xs mt-0.5">Flickdot Studio</p>
               </div>
             </Link>
           ))}
        </div>

      </div>
    </div>
  );
}
