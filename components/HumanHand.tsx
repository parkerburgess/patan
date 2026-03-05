"use client";

import Image from "next/image";
import type { Player, PlayableResource, DevCardType } from "@/types/game";

const RESOURCES: PlayableResource[] = ["wood", "brick", "sheep", "wheat", "stone"];

const RESOURCE_LABELS: Record<PlayableResource, string> = {
  wood: "Wood", brick: "Brick", sheep: "Sheep", wheat: "Wheat", stone: "Stone",
};

const RESOURCE_IMAGES: Record<PlayableResource, string> = {
  wood:  "/images/wood.png",
  brick: "/images/brick.png",
  sheep: "/images/sheep.png",
  wheat: "/images/wheat.png",
  stone: "/images/stone.png",
};

const DEV_CARD_LABELS: Record<DevCardType, string> = {
  knight:       "Knight",
  victoryPoint: "Victory Point",
  roadBuilding: "Road Building",
  yearOfPlenty: "Year of Plenty",
  monopoly:     "Monopoly",
};

interface Props {
  player: Player;
}

export default function HumanHand({ player }: Props) {
  // Group dev cards by type
  const devCardCounts = player.devCards.reduce<Partial<Record<DevCardType, number>>>(
    (acc, card) => ({ ...acc, [card.type]: (acc[card.type] ?? 0) + 1 }),
    {},
  );
  const devCardEntries = Object.entries(devCardCounts) as [DevCardType, number][];

  return (
    <div className="flex gap-3 shrink-0 justify-center pb-3">

      {/* Resources */}
      <fieldset className="border border-slate-500 rounded px-3 pb-2">
        <legend className="text-[10px] text-slate-400 px-1 uppercase tracking-widest">Resources</legend>
        <div className="flex gap-2">
          {RESOURCES.map(res => {
            const count = player.resources[res];
            return (
              <div
                key={res}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors ${
                  count > 0
                    ? "border-slate-500 bg-slate-700"
                    : "border-slate-700 bg-slate-800 opacity-35"
                }`}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={RESOURCE_IMAGES[res]}
                    alt={RESOURCE_LABELS[res]}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-slate-300 text-[10px] leading-none">{RESOURCE_LABELS[res]}</span>
                <span className={`font-bold text-sm leading-none ${count > 0 ? "text-white" : "text-slate-500"}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Dev Cards */}
      <fieldset className="border border-slate-500 rounded px-3 pb-2 min-w-32">
        <legend className="text-[10px] text-slate-400 px-1 uppercase tracking-widest">Dev Cards</legend>
        {devCardEntries.length === 0 ? (
          <p className="text-slate-600 text-xs italic mt-1">None</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {devCardEntries.map(([type, count]) => (
              <div
                key={type}
                className="flex items-center gap-1.5 bg-slate-700 border border-slate-500
                           rounded px-2 py-1"
              >
                <span className="text-slate-200 text-xs">{DEV_CARD_LABELS[type]}</span>
                {count > 1 && (
                  <span className="bg-slate-500 text-white text-[10px] font-bold
                                   rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </fieldset>

    </div>
  );
}
