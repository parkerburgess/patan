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
  /** Which placement modes are currently active. Multiple can be active simultaneously. */
  activeModes: ("village" | "town" | "road")[];
  /** During setup road phase, only show road spots adjacent to this village. */
  setupLastVillageId?: number | null;
  onVillagePlace: (locationId: number) => void;
  onTownPlace: (locationId: number) => void;
  onRoadPlace: (locationId: number) => void;
  /** When true, clicking a hex tile places the robber there. */
  robberMode?: boolean;
  onRobberPlace?: (tileId: number) => void;
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
  activeModes,
  setupLastVillageId = null,
  onVillagePlace,
  onTownPlace,
  onRoadPlace,
  robberMode = false,
  onRobberPlace,
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

  const roadModeActive    = activeModes.includes("road");
  const villageModeActive = activeModes.includes("village");
  const townModeActive    = activeModes.includes("town");

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

  const activePlayer = players.find(p => p.id === activePlayerId);

  const validRoadIds = useMemo(() => {
    if (!roadModeActive) return new Set<number>();
    return new Set(
      board.roadLocations
        .filter(r => {
          if (!canPlaceRoad(board, r.id, activePlayerId, isSetup, activePlayer?.resources)) return false;
          if (isSetup && setupLastVillageId !== null) {
            return r.villageLocationId1 === setupLastVillageId ||
              r.villageLocationId2 === setupLastVillageId;
          }
          return true;
        })
        .map(r => r.id)
    );
  }, [board, activeModes, activePlayerId, isSetup, setupLastVillageId, activePlayer]);

  const validVillageIds = useMemo(() => {
    if (!villageModeActive) return new Set<number>();
    return new Set(
      board.villageLocations
        .filter(loc => canPlaceVillage(board, loc.id, activePlayerId, isSetup, activePlayer?.resources))
        .map(loc => loc.id)
    );
  }, [board, activeModes, activePlayerId, isSetup, activePlayer]);

  const validTownIds = useMemo(() => {
    if (!townModeActive) return new Set<number>();
    return new Set(
      board.villageLocations
        .filter(loc => canPlaceTown(board, loc.id, activePlayerId, activePlayer?.resources))
        .map(loc => loc.id)
    );
  }, [board, activeModes, activePlayerId, activePlayer]);

  return (
    <svg
      viewBox={`${-halfW} ${-halfH} ${halfW * 2} ${halfH * 2}`}
      className="w-full h-full"
    >
      {/* Parchment oval */}
      <ellipse cx={0} cy={0} rx={halfW * 0.97} ry={halfH * 0.97} fill="#C4A882" opacity={0.95} />

      {/* Ports — behind everything */}
      {board.ports.map((port, i) => {
        const { x, y } = axialToPixel(port.hexCoord, HEX_SIZE);
        return <Port key={i} port={port} cx={x} cy={y} size={HEX_SIZE} />;
      })}

      {/* Hex tiles */}
      {board.tiles.map((tile) => {
        const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
        const isTarget = robberMode && !tile.hasRobber;
        return (
          <HexTile
            key={tile.id}
            tile={tile}
            size={HEX_SIZE}
            cx={x}
            cy={y}
            isRobberTarget={isTarget}
            onRobberClick={isTarget ? () => onRobberPlace?.(tile.id) : undefined}
          />
        );
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

      {/* Road click targets */}
      {roadModeActive && board.roadLocations.map((r) => {
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
        const spotMode = validVillageIds.has(loc.id) ? "place-village"
          : validTownIds.has(loc.id) ? "place-town"
          : "idle";
        return (
          <VillageSpot
            key={loc.id}
            location={loc}
            playerColor={owner?.color ?? null}
            mode={spotMode}
            isValid={validVillageIds.has(loc.id) || validTownIds.has(loc.id)}
            onVillageClick={() => onVillagePlace(loc.id)}
            onTownClick={() => onTownPlace(loc.id)}
          />
        );
      })}


    </svg>
  );
}
