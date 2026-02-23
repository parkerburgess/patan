"use client";

import { useMemo } from "react";
import type { BoardState, Player } from "@/types/game";
import { HEX_SIZE, BOARD_MARGIN_RATIO, SQRT3 } from "@/lib/constants";
import { axialToPixel, hexCornerPoints } from "@/lib/geometry";
import { canPlaceVillage, canPlaceRoad, canPlaceTown } from "@/lib/placement";
import HexTile from "./HexTile";
import Port from "./Port";
import Road from "./Road";
import VillageSpot from "./VillageSpot";

interface Props {
  board: BoardState;
  players: Player[];
  activePlayerId: number;
  isSetup: boolean;
  placementMode: "village" | "town" | "road" | null;
  /** During setup road phase, only show road spots adjacent to this village. */
  setupLastVillageId?: number | null;
  onVillagePlace: (locationId: number) => void;
  onRoadPlace: (locationId: number) => void;
}

interface RoadEdge {
  key: string;
  x1: number; y1: number;
  x2: number; y2: number;
  roadLocationId: number | null;
  ownerId: number | null;
}

/**
 * Fallback: compute deduplicated road edges directly from tile geometry.
 * Used only when roadLocations is not yet populated.
 */
function computeRoadEdgesFromTiles(board: BoardState): RoadEdge[] {
  const seen = new Set<string>();
  const edges: RoadEdge[] = [];

  for (const tile of board.tiles) {
    const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
    const corners = hexCornerPoints(x, y, HEX_SIZE);

    for (let i = 0; i < 6; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 6];
      const ax = Math.round(a.x), ay = Math.round(a.y);
      const bx = Math.round(b.x), by = Math.round(b.y);
      const key = ax < bx || (ax === bx && ay < by)
        ? `${ax},${ay}-${bx},${by}`
        : `${bx},${by}-${ax},${ay}`;

      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ key, x1: a.x, y1: a.y, x2: b.x, y2: b.y, roadLocationId: null, ownerId: null });
      }
    }
  }

  return edges;
}

export default function Board({
  board,
  players,
  activePlayerId,
  isSetup,
  placementMode,
  setupLastVillageId = null,
  onVillagePlace,
  onRoadPlace,
}: Props) {
  const margin = HEX_SIZE * BOARD_MARGIN_RATIO;
  const halfW = HEX_SIZE * SQRT3 * 2.5 + margin;
  const halfH = HEX_SIZE * 3 + margin;

  const villageById = useMemo(
    () => new Map(board.villageLocations.map(l => [l.id, l])),
    [board.villageLocations],
  );

  const playerById = useMemo(
    () => new Map(players.map(p => [p.id, p])),
    [players],
  );

  // Compute road edges from roadLocations (preferred) or tile geometry (fallback)
  const roadEdges = useMemo((): RoadEdge[] => {
    if (board.roadLocations.length > 0) {
      return board.roadLocations.map(r => {
        const loc1 = villageById.get(r.villageLocationId1)!;
        const loc2 = villageById.get(r.villageLocationId2)!;
        const ax = Math.round(loc1.x), ay = Math.round(loc1.y);
        const bx = Math.round(loc2.x), by = Math.round(loc2.y);
        const key = ax < bx || (ax === bx && ay < by)
          ? `${ax},${ay}-${bx},${by}`
          : `${bx},${by}-${ax},${ay}`;
        return {
          key,
          x1: loc1.x, y1: loc1.y,
          x2: loc2.x, y2: loc2.y,
          roadLocationId: r.id,
          ownerId: r.ownerId,
        };
      });
    }
    return computeRoadEdgesFromTiles(board);
  }, [board, villageById]);

  // Valid road ids when in road placement mode
  const validRoadIds = useMemo(() => {
    if (placementMode !== "road") return new Set<number>();
    return new Set(
      board.roadLocations
        .filter(r => {
          if (!canPlaceRoad(board, r.id, activePlayerId, isSetup)) return false;
          // During setup, restrict to roads adjacent to the just-placed village
          if (isSetup && setupLastVillageId !== null) {
            return r.villageLocationId1 === setupLastVillageId ||
              r.villageLocationId2 === setupLastVillageId;
          }
          return true;
        })
        .map(r => r.id)
    );
  }, [board, placementMode, activePlayerId, isSetup, setupLastVillageId]);

  // Valid village/town ids when in village or town placement mode
  const validVillageIds = useMemo(() => {
    if (placementMode !== "village" && placementMode !== "town") return new Set<number>();
    return new Set(
      board.villageLocations
        .filter(loc => placementMode === "village"
          ? canPlaceVillage(board, loc.id, activePlayerId, isSetup)
          : canPlaceTown(board, loc.id, activePlayerId)
        )
        .map(loc => loc.id)
    );
  }, [board, placementMode, activePlayerId, isSetup]);

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
        fill="#ffffff"
        opacity={.25}
      />

      {/* Hex tiles */}
      {board.tiles.map((tile) => {
        const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
        return <HexTile key={tile.id} tile={tile} size={HEX_SIZE} cx={x} cy={y} />;
      })}

      {/* Roads — ownership-colored */}
      {roadEdges.map((edge) => {
        const color = edge.ownerId !== null
          ? (playerById.get(edge.ownerId)?.color ?? null)
          : null;
        return (
          <Road
            key={edge.key}
            x1={edge.x1} y1={edge.y1}
            x2={edge.x2} y2={edge.y2}
            playerColor={color}
          />
        );
      })}

      {/* Road click targets — wide transparent strokes when in road placement mode */}
      {placementMode === "road" && board.roadLocations.map((r) => {
        if (!validRoadIds.has(r.id)) return null;
        const loc1 = villageById.get(r.villageLocationId1);
        const loc2 = villageById.get(r.villageLocationId2);
        if (!loc1 || !loc2) return null;
        return (
          <line
            key={`rt-${r.id}`}
            x1={loc1.x} y1={loc1.y}
            x2={loc2.x} y2={loc2.y}
            stroke="white"
            strokeOpacity={0.35}
            strokeWidth={14}
            strokeLinecap="round"
            cursor="pointer"
            onClick={() => onRoadPlace(r.id)}
          />
        );
      })}

      {/* Village / town spots */}
      {board.villageLocations.map((loc) => {
        const owner = loc.ownerId !== null ? playerById.get(loc.ownerId) ?? null : null;
        const spotMode = placementMode === "village" ? "place-village"
          : placementMode === "town" ? "place-town"
          : "idle";
        return (
          <VillageSpot
            key={loc.id}
            location={loc}
            playerColor={owner?.color ?? null}
            mode={spotMode}
            isValid={validVillageIds.has(loc.id)}
            onClick={() => onVillagePlace(loc.id)}
          />
        );
      })}

      {/* Ports — rendered on top */}
      {board.ports.map((port, i) => {
        const { x, y } = axialToPixel(port.hexCoord, HEX_SIZE);
        return <Port key={i} port={port} cx={x} cy={y} size={HEX_SIZE} />;
      })}
    </svg>
  );
}
