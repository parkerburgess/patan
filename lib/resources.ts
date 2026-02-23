import type { BoardState, Player, PlayableResource } from "@/types/game";

export function collectSetupResources(
  board: BoardState,
  locationId: number,
): Record<PlayableResource, number> {
  const delta: Record<PlayableResource, number> = { wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0 };
  const loc = board.villageLocations.find(l => l.id === locationId);
  if (!loc) return delta;
  for (const tileId of loc.adjacentTileIds) {
    const tile = board.tiles.find(t => t.id === tileId);
    if (tile && tile.resource !== "desert") {
      delta[tile.resource as PlayableResource]++;
    }
  }
  return delta;
}

export function addResources(
  a: Record<PlayableResource, number>,
  b: Record<PlayableResource, number>,
): Record<PlayableResource, number> {
  return {
    wood:  a.wood  + b.wood,
    brick: a.brick + b.brick,
    sheep: a.sheep + b.sheep,
    wheat: a.wheat + b.wheat,
    stone: a.stone + b.stone,
  };
}

export function distributeResources(board: BoardState, players: Player[], rollTotal: number): Player[] {
  const matchingTileIds = new Set(
    board.tiles.filter(t => t.dieNumber === rollTotal && !t.hasRobber).map(t => t.id)
  );
  if (matchingTileIds.size === 0) return players;
  return players.map(player => {
    const delta: Record<PlayableResource, number> = { wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0 };
    for (const loc of board.villageLocations) {
      if (loc.ownerId !== player.id) continue;
      const mult = loc.isTown ? 2 : loc.isVillage ? 1 : 0;
      if (mult === 0) continue;
      for (const tileId of loc.adjacentTileIds) {
        if (!matchingTileIds.has(tileId)) continue;
        const tile = board.tiles.find(t => t.id === tileId)!;
        if (tile.resource !== "desert")
          delta[tile.resource as PlayableResource] += mult;
      }
    }
    return Object.values(delta).some(v => v > 0)
      ? { ...player, resources: addResources(player.resources, delta) }
      : player;
  });
}

export function processRobber(board: BoardState): BoardState {
  // TODO: move robber, discard logic
  return board;
}
