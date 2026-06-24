"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YouTubePlayer } from "@/components/ui/YouTubePlayer";
import { MoreInfoButton } from "@/components/home/MoreInfoButton";
import { motion, AnimatePresence } from "framer-motion";

const heroBanners = [
  { 
    id: "L7aRxqziN8w", 
    title: "GLOBAL\\nDOMINANCE", 
    tag: "F SERIES",
    rank: "#1 in TV Shows Today",
    description: "An exclusive look into the most breathtaking cinematic achievements of the year. Uncover the truth behind the curtain in this thrilling documentary series." 
  },
  { 
    id: "GX1vz0T-dIE", 
    title: "BEHIND\\nTHE SCENES", 
    tag: "F DOCUMENTARY",
    rank: "#3 in Movies Today",
    description: "Step onto the set and experience the chaos, creativity, and passion that goes into making Flickdot's most ambitious projects." 
  },
  { 
    id: "OBAeyeYSjFQ", 
    title: "VISUAL\\nEFFECTS", 
    tag: "F ORIGINALS",
    rank: "New Arrival",
    description: "A deep dive into the mind-bending visual effects that bring impossible worlds to life. See the magic behind the pixels." 
  }
];

export function HeroBannerRotator() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    }, 15000); // Rotate every 15 seconds
    return () => clearInterval(timer);
  }, []);

  const currentBanner = heroBanners[currentIndex];

  return (
    <div className="relative min-h-[90vh] w-full bg-fast-black flex flex-col md:flex-row overflow-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      {/* Full Width Background Video (We use AnimatePresence for smooth transitions if needed, but for iframe it's tricky. Let's key it by ID) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <YouTubePlayer 
              videoId={currentBanner.id}
              autoplay={true}
              mute={true}
              loop={true}
              controls={false}
              className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>

        {/* Netflix-style Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      </div>

      {/* Left Content (Netflix Style) */}
      <div className="w-full md:w-[50%] flex flex-col justify-center z-20 pt-24 pb-32 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentBanner.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            {/* Tag Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-[#E50914] font-bold tracking-[0.2em] text-xs">
                <span className="text-2xl leading-none">F</span>
                <span>{currentBanner.tag}</span>
              </div>
            </div>

            {/* Title */}
            <h1 
              className="text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-2xl uppercase tracking-tight whitespace-pre-line"
            >
              {currentBanner.title}
            </h1>

            {/* Rank Badge */}
            <div className="flex items-center gap-2 mb-4 drop-shadow-md">
               <div className="bg-[#E50914] text-white font-bold text-[10px] w-6 h-6 rounded-sm shadow-md flex flex-col items-center justify-center leading-none border border-white/20">
                  <span className="text-[6px] tracking-tighter">TOP</span>
                  <span>10</span>
               </div>
               <span className="text-white font-bold text-xl drop-shadow-md">{currentBanner.rank}</span>
            </div>
            
            <p className="max-w-xl text-lg text-white font-medium leading-normal mb-8 drop-shadow-xl line-clamp-3">
              {currentBanner.description}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 items-center">
              <Link href={`/watch/${currentBanner.id}`}>
                <Button className="bg-white hover:bg-white/80 text-black font-bold text-lg px-8 py-6 rounded-md transition-all shadow-xl">
                  <Play className="h-6 w-6 mr-2 fill-black" /> Play
                </Button>
              </Link>
              
              <MoreInfoButton 
                videoId={currentBanner.id} 
                title={currentBanner.title.replace("\\n", " ")} 
                description={currentBanner.description} 
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="absolute bottom-16 left-0 flex gap-2">
          {heroBanners.map((_, idx) => (
            <div 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 cursor-pointer transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
