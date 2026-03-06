import type { BoardState } from "@/types/game";
import { placeVillage, placeRoad } from "@/lib/placement";
import { npcChooseSetupVillagePlacement, npcChooseSetupRoadPlacement } from "@/lib/npcAI";

export interface NpcSetupPlacementResult {
  newBoard: BoardState;
  villageId: number;
  roadPlaced: boolean;
}

export function placeStartingVillageAndRoadLocation(board: BoardState, playerId: number): NpcSetupPlacementResult | null {
  const villageId = npcChooseSetupVillagePlacement(board, playerId);
  if (villageId === null) return null;

  let newBoard = placeVillage(board, villageId, playerId);

  const roadId = npcChooseSetupRoadPlacement(newBoard, villageId);
  let roadPlaced = false;
  if (roadId !== null) {
    newBoard = placeRoad(newBoard, roadId, playerId);
    roadPlaced = true;
  }

  return { newBoard, villageId, roadPlaced };
}