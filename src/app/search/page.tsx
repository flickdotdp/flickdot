import { Navbar } from "@/components/layout/Navbar";

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      <Navbar />
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-8 mt-12">Search</h1>
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-lg overflow-hidden border border-white/20 p-2 flex items-center shadow-xl focus-within:border-fast-red transition-all">
        <input type="text" placeholder="Movies, Shows, or Cast" className="flex-1 bg-transparent text-white px-6 py-4 outline-none placeholder-gray-500" />
        <button className="bg-fast-red text-white font-bold px-8 py-4 rounded uppercase text-sm tracking-widest hover:bg-fast-red/80 transition">Search</button>
      </div>
      <div className="mt-16">
        <h2 className="text-xl font-bold text-white mb-6">Trending Searches</h2>
        <div className="flex flex-wrap gap-4">
          {["Global Dominance", "Flickstory", "Cinemayiloode", "Short films"].map((term) => (
             <span key={term} className="px-6 py-2 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white cursor-pointer transition">
               {term}
             </span>
          ))}
        </div>
      </div>
    </div>
  );
}
