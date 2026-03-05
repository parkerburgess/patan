"use client";

import type { Player } from "@/types/game";

interface Props {
  player: Player;
  isActive: boolean;
}

export default function PlayerCard({ player, isActive }: Props) {
  return (
    <div
      className={`grid gap-1.5 rounded-lg pt-2.5 px-2.5 pb-1 border-4 transition-all duration-200 ${
        isActive
          ? "bg-[#D4A96A] text-[#3B1F0A]"
          : "bg-[#7B4F2E] text-white"
      }`}
      style={{ borderColor: player.color }}
    >
      {/* Row 1: name | VP | Road | Army */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-2 text-xs">
        <span className="font-bold truncate">{player.name}</span>
        <span className={`text-xl font-bold ${isActive ? "text-[#7B4F2E]" : "text-[#D4A96A]"}`}>
          {player.victoryPoints}
        </span>
        <div>
          <span className="opacity-60">R </span>
          <span className={player.hasLongestRoad ? `font-bold ${isActive ? "text-[#7B4F2E]" : "text-[#D4A96A]"}` : ""}>
            {player.roadLength}
          </span>
        </div>
        <div>
          <span className="opacity-60">A </span>
          <span className={player.hasLargestArmy ? `font-bold ${isActive ? "text-[#7B4F2E]" : "text-[#D4A96A]"}` : ""}>
            {player.armyCount}
          </span>
        </div>
      </div>

      {/* Row 2: Roads | Villages | Towns */}
      <div className={`grid grid-cols-4 border-t pt-1 text-[11px] opacity-80 ${isActive ? "border-[#7B4F2E]/30" : "border-white/30"}`}>
        <span></span>
        <span>Rd:<span className="opacity-100">{player.roadsAvailable}</span></span>
        <span>Vil:<span className="opacity-100">{player.villagesAvailable}</span></span>
        <span>Twn:<span className="opacity-100">{player.townsAvailable}</span></span>
      </div>

    </div>
  );
}
