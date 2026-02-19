"use client";

import type { BoardState } from "@/types/game";
import HexTile from "./HexTile";
import Port from "./Port";

interface Props {
  board: BoardState;
}

const HEX_SIZE = 70; // circumradius in SVG units
const SQRT3 = Math.sqrt(3);

// Axial (q, r) → SVG pixel coords for pointy-top hexagons
function axialToPixel(q: number, r: number): { x: number; y: number } {
  return {
    x: HEX_SIZE * SQRT3 * (q + r / 2),
    y: HEX_SIZE * 1.5 * r,
  };
}

export default function Board({ board }: Props) {
  const margin = HEX_SIZE * 2.2;

  // Board spans ±2*SQRT3*HEX_SIZE in x, ±3*HEX_SIZE in y
  const halfW = HEX_SIZE * SQRT3 * 2.5 + margin;
  const halfH = HEX_SIZE * 3 + margin;

  return (
    <svg
      viewBox={`${-halfW} ${-halfH} ${halfW * 2} ${halfH * 2}`}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Ocean background */}
      <ellipse
        cx={0} cy={0}
        rx={halfW * 0.97}
        ry={halfH * 0.97}
        fill="#1565C0"
      />

      {/* Hex tiles */}
      {board.tiles.map((tile) => {
        const { x, y } = axialToPixel(tile.coord.q, tile.coord.r);
        return (
          <HexTile key={tile.id} tile={tile} size={HEX_SIZE} cx={x} cy={y} />
        );
      })}

      {/* Ports */}
      {board.ports.map((port, i) => {
        const { x, y } = axialToPixel(port.hexCoord.q, port.hexCoord.r);
        return (
          <Port key={i} port={port} cx={x} cy={y} size={HEX_SIZE} />
        );
      })}
    </svg>
  );
}
