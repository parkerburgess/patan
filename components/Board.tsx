"use client";

import type { BoardState } from "@/types/game";
import { HEX_SIZE, BOARD_MARGIN_RATIO, SQRT3 } from "@/lib/constants";
import { axialToPixel } from "@/lib/geometry";
import HexTile from "./HexTile";
import Port from "./Port";

interface Props {
  board: BoardState;
}

export default function Board({ board }: Props) {
  const margin = HEX_SIZE * BOARD_MARGIN_RATIO;

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
        const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
        return (
          <HexTile key={tile.id} tile={tile} size={HEX_SIZE} cx={x} cy={y} />
        );
      })}

      {/* Ports */}
      {board.ports.map((port, i) => {
        const { x, y } = axialToPixel(port.hexCoord, HEX_SIZE);
        return (
          <Port key={i} port={port} cx={x} cy={y} size={HEX_SIZE} />
        );
      })}
    </svg>
  );
}
