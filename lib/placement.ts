import type { BoardState } from "@/types/game";

/**
 * Returns true if the given village location is a valid placement for playerId.
 * Rules:
 *  - location must exist and be unowned
 *  - no adjacent village (distance rule)
 *  - must have an adjacent road owned by the player (waived during setup)
 */
export function canPlaceVillage(
  board: BoardState,
  locationId: number,
  playerId: number,
  isSetup: boolean,
): boolean {
  const loc = board.villageLocations.find(l => l.id === locationId);
  if (!loc || loc.ownerId !== null) return false;

  // Distance rule: no adjacent location may already have a settlement
  const hasAdjacentSettlement = loc.adjacentVillageIds.some(adjId =>
    board.villageLocations.find(l => l.id === adjId)?.ownerId !== null
  );
  if (hasAdjacentSettlement) return false;

  // Must connect to player's road network (waived in setup)
  if (!isSetup) {
    const hasAdjacentRoad = board.roadLocations.some(
      r => r.ownerId === playerId &&
        (r.villageLocationId1 === locationId || r.villageLocationId2 === locationId)
    );
    if (!hasAdjacentRoad) return false;
  }

  return true;
}

/** Place a village for playerId at locationId. Returns new BoardState (immutable). */
export function placeVillage(
  board: BoardState,
  locationId: number,
  playerId: number,
): BoardState {
  return {
    ...board,
    villageLocations: board.villageLocations.map(loc =>
      loc.id === locationId ? { ...loc, ownerId: playerId, isVillage: true } : loc
    ),
  };
}

/**
 * Returns true if the player can upgrade their village to a town at locationId.
 * Requires: location owned by player, is a village, not yet a town.
 */
export function canPlaceTown(
  board: BoardState,
  locationId: number,
  playerId: number,
): boolean {
  const loc = board.villageLocations.find(l => l.id === locationId);
  return !!loc && loc.ownerId === playerId && loc.isVillage && !loc.isTown;
}

/** Upgrade a village to a town. Returns new BoardState (immutable). */
export function placeTown(
  board: BoardState,
  locationId: number,
  playerId: number,
): BoardState {
  return {
    ...board,
    villageLocations: board.villageLocations.map(loc =>
      loc.id === locationId && loc.ownerId === playerId ? { ...loc, isTown: true } : loc
    ),
  };
}

/**
 * Returns true if the given road location is valid for playerId.
 * Rules:
 *  - road must exist and be unowned
 *  - during setup: any unowned road is valid
 *  - during play: one endpoint is owned by the player, OR the road shares an
 *    endpoint with one of the player's existing roads
 */
export function canPlaceRoad(
  board: BoardState,
  locationId: number,
  playerId: number,
  isSetup: boolean,
): boolean {
  const road = board.roadLocations.find(r => r.id === locationId);
  if (!road || road.ownerId !== null) return false;
  if (isSetup) return true;

  const { villageLocationId1: vid1, villageLocationId2: vid2 } = road;

  // Endpoint village owned by this player
  const endpointOwned = board.villageLocations.some(
    loc => (loc.id === vid1 || loc.id === vid2) && loc.ownerId === playerId
  );
  if (endpointOwned) return true;

  // Shares an endpoint with a road already owned by this player
  return board.roadLocations.some(
    r => r.ownerId === playerId && (
      r.villageLocationId1 === vid1 || r.villageLocationId1 === vid2 ||
      r.villageLocationId2 === vid1 || r.villageLocationId2 === vid2
    )
  );
}

/** Place a road for playerId at locationId. Returns new BoardState (immutable). */
export function placeRoad(
  board: BoardState,
  locationId: number,
  playerId: number,
): BoardState {
  return {
    ...board,
    roadLocations: board.roadLocations.map(r =>
      r.id === locationId ? { ...r, ownerId: playerId } : r
    ),
  };
}
