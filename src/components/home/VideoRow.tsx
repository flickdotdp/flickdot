"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VideoRowProps {
  title: string;
  catIndex?: number;
  children: React.ReactNode;
}

export function VideoRow({ title, catIndex, children }: VideoRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.8; // Scroll by 80% of the visible width
      
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 group/row relative">
      <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
        {title}
        {catIndex === 1 && <span className="text-sm font-bold text-gray-400">&gt;</span>}
      </h2>
      
      <div className="relative">
        {/* Left Arrow (only visible if scrolled) */}
        <div 
          className={`absolute left-0 top-0 bottom-4 w-12 bg-black/60 z-30 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm -ml-8 md:-ml-12 rounded-r-lg ${!isScrolled ? 'hidden' : ''}`}
          onClick={() => handleScroll("left")}
        >
          <ChevronLeft className="text-white w-8 h-8 hover:scale-125 transition-transform" />
        </div>

        {/* Scroll Container */}
        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollLeft > 20)}
        >
          {children}
        </div>

        {/* Right Arrow */}
        <div 
          className="absolute right-0 top-0 bottom-4 w-12 bg-black/60 z-30 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm -mr-8 md:-mr-16 rounded-l-lg"
          onClick={() => handleScroll("right")}
        >
          <ChevronRight className="text-white w-8 h-8 hover:scale-125 transition-transform" />
        </div>
      </div>
    </div>
  );
}
