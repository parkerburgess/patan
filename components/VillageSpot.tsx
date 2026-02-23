import type { VillageLocation } from "@/types/game";

interface Props {
  location: VillageLocation;
  /** Hex color of the owning player, or null if unowned. */
  playerColor: string | null;
  mode: "place-village" | "place-town" | "idle";
  /** Whether this spot is a valid click target in the current placement mode. */
  isValid: boolean;
  onClick: () => void;
}

const VILLAGE_R = 19;
const TOWN_R = 25;
const RING_R = 12;

function diamondPoints(x: number, y: number, r: number): string {
  return `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
}

export default function VillageSpot({ location, playerColor, mode, isValid, onClick }: Props) {
  const { x, y, isVillage, isTown } = location;
  const owned = location.ownerId !== null;

  // In idle mode, only render owned settlements
  if (mode === "idle") {
    if (!owned || !playerColor) return null;
    if (isTown) {
      return (
        <g>
          <circle cx={x} cy={y} r={TOWN_R} fill={playerColor} />
          <circle cx={x} cy={y} r={TOWN_R - 5} fill="white" fillOpacity={0.3} />
        </g>
      );
    }
    return <polygon points={diamondPoints(x, y, VILLAGE_R)} fill={playerColor} />;
  }

  // In placement mode — always render owned pieces as non-interactive indicators
  if (owned && playerColor) {
    if (isTown) {
      return (
        <g>
          <circle cx={x} cy={y} r={TOWN_R} fill={playerColor} />
          <circle cx={x} cy={y} r={TOWN_R - 5} fill="white" fillOpacity={0.3} />
        </g>
      );
    }
    if (isVillage) {
      // In town-placement mode, highlight the player's own village as a target
      if (mode === "place-town" && isValid) {
        return (
          <polygon
            points={diamondPoints(x, y, VILLAGE_R)}
            fill={playerColor}
            stroke="white" strokeWidth={2} strokeOpacity={0.9}
            cursor="pointer"
            onClick={onClick}
          />
        );
      }
      return <polygon points={diamondPoints(x, y, VILLAGE_R)} fill={playerColor} />;
    }
    return null;
  }

  // Unowned — show clickable diamond ring if valid for village placement
  if (isValid && mode === "place-village") {
    return (
      <polygon
        points={diamondPoints(x, y, RING_R)}
        fill="white" fillOpacity={0.35}
        stroke="white" strokeWidth={2} strokeOpacity={0.8}
        cursor="pointer"
        onClick={onClick}
      />
    );
  }

  return null;
}
