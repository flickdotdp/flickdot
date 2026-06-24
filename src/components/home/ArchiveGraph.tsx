"use client";
import { useRef } from "react";
import { useInView } from "framer-motion";

const NODES = [
  // Art — amber
  { id: 0,  label: "Picasso",      x: 12, y: 18, color: "#f59e0b", r: 0.9 },
  { id: 1,  label: "Da Vinci",     x: 22, y: 32, color: "#f59e0b", r: 0.7 },
  { id: 2,  label: "Kahlo",        x:  8, y: 48, color: "#f59e0b", r: 0.8 },
  { id: 3,  label: "Basquiat",     x: 18, y: 65, color: "#f59e0b", r: 0.6 },
  // People — violet
  { id: 4,  label: "Gandhi",       x: 38, y: 12, color: "#c084fc", r: 0.9 },
  { id: 5,  label: "Mandela",      x: 52, y: 22, color: "#c084fc", r: 0.7 },
  { id: 6,  label: "Marie Curie",  x: 40, y: 40, color: "#c084fc", r: 0.8 },
  { id: 7,  label: "Turing",       x: 58, y: 52, color: "#c084fc", r: 0.6 },
  // Literature — sky
  { id: 8,  label: "Tagore",       x: 76, y: 14, color: "#38bdf8", r: 0.9 },
  { id: 9,  label: "Shakespeare",  x: 88, y: 28, color: "#38bdf8", r: 0.7 },
  { id: 10, label: "Neruda",       x: 82, y: 46, color: "#38bdf8", r: 0.8 },
  { id: 11, label: "Virginia Woolf",x: 72, y: 62, color: "#38bdf8", r: 0.6 },
  // Cinema — red
  { id: 12, label: "Kurosawa",     x: 28, y: 80, color: "#f87171", r: 0.8 },
  { id: 13, label: "Satyajit Ray", x: 48, y: 76, color: "#f87171", r: 0.9 },
  { id: 14, label: "Bergman",      x: 64, y: 80, color: "#f87171", r: 0.7 },
  { id: 15, label: "Fellini",      x: 82, y: 74, color: "#f87171", r: 0.6 },
  // Central — FlickDot
  { id: 16, label: "FlickDot",     x: 50, y: 46, color: "#ffffff", r: 1.8 },
];

const EDGES: [number, number][] = [
  // Spokes to center
  [0,16],[1,16],[2,16],[3,16],
  [4,16],[5,16],[6,16],[7,16],
  [8,16],[9,16],[10,16],[11,16],
  [12,16],[13,16],[14,16],[15,16],
  // Within groups
  [0,1],[1,2],[2,3],
  [4,5],[5,6],[6,7],
  [8,9],[9,10],[10,11],
  [12,13],[13,14],[14,15],
  // Cross-group connections
  [0,4],[4,8],[8,12],
  [3,7],[7,11],[11,15],
  [1,6],[6,13],
];

export function ArchiveGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-15%" });

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: "16/8" }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          {NODES.map((n) => (
            <radialGradient key={`rg-${n.id}`} id={`rg-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={n.color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0"    />
            </radialGradient>
          ))}
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="center-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const na = NODES[a], nb = NODES[b];
          const len = Math.hypot(na.x - nb.x, na.y - nb.y);
          const isSpoke = b === 16 || a === 16;
          return (
            <line
              key={i}
              x1={na.x} y1={na.y}
              x2={nb.x} y2={nb.y}
              stroke={isSpoke ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}
              strokeWidth={isSpoke ? "0.12" : "0.08"}
              strokeDasharray={`${len} ${len}`}
              strokeDashoffset={inView ? 0 : len}
              style={{
                transition: `stroke-dashoffset ${0.9 + i * 0.035}s cubic-bezier(0.22,1,0.36,1) ${i * 0.025}s`,
              }}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n) => {
          const isCenter = n.id === 16;
          const delay = n.id * 0.045;
          return (
            <g key={n.id}>
              {/* Halo glow */}
              <circle
                cx={n.x} cy={n.y}
                r={n.r * (isCenter ? 5 : 3.5)}
                fill={`url(#rg-${n.id})`}
                opacity={inView ? (isCenter ? 0.5 : 0.35) : 0}
                style={{ transition: `opacity 1.2s ${delay + 0.3}s ease` }}
              />
              {/* Core */}
              <circle
                cx={n.x} cy={n.y}
                r={n.r * (isCenter ? 0.6 : 0.4)}
                fill={n.color}
                filter={isCenter ? "url(#center-glow)" : "url(#node-glow)"}
                opacity={inView ? 1 : 0}
                style={{ transition: `opacity 0.6s ${delay + 0.5}s ease` }}
              />
              {/* Label */}
              <text
                x={n.x}
                y={n.y + n.r * (isCenter ? 1.4 : 1.2) + (isCenter ? 1.8 : 1.4)}
                textAnchor="middle"
                fontSize={isCenter ? "2.2" : "1.6"}
                fontWeight={isCenter ? "800" : "400"}
                fill={n.color}
                opacity={inView ? (isCenter ? 0.9 : 0.6) : 0}
                style={{
                  transition: `opacity 0.6s ${delay + 0.7}s ease`,
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: isCenter ? "0.05em" : "0",
                }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
