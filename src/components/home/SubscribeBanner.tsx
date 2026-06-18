import Image from "next/image";

interface SubscribeBannerProps {
  bgVideoId: string;
}

export function SubscribeBanner({ bgVideoId }: SubscribeBannerProps) {
  return (
    <div className="w-full bg-black pr-8 pl-24 md:pr-16 md:pl-32 py-12">
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
        {/* Background Image */}
        <Image 
          src={`https://i.ytimg.com/vi/${bgVideoId}/maxresdefault.jpg`} 
          alt="Subscribe Background" 
          fill 
          className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" 
          unoptimized 
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-fast-red/5 via-transparent to-transparent mix-blend-overlay" />

        {/* Content Container */}
        <div className="absolute inset-0 flex items-center justify-end p-8 md:p-16">
          <div className="w-full md:w-1/2 flex flex-col items-start md:items-end text-left md:text-right">
            
            <div className="flex items-center gap-4 mb-4 flex-row-reverse md:flex-row">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Subscribe</h2>
              <div className="h-[2px] w-12 bg-fast-red hidden md:block"></div>
            </div>
            
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 max-w-md ml-0 md:ml-auto">
              Get the latest trailers, news, and exclusive drops sent straight to your inbox. Never miss a cinematic moment.
            </p>

            <form className="flex w-full max-w-md items-center ml-0 md:ml-auto bg-white/5 backdrop-blur-md rounded-lg overflow-hidden border border-white/20 shadow-xl focus-within:border-fast-red transition-all">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 bg-transparent text-white px-6 py-4 text-sm outline-none placeholder-gray-400"
                required
              />
              <button 
                type="button" 
                className="bg-fast-red hover:bg-fast-red-hover text-white text-xs font-black tracking-widest px-8 py-4 transition-colors uppercase h-full"
              >
                Join Now
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
