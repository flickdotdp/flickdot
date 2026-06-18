import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface CatalogSectionProps {
  videos: string[];
}

export function CatalogSection({ videos }: CatalogSectionProps) {
  // Using the first 10 videos for the catalog
  const catalogVideos = videos.slice(0, 10);
  
  return (
    <div className="w-full bg-black pr-8 pl-24 md:pr-16 md:pl-32 py-16 border-t border-fast-surface">
      <div className="w-full flex flex-col items-center">


        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full mb-12">
          {catalogVideos.map((videoId, index) => (
            <Link href={`/watch/${videoId}`} key={`catalog-${videoId}-${index}`}>
              <div className="flex flex-col gap-3 group cursor-pointer">
                <div className="relative aspect-video w-full rounded-md overflow-hidden border border-white/5 shadow-lg group-hover:scale-105 transition-transform duration-300 group-hover:shadow-[0_0_15px_rgba(204,0,0,0.3)]">
                  <Image 
                    src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} 
                    alt={`Movie ${index}`} 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                  <div className="absolute top-2 left-2 flex items-center justify-center">
                     <div className="h-6 w-4 bg-fast-red flex items-center justify-center text-white font-black text-xs">F</div>
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white text-xs font-bold text-center line-clamp-1 group-hover:text-fast-red transition-colors">
                    Dolor y gloria
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                     {/* 4 filled stars, 1 empty for visual effect */}
                     {[1,2,3,4].map(star => (
                       <span key={star} className="text-fast-red text-[10px]">★</span>
                     ))}
                     <span className="text-gray-600 text-[10px]">★</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View More Button */}
        <button className="flex items-center gap-2 px-8 py-3 rounded-full bg-fast-surface hover:bg-fast-red border border-white/10 hover:border-fast-red text-white font-bold text-sm tracking-widest uppercase transition-all duration-300 group">
          View More
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
