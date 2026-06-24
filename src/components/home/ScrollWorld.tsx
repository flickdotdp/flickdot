"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface ScrollWorldProps {
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  imageSrc: string;
  index: number;
  icon: React.ReactNode;
  quote?: string;
}

export function ScrollWorld({
  title,
  subtitle,
  description,
  accentColor,
  imageSrc,
  index,
  icon,
  quote,
}: ScrollWorldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imgScale   = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [1.12, 1.0, 1.0, 1.12]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.15, 0.82, 1], [0, 1, 1, 0]);
  const textY      = useTransform(scrollYProgress, [0.08, 0.4], [70, 0]);
  const textOp     = useTransform(scrollYProgress, [0.08, 0.32, 0.72, 0.88], [0, 1, 1, 0]);
  const lineWidth  = useTransform(scrollYProgress, [0.2, 0.55], ["0%", "100%"]);

  return (
    <div
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div
        style={{ scale: imgScale, opacity: imgOpacity }}
        className="absolute inset-0"
      >
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        <div className="absolute inset-0 vignette" />
      </motion.div>

      {/* Ambient accent rings */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full border opacity-[0.03] spin-slow pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full border opacity-[0.05] spin-slow-reverse pointer-events-none"
        style={{ borderColor: accentColor }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY, opacity: textOp }}
        className="relative z-10 text-center max-w-5xl mx-auto px-6 py-24"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6 float" style={{ color: accentColor }}>
          <div className="w-12 h-12 flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Eyebrow */}
        <p
          className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mb-5"
          style={{ color: accentColor }}
        >
          {subtitle}
        </p>

        {/* Giant title */}
        <h2 className="text-7xl md:text-9xl lg:text-[11rem] font-black tracking-tighter leading-[0.86] mb-8 text-white">
          {title}
        </h2>

        {/* Animated accent line */}
        <div className="flex justify-center mb-8 overflow-hidden">
          <motion.div
            style={{ width: lineWidth }}
            className="h-[1px] max-w-[200px]"
          >
            <div className="h-full w-full" style={{ backgroundColor: accentColor }} />
          </motion.div>
        </div>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-400 font-light max-w-2xl mx-auto leading-relaxed mb-8">
          {description}
        </p>

        {/* Optional quote */}
        {quote && (
          <blockquote
            className="text-sm md:text-base font-medium italic max-w-xl mx-auto border-l-2 pl-5 text-left"
            style={{ borderColor: accentColor, color: `${accentColor}bb` }}
          >
            {quote}
          </blockquote>
        )}
      </motion.div>

      {/* Large section number watermark */}
      <div
        className="absolute bottom-10 right-10 md:right-16 text-[9rem] md:text-[14rem] font-black leading-none select-none pointer-events-none"
        style={{ color: "rgba(255,255,255,0.022)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
    </div>
  );
}
