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

const PORT_RATIOS: Record<PortType, string> = {
  generic: "3:1",
  wood:    "2:1",
  brick:   "2:1",
  sheep:   "2:1",
  wheat:   "2:1",
  stone:   "2:1",
  desert:  "2:1",
};

const PORT_IMAGES: Partial<Record<PortType, string>> = {
  wood:  "/images/wood.png",
  brick: "/images/brick.png",
  sheep: "/images/sheep.png",
  wheat: "/images/wheat.png",
  stone: "/images/stone.png",
  generic: "/images/generic.png"
};

export default function Port({ port, cx, cy, size }: Props) {
  // Two corners that define this edge
  const angleA = ((60 * port.edgeIndex + 30) * Math.PI) / 180;
  const angleB = ((60 * (port.edgeIndex + 1) + 30) * Math.PI) / 180;
  const cornerA = { x: cx + size * Math.cos(angleA), y: cy + size * Math.sin(angleA) };
  const cornerB = { x: cx + size * Math.cos(angleB), y: cy + size * Math.sin(angleB) };

  // Push port circle outward from hex center along the edge normal
  const mid = edgeMidpoint(cx, cy, size, port.edgeIndex);
  const dx = mid.x - cx;
  const dy = mid.y - cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const portCx = cx + (dx / len) * size * PORT_OFFSET_RATIO;
  const portCy = cy + (dy / len) * size * PORT_OFFSET_RATIO;

  const portR = size * PORT_RADIUS_RATIO;
  const color = PORT_COLORS[port.type];
  const image = PORT_IMAGES[port.type];

  // Unique clip ID per port instance
  const clipId = `port-clip-${Math.round(portCx)}-${Math.round(portCy)}`;

  return (
    <g>
      <defs>
        {image && (
          <clipPath id={clipId}>
            <circle cx={portCx} cy={portCy} r={portR} />
          </clipPath>
        )}
      </defs>

      {/* Connector lines from hex edge nodes to port */}
      <line
        x1={cornerA.x} y1={cornerA.y}
        x2={portCx} y2={portCy}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <line
        x1={cornerB.x} y1={cornerB.y}
        x2={portCx} y2={portCy}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Port circle */}
      <circle cx={portCx} cy={portCy} r={portR} fill={color} stroke="#1a1a1a" strokeWidth={1.5} />

      {/* Resource image clipped to circle */}
      {image && (
        <image
          href={image}
          x={portCx - portR}
          y={portCy - portR}
          width={portR * 2}
          height={portR * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          opacity={0.85}
        />
      )}

      {/* Generic port: show "?" symbol */}
      {!image && (
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
          ?
        </text>
      )}
    </g>
  );
}
