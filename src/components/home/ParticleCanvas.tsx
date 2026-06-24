"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const COLORS = [
  "255,255,255",
  "255,255,255",
  "255,255,255",
  "220,38,38",
  "251,146,60",
  "248,250,252",
  "156,163,175",
  "253,186,116",
];

export function ParticleCanvas({ scrollRef }: { scrollRef?: React.RefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const internalScrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 250 : 650;

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 2.2 + 0.4,
      opacity: Math.random() * 0.65 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onScroll = () => {
      internalScrollRef.current = window.scrollY;
    };
    const onResize = () => setSize();

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    let time = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      time += 0.004;

      const mx = (mouseRef.current.x / W - 0.5) * 28;
      const my = (mouseRef.current.y / H - 0.5) * 18;
      const sy = internalScrollRef.current * 0.15;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;
        if (p.y < -8) p.y = H + 8;
        if (p.y > H + 8) p.y = -8;

        const depth = 0.35 + p.z * 0.65;
        const px = p.x + mx * (1 - p.z) * 0.7;
        const py = p.y + my * (1 - p.z) * 0.7 - sy * (1 - p.z) * 0.4;
        const sz = p.size * depth;
        const op = p.opacity * depth;

        // Soft glow halo
        const grad = ctx.createRadialGradient(px, py, 0, px, py, sz * 7);
        grad.addColorStop(0,   `rgba(${p.color},${op * 0.9})`);
        grad.addColorStop(0.35, `rgba(${p.color},${op * 0.25})`);
        grad.addColorStop(1,   `rgba(${p.color},0)`);
        ctx.beginPath();
        ctx.arc(px, py, sz * 7, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${Math.min(1, op * 1.6)})`;
        ctx.fill();
      }

      // Ambient central glow (sphere suggestion)
      const cx = W / 2;
      const cy = H / 2 - sy * 0.1;
      const r = Math.min(W, H) * 0.18 * (0.9 + Math.sin(time * 0.7) * 0.1);
      const sGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      sGrad.addColorStop(0,   "rgba(220,38,38,0.05)");
      sGrad.addColorStop(0.5, "rgba(220,38,38,0.02)");
      sGrad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = sGrad;
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
