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
const STRIPE_WIDTH = 2; // center stripe width

export default function Road({ x1, y1, x2, y2, playerColor }: Props) {
  const roadColor   = playerColor ?? "#3a3a3a";
  const stripeColor = playerColor ? "rgba(255,255,255,0.35)" : "#666666";

  return (
    <g>
      {/* Outer road */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={roadColor}
        strokeWidth={ROAD_WIDTH}
        strokeLinecap="round"
      />
      {/* Center stripe */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stripeColor}
        strokeWidth={STRIPE_WIDTH}
        strokeLinecap="round"
      />
    </g>
  );
}
