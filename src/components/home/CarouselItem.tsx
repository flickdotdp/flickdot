import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface CarouselItemProps {
  item: { id: string; thumbnail: string; title?: string };
  index: number;
}

export function CarouselItem({ item, index }: CarouselItemProps) {
  const handleClick = () => {
    window.open(`https://www.youtube.com/watch?v=${item.id}`, "_blank");
  };
  return (
    <div
      className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 ring-1 ring-white/5 hover:ring-red-500/30 transition-all duration-500 carousel-item"
      onClick={handleClick}
    >
      <Image
        src={item.thumbnail}
        alt={item.title || "Video"}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
          <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
        </div>
      </div>
      {/* Badges */}
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">New</span>
        <span className="text-[9px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur text-white px-2 py-0.5 rounded border border-white/10">4K</span>
      </div>
    </div>
  );
}
