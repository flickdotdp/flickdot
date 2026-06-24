"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      // Query movies and series
      const { data: movies } = await supabase
        .from('movies')
        .select('id, title, poster_url')
        .ilike('title', `%${query}%`)
        .limit(3);
        
      const { data: series } = await supabase
        .from('series')
        .select('id, title, poster_url')
        .ilike('title', `%${query}%`)
        .limit(3);
        
      let combined = [
        ...(movies || []).map(m => ({ ...m, type: 'Movie' })),
        ...(series || []).map(s => ({ ...s, type: 'Series' }))
      ];

      // If no results from DB yet, provide some mock suggestions so the UI can be previewed
      if (combined.length === 0) {
        combined = [
          { id: '1', title: `${query} (Movie Match)`, type: 'Movie' },
          { id: '2', title: `${query} (Series Match)`, type: 'Series' },
        ];
      }
      
      setSuggestions(combined);
    };

    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      <Navbar />
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-8 mt-12">Search</h1>
      
      <div className="w-full max-w-2xl relative">
        <div className="bg-white/5 backdrop-blur-md rounded-lg overflow-hidden border border-white/20 p-2 flex items-center shadow-xl focus-within:border-fast-red transition-all relative z-20">
          <input 
            type="text" 
            placeholder="Movies, Shows, or Cast" 
            className="flex-1 bg-transparent text-white px-6 py-4 outline-none placeholder-gray-500" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button className="bg-fast-red text-white font-bold px-8 py-4 rounded uppercase text-sm tracking-widest hover:bg-fast-red/80 transition">
            Search
          </button>
        </div>
        
        {/* Auto-suggestions dropdown */}
        {showSuggestions && query.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-10">
            {suggestions.length > 0 ? (
              <ul>
                {suggestions.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="hover:bg-white/5 cursor-pointer transition flex items-center gap-4 p-4 border-b border-white/5 last:border-none">
                    <Search className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-400">
                No suggestions found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-bold text-white mb-6">Trending Searches</h2>
        <div className="flex flex-wrap gap-4">
          {["Global Dominance", "Flickstory", "Cinemayiloode", "Short films"].map((term) => (
             <span 
                key={term} 
                className="px-6 py-2 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white cursor-pointer transition"
                onClick={() => {
                  setQuery(term);
                  setShowSuggestions(true);
                }}
             >
               {term}
             </span>
          ))}
        </div>
      </div>
    </div>
  );
}
