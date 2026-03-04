"use client";

import type { Player } from "@/types/game";

interface Props {
  player: Player;
  isActive: boolean;
}

export default function PlayerCard({ player, isActive }: Props) {
  return (
    <div
      className={`grid gap-1.5 rounded-lg pt-2.5 px-2.5 pb-1 border-2 transition-all duration-200 ${
        isActive
          ? "border-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.4)]"
          : "border-black/20"
      }`}
      style={{ backgroundColor: player.color }}
    >
      {/* Row 1: name | VP | Road | Army */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-2 text-xs">
        <span className="font-bold text-white drop-shadow truncate">{player.name}</span>
        <span className="text-xl font-bold text-yellow-200">{player.victoryPoints}</span>
        <div>
          <span className="text-white/60">R </span>
          <span className={player.hasLongestRoad ? "font-bold text-yellow-200" : "text-white"}>
            {player.roadLength}
          </span>
        </div>
        <div>
          <span className="text-white/60">A </span>
          <span className={player.hasLargestArmy ? "font-bold text-yellow-200" : "text-white"}>
            {player.armyCount}
          </span>
        </div>
      </div>

      {/* Row 2: Roads | Villages | Towns */}
      <div className="grid grid-cols-4 border-t border-white/30 pt-1 text-[11px] text-white/60">
        <span></span>
        <span>Rd:<span className="text-white">{player.roadsAvailable}</span></span>
        <span>Vil:<span className="text-slate-100">{player.villagesAvailable}</span></span>
        <span>Twn:<span className="text-slate-100">{player.townsAvailable}</span></span>
      </div>

      {/* Resources
      <div className="grid grid-cols-5 border-t border-white/30 pt-1 text-[9px] text-white/60">
        {(["wood","brick","sheep","wheat","stone"] as const).map(r => (
          <span key={r}>
            {r.slice(0, 2)}<span className="text-white">{player.resources[r]}</span>
          </span>
        ))}
      </div>
      */}
    </div>
  );
}
