import type {
  Tile, Port, BoardState, VillageLocation, RoadLocation,
  ResourceType, PortType, HexCoord,
} from "@/types/game";
import { HEX_SIZE } from "@/lib/constants";
import { axialToPixel, hexCornerPoints } from "@/lib/geometry";

// ── Axial coords for the 19 hex tiles ────────────────────────────────────────
// Hex-shaped layout: all (q, r) satisfying |q| ≤ 2, |r| ≤ 2, |q+r| ≤ 2

const HEX_COORDS: HexCoord[] = [
  // r = -2  (3 tiles)
  { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  // r = -1  (4 tiles)
  { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
  // r =  0  (5 tiles)
  { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  // r =  1  (4 tiles)
  { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
  // r =  2  (3 tiles)
  { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
];

// Standard Catan resource distribution (19 tiles total)
const RESOURCE_POOL: ResourceType[] = [
  "wood", "wood", "wood", "wood",
  "sheep", "sheep", "sheep", "sheep",
  "wheat", "wheat", "wheat", "wheat",
  "brick", "brick", "brick",
  "stone", "stone", "stone",
  "desert",
];

// Number tokens for non-desert tiles (18 tokens)
const NUMBER_POOL: number[] = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

// 9 fixed border port positions (types are shuffled separately)
// Edge directions for pointy-top hexagons (SVG y-down):
//   0 = SE,  1 = SW,  2 = W,  3 = NW,  4 = NE,  5 = E
const PORT_POSITIONS: Array<{ hexCoord: HexCoord; edgeIndex: number }> = [
  { hexCoord: { q: 0,  r: -2 }, edgeIndex: 3 }, // top-left    → NW face
  { hexCoord: { q: 1,  r: -2 }, edgeIndex: 4 }, // top         → NE face
  { hexCoord: { q: 2,  r: -1 }, edgeIndex: 4 }, // upper-right → NE face
  { hexCoord: { q: 2,  r:  0 }, edgeIndex: 5 }, // right       → E face
  { hexCoord: { q: 1,  r:  1 }, edgeIndex: 0 }, // lower-right → SE face
  { hexCoord: { q: -1, r:  2 }, edgeIndex: 0 }, // bottom      → SE face
  { hexCoord: { q: -2, r:  2 }, edgeIndex: 1 }, // bottom-left → SW face
  { hexCoord: { q: -2, r:  1 }, edgeIndex: 2 }, // left        → W face
  { hexCoord: { q: -1, r: -1 }, edgeIndex: 2 }, // upper-left  → W face
];

// 9 port types: 4 generic (3:1) + one 2:1 for each playable resource
const PORT_TYPE_POOL: PortType[] = [
  "generic", "generic", "generic", "generic",
  "wood", "brick", "sheep", "wheat", "stone",
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const NEIGHBOR_DELTAS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]] as const;

function areAdjacent(a: HexCoord, b: HexCoord): boolean {
  return NEIGHBOR_DELTAS.some(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
}

function hasAdjacentHighNumbers(tiles: Tile[]): boolean {
  const highTiles = tiles.filter(t => t.dieNumber === 6 || t.dieNumber === 8);
  for (let i = 0; i < highTiles.length; i++) {
    for (let j = i + 1; j < highTiles.length; j++) {
      if (areAdjacent(highTiles[i].coord, highTiles[j].coord)) return true;
    }
  }
  return false;
}

// ── Village & Road Location Geometry ──────────────────────────────────────────

/**
 * Build all 54 vertex positions (VillageLocation) from the 19 tiles.
 * Deduplicates by rounded pixel coordinate, builds tile adjacency,
 * vertex-to-vertex adjacency (distance rule), and port bonuses.
 */
function createVillageLocations(tiles: Tile[], ports: Port[]): VillageLocation[] {
  const byKey = new Map<string, VillageLocation>();
  let nextId = 0;

  // Pass 1: collect all corners, deduplicate, build tile adjacency
  for (const tile of tiles) {
    const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
    const corners = hexCornerPoints(x, y, HEX_SIZE);
    for (const corner of corners) {
      const key = `${Math.round(corner.x)},${Math.round(corner.y)}`;
      if (!byKey.has(key)) {
        byKey.set(key, {
          id: nextId++,
          ownerId: null,
          adjacentVillageIds: [],
          adjacentTileIds: [],
          bonus: null,
          isVillage: false,
          isTown: false,
          x: corner.x,
          y: corner.y,
        });
      }
      const loc = byKey.get(key)!;
      if (!loc.adjacentTileIds.includes(tile.id)) {
        loc.adjacentTileIds.push(tile.id);
      }
    }
  }

  // Pass 2: build vertex-to-vertex adjacency (edge i connects corner i and (i+1)%6)
  for (const tile of tiles) {
    const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
    const corners = hexCornerPoints(x, y, HEX_SIZE);
    for (let i = 0; i < 6; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 6];
      const locA = byKey.get(`${Math.round(a.x)},${Math.round(a.y)}`)!;
      const locB = byKey.get(`${Math.round(b.x)},${Math.round(b.y)}`)!;
      if (!locA.adjacentVillageIds.includes(locB.id)) locA.adjacentVillageIds.push(locB.id);
      if (!locB.adjacentVillageIds.includes(locA.id)) locB.adjacentVillageIds.push(locA.id);
    }
  }

  // Pass 3: assign port bonuses to the two corners on each port edge
  for (const port of ports) {
    const { x, y } = axialToPixel(port.hexCoord, HEX_SIZE);
    const corners = hexCornerPoints(x, y, HEX_SIZE);
    const ca = corners[port.edgeIndex];
    const cb = corners[(port.edgeIndex + 1) % 6];
    const locA = byKey.get(`${Math.round(ca.x)},${Math.round(ca.y)}`);
    const locB = byKey.get(`${Math.round(cb.x)},${Math.round(cb.y)}`);
    if (locA) locA.bonus = port.type;
    if (locB) locB.bonus = port.type;
  }

  return Array.from(byKey.values());
}

/**
 * Build all 72 edge positions (RoadLocation) from the 19 tiles.
 * Uses the same canonical-key deduplication as Board.tsx road rendering.
 */
function createRoadLocations(villageLocations: VillageLocation[], tiles: Tile[]): RoadLocation[] {
  // Build pixel-key → village id lookup
  const byKey = new Map<string, number>();
  for (const loc of villageLocations) {
    byKey.set(`${Math.round(loc.x)},${Math.round(loc.y)}`, loc.id);
  }

  const seen = new Set<string>();
  const roads: RoadLocation[] = [];
  let nextId = 0;

  for (const tile of tiles) {
    const { x, y } = axialToPixel(tile.coord, HEX_SIZE);
    const corners = hexCornerPoints(x, y, HEX_SIZE);
    for (let i = 0; i < 6; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 6];
      const ax = Math.round(a.x), ay = Math.round(a.y);
      const bx = Math.round(b.x), by = Math.round(b.y);
      // Canonical key: smaller coordinate first
      const key = ax < bx || (ax === bx && ay < by)
        ? `${ax},${ay}-${bx},${by}`
        : `${bx},${by}-${ax},${ay}`;
      if (!seen.has(key)) {
        seen.add(key);
        const id1 = byKey.get(`${ax},${ay}`);
        const id2 = byKey.get(`${bx},${by}`);
        if (id1 !== undefined && id2 !== undefined) {
          roads.push({ id: nextId++, ownerId: null, villageLocationId1: id1, villageLocationId2: id2 });
        }
      }
    }
  }

  return roads;
}

// ── Board Generation ──────────────────────────────────────────────────────────

export function createBoard(): BoardState {
  const resources = shuffle(RESOURCE_POOL);

  // Reshuffle number tokens until no 6 or 8 is adjacent to another 6 or 8.
  // Converges quickly in practice; bounded by the low probability of repeated failures.
  let tiles: Tile[];
  let attempts = 0;
  do {
    const numbers = shuffle(NUMBER_POOL);
    let numberIndex = 0;
    tiles = HEX_COORDS.map((coord, i) => {
      const resource = resources[i];
      const isDesert = resource === "desert";
      return {
        id: i + 1,
        coord,
        resource,
        dieNumber: isDesert ? null : numbers[numberIndex++],
        hasRobber: isDesert,
      };
    });
    attempts++;
    if (attempts > 100) break; // safety valve; valid layouts exist so this is unreachable in practice
  } while (hasAdjacentHighNumbers(tiles));

  const portTypes = shuffle(PORT_TYPE_POOL);
  const ports: Port[] = PORT_POSITIONS.map((pos, i) => ({
    type: portTypes[i],
    hexCoord: pos.hexCoord,
    edgeIndex: pos.edgeIndex,
  }));

  const villageLocations = createVillageLocations(tiles, ports);
  const roadLocations = createRoadLocations(villageLocations, tiles);

  return {
    tiles,
    ports,
    villageLocations,
    roadLocations,
    startingPlayerIdx: Math.floor(Math.random() * 4),
  };
}
