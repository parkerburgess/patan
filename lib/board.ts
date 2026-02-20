import type { Tile, Port, BoardState, ResourceType, PortType, HexCoord } from "@/types/game";

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
// Pointy-top corners at (60*i + 30)°, so edge i is between corners i and i+1:
//   edge 0 = SE, edge 1 = SW, edge 2 = W, edge 3 = NW, edge 4 = NE, edge 5 = E
const PORT_POSITIONS: Array<{ hexCoord: HexCoord; edgeIndex: number }> = [
  { hexCoord: { q: 0, r: -2 }, edgeIndex: 3 },   // top-left → NW face (outer)            // good
  { hexCoord: { q: 1, r: -2 }, edgeIndex: 4 },   // top-right → NE face (outer)
  { hexCoord: { q: 2, r: -1 }, edgeIndex: 4 },   // upper-right → E face (outer)
  { hexCoord: { q: 2, r: 0 }, edgeIndex: 5 },    // far-right middle → SE face (outer)
  { hexCoord: { q: 1, r: 1 }, edgeIndex: 0 },    // lower-right → SE face (outer)
  { hexCoord: { q: -1, r: 2 }, edgeIndex: 0 },    // bottom-right → SW face (outer)
  { hexCoord: { q: -2, r: 2 }, edgeIndex: 1 },   // bottom-left → SW face (outer)
  { hexCoord: { q: -2, r: 1 }, edgeIndex: 2 },   // lower-left → W face (outer)
  { hexCoord: { q: -1, r: -1 }, edgeIndex: 2 },   // far-left middle → W face (outer)
];

// 9 port types: 4 generic (3:1) + one 2:1 for each resource
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

const NEIGHBOR_DELTAS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]] as const;

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

// ── Board Generation ──────────────────────────────────────────────────────────

export function createBoard(): BoardState {
  const resources = shuffle(RESOURCE_POOL);

  // Reshuffle number tokens until no 6 or 8 is adjacent to another 6 or 8
  let tiles: Tile[];
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
  } while (hasAdjacentHighNumbers(tiles));

  const portTypes = shuffle(PORT_TYPE_POOL);
  const ports: Port[] = PORT_POSITIONS.map((pos, i) => ({
    type: portTypes[i],
    hexCoord: pos.hexCoord,
    edgeIndex: pos.edgeIndex,
  }));

  return { tiles, ports };
}
