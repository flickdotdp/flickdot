import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LatestNewsProps {
  videos: string[];
}

export function LatestNews({ videos }: LatestNewsProps) {
  return (
    <div className="w-full bg-black pr-8 pl-24 md:pr-16 md:pl-32 py-8 border-b border-fast-surface pb-16">
      <div className="w-full flex flex-col">
        
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-white tracking-wide">Latest news</h2>
          <div className="h-[1px] w-12 bg-white/20"></div>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-8">
          
          {/* Main Large News Card */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4 group cursor-pointer border border-white/10 shadow-lg">
              <Image 
                src={`https://i.ytimg.com/vi/${videos[0]}/hqdefault.jpg`} 
                alt="News 1" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                unoptimized
              />
              <div className="absolute top-4 left-4 bg-fast-red text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-md">
                21.06.2019
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-1 flex flex-col items-start">
                <button className="bg-fast-red hover:bg-fast-red-hover text-white text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full mb-3 uppercase transition-colors shadow-md">
                  More Info
                </button>
                <h3 className="text-xl font-bold text-white mb-2">The Movie</h3>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                  Roman teenager Adi is forced to join the Roman army when one of his clever schemes fails foul of Emperor Nero. He is sent to "miserable, cold, wet Britain" where "the natives are revolting - quite literally". Things go from bad to worse when Adi is captured by the Celts.
                </p>
              </div>
              <div className="flex flex-col items-center justify-start pt-2">
                <div className="flex gap-2 text-gray-500 mb-2">
                  <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                  <ChevronRight className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                </div>
                <span className="text-3xl font-light text-gray-600 leading-none">02</span>
              </div>
            </div>
          </div>

          {/* Side Grid News Cards */}
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
            
            {/* Sub Card 1 */}
            <div className="flex flex-col group cursor-pointer">
              <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-3 border border-white/10 shadow-lg">
                <Image 
                  src={`https://i.ytimg.com/vi/${videos[1]}/hqdefault.jpg`} 
                  alt="News 2" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <button className="bg-fast-red hover:bg-fast-red-hover text-white text-[9px] font-bold tracking-widest px-3 py-1 rounded-full uppercase transition-colors shadow-md">
                    More Info
                  </button>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm line-clamp-2">Best movies on your smartphone</h3>
            </div>

            {/* Sub Card 2 */}
            <div className="flex flex-col group cursor-pointer">
              <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-3 border border-white/10 shadow-lg">
                <Image 
                  src={`https://i.ytimg.com/vi/${videos[2]}/hqdefault.jpg`} 
                  alt="News 3" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <button className="bg-fast-red hover:bg-fast-red-hover text-white text-[9px] font-bold tracking-widest px-3 py-1 rounded-full uppercase transition-colors shadow-md">
                    More Info
                  </button>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm line-clamp-2">Not much about the avengers</h3>
            </div>

            {/* Sub Card 3 */}
            <div className="flex flex-col group cursor-pointer">
              <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-3 border border-white/10 shadow-lg">
                <Image 
                  src={`https://i.ytimg.com/vi/${videos[3]}/hqdefault.jpg`} 
                  alt="News 4" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <button className="bg-fast-red hover:bg-fast-red-hover text-white text-[9px] font-bold tracking-widest px-3 py-1 rounded-full uppercase transition-colors shadow-md">
                    More Info
                  </button>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm line-clamp-2">A look inside the making of</h3>
            </div>

            {/* Sub Card 4 */}
            <div className="flex flex-col group cursor-pointer">
              <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-3 border border-white/10 shadow-lg">
                <Image 
                  src={`https://i.ytimg.com/vi/${videos[4]}/hqdefault.jpg`} 
                  alt="News 5" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <button className="bg-fast-red hover:bg-fast-red-hover text-white text-[9px] font-bold tracking-widest px-3 py-1 rounded-full uppercase transition-colors shadow-md">
                    More Info
                  </button>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm line-clamp-2">Exclusive behind the scenes</h3>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
