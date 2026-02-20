"use client";

import type { Port, PortType } from "@/types/game";
import { edgeMidpoint } from "@/lib/geometry";
import { PORT_OFFSET_RATIO, PORT_RADIUS_RATIO } from "@/lib/constants";

interface Props {
  port: Port;
  cx: number;   // center of host hex in pixels
  cy: number;
  size: number; // hex circumradius
}

const PORT_COLORS: Record<PortType, string> = {
  generic: "#8B6914",
  wood:    "#2D6A2D",
  brick:   "#B22222",
  sheep:   "#7EC850",
  wheat:   "#DAA520",
  stone:   "#708090",
  desert:  "#E8D5A3",
};

const PORT_SYMBOLS: Record<PortType, string> = {
  generic: "?",
  wood:    "W",
  brick:   "Br",
  sheep:   "Sh",
  wheat:   "Wh",
  stone:   "St",
  desert:  "De",
};

const PORT_RATIOS: Record<PortType, string> = {
  generic: "3:1",
  wood:    "2:1",
  brick:   "2:1",
  sheep:   "2:1",
  wheat:   "2:1",
  stone:   "2:1",
  desert:  "2:1",
};

export default function Port({ port, cx, cy, size }: Props) {
  const mid = edgeMidpoint(cx, cy, size, port.edgeIndex);

  // Push port circle outward from hex center along the edge normal
  const dx = mid.x - cx;
  const dy = mid.y - cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const portCx = cx + (dx / len) * size * PORT_OFFSET_RATIO;
  const portCy = cy + (dy / len) * size * PORT_OFFSET_RATIO;

  const portR = size * PORT_RADIUS_RATIO;
  const color = PORT_COLORS[port.type];

  return (
    <g>
      {/* Connector line from hex edge to port */}
      <line
        x1={mid.x} y1={mid.y}
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
