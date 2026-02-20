import type {
  Tile, Port, BoardState, VillageLocation, RoadLocation,
  ResourceType, PortType, HexCoord,
} from "@/types/game";

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

// ── Village & Road Location Stubs ─────────────────────────────────────────────
// A standard Catan board has 54 village locations (hex vertices) and
// 72 road locations (hex edges). Computing their adjacency graph from axial
// coordinates is deferred to a future phase.

function createVillageLocations(): VillageLocation[] {
  return [];
}

function createRoadLocations(): RoadLocation[] {
  return [];
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

  return {
    tiles,
    ports,
    villageLocations: createVillageLocations(),
    roadLocations: createRoadLocations(),
  };
}
