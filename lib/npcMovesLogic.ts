import type { BoardState, VillageLocation, RoadLocation } from "@/types/game";
import { canPlaceVillage, placeVillage, placeRoad } from "@/lib/placement";


export interface NpcSetupPlacementResult {
  newBoard: BoardState;
  villageId: number;
  roadPlaced: boolean;
}

export function placeStartingVillageAndRoadLocation(board: BoardState, playerId: number): NpcSetupPlacementResult | null {
  const validVillages = getValidVillageLocations(board, playerId);
  if (validVillages.length === 0) return null;

  const village = pickBestVillageLocation(validVillages);

  let newBoard = placeVillage(board, village.id, playerId);

  const adjRoads = newBoard.roadLocations.filter(r =>
    r.ownerId === null && (
      r.villageLocationId1 === village.id || r.villageLocationId2 === village.id
    )
  );
  let roadPlaced = false;
  if (adjRoads.length > 0) {
    const road = adjRoads[Math.floor(Math.random() * adjRoads.length)];
    newBoard = placeRoad(newBoard, road.id, playerId);
    roadPlaced = true;
  }

  return { newBoard, villageId: village.id, roadPlaced };
}

export function pickVillageLocation(board: BoardState, playerId: number) {

}

function getValidVillageLocations(board: BoardState, playerId: number) : VillageLocation[]  {
    return board.villageLocations.filter(loc =>
    canPlaceVillage(board, loc.id, playerId, true)
  ); 
}

function pickBestVillageLocation(validVillages: VillageLocation[]) {
  //  TODO: make this more sophisticated.  Do things like count odds, resources proviced, and defense
  return validVillages[Math.floor(Math.random() * validVillages.length)];
}