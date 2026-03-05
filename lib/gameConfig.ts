import type { Player, PlayableResource } from "@/types/game";

export const EMPTY_RESOURCES: Record<PlayableResource, number> = {
  wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0,
};

export const ROAD_COST     = { ...EMPTY_RESOURCES, wood: 1, brick: 1 };
export const VILLAGE_COST  = { ...EMPTY_RESOURCES, wood: 1, brick: 1, sheep: 1, wheat: 1 };
export const TOWN_COST     = { ...EMPTY_RESOURCES, wheat: 2, stone: 3 };
export const DEV_CARD_COST = { ...EMPTY_RESOURCES, sheep: 1, wheat: 1, stone: 1 };

export const LEGEND = [
  { color: "#2D6A2D", label: "Wood" },
  { color: "#B22222", label: "Brick" },
  { color: "#7EC850", label: "Sheep" },
  { color: "#DAA520", label: "Wheat" },
  { color: "#708090", label: "Stone" },
  { color: "#E8D5A3", label: "Desert" },
];

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 1, name: "You", color: "#DC2626", isHuman: true,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 2, name: "NPC 1", color: "#042c83", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 3, name: "NPC 2", color: "#f1de2b", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 4, name: "NPC 3", color: "#16A34A", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
];
