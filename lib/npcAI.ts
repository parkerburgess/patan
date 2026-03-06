/**
 * lib/npcAI.ts
 *
 * Centralised NPC AI decision layer.
 * All exported functions are pure: they receive game state and return a decision.
 * No state mutation occurs here. Execution (applying decisions to state) stays
 * in the relevant lib/* files and hooks.
 *
 * May be split into sub-files (npcAI/placement.ts, npcAI/trading.ts, …) as it grows.
 */

import type { BoardState, Player, PlayableResource, DevCardType, VillageLocation } from "@/types/game";
import { canPlaceVillage, canPlaceTown, canPlaceRoad } from "@/lib/placement";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Probability pip count for a die number (0 for desert / null). */
function tilePips(dieNumber: number | null): number {
  if (dieNumber === null) return 0;
  return 6 - Math.abs(7 - dieNumber);
}

/** Sum of pip values for tiles adjacent to a village location. */
function locationScore(loc: VillageLocation, board: BoardState): number {
  return loc.adjacentTileIds.reduce((sum, tileId) => {
    const tile = board.tiles.find(t => t.id === tileId);
    return sum + (tile ? tilePips(tile.dieNumber) : 0);
  }, 0);
}

/** Bank exchange rate for a resource given the player's port access. */
function exchangeRate(board: BoardState, player: Player, resource: PlayableResource): number {
  let rate = 4;
  for (const loc of board.villageLocations) {
    if (loc.ownerId !== player.id || (!loc.isVillage && !loc.isTown) || !loc.bonus) continue;
    if (loc.bonus === "generic" && rate > 3) rate = 3;
    else if (loc.bonus === resource) rate = 2;
  }
  return rate;
}

/** Total resources held by a player. */
function totalResources(player: Player): number {
  return Object.values(player.resources).reduce((a, b) => a + b, 0);
}

const ALL_RESOURCES: PlayableResource[] = ["wood", "brick", "sheep", "wheat", "stone"];

// ─────────────────────────────────────────────────────────────────────────────
// Placement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Setup phase: pick the best unoccupied village location by probability score.
 * Selects randomly from the top 3 candidates to vary games.
 */
export function npcChooseSetupVillagePlacement(board: BoardState, playerId: number): number | null {
  const valid = board.villageLocations.filter(loc => canPlaceVillage(board, loc.id, playerId, true));
  if (valid.length === 0) return null;
  valid.sort((a, b) => locationScore(b, board) - locationScore(a, board));
  const pool = valid.slice(0, Math.min(3, valid.length));
  return pool[Math.floor(Math.random() * pool.length)].id;
}

/**
 * Setup phase: pick the road adjacent to villageId that leads toward the
 * neighbour with the highest location score.
 */
export function npcChooseSetupRoadPlacement(
  board: BoardState,
  villageId: number,
): number | null {
  const adjacent = board.roadLocations.filter(
    r => r.ownerId === null && (r.villageLocationId1 === villageId || r.villageLocationId2 === villageId),
  );
  if (adjacent.length === 0) return null;

  let best = adjacent[0];
  let bestScore = -1;
  for (const road of adjacent) {
    const neighborId = road.villageLocationId1 === villageId ? road.villageLocationId2 : road.villageLocationId1;
    const neighbor = board.villageLocations.find(l => l.id === neighborId);
    const score = neighbor ? locationScore(neighbor, board) : 0;
    if (score > bestScore) { bestScore = score; best = road; }
  }
  return best.id;
}

/**
 * Mid-game: pick the best valid village placement by probability score.
 * Returns null if no valid placement exists or the player cannot afford one.
 */
export function npcChooseVillagePlacement(board: BoardState, player: Player): number | null {
  const valid = board.villageLocations.filter(
    loc => canPlaceVillage(board, loc.id, player.id, false, player.resources),
  );
  if (valid.length === 0) return null;
  return valid.reduce((best, loc) =>
    locationScore(loc, board) > locationScore(best, board) ? loc : best,
  ).id;
}

/**
 * Mid-game: pick the village to upgrade to a town (highest location score).
 * Returns null if no upgrade is valid or affordable.
 */
export function npcChooseTownPlacement(board: BoardState, player: Player): number | null {
  const valid = board.villageLocations.filter(
    loc => canPlaceTown(board, loc.id, player.id, player.resources),
  );
  if (valid.length === 0) return null;
  return valid.reduce((best, loc) =>
    locationScore(loc, board) > locationScore(best, board) ? loc : best,
  ).id;
}

/**
 * Mid-game: pick a road that extends toward the highest-scoring unoccupied
 * village spot reachable from its endpoints.
 */
export function npcChooseRoadPlacement(board: BoardState, player: Player): number | null {
  const valid = board.roadLocations.filter(
    r => canPlaceRoad(board, r.id, player.id, false, player.resources),
  );
  if (valid.length === 0) return null;

  const unoccupied = board.villageLocations.filter(l => l.ownerId === null);
  let best = valid[0];
  let bestScore = -1;
  for (const road of valid) {
    const score = Math.max(
      ...[road.villageLocationId1, road.villageLocationId2].map(vid => {
        const loc = unoccupied.find(l => l.id === vid);
        return loc ? locationScore(loc, board) : 0;
      }),
    );
    if (score > bestScore) { bestScore = score; best = road; }
  }
  return best.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Development cards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the NPC should buy a dev card this turn.
 * Buys when it can afford one and isn't about to complete a more valuable build.
 */
export function npcShouldBuyDevCard(player: Player): boolean {
  const { sheep, wheat, stone, wood, brick } = player.resources;
  if (sheep < 1 || wheat < 1 || stone < 1) return false;
  // Don't buy if on the verge of a town (2 wheat + 3 stone — expensive, high priority)
  if (wheat >= 2 && stone >= 3) return false;
  // Don't buy if we can build a village right now and have few resources to spare
  const canBuildVillage = wood >= 1 && brick >= 1 && sheep >= 1 && wheat >= 1;
  if (canBuildVillage && totalResources(player) <= 5) return false;
  return true;
}

/**
 * Returns the dev card type the NPC should play this turn, or null if none.
 * - pre-roll: only Knight may be played.
 * - actions: Monopoly → Year of Plenty → Road Building (in priority order).
 */
export function npcChooseDevCardToPlay(
  player: Player,
  turnPhase: "pre-roll" | "actions",
  currentTurnNumber: number,
  players: Player[],
): DevCardType | null {
  const playable = player.devCards.filter(
    c => c.type !== "victoryPoint" && c.drawnOnTurn !== currentTurnNumber,
  );

  if (turnPhase === "pre-roll") {
    return playable.some(c => c.type === "knight") ? "knight" : null;
  }

  // Monopoly: worth playing when opponents hold meaningful resources
  const opponentTotal = players
    .filter(p => p.id !== player.id)
    .reduce((sum, p) => sum + totalResources(p), 0);
  if (playable.some(c => c.type === "monopoly") && opponentTotal >= 4) return "monopoly";

  // Year of Plenty: play when 2 free resources complete a build
  if (playable.some(c => c.type === "yearOfPlenty")) {
    const r = player.resources;
    const villageShortfall =
      Math.max(0, 1 - r.wood) + Math.max(0, 1 - r.brick) +
      Math.max(0, 1 - r.sheep) + Math.max(0, 1 - r.wheat);
    const townShortfall = Math.max(0, 2 - r.wheat) + Math.max(0, 3 - r.stone);
    if (villageShortfall <= 2 || townShortfall <= 2) return "yearOfPlenty";
  }

  // Road Building: play if roads remain
  if (playable.some(c => c.type === "roadBuilding") && player.roadsAvailable >= 1) {
    return "roadBuilding";
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Trading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the NPC should accept a player trade offer.
 * Accepts when: has enough of the requested resource (≥ 2) AND the offered
 * resource moves the NPC closer to an affordable build goal.
 */
export function npcShouldAcceptPlayerTrade(
  npc: Player,
  offer: PlayableResource,
  request: PlayableResource,
): boolean {
  if (npc.resources[request] < 2) return false;
  const after = {
    ...npc.resources,
    [request]: npc.resources[request] - 1,
    [offer]: npc.resources[offer] + 1,
  };
  return (
    (after.wood >= 1 && after.brick >= 1) ||
    (after.wood >= 1 && after.brick >= 1 && after.sheep >= 1 && after.wheat >= 1) ||
    (after.wheat >= 2 && after.stone >= 3) ||
    (after.sheep >= 1 && after.wheat >= 1 && after.stone >= 1)
  );
}

/**
 * Returns a bank trade the NPC should make, or null if none is worthwhile.
 * Trades the most-surplus resource for the most-needed one.
 */
export function npcChooseBankTrade(
  player: Player,
  board: BoardState,
): { give: PlayableResource; receive: PlayableResource } | null {
  const canGive = ALL_RESOURCES.filter(r => player.resources[r] >= exchangeRate(board, player, r));
  if (canGive.length === 0) return null;

  function needScore(r: PlayableResource): number {
    const res = player.resources;
    let score = 0;
    const villageShortfall =
      Math.max(0, 1 - res.wood) + Math.max(0, 1 - res.brick) +
      Math.max(0, 1 - res.sheep) + Math.max(0, 1 - res.wheat);
    if (villageShortfall > 0 && ["wood", "brick", "sheep", "wheat"].includes(r)) {
      score += (4 - villageShortfall) * 2;
    }
    if (r === "wheat") score += Math.max(0, 2 - res.wheat) * 3;
    if (r === "stone") score += Math.max(0, 3 - res.stone) * 3;
    if (r === "wood" || r === "brick") score += Math.max(0, 1 - res.wood) + Math.max(0, 1 - res.brick);
    if (["sheep", "wheat", "stone"].includes(r)) score += 1;
    return score;
  }

  const give = canGive.reduce((best, r) =>
    player.resources[r] - exchangeRate(board, player, r) >
    player.resources[best] - exchangeRate(board, player, best) ? r : best,
  );
  const receive = ALL_RESOURCES
    .filter(r => r !== give)
    .reduce((best, r) => needScore(r) > needScore(best) ? r : best);

  return needScore(receive) > 0 ? { give, receive } : null;
}

/**
 * Returns a player trade offer the NPC would initiate, or null if none makes sense.
 * Offers their most-surplus resource, requests their most-needed one.
 */
export function npcChoosePlayerTradeOffer(
  player: Player,
): { offer: PlayableResource; request: PlayableResource } | null {
  const r = player.resources;
  const canOffer = ALL_RESOURCES.filter(res => r[res] >= 2);
  if (canOffer.length === 0) return null;

  function needScore(res: PlayableResource): number {
    let score = 0;
    if (res === "wood" || res === "brick") score += Math.max(0, 1 - r.wood) + Math.max(0, 1 - r.brick);
    const villageShortfall =
      Math.max(0, 1 - r.wood) + Math.max(0, 1 - r.brick) +
      Math.max(0, 1 - r.sheep) + Math.max(0, 1 - r.wheat);
    if (villageShortfall > 0 && ["wood", "brick", "sheep", "wheat"].includes(res)) score += villageShortfall;
    if (res === "wheat") score += Math.max(0, 2 - r.wheat) * 2;
    if (res === "stone") score += Math.max(0, 3 - r.stone) * 2;
    return score;
  }

  const offer = canOffer.reduce((best, res) => r[res] > r[best] ? res : best);
  const request = ALL_RESOURCES
    .filter(res => res !== offer && r[res] < 2)
    .sort((a, b) => needScore(b) - needScore(a))[0] ?? null;

  return request ? { offer, request } : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Robber placement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Choose a robber tile for an NPC:
 * - Prefer high-probability tiles (6/8) with enemy settlements and no own settlements.
 * - Exclude the tile the robber is already on.
 * - Falls back to any non-robber tile, then the first tile.
 */
export function npcChooseRobberTile(
  board: BoardState,
  npcPlayerId: number,
  _players: Player[],
): number {
  const npcTileIds = new Set(
    board.villageLocations
      .filter(loc => loc.ownerId === npcPlayerId && (loc.isVillage || loc.isTown))
      .flatMap(loc => loc.adjacentTileIds),
  );
  const enemyTileIds = new Set(
    board.villageLocations
      .filter(loc => loc.ownerId !== null && loc.ownerId !== npcPlayerId && (loc.isVillage || loc.isTown))
      .flatMap(loc => loc.adjacentTileIds),
  );

  const ideal = board.tiles.filter(t => !t.hasRobber && !npcTileIds.has(t.id) && enemyTileIds.has(t.id));
  if (ideal.length > 0) {
    return ideal.reduce((best, t) => tilePips(t.dieNumber) > tilePips(best.dieNumber) ? t : best).id;
  }

  const anyOther = board.tiles.filter(t => !t.hasRobber);
  if (anyOther.length > 0) return anyOther[Math.floor(Math.random() * anyOther.length)].id;

  return board.tiles[0].id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monopoly resource
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Choose which resource to monopolize: the one opponents hold the most of.
 */
export function npcChooseMonopolyResource(
  players: Player[],
  npcPlayerId: number,
): PlayableResource {
  return ALL_RESOURCES.reduce((best, r) => {
    const total = players.filter(p => p.id !== npcPlayerId).reduce((sum, p) => sum + p.resources[r], 0);
    const bestTotal = players.filter(p => p.id !== npcPlayerId).reduce((sum, p) => sum + p.resources[best], 0);
    return total > bestTotal ? r : best;
  });
}
