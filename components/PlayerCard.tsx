"use client";

import type { Player } from "@/types/game";

interface Props {
  player: Player;
  isActive: boolean;
}

export default function PlayerCard({ player, isActive }: Props) {
  return (
    <div
      className={`rounded-xl overflow-hidden border-2 transition-all duration-200 ${isActive ? "" : "opacity-75"}`}
      style={{
        borderColor: isActive ? player.color : "transparent",
        boxShadow: isActive ? `0 0 14px ${player.color}55` : undefined,
      }}
    >
      {/* Header: color swatch + name + active badge */}
      <div className="flex items-center gap-2 px-3 py-1" style={{ backgroundColor: `${player.color}28` }}>
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
          style={{ backgroundColor: player.color }}
        />
        <span className="font-bold text-white text-sm flex-1 truncate">{player.name}</span>
        {isActive && (
          <span className="text-[9px] uppercase tracking-widest bg-white/20 text-white px-1.5 py-0.5 rounded shrink-0">
            Active
          </span>
        )}
      </div>

      {/* Victory Points */}
      <div className="bg-slate-800 flex items-center justify-between px-3 py-1">
        <span className="text-slate-400 text-[10px] uppercase tracking-widest">Victory Points</span>
        <span className="text-xl font-bold leading-none" style={{ color: player.color }}>
          {player.victoryPoints}
        </span>
      </div>

      {/* Road length + Army count */}
      <div className="bg-slate-800/70 border-t border-slate-700 flex divide-x divide-slate-700">
        <div className="flex-1 flex items-center justify-between px-3 py-1 gap-1.5">
          <span className="text-slate-400 text-[10px] uppercase tracking-widest">Road</span>
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-sm">{player.roadLength}</span>
            {player.hasLongestRoad && (
              <span className="text-xs leading-none" style={{ color: player.color }}>★</span>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between px-3 py-1 gap-1.5">
          <span className="text-slate-400 text-[10px] uppercase tracking-widest">Army</span>
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-sm">{player.armyCount}</span>
            {player.hasLargestArmy && (
              <span className="text-xs leading-none" style={{ color: player.color }}>★</span>
            )}
          </div>
        </div>
      </div>

      {/* DEBUG: NPC resources / commented-out avail row */}
      {/* Pieces remaining
      <div className="bg-slate-900 border-t border-slate-700 flex divide-x divide-slate-700">
        <div className="flex items-center px-2 py-1">
          <span className="text-slate-500 text-[9px] uppercase tracking-widest">Avail</span>
        </div>
        {[
          { label: "Rd",  value: player.roadsAvailable },
          { label: "Vil", value: player.villagesAvailable },
          { label: "Twn", value: player.townsAvailable },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 flex items-center justify-center gap-1 py-1">
            <span className="text-slate-400 text-[9px] uppercase tracking-widest">{label}</span>
            <span className="text-white text-[9px] leading-none">{value}</span>
          </div>
        ))}
      </div>
      */}
      {!player.isHuman && (
        <div className="bg-slate-900 border-t border-slate-700 flex divide-x divide-slate-700">
          {(["wood","brick","sheep","wheat","stone"] as const).map(res => (
            <div key={res} className="flex-1 flex items-center justify-center gap-0.5 py-1">
              <span className="text-slate-500 text-[9px] uppercase">{res[0]}</span>
              <span className="text-white text-[9px] leading-none">{player.resources[res]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
