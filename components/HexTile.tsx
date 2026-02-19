"use client";

import type { Tile } from "@/types/game";

interface Props {
  tile: Tile;
  size: number; // circumradius R (center to corner)
  cx: number;   // pixel center x
  cy: number;   // pixel center y
}

const RESOURCE_COLORS: Record<string, string> = {
  wood:    "#2D6A2D",
  brick:   "#B22222",
  sheep:   "#7EC850",
  wheat:   "#DAA520",
  stone:   "#708090",
  desert:  "#E8D5A3",
};

const RESOURCE_LABELS: Record<string, string> = {
  wood:    "Wood",
  brick:   "Brick",
  sheep:   "Sheep",
  wheat:   "Wheat",
  stone:   "Stone",
  desert:  "Desert",
};

function hexPoints(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i + 30) * Math.PI) / 180; // pointy-top: 30° offset
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
  }).join(" ");
}

function ProbabilityDots({
  cx, cy, dieNumber, isRed, dotSize,
}: {
  cx: number; cy: number; dieNumber: number; isRed: boolean; dotSize: number;
}) {
  const pips = 6 - Math.abs(7 - dieNumber); // 1 pip for 2/12, 5 pips for 6/8
  const spacing = dotSize * 2.8;
  const startX = cx - ((pips - 1) / 2) * spacing;
  return (
    <>
      {Array.from({ length: pips }, (_, i) => (
        <circle
          key={i}
          cx={startX + i * spacing}
          cy={cy}
          r={dotSize}
          fill={isRed ? "#CC0000" : "#333333"}
        />
      ))}
    </>
  );
}

export default function HexTile({ tile, size, cx, cy }: Props) {
  const points = hexPoints(cx, cy, size);
  const fill = RESOURCE_COLORS[tile.resource];
  const isRed = tile.dieNumber === 6 || tile.dieNumber === 8;
  const tokenR = size * 0.28;

  return (
    <g>
      <polygon
        points={points}
        fill={fill}
        stroke="#3D2B1F"
        strokeWidth={2}
      />

      {/* Resource label */}
      <text
        x={cx}
        y={cy - size * 0.52}
        textAnchor="middle"
        fontSize={size * 0.19}
        fontWeight="bold"
        fill="#ffffffcc"
        style={{ pointerEvents: "none" }}
      >
        {RESOURCE_LABELS[tile.resource]}
      </text>

      {/* Number token */}
      {tile.dieNumber !== null && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={tokenR}
            fill="#F5F0DC"
            stroke="#8B7355"
            strokeWidth={1.5}
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.25}
            fontWeight="bold"
            fill={isRed ? "#CC0000" : "#1a1a1a"}
            style={{ pointerEvents: "none" }}
          >
            {tile.dieNumber}
          </text>
          <ProbabilityDots
            cx={cx}
            cy={cy + tokenR * 0.6}
            dieNumber={tile.dieNumber}
            isRed={isRed}
            dotSize={size * 0.026}
          />
        </>
      )}

      {/* Robber */}
      {tile.hasRobber && (
        <text
          x={cx}
          y={cy + size * 0.15}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.38}
          style={{ pointerEvents: "none" }}
        >
          🏴
        </text>
      )}
    </g>
  );
}
