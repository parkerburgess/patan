"use client";

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Hex color string for the owning player, or null if unowned. */
  playerColor: string | null;
}

const ROAD_WIDTH = 7;

export default function Road({ x1, y1, x2, y2, playerColor }: Props) {
  if (playerColor) {
    return (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={playerColor}
        strokeWidth={ROAD_WIDTH}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.6))" }}
      />
    );
  }

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#5C3D1E"
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray="6 8"
      strokeOpacity={0.25}
    />
  );
}
