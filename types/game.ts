export type ResourceType = "wood" | "brick" | "sheep" | "wheat" | "stone" | "desert";
export type PlayableResource = Exclude<ResourceType, "desert">;
export type PortType = ResourceType | "generic";

export interface HexCoord {
  q: number;
  r: number;
}

export interface Tile {
  id: number;
  coord: HexCoord;
  resource: ResourceType;
  dieNumber: number | null; // null for desert
  hasRobber: boolean;
}

export interface Port {
  type: PortType;
  hexCoord: HexCoord;
  // Edge i lies between hex corner i and corner (i+1)%6 (pointy-top, SVG y-down):
  //   0 = SE,  1 = SW,  2 = W,  3 = NW,  4 = NE,  5 = E
  edgeIndex: number;
}

export interface VillageLocation {
  id: number;
  ownerId: number | null;
  adjacentVillageIds: number[]; // used to enforce the distance rule (no adjacent settlements)
  adjacentTileIds: number[];    // tiles this vertex borders (for resource collection)
  bonus: PortType | null;       // port bonus if this location sits on a port edge
  isVillage: boolean;
  isTown: boolean;
}

export interface RoadLocation {
  id: number;
  ownerId: number | null;
  villageLocationId1: number;
  villageLocationId2: number;
}

export interface BoardState {
  tiles: Tile[];
  ports: Port[];
  villageLocations: VillageLocation[]; // 54 vertex positions
  roadLocations: RoadLocation[];       // 72 edge positions
}

export interface Player {
  id: number;
  name: string;
  color: string;
  isHuman: boolean;
  victoryPoints: number;
  roadLength: number;
  armyCount: number;
  hasLargestArmy: boolean;
  hasLongestRoad: boolean;
  roadsAvailable: number;    // starts at 15
  villagesAvailable: number; // starts at 5
  townsAvailable: number;    // starts at 4
  resources: Record<PlayableResource, number>;
}
