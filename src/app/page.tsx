"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MessageCircle,
  Film,
  ArrowDown,
  Sparkles,
  BookOpen,
  Users,
  Clapperboard,
  Play,
  ChevronRight,
} from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useInView,
  useSpring,
} from "framer-motion";
import { ParticleCanvas } from "@/components/home/ParticleCanvas";
import { ArchiveGraph } from "@/components/home/ArchiveGraph";
import { ScrollWorld } from "@/components/home/ScrollWorld";
import { Carousel } from "@/components/home/Carousel";

/* ─── Reveal helper ─── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stat counter ─── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 80;
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Worlds config ─── */
const WORLDS = [
  {
    title: "Art",
    subtitle: "Visual Expression",
    description:
      "Traditional and contemporary art forms, visual artists, craftsmen, performers, and creative movements that have shaped the aesthetic soul of humanity.",
    accentColor: "#f59e0b",
    imageSrc: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=1600&auto=format&fit=crop",
    icon: <Sparkles className="w-8 h-8" />,
    quote: "Every painting is a voyage into a sacred harbour.",
  },
  {
    title: "People",
    subtitle: "Human Stories",
    description:
      "Extraordinary individuals, local heroes, cultural icons, unsung contributors, and remarkable human journeys that define our collective identity.",
    accentColor: "#c084fc",
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1600&auto=format&fit=crop",
    icon: <Users className="w-8 h-8" />,
    quote: "Behind every forgotten name is an unforgettable story.",
  },
  {
    title: "Literature",
    subtitle: "The Written Word",
    description:
      "Writers, poets, storytellers, publishers, literary heritage, and the timeless power of words that carry civilizations across centuries.",
    accentColor: "#38bdf8",
    imageSrc: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600&auto=format&fit=crop",
    icon: <BookOpen className="w-8 h-8" />,
    quote: "A book is a dream you hold in your hands.",
  },
  {
    title: "Cinema",
    subtitle: "Moving Imagery",
    description:
      "The world of filmmaking, visual storytelling, film history, and the evolution of moving imagery as a lens into the human condition.",
    accentColor: "#f87171",
    imageSrc: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1600&auto=format&fit=crop",
    icon: <Clapperboard className="w-8 h-8" />,
    quote: "Cinema is a matter of what's in the frame and what's out.",
  },
];

const TICKER_WORDS = ["ART", "LITERATURE", "PEOPLE", "CINEMA", "STORIES", "CULTURE", "HERITAGE", "CREATIVITY", "LEGACY"];
const YOUTUBE_IDS  = ["L7aRxqziN8w", "AvqXCOoCbhw", "LtOwx_tqJsw"];

/* ═══════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.07], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 0.1], [0, -60]);

  useMotionValueEvent(scrollYProgress, "change", (v) => setScrolled(v > 0.005));

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative bg-black text-white overflow-x-hidden">

      {/* ── Grain overlay ── */}
      <div className="pointer-events-none fixed inset-0 z-[999] landing-grain opacity-40 mix-blend-soft-light" />

      {/* ══════════════════════════════════════════════
          01 — CINEMATIC HERO
          ══════════════════════════════════════════════ */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      >
        {/* Deep black base */}
        <div className="absolute inset-0 bg-black" />

        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Volumetric ambient glow layers */}
        <div
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full pointer-events-none breathe"
          style={{
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] rounded-full pointer-events-none spin-slow"
          style={{
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(255,255,255,0.025)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full pointer-events-none spin-slow-reverse"
          style={{
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(220,38,38,0.04)",
          }}
        />

        {/* Bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />

        {/* ── Fixed navigation ── */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-28 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">FlickDot</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="hidden md:flex text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-[0.18em] transition-colors"
              onClick={() => document.getElementById("worlds")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore
            </Button>
            <Button
              variant="ghost"
              className="hidden md:flex text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-[0.18em] transition-colors"
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
            >
              About
            </Button>
            <Button
              onClick={() => router.push("/home")}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2 transition-colors"
            >
              Enter Platform
            </Button>
          </div>
        </header>

        {/* ── Hero centrepiece ── */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={heroReady ? { opacity: 1, letterSpacing: "0.35em" } : {}}
            transition={{ duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10px] md:text-xs font-black uppercase text-red-400 mb-8 tracking-[0.35em]"
          >
            Art · People · Literature · Cinema
          </motion.p>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
            animate={heroReady ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-8xl lg:text-[9rem] xl:text-[11rem] font-black tracking-tighter leading-[0.85] text-white"
          >
            Flick
            <span className="bg-gradient-to-r from-red-500 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Dot
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-base md:text-lg lg:text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Preserving Stories. Celebrating Creators. Inspiring Generations.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => router.push("/home")}
              className="px-10 py-6 text-sm font-bold bg-white text-black rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <Play className="w-4 h-4 mr-2 fill-black" />
              Enter Platform
            </Button>
            <Button
              size="lg"
              onClick={() => window.open("https://wa.me/8889390303", "_blank")}
              className="px-10 py-6 text-sm font-bold bg-[#25D366]/10 text-[#25D366] rounded-2xl border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="mr-2 w-4 h-4" />
              Join Community
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={heroReady ? { opacity: 1 } : {}}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => document.getElementById("ticker")?.scrollIntoView({ behavior: "smooth" })}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          >
            <ArrowDown className="w-4 h-4 text-white/30" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════
          02 — TICKER STRIP
          ══════════════════════════════════════════════ */}
      <div id="ticker" className="w-full overflow-hidden border-y border-white/[0.04] py-5 bg-black">
        <div className="ticker-strip flex whitespace-nowrap">
          {[...TICKER_WORDS, ...TICKER_WORDS, ...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
            <span
              key={i}
              className="text-sm md:text-base font-black uppercase tracking-[0.3em] text-white/[0.06] mx-8 flex items-center gap-4"
            >
              <span className="w-1 h-1 rounded-full bg-red-600/50" />
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          03 — STATS BAR
          ══════════════════════════════════════════════ */}
      <section className="w-full bg-black py-20 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 10000, suffix: "+", label: "Stories Documented" },
            { value: 50,    suffix: "+", label: "Original Productions" },
            { value: 120,   suffix: "+", label: "Cultural Contributors" },
            { value: 4,     suffix: "",  label: "Pillars of Culture" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          04 — FOUR WORLDS (scroll journey)
          ══════════════════════════════════════════════ */}
      <div id="worlds">
        {/* Divider */}
        <div className="w-full bg-black py-24 text-center">
          <Reveal>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-4">The Journey</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
              Four Worlds.<br />
              <span className="text-gray-600">Infinite Stories.</span>
            </h2>
          </Reveal>
        </div>

        {WORLDS.map((world, i) => (
          <ScrollWorld key={world.title} {...world} index={i} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          05 — ABOUT
          ══════════════════════════════════════════════ */}
      <section id="about" className="w-full py-40 bg-black">
        <div className="max-w-5xl mx-auto px-6 md:px-16 text-center">
          <Reveal>
            <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.4em] mb-6">
              Our Mission
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02] mb-12">
              Discovering, preserving, and{" "}
              <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                celebrating
              </span>{" "}
              stories that deserve to be remembered.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed max-w-3xl mx-auto">
              We believe that behind every community, art form, book, song, craft, and cultural
              movement are people whose contributions often go unnoticed. Our mission is to document,
              preserve, and share these stories for future generations while creating original
              entertainment for today&apos;s audiences.
            </p>
          </Reveal>
          <Reveal delay={0.35}>
            <div className="mt-14 inline-flex items-center gap-3 text-sm font-semibold text-gray-500 hover:text-white cursor-pointer transition-colors group"
              onClick={() => router.push("/home")}>
              <span className="uppercase tracking-[0.2em]">Start Exploring</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Glow divider ── */}
      <div className="divider-glow mx-auto max-w-4xl" />

      {/* ══════════════════════════════════════════════
          06 — MISSION EDITORIAL (split)
          ══════════════════════════════════════════════ */}
      <section className="w-full bg-black">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] block mb-4">
                Preserving Legacy
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-8">
                Building a Living Archive of Human Creativity
              </h3>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="w-12 h-[2px] bg-red-600 mb-8" />
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-base text-gray-500 font-light leading-relaxed mb-5">
                Across villages, towns, cities, and generations, countless artists, writers, musicians,
                filmmakers, performers, and cultural contributors have shaped society without receiving
                the recognition they deserve.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="text-base text-gray-500 font-light leading-relaxed mb-8">
                FlickDot identifies these hidden legends, documents their journeys, preserves their
                legacy, and introduces their stories to the world.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <blockquote className="text-base text-white/75 font-medium italic border-l-2 border-red-600 pl-5">
                &ldquo;Every forgotten story is a piece of history waiting to be rediscovered.&rdquo;
              </blockquote>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={0.2}>
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden ring-1 ring-white/[0.06]">
                <Image
                  src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=900&auto=format&fit=crop"
                  alt="Filmmaker"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Floating label */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="glass-card rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 mb-1">Now Documenting</p>
                    <p className="text-sm font-semibold text-white">Hidden legends of Indian cinema</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          07 — FEATURED VIDEOS (carousel)
          ══════════════════════════════════════════════ */}
      <section className="w-full px-6 md:px-16 lg:px-28 py-28 bg-black">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] block mb-2">
                Now Streaming
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Featured Content</h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/home")}
              className="hidden md:flex text-xs font-semibold text-gray-500 hover:text-white uppercase tracking-[0.18em] gap-2"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Reveal>
        <Carousel
          items={YOUTUBE_IDS.map((id) => ({
            id,
            thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          }))}
        />
      </section>

      {/* ── Glow divider ── */}
      <div className="divider-glow mx-auto max-w-4xl" />

      {/* ══════════════════════════════════════════════
          08 — ORIGINAL CONTENT
          ══════════════════════════════════════════════ */}
      <section className="w-full bg-black py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6">
            <Reveal>
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden ring-1 ring-white/[0.06]">
                <Image
                  src="https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=900&auto=format&fit=crop"
                  alt="Original content"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 to-transparent" />
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-6">
            <Reveal>
              <span className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] block mb-2">
                What We Create
              </span>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Original Content</h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-base text-gray-500 font-light mb-8">
                We develop and produce original content across multiple formats:
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="flex flex-wrap gap-2 mb-10">
                {[
                  "Music Videos", "Short Films", "Web Series", "Documentaries",
                  "Artist Profiles", "Cultural Stories", "Heritage Films",
                  "Interviews", "Behind-the-Scenes", "Experimental",
                ].map((f) => (
                  <span
                    key={f}
                    className="text-[12px] font-medium text-gray-400 glass-card px-4 py-1.5 rounded-full hover:text-gray-200 transition-all cursor-default"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="border-l-2 border-red-600 pl-5">
                <p className="text-base text-white/70 font-medium leading-relaxed">
                  Every project is designed to entertain, inspire, educate, and preserve cultural memory.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          09 — ARCHIVE NEURAL GRAPH
          ══════════════════════════════════════════════ */}
      <section className="w-full bg-black py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <Reveal className="text-center mb-20">
            <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.4em] mb-4">
              Living Archive
            </p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Millions of Stories,{" "}
              <span className="text-gray-600">One Network</span>
            </h2>
            <p className="text-base text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
              Every creator, story, and work of art is connected. Our growing archive maps the
              neural pathways of human creativity across time, culture, and geography.
            </p>
          </Reveal>

          {/* The archive graph */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />
            <ArchiveGraph />
          </div>

          {/* Legend */}
          <Reveal delay={0.3} className="flex flex-wrap justify-center gap-8 mt-16">
            {[
              { label: "Art",        color: "#f59e0b" },
              { label: "People",     color: "#c084fc" },
              { label: "Literature", color: "#38bdf8" },
              { label: "Cinema",     color: "#f87171" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full dot-blink" style={{ backgroundColor: l.color }} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{l.label}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Glow divider ── */}
      <div className="divider-glow mx-auto max-w-4xl" />

      {/* ══════════════════════════════════════════════
          10 — AI + CREATIVITY
          ══════════════════════════════════════════════ */}
      <section className="w-full bg-black py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <Reveal>
              <span className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em] block mb-2">
                Innovation
              </span>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-[1.08]">
                Human Creativity<br />
                <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                  Meets AI
                </span>
              </h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-base text-gray-500 font-light leading-relaxed mb-5">
                We embrace the future of storytelling through the thoughtful use of Artificial
                Intelligence — combining human creativity with AI-powered tools to explore new ways
                of producing films, documentaries, music videos, and immersive narratives.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="glass-card rounded-2xl p-6 mt-4">
                <p className="text-base text-white/60 font-medium text-center leading-relaxed">
                  Technology is not here to replace creativity — it is here to{" "}
                  <span className="text-red-400 font-bold">expand</span> what creators can achieve.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <Reveal>
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden ring-1 ring-white/[0.06]">
                <Image
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=900&auto=format&fit=crop"
                  alt="AI & Creativity"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          11 — FULL-BLEED ARCHIVE CTA BANNER
          ══════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/netflix_hero.png"
          alt="Archive"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/80" />
        {/* Particle-like floating dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full float"
            style={{
              width: `${((Math.abs(Math.sin(i * 1.1)) * 4) + 2).toFixed(2)}px`,
              height: `${((Math.abs(Math.sin(i * 1.2)) * 4) + 2).toFixed(2)}px`,
              left: `${(Math.abs(Math.sin(i * 1.3)) * 100).toFixed(2)}%`,
              top: `${(Math.abs(Math.sin(i * 1.4)) * 100).toFixed(2)}%`,
              backgroundColor: ["#f59e0b", "#c084fc", "#38bdf8", "#f87171", "#ffffff"][i % 5],
              opacity: (0.3 + (Math.abs(Math.sin(i * 1.5)) * 0.4)).toFixed(2),
              animationDelay: `${(i * 0.5).toFixed(2)}s`,
              animationDuration: `${(6 + (Math.abs(Math.sin(i * 1.6)) * 8)).toFixed(2)}s`,
            }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, delay: 0.2 }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          <p className="text-red-500 text-[11px] font-bold uppercase tracking-[0.4em] mb-6">
            Growing Every Day
          </p>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-white">
            Building a Living Archive
          </h2>
          <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-3xl mx-auto mb-12">
            More than a media platform — a growing archive of people, places, traditions, ideas, and
            creative expressions. Through films, articles, interviews, and digital experiences, we
            preserve cultural memory for future generations.
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/home")}
            className="px-12 py-6 text-sm font-bold bg-white text-black rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
          >
            Explore the Archive
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          12 — FINAL HOOK
          ══════════════════════════════════════════════ */}
      <section className="relative w-full bg-black py-48 px-6 overflow-hidden">
        {/* Giant watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[16rem] md:text-[28rem] font-black tracking-tighter text-white/[0.012] leading-none">
            FD
          </span>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <span className="text-4xl md:text-6xl font-black tracking-tight text-gray-700 block mb-4">
              Preserving the Past.
            </span>
          </Reveal>
          <Reveal delay={0.18}>
            <span className="text-4xl md:text-6xl font-black tracking-tight text-gray-400 block mb-4">
              Celebrating the Present.
            </span>
          </Reveal>
          <Reveal delay={0.36}>
            <span className="text-4xl md:text-6xl font-black tracking-tight text-white block mb-16">
              Creating the Future.
            </span>
          </Reveal>
          <Reveal delay={0.55}>
            <span className="inline-block text-base md:text-lg font-black uppercase tracking-[0.15em] text-white bg-red-600 px-10 py-5 rounded-full pulse-glow cursor-pointer"
              onClick={() => router.push("/home")}>
              Every Story Begins with a Dot.
            </span>
          </Reveal>
        </div>
      </section>

      {/* ── Sticky nav (appears on scroll) ── */}
      <motion.nav
        initial={false}
        animate={{ y: scrolled ? 0 : -80, opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="fixed top-0 inset-x-0 z-[100] bg-black/80 backdrop-blur-2xl border-b border-white/[0.05] px-6 md:px-16 lg:px-28 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">FlickDot</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="hidden md:flex text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-[0.15em]"
            onClick={() => document.getElementById("worlds")?.scrollIntoView({ behavior: "smooth" })}
          >
            Worlds
          </Button>
          <Button
            variant="ghost"
            className="hidden md:flex text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-[0.15em]"
            onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
          >
            About
          </Button>
          <Button
            onClick={() => router.push("/home")}
            className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2"
          >
            Enter
          </Button>
        </div>
      </motion.nav>

    </div>
  );
}
