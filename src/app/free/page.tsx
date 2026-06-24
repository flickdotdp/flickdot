import { Navbar } from "@/components/layout/Navbar";

export default function FreePage() {
  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      <Navbar />
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-8 mt-12">Free to Watch</h1>
      <p className="text-gray-400 mb-12 max-w-2xl text-lg">Enjoy a selection of free movies, series, and short films available without a subscription. Powered by ads.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-video bg-white/5 rounded-lg border border-white/10 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
