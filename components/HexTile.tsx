"use client";

import type { ResourceType, Tile } from "@/types/game";
import { hexPointsString } from "@/lib/geometry";
import {
  TOKEN_RADIUS_RATIO,
  TOKEN_FONT_RATIO,
  TOKEN_DOT_RATIO,
  TOKEN_DOT_Y_RATIO,
  LABEL_Y_RATIO,
  LABEL_FONT_RATIO,
} from "@/lib/constants";

interface Props {
  tile: Tile;
  size: number; // circumradius R (center to corner)
  cx: number;   // pixel center x
  cy: number;   // pixel center y
}

const RESOURCE_COLORS: Record<ResourceType, string> = {
  wood:   "#2D6A2D",
  brick:  "#B22222",
  sheep:  "#7EC850",
  wheat:  "#DAA520",
  stone:  "#708090",
  desert: "#E8D5A3",
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
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

const RESOURCE_IMAGES: Partial<Record<ResourceType, string>> = {
 wood:   "/images/wood.png",
 brick:  "/images/brick.png",
 sheep:  "/images/sheep.png",
 wheat:  "/images/wheat.png",
 stone:  "/images/stone.png",
 desert: "/images/desert.png",
};

const DIE_IMAGES: Partial<Record<number, string>> = {
  2:  "/images/die-2.png",
  3:  "/images/die-3.png",
  4:  "/images/die-4.png",
  5:  "/images/die-5.png",
  6:  "/images/die-6.png",
  8:  "/images/die-8.png",
  9:  "/images/die-9.png",
  10: "/images/die-10.png",
  11: "/images/die-11.png",
  12: "/images/die-12.png",
};

// ─────────────────────────────────────────────────────────────────────────────

/** Number of probability pips for a die number (mirrors physical Catan tokens). */
function diePips(dieNumber: number): number {
  return 6 - Math.abs(7 - dieNumber); // 1 pip for 2/12, up to 5 pips for 6/8
}

function ProbabilityDots({
  cx, cy, dieNumber, isRed, dotSize,
}: {
  cx: number; cy: number; dieNumber: number; isRed: boolean; dotSize: number;
}) {
  const pips = diePips(dieNumber);
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
  const points = hexPointsString(cx, cy, size);
  const fill = RESOURCE_COLORS[tile.resource];
  const isRed = tile.dieNumber === 6 || tile.dieNumber === 8;
  const tokenR = size * TOKEN_RADIUS_RATIO;

  const resourceImage = RESOURCE_IMAGES[tile.resource];
  const dieImage = tile.dieNumber !== null ? DIE_IMAGES[tile.dieNumber] : undefined;

  const hexClipId = `hex-clip-${tile.id}`;
  const tokenClipId = `token-clip-${tile.id}`;

  return (
    <g>
      <defs>
        <clipPath id={hexClipId}>
          <polygon points={points} />
        </clipPath>
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

       {/* Resource image  clipped to hex */}
      {resourceImage && (
        <image
          href={resourceImage}
          x={cx - size * .5}
          y={cy - size * .25}
          width={size * 1}
          height={size * 1}
          clipPath={`url(#${hexClipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      {/* Resource label — shown only when no image */}
      {!resourceImage && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fontSize={size * LABEL_FONT_RATIO}
          fontWeight="bold"
          fill="#ffffffcc"
          style={{ pointerEvents: "none" }}
        >
          {RESOURCE_LABELS[tile.resource]}
        </text>
      )}

      {/* Number token */}
      {tile.dieNumber !== null && dieImage ? (
          <image
            href={dieImage}
            x={cx - tokenR}
            y={cy - tokenR}
            width={tokenR * 2}
            height={tokenR * 2}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <>
            
        </>
      )}

      {/* Robber */}
      {tile.hasRobber && (
        <text
          x={cx - size * 0.5}
          y={cy}
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
