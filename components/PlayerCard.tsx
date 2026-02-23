"use client";

import type { Player } from "@/types/game";

interface Props {
  player: Player;
  isActive: boolean;
}

export default function PlayerCard({ player, isActive }: Props) {
  return (
    <div
      className={`h-full rounded-lg pt-2.5 px-2.5 pb-1 border-2 flex flex-col transition-all duration-200 ${
        isActive
          ? "border-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.4)]"
          : "border-black/20"
      }`}
      style={{ backgroundColor: player.color }}
    >
      {/* Name */}
      <div className="mb-2">
        <span className="font-bold text-white text-xs drop-shadow">{player.name}</span>
      </div>

      {/* VP + Road + Army on same row */}
      <div className="flex items-baseline gap-3 mb-2 text-xs">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-yellow-200">{player.victoryPoints}</span>
          <span className="text-white/60">VP</span>
        </div>
        <div>
          <span className="text-white/60">Road </span>
          <span className={player.hasLongestRoad ? "font-bold text-yellow-200" : "text-white"}>
            {player.roadLength}
          </span>
        </div>
        <div>
          <span className="text-white/60">Army </span>
          <span className={player.hasLargestArmy ? "font-bold text-yellow-200" : "text-white"}>
            {player.armyCount}
          </span>
        </div>
      </div>

      {/* Available pieces */}
      <div className="border-t border-white/30 pt-1 flex gap-2 text-[11px] text-white/60">
        <span>Rd:<span className="text-white">{player.roadsAvailable}</span></span>
        <span>Vil:<span className="text-slate-100">{player.villagesAvailable}</span></span>
        <span>Twn:<span className="text-slate-100">{player.townsAvailable}</span></span>
      </div>

      {/* Resources */}
      <div className="border-t border-white/30 pt-1 flex justify-between text-[9px] text-white/60">
        {(["wood","brick","sheep","wheat","stone"] as const).map(r => (
          <span key={r}>
            {r.slice(0, 2)}<span className="text-white">{player.resources[r]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
