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

const DEV_CARDS: DevCardType[] = ["knight", "victoryPoint", "roadBuilding", "yearOfPlenty", "monopoly"];

const DEV_CARD_LABELS: Record<DevCardType, string> = {
  knight:       "Knight",
  victoryPoint: "Vic. Point",
  roadBuilding: "Road Build",
  yearOfPlenty: "Yr. Plenty",
  monopoly:     "Monopoly",
};

const DEV_CARD_IMAGES: Record<DevCardType, string> = {
  knight:       "/images/knight.png",
  victoryPoint: "/images/vicotry-point.png",
  roadBuilding: "/images/road-builder.png",
  yearOfPlenty: "/images/year-of-plenty.png",
  monopoly:     "/images/monopoly.png",
};

interface Props {
  player: Player;
  canDraw: boolean;
  canPlayKnight: boolean;
  currentTurnNumber: number;
  onDraw: () => void;
  onUseDevCard: (type: DevCardType) => void;
}

export default function HumanHand({ player, canDraw, canPlayKnight, currentTurnNumber, onDraw, onUseDevCard }: Props) {
  const devCardCounts = player.devCards.reduce<Partial<Record<DevCardType, number>>>(
    (acc, card) => ({ ...acc, [card.type]: (acc[card.type] ?? 0) + 1 }),
    {},
  );

  return (
    <div className="flex gap-3 shrink-0 justify-center">

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
      <fieldset className="border border-slate-500 rounded px-3 pb-2">
        <legend className="text-[10px] text-slate-400 px-1 uppercase tracking-widest">Dev Cards</legend>
        <div className="flex gap-2">

          {/* Draw button */}
          <button
            onClick={onDraw}
            disabled={!canDraw}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              ${canDraw ? "border-slate-500 bg-slate-700 hover:bg-slate-600 cursor-pointer" : "border-slate-700 bg-slate-800"}`}
          >
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <Image src="/images/plus.png" alt="Draw" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="text-slate-300 text-[10px] leading-none">Draw</span>
            <span className="font-bold text-sm leading-none text-slate-500">+</span>
          </button>

          {/* One card per type */}
          {DEV_CARDS.map(type => {
            const count = devCardCounts[type] ?? 0;
            const notPlayable = type === "victoryPoint";
            const drawnThisTurn = type !== "victoryPoint" &&
              player.devCards.find(c => c.type === type)?.drawnOnTurn === currentTurnNumber;
            const disabled = count === 0 || notPlayable || drawnThisTurn ||
              (type === "knight" ? !canPlayKnight : false);
            return (
              <button
                key={type}
                onClick={() => !notPlayable && onUseDevCard(type)}
                disabled={disabled}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors
                  disabled:opacity-35 disabled:cursor-not-allowed
                  ${count > 0 ? "border-slate-500 bg-slate-700 hover:bg-slate-600 cursor-pointer" : "border-slate-700 bg-slate-800"}`}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={DEV_CARD_IMAGES[type]}
                    alt={DEV_CARD_LABELS[type]}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-slate-300 text-[10px] leading-none">{DEV_CARD_LABELS[type]}</span>
                <span className={`font-bold text-sm leading-none ${count > 0 ? "text-white" : "text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

    </div>
  );
}
