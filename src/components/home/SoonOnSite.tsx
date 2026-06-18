import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

interface SoonOnSiteProps {
  mainVideo: string;
  sideVideos: string[];
}

export function SoonOnSite({ mainVideo, sideVideos }: SoonOnSiteProps) {
  return (
    <div className="w-full bg-black pr-8 pl-24 md:pr-16 md:pl-32 py-16 border-t border-fast-surface">
      <div className="w-full flex flex-col">
        
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-white tracking-wide">Soon on site</h2>
          <div className="h-[1px] w-12 bg-white/20"></div>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-12 items-center">
          {/* Left Text */}
          <div className="w-full md:w-[35%] flex flex-col justify-center">
            <p className="text-gray-300 text-lg leading-relaxed font-light">
              We will show all new trailers that will appear soon on our site. New films, trailers, news and many many other cool things are waiting for you! Stay tuned for our upcoming releases.
            </p>
          </div>

          {/* Right Massive Player */}
          <div className="w-full md:w-[65%]">
            <Link href={`/watch/${mainVideo}`}>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl">
                <Image src={`https://i.ytimg.com/vi/${mainVideo}/hqdefault.jpg`} alt="Soon on site featured" fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                
                {/* Custom Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-4 transition-transform group-hover:scale-110">
                    <div className="w-16 h-16 rounded-full border border-fast-red flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-[0_0_20px_rgba(204,0,0,0.3)] group-hover:bg-fast-red/20">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                    <span className="text-white text-sm font-light tracking-widest uppercase">play</span>
                  </div>
                </div>

                {/* Date Badge */}
                <div className="absolute top-4 right-4 bg-fast-red text-white text-[10px] font-bold px-3 py-1 rounded-sm shadow-md">
                  21.06.2019
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
