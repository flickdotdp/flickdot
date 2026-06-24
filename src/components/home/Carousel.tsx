import React from "react";
import { CarouselItem } from "./CarouselItem";

interface CarouselProps {
  items: { id: string; thumbnail: string; title?: string }[];
  // future options like autoplay could be added
}

export function Carousel({ items }: CarouselProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.8; // 80% width
      rowRef.current.scrollTo({
        left: direction === "left" ? rowRef.current.scrollLeft - scrollAmount : rowRef.current.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <div
        className={`absolute left-0 top-0 bottom-4 w-12 bg-black/60 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm -ml-8 md:-ml-12 rounded-r-lg ${!isScrolled ? "hidden" : ""}`}
        onClick={() => handleScroll("left")}
      >
        {/* replace with an icon if needed */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>

      {/* Scroll container */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollLeft > 20)}
      >
        {items.map((item, i) => (
          <CarouselItem key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Right Arrow */}
      <div
        className="absolute right-0 top-0 bottom-4 w-12 bg-black/60 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm -mr-8 md:-mr-16 rounded-l-lg"
        onClick={() => handleScroll("right")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
