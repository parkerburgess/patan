"use client";

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Hex color string for the owning player, or null if unowned. */
  playerColor: string | null;
}

const ROAD_WIDTH  = 12;   // outer road width

export default function Road({ x1, y1, x2, y2, playerColor }: Props) {
  const roadColor   = playerColor ?? "#978e80";

  return (
    <g>
      {/* Outer road */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={roadColor}
        strokeWidth={ROAD_WIDTH}
        strokeLinecap="round"
      />
    </g>
  );
}
