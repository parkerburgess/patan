import type { VillageLocation } from "@/types/game";

interface Props {
  location: VillageLocation;
  /** Hex color of the owning player, or null if unowned. */
  playerColor: string | null;
  mode: "place-village" | "place-town" | "idle";
  /** Whether this spot is a valid click target in the current placement mode. */
  isValid: boolean;
  onVillageClick: () => void;
  onTownClick: () => void;
}

const VILLAGE_R = 19;
const TOWN_R = 25;
const RING_R = 12;

function diamondPoints(x: number, y: number, r: number): string {
  return `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
}

/** Parse "#RRGGBB" → [r, g, b] in 0–1 range for feColorMatrix. */
function hexToNorm(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function VillageImage({ x, y, color }: { x: number; y: number; color: string }) {
  const filterId = `village-color-${color.replace("#", "")}`;
  const [r, g, b] = hexToNorm(color);
  const imgProps = {
    href: "/images/village.png",
    x: x - VILLAGE_R * 4,
    y: y - VILLAGE_R * 4,
    width: VILLAGE_R * 8,
    height: VILLAGE_R * 8,
    preserveAspectRatio: "xMidYMid meet" as const,
    style: { pointerEvents: "none" as const },
  };
  return (
    <g>
      <defs>
        {/* Replace all opaque pixels with player color, preserve alpha */}
        <filter id={filterId}>
          <feColorMatrix type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1 0`} />
        </filter>
      </defs>
      {/* Isolated group: multiply blends the two layers with each other, not with the hex behind */}
      <g style={{ isolation: "isolate" }}>
        {/* Color fill layer: all pixels become player color */}
        <image {...imgProps} filter={`url(#${filterId})`} />
        {/* Original on top with multiply: white fill → player color, black lines → black */}
        <image {...imgProps} style={{ ...imgProps.style, mixBlendMode: "multiply" }} />
      </g>
    </g>
  );
}

function TownImage({ x, y, color }: { x: number; y: number; color: string }) {
  const filterId = `town-color-${color.replace("#", "")}`;
  const [r, g, b] = hexToNorm(color);
  const imgProps = {
    href: "/images/town.png",
    x: x - TOWN_R * 4,
    y: y - TOWN_R * 4,
    width: TOWN_R * 8,
    height: TOWN_R * 8,
    preserveAspectRatio: "xMidYMid meet" as const,
    style: { pointerEvents: "none" as const },
  };
  return (
    <g>
      <defs>
        <filter id={filterId}>
          <feColorMatrix type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1 0`} />
        </filter>
      </defs>
      <g style={{ isolation: "isolate" }}>
        <image {...imgProps} filter={`url(#${filterId})`} />
        <image {...imgProps} style={{ ...imgProps.style, mixBlendMode: "multiply" }} />
      </g>
    </g>
  );
}

export default function VillageSpot({ location, playerColor, mode, isValid, onVillageClick, onTownClick }: Props) {
  const { x, y, isVillage, isTown } = location;
  const owned = location.ownerId !== null;

  // In idle mode, only render owned settlements
  if (mode === "idle") {
    if (!owned || !playerColor) return null;
    if (isTown) return <TownImage x={x} y={y} color={playerColor} />;
    return <VillageImage x={x} y={y} color={playerColor} />;
  }

  // In placement mode — always render owned pieces as non-interactive indicators
  if (owned && playerColor) {
    if (isTown) return <TownImage x={x} y={y} color={playerColor} />;
    if (isVillage) {
      // In town-placement mode, highlight the player's own village as a target
      if (mode === "place-town" && isValid) {
        return (
          <g cursor="pointer" onClick={onTownClick}>
            <VillageImage x={x} y={y} color={playerColor} />
            <circle cx={x} cy={y} r={VILLAGE_R * 1.5} fill="none" stroke="white" strokeWidth={2} strokeOpacity={0.9} />
            {/* Invisible hit area — images have pointerEvents:none so we need an explicit target */}
            <circle cx={x} cy={y} r={VILLAGE_R * 1.5} fill="transparent" style={{ pointerEvents: "all" }} />
          </g>
        );
      }
      return <VillageImage x={x} y={y} color={playerColor} />;
    }
    return null;
  }

  // Unowned — show clickable diamond ring if valid for village placement
  if (isValid && mode === "place-village") {
    return (
      <polygon
        points={diamondPoints(x, y, RING_R)}
        fill="white" fillOpacity={0.09}
        stroke="white" strokeWidth={2} strokeOpacity={0.90}
        cursor="pointer"
        onClick={onVillageClick}
      />
    );
  }

  return null;
}
