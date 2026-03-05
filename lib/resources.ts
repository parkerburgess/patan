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

export function subtractResources(
  a: Record<PlayableResource, number>,
  b: Record<PlayableResource, number>,
): Record<PlayableResource, number> {
  return {
    wood:  a.wood  - b.wood,
    brick: a.brick - b.brick,
    sheep: a.sheep - b.sheep,
    wheat: a.wheat - b.wheat,
    stone: a.stone - b.stone,
  };
}

export function totalResources(player: Player): number {
  return Object.values(player.resources).reduce((sum, n) => sum + n, 0);
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

/** Randomly discard half (rounded down) of an NPC's resources. */
export function randomNpcDiscard(player: Player): Player {
  const total = totalResources(player);
  let toDiscard = Math.floor(total / 2);
  const resources = { ...player.resources };
  const keys: PlayableResource[] = ["wood", "brick", "sheep", "wheat", "stone"];
  while (toDiscard > 0) {
    const available = keys.filter(k => resources[k] > 0);
    if (available.length === 0) break;
    const pick = available[Math.floor(Math.random() * available.length)];
    resources[pick]--;
    toDiscard--;
  }
  return { ...player, resources };
}

/** Apply random discards to all NPCs with >7 resources. Human is untouched. */
export function applyNpcDiscards(players: Player[]): Player[] {
  return players.map(p => {
    if (p.isHuman || totalResources(p) <= 7) return p;
    return randomNpcDiscard(p);
  });
}

/** Move the robber to a new tile (immutable). */
export function moveRobber(board: BoardState, tileId: number): BoardState {
  return {
    ...board,
    tiles: board.tiles.map(t => ({ ...t, hasRobber: t.id === tileId })),
  };
}

/**
 * Steal one random resource from a random player (other than activePlayerId)
 * who has a village or town on the given tile.
 */
export function stealRandomResource(
  board: BoardState,
  tileId: number,
  activePlayerId: number,
  players: Player[],
): { players: Player[]; stolen: PlayableResource | null; fromName: string | null } {
  const eligible = board.villageLocations.filter(
    loc =>
      loc.adjacentTileIds.includes(tileId) &&
      (loc.isVillage || loc.isTown) &&
      loc.ownerId !== null &&
      loc.ownerId !== activePlayerId,
  );
  if (eligible.length === 0) return { players, stolen: null, fromName: null };

  const randomLoc = eligible[Math.floor(Math.random() * eligible.length)];
  const fromPlayer = players.find(p => p.id === randomLoc.ownerId);
  if (!fromPlayer) return { players, stolen: null, fromName: null };

  const keys: PlayableResource[] = ["wood", "brick", "sheep", "wheat", "stone"];
  const available = keys.filter(k => fromPlayer.resources[k] > 0);
  if (available.length === 0) return { players, stolen: null, fromName: fromPlayer.name };

  const stolen = available[Math.floor(Math.random() * available.length)];
  const newPlayers = players.map(p => {
    if (p.id === fromPlayer.id)
      return { ...p, resources: { ...p.resources, [stolen]: p.resources[stolen] - 1 } };
    if (p.id === activePlayerId)
      return { ...p, resources: { ...p.resources, [stolen]: p.resources[stolen] + 1 } };
    return p;
  });

  return { players: newPlayers, stolen, fromName: fromPlayer.name };
}
