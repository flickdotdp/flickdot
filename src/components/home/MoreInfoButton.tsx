"use client";

import { useState } from "react";
import { Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import Image from "next/image";

interface MoreInfoButtonProps {
  videoId: string;
  title?: string;
  description?: string;
  className?: string;
}

export function MoreInfoButton({ videoId, title = "GLOBAL DOMINANCE", description = "An exclusive look into the most breathtaking cinematic achievements of the year. Uncover the truth behind the curtain in this thrilling documentary series.", className }: MoreInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className={`bg-gray-500/60 hover:bg-gray-500/40 text-white font-bold text-lg px-8 py-6 rounded-md border-transparent transition-all backdrop-blur-md shadow-xl ${className || ''}`}
      >
        <Info className="h-6 w-6 mr-2" /> More Info
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        className="max-w-3xl p-0 overflow-hidden bg-zinc-900 border-zinc-800"
      >
        <div className="relative aspect-video w-full">
          <Image 
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
            <div className="flex gap-4">
              <Link href={`/watch/${videoId}`}>
                <Button className="bg-white hover:bg-white/80 text-black font-bold px-6 py-2 rounded-md">
                  <Play className="h-4 w-4 mr-2 fill-black" /> Play Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="p-6 text-gray-300">
          <div className="flex items-center gap-4 text-sm font-medium mb-4">
            <span className="text-green-400 font-bold">98% Match</span>
            <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700">HD</span>
            <span className="px-1 border border-zinc-500 rounded text-xs text-zinc-400">TV-MA</span>
          </div>
          <p className="text-lg leading-relaxed">{description}</p>
          
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Cast: </span>
              <span className="text-zinc-300">Flickdot Ensemble</span>
            </div>
            <div>
              <span className="text-zinc-500">Genres: </span>
              <span className="text-zinc-300">Documentary, Thriller</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
