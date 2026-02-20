"use client";

import type { Tile } from "@/types/game";

interface Props {
  tile: Tile;
  size: number; // circumradius R (center to corner)
  cx: number;   // pixel center x
  cy: number;   // pixel center y
}

const RESOURCE_COLORS: Record<string, string> = {
  wood:   "#2D6A2D",
  brick:  "#B22222",
  sheep:  "#7EC850",
  wheat:  "#DAA520",
  stone:  "#708090",
  desert: "#E8D5A3",
};

const RESOURCE_LABELS: Record<string, string> = {
  wood:   "Wood",
  brick:  "Brick",
  sheep:  "Sheep",
  wheat:  "Wheat",
  stone:  "Stone",
  desert: "Desert",
};

// ── Image overrides ───────────────────────────────────────────────────────────
// Drop image paths here to replace the colored hex background or number token.
// Leave an entry absent (or undefined) to keep the default SVG rendering.

const RESOURCE_IMAGES: Partial<Record<string, string>> = {
  wood:   "/images/wood.png",
  brick:  "/images/brick.png",
  sheep:  "/images/sheep.png",
  wheat:  "/images/wheat.png",
  stone:  "/images/stone.png",
  desert: "/images/desert.png",
};

const DIE_IMAGES: Partial<Record<number, string>> = {
  // 2:  "/images/die-2.png",
  // 3:  "/images/die-3.png",
  // 4:  "/images/die-4.png",
  // 5:  "/images/die-5.png",
  // 6:  "/images/die-6.png",
  // 8:  "/images/die-8.png",
  // 9:  "/images/die-9.png",
  // 10: "/images/die-10.png",
  // 11: "/images/die-11.png",
  // 12: "/images/die-12.png",
};

// ─────────────────────────────────────────────────────────────────────────────

function hexPoints(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i + 30) * Math.PI) / 180;
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
  }).join(" ");
}

function ProbabilityDots({
  cx, cy, dieNumber, isRed, dotSize,
}: {
  cx: number; cy: number; dieNumber: number; isRed: boolean; dotSize: number;
}) {
  const pips = 6 - Math.abs(7 - dieNumber);
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

  const resourceImage = RESOURCE_IMAGES[tile.resource];
  const dieImage = tile.dieNumber !== null ? DIE_IMAGES[tile.dieNumber] : undefined;

  const hexClipId = `hex-clip-${tile.id}`;
  const tokenClipId = `token-clip-${tile.id}`;

  return (
    <g>
      <defs>
        {/* Clip path for resource image — hex shape */}
        <clipPath id={hexClipId}>
          <polygon points={points} />
        </clipPath>
        {/* Clip path for resource image — circle */}
        <clipPath id={`${hexClipId}-circle`}>
          <circle cx={cx} cy={cy} r={size * 0.75} />
        </clipPath>
        {/* Clip path for die image — token circle */}
        {tile.dieNumber !== null && (
          <clipPath id={tokenClipId}>
            <circle cx={cx} cy={cy} r={tokenR} />
          </clipPath>
        )}
      </defs>

      {/* Hex background polygon */}
      <polygon
        points={points}
        fill={fill}
        stroke="#3D2B1F"
        strokeWidth={2}
      />

      {/* Resource image overlay (clipped to hex) */}
      {resourceImage && (
        <image
          href={resourceImage}
          x={cx - size * 0.75}
          y={cy - size * 0.75}
          width={size * 1.5}
          height={size * 1.5}
          clipPath={`url(#${hexClipId}-circle)`}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* Resource label — shown only when no image */}
      {!resourceImage && (
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
      )}

      {/* Number token */}
      {tile.dieNumber !== null && (
        <>
          {/* Token circle + die image or fallback text */}
          <circle
            cx={cx}
            cy={cy}
            r={tokenR}
            fill="#F5F0DC"
            stroke="#8B7355"
            strokeWidth={1.5}
          />
          {dieImage ? (
            <image
              href={dieImage}
              x={cx - tokenR}
              y={cy - tokenR}
              width={tokenR * 2}
              height={tokenR * 2}
              clipPath={`url(#${tokenClipId})`}
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <>
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
