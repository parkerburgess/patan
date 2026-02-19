"use client";

import type { Port } from "@/types/game";

interface Props {
  port: Port;
  cx: number;   // center of host hex in pixels
  cy: number;
  size: number; // hex circumradius
}

const PORT_COLORS: Record<string, string> = {
  generic: "#8B6914",
  wood:    "#2D6A2D",
  brick:   "#B22222",
  sheep:   "#7EC850",
  wheat:   "#DAA520",
  stone:   "#708090",
};

const PORT_SYMBOLS: Record<string, string> = {
  generic: "?",
  wood:    "W",
  brick:   "Br",
  sheep:   "Sh",
  wheat:   "Wh",
  stone:   "St",
};

const PORT_RATIOS: Record<string, string> = {
  generic: "3:1",
  wood:    "2:1",
  brick:   "2:1",
  sheep:   "2:1",
  wheat:   "2:1",
  stone:   "2:1",
};

export default function Port({ port, cx, cy, size }: Props) {
  // Edge i = between corner i and corner (i+1)%6
  // Pointy-top: corner i at angle (60*i + 30)°
  const aRad = ((60 * port.edgeIndex + 30) * Math.PI) / 180;
  const bRad = ((60 * (port.edgeIndex + 1) + 30) * Math.PI) / 180;

  // Midpoint of the edge
  const midX = cx + size * (Math.cos(aRad) + Math.cos(bRad)) / 2;
  const midY = cy + size * (Math.sin(aRad) + Math.sin(bRad)) / 2;

  // Push port circle outward from hex center
  const dx = midX - cx;
  const dy = midY - cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const portCx = cx + (dx / len) * size * 1.55;
  const portCy = cy + (dy / len) * size * 1.55;

  const portR = size * 0.24;
  const color = PORT_COLORS[port.type];

  return (
    <g>
      {/* Connector line from hex edge to port */}
      <line
        x1={midX} y1={midY}
        x2={portCx} y2={portCy}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      {/* Port circle */}
      <circle cx={portCx} cy={portCy} r={portR} fill={color} stroke="#1a1a1a" strokeWidth={1.5} />
      {/* Symbol */}
      <text
        x={portCx}
        y={portCy - portR * 0.18}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={portR * 0.78}
        fontWeight="bold"
        fill="#ffffff"
        style={{ pointerEvents: "none" }}
      >
        {PORT_SYMBOLS[port.type]}
      </text>
      {/* Ratio */}
      <text
        x={portCx}
        y={portCy + portR * 0.62}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={portR * 0.6}
        fill="#ffffffcc"
        style={{ pointerEvents: "none" }}
      >
        {PORT_RATIOS[port.type]}
      </text>
    </g>
  );
}
