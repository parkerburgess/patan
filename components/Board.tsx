"use client";

import type { BoardState } from "@/types/game";
import { HEX_SIZE, BOARD_MARGIN_RATIO, SQRT3 } from "@/lib/constants";
import { axialToPixel, hexCornerPoints } from "@/lib/geometry";
import HexTile from "./HexTile";
import Port from "./Port";
import Road from "./Road";

interface Props {
  board: BoardState;
  /** Map from roadLocation id → player color, for owned roads. */
  ownedRoads?: Map<number, string>;
}

interface RoadEdge {
  key: string;
  x1: number; y1: number;
  x2: number; y2: number;
  roadLocationId: number | null;
}

/**
 * Compute deduplicated road edges for all tiles.
 * Each shared edge between two tiles appears only once.
 * Edge i of a hex connects corner i and corner (i+1)%6.
 */
function computeRoadEdges(board: BoardState): RoadEdge[] {
  const seen = new Set<string>();
  const edges: RoadEdge[] = [];

  for (const tile of board.tiles) {
    const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
    const corners = hexCornerPoints(x, y, HEX_SIZE);

    for (let i = 0; i < 6; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 6];

      // Canonical key: round to nearest int to handle floating-point near-equality
      const ax = Math.round(a.x), ay = Math.round(a.y);
      const bx = Math.round(b.x), by = Math.round(b.y);
      const key = ax < bx || (ax === bx && ay < by)
        ? `${ax},${ay}-${bx},${by}`
        : `${bx},${by}-${ax},${ay}`;

      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ key, x1: a.x, y1: a.y, x2: b.x, y2: b.y, roadLocationId: null });
      }
    }
  }

  return edges;
}

export default function Board({ board, ownedRoads = new Map() }: Props) {
  const margin = HEX_SIZE * BOARD_MARGIN_RATIO;

  // Board spans ±2*SQRT3*HEX_SIZE in x, ±3*HEX_SIZE in y
  const halfW = HEX_SIZE * SQRT3 * 2.5 + margin;
  const halfH = HEX_SIZE * 3 + margin;

  const roadEdges = computeRoadEdges(board);

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

      {/* Roads — rendered above tiles, below ports */}
      {roadEdges.map((edge) => {
        const playerColor = edge.roadLocationId !== null
          ? (ownedRoads.get(edge.roadLocationId) ?? null)
          : null;
        return (
          <Road
            key={edge.key}
            x1={edge.x1} y1={edge.y1}
            x2={edge.x2} y2={edge.y2}
            playerColor={playerColor}
          />
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
