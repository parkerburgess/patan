export type ResourceType = "wood" | "brick" | "sheep" | "wheat" | "stone" | "desert";
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
  edgeIndex: number; // 0–5, pointy-top edges: 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW
}

export interface BoardState {
  tiles: Tile[];
  ports: Port[];
}
