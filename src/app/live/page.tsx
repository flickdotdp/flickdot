import { Navbar } from "@/components/layout/Navbar";

export default function LiveTVPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      <Navbar />
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-8 mt-12 flex items-center gap-4">
        Live TV
        <span className="bg-fast-red text-white text-xs px-2 py-1 rounded animate-pulse">ON AIR</span>
      </h1>
      
      <div className="w-full aspect-video bg-black rounded-2xl border border-white/10 flex items-center justify-center mb-12 shadow-[0_0_50px_rgba(255,0,77,0.1)]">
         <div className="flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-gray-500 mb-2">Live Broadcast Starting Soon</h3>
            <p className="text-gray-600 text-sm">Stay tuned for the next live event on Flickdot.</p>
         </div>
      </div>

    </div>
  );
}
