import Image from "next/image";
import Link from "next/link";
import { Play, Bell, Info } from "lucide-react";

interface SoonOnSiteProps {
  mainVideo: string;
  sideVideos: string[];
}

export function SoonOnSite({ mainVideo, sideVideos }: SoonOnSiteProps) {
  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] bg-[#141414] overflow-hidden group border-y border-white/10">
      {/* Immersive Background */}
      <div className="absolute inset-0">
        <Image 
          src="/mrs-niveda-hero-2.png" 
          alt="Coming Soon Background" 
          fill 
          className="object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105" 
          unoptimized 
        />
        {/* Netflix-style Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 md:pl-24 lg:pl-32">
        <div className="flex flex-col lg:flex-row gap-10 items-end justify-between w-full h-full">
          
          {/* Left Content */}
          <div className="flex flex-col gap-6 w-full lg:w-[45%] z-10 mb-4 lg:mb-10">
            <div className="flex items-center gap-2 mb-[-1rem]">
               <div className="w-3 h-8 bg-[#E50914] rounded-sm shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
               <h3 className="text-[#E50914] font-bold tracking-widest uppercase text-sm drop-shadow-md">New on Flickdot</h3>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-white drop-shadow-lg tracking-tight uppercase leading-none">
              Mrs.Niveda
            </h2>
            <p className="text-sm md:text-base text-gray-300 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-md font-medium text-shadow-sm">
              In a gripping new night-time thriller, Mrs. Niveda takes matters into her own hands. When a mysterious threat strikes close to home, she must navigate the shadows with her weapon drawn to uncover the truth. The highly anticipated thriller web series arrives this fall.
            </p>
            
            {/* Buttons */}
            <div className="flex items-center gap-4 mt-4">
              <Link href={`/watch/${mainVideo}`} className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded hover:bg-white/80 transition-colors font-bold text-lg shadow-lg hover:scale-105">
                <Play className="w-6 h-6 fill-black" />
                Play Trailer
              </Link>
              <button className="flex items-center gap-3 px-8 py-3 bg-[#6d6d6eb3] text-white rounded hover:bg-[#6d6d6e] transition-colors font-bold text-lg shadow-lg hover:scale-105 backdrop-blur-sm">
                <Bell className="w-6 h-6" />
                Remind Me
              </button>
            </div>
          </div>

          {/* Right Side Videos Carousel (Upcoming) */}
          <div className="w-full lg:w-[50%] z-10 flex flex-col gap-4 mb-4 lg:mb-10">
            <h3 className="text-white/90 font-medium text-lg flex items-center gap-3">
              Up Next
              <span className="text-[10px] px-2 py-0.5 bg-[#E50914] text-white rounded-sm font-bold tracking-wider uppercase">New Arrivals</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
              {sideVideos.map((vid, idx) => (
                <Link key={idx} href={`/watch/${vid}`} className="relative min-w-[200px] md:min-w-[240px] aspect-video rounded-md overflow-hidden group/card border border-white/10 hover:border-white/40 transition-colors shadow-xl snap-start">
                  <Image src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`} alt="Upcoming" fill className="object-cover group-hover/card:scale-110 transition-transform duration-500" unoptimized />
                  <div className="absolute inset-0 bg-black/40 group-hover/card:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-black/40 backdrop-blur-sm">
                       <Play className="w-5 h-5 text-white fill-white ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
