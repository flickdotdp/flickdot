import { ArrowLeft, Play, Maximize, SkipBack, SkipForward, Volume2, Subtitles, Layers, Cast, ShoppingBag, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WatchPage({ params }: { params: { id: string } }) {
  const videoId = params.id;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a] font-sans">
      
      {/* Background Ambient Blur (Lens Blur Environment) */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
          alt="Ambient Environment"
          fill
          className="object-cover opacity-90 blur-[16px] scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[90rem] mx-auto flex flex-col md:flex-row items-center justify-center gap-8 px-8 py-12">
        
        {/* Left Floating Sidebar (Vision Pro style) */}
        <div className="hidden md:flex flex-col items-center gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full py-8 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
           <div className="p-3 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors shadow-inner">
             <Play className="w-5 h-5 text-white fill-white ml-0.5" />
           </div>
           <div className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <Layers className="w-5 h-5" />
           </div>
           <div className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <Cast className="w-5 h-5" />
           </div>
           <div className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <ShoppingBag className="w-5 h-5" />
           </div>
           <div className="p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-white/60 hover:text-white">
             <Search className="w-5 h-5" />
           </div>
        </div>

        {/* Center Main Player Window */}
        <div className="flex-1 w-full flex flex-col items-center gap-8">
          
          <div className="relative w-full max-w-5xl aspect-video bg-black/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col group">
            
            {/* Top Bar (Auto-hides in reality, but we keep it slightly visible) */}
            <div className="flex items-center justify-between px-6 py-5 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Link href="/home">
                <div className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer backdrop-blur-md transition-colors">
                  <ArrowLeft className="w-4 h-4 text-white" />
                </div>
              </Link>
              <h2 className="text-white/90 font-medium tracking-wide text-sm md:text-base shadow-sm">Flickdot Presentation</h2>
              <div className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer backdrop-blur-md transition-colors">
                <Maximize className="w-4 h-4 text-white" />
              </div>
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
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`}
                className="absolute inset-0 w-full h-full pointer-events-auto z-10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              {/* Custom Progress Bar Overlay */}
              <div className="absolute bottom-8 left-8 right-8 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <div className="flex flex-col gap-3">
                   <span className="text-white font-bold tracking-wide drop-shadow-md px-2">Flickdot, Assemble!</span>
                   <div className="w-full h-1.5 bg-white/30 rounded-full backdrop-blur-md relative">
                     <div className="absolute left-0 top-0 h-full bg-white w-2/3 rounded-full"></div>
                     <div className="absolute left-2/3 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="flex items-center justify-center gap-6 md:gap-10 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-8 md:px-12 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
             <SkipBack className="w-5 h-5 md:w-6 md:h-6 text-white/60 hover:text-white cursor-pointer transition-colors" />
             <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white cursor-pointer hover:scale-110 transition-transform" />
             <SkipForward className="w-5 h-5 md:w-6 md:h-6 text-white/60 hover:text-white cursor-pointer transition-colors" />
             
             <div className="w-px h-6 bg-white/20 mx-0 md:mx-2" />
             
             <Volume2 className="w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-colors" />
             <Subtitles className="w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-colors" />
             <span className="text-white/60 hover:text-white font-medium text-sm ml-2 md:ml-4 cursor-pointer transition-colors">1080p</span>
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
             <div key={i} className="flex flex-col gap-2 group cursor-pointer">
               <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors shadow-lg">
                 <Image src={`https://i.ytimg.com/vi/${vid.id}/mqdefault.jpg`} alt="Related" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                 <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-medium">10:24</div>
               </div>
               <div className="px-1">
                 <h4 className="text-white/90 text-sm font-medium line-clamp-1 group-hover:text-white">{vid.title}</h4>
                 <p className="text-white/50 text-xs mt-0.5">Flickdot Studio</p>
               </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
