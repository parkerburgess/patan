import type { BoardState, Player } from "@/types/game";

/**
 * Choose a robber tile for an NPC:
 * - Prefer tiles where an enemy has a village/town but the NPC does not.
 * - Exclude the tile the robber is already on.
 * - Falls back to any non-robber tile, then any tile.
 */
export function npcChooseRobberTile(
  board: BoardState,
  npcPlayerId: number,
  players: Player[],
): number {
  // Tiles the NPC has settlements on
  const npcTileIds = new Set(
    board.villageLocations
      .filter(loc => loc.ownerId === npcPlayerId && (loc.isVillage || loc.isTown))
      .flatMap(loc => loc.adjacentTileIds),
  );

  // Tiles any other player has settlements on
  const enemyTileIds = new Set(
    board.villageLocations
      .filter(
        loc =>
          loc.ownerId !== null &&
          loc.ownerId !== npcPlayerId &&
          (loc.isVillage || loc.isTown),
      )
      .flatMap(loc => loc.adjacentTileIds),
  );

  // Ideal: enemy has settlement, NPC does not, robber isn't already there
  const ideal = board.tiles.filter(
    t => !npcTileIds.has(t.id) && enemyTileIds.has(t.id) && !t.hasRobber,
  );
  if (ideal.length > 0) return ideal[Math.floor(Math.random() * ideal.length)].id;

  // Fallback: any tile without the robber
  const anyOther = board.tiles.filter(t => !t.hasRobber);
  if (anyOther.length > 0) return anyOther[Math.floor(Math.random() * anyOther.length)].id;

  return board.tiles[0].id;
}
