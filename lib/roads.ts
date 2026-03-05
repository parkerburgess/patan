import type { BoardState, Player } from "@/types/game";

/**
 * Longest connected road for one player using DFS with edge tracking.
 *
 * Rules:
 *  - Traverses only roads owned by playerId
 *  - Each road (edge) may be visited at most once per path (backtracking resets)
 *  - A vertex occupied by a different player's settlement/town breaks the chain
 *    (you can arrive at it but cannot continue through it)
 */
function longestRoadForPlayer(board: BoardState, playerId: number): number {
  // Build adjacency: vertexId → [{roadId, neighborVertexId}]
  const adj = new Map<number, Array<{ roadId: number; neighbor: number }>>();

  for (const road of board.roadLocations) {
    if (road.ownerId !== playerId) continue;
    const { id, villageLocationId1: v1, villageLocationId2: v2 } = road;
    if (!adj.has(v1)) adj.set(v1, []);
    if (!adj.has(v2)) adj.set(v2, []);
    adj.get(v1)!.push({ roadId: id, neighbor: v2 });
    adj.get(v2)!.push({ roadId: id, neighbor: v1 });
  }

  if (adj.size === 0) return 0;

  const vertexOwner = new Map(board.villageLocations.map(l => [l.id, l.ownerId]));
  const visited = new Set<number>();

  function dfs(vertex: number): number {
    // Opponent settlement at this vertex breaks the chain
    const owner = vertexOwner.get(vertex) ?? null;
    if (owner !== null && owner !== playerId) return 0;

    let best = 0;
    for (const { roadId, neighbor } of adj.get(vertex) ?? []) {
      if (!visited.has(roadId)) {
        visited.add(roadId);
        best = Math.max(best, 1 + dfs(neighbor));
        visited.delete(roadId);
      }
    }
    return best;
  }

  let longest = 0;
  for (const vertex of adj.keys()) {
    longest = Math.max(longest, dfs(vertex));
  }
  return longest;
}

/**
 * Recalculates roadLength and hasLongestRoad for all players.
 *
 * Longest Road rules:
 *  - Minimum 5 roads to qualify
 *  - Current holder keeps it unless another player strictly exceeds their length
 *  - If no one holds it and a player reaches 5+, the longest earns it (first on tie)
 */
/** Recalculates hasLargestArmy for all players after an armyCount change. */
export function updateLargestArmy(players: Player[]): Player[] {
  const counts = players.map(p => p.armyCount);
  const maxCount = Math.max(...counts);
  const holderIdx = players.findIndex(p => p.hasLargestArmy);

  let newHolderIdx = holderIdx;

  if (maxCount < 3) {
    newHolderIdx = -1;
  } else if (holderIdx === -1) {
    newHolderIdx = counts.indexOf(maxCount);
  } else {
    const holderCount = counts[holderIdx];
    const challenger = counts.findIndex((c, i) => i !== holderIdx && c > holderCount);
    if (challenger !== -1) newHolderIdx = challenger;
  }

  return players.map((p, i) => {
    const had = p.hasLargestArmy;
    const has = i === newHolderIdx;
    const vpDelta = (has ? 1 : 0) - (had ? 1 : 0);
    return { ...p, hasLargestArmy: has, victoryPoints: p.victoryPoints + vpDelta * 2 };
  });
}

export function updateRoadLengths(board: BoardState, players: Player[]): Player[] {
  const lengths = players.map(p => longestRoadForPlayer(board, p.id));
  const maxLength = Math.max(...lengths);
  const holderIdx = players.findIndex(p => p.hasLongestRoad);

  let newHolderIdx = holderIdx;

  if (maxLength < 5) {
    newHolderIdx = -1;
  } else if (holderIdx === -1) {
    // Nobody holds it yet — award to the longest (first on tie)
    newHolderIdx = lengths.indexOf(maxLength);
  } else {
    // Existing holder — only transfer if someone strictly exceeds them
    const holderLength = lengths[holderIdx];
    const challenger = lengths.findIndex((len, i) => i !== holderIdx && len > holderLength);
    if (challenger !== -1) newHolderIdx = challenger;
  }

  return players.map((p, i) => {
    const had = p.hasLongestRoad;
    const has = i === newHolderIdx;
    const vpDelta = (has ? 1 : 0) - (had ? 1 : 0);
    return { ...p, roadLength: lengths[i], hasLongestRoad: has, victoryPoints: p.victoryPoints + vpDelta * 2 };
  });
}
