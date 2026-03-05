"use client";

import { useState } from "react";
import type { Player } from "@/types/game";
import type { LogEntry } from "./GameLog";
import GameLog from "./GameLog";
import PlayerCard from "./PlayerCard";

interface Props {
  orderedPlayers: Player[];
  currentPlayer: Player;
  gamePhase: "setup" | "playing";
  robberState: "human-discard" | "place-robber" | null;
  statusText: string;
  logEntries: LogEntry[];
  rollHistory: number[];
}

const DICE_TOTALS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function LeftPanel({
  orderedPlayers,
  currentPlayer,
  gamePhase,
  robberState,
  statusText,
  logEntries,
  rollHistory,
}: Props) {
  const [activeTab, setActiveTab] = useState<"players" | "stats">("players");

  const rollCounts = DICE_TOTALS.reduce<Record<number, number>>((acc, n) => {
    acc[n] = rollHistory.filter(r => r === n).length;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(rollCounts));

  return (
    <aside className="w-56 shrink-0 flex flex-row h-full">

      {/* Side tab strip */}
      <div className="flex flex-col bg-slate-900 border-r border-slate-700">
        {(["players", "stats"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            className={`px-1.5 py-3 text-[10px] uppercase tracking-widest transition-colors flex-1
              ${activeTab === tab
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto gap-2 p-2">

        {activeTab === "players" && (
          <>
            {/* Status banner */}
            {(gamePhase === "setup" || gamePhase === "playing") && (
              <div className={`px-3 py-2 rounded-lg text-sm text-white font-medium shadow shrink-0 text-center ${
                robberState === "place-robber" ? "bg-yellow-700" : "bg-slate-700"
              }`}>
                {gamePhase === "setup" ? (
                  <>
                    <span className="text-slate-400 mr-1">Setup —</span>
                    <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
                      {currentPlayer.name}:
                    </span>
                    {statusText}
                  </>
                ) : (
                  <>
                    <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
                      {currentPlayer.name}
                    </span>
                    <span className="text-slate-300">{statusText}</span>
                  </>
                )}
              </div>
            )}

            {orderedPlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                isActive={player.id === currentPlayer.id}
              />
            ))}
          </>
        )}

        {activeTab === "stats" && (
          <>
            {/* Dice roll histogram */}
            <fieldset className="border border-slate-600 rounded px-2 pb-2 shrink-0">
              <legend className="text-[10px] text-slate-400 px-1 uppercase tracking-widest">Dice Rolls</legend>
              <div className="flex flex-col gap-0.5">
                {DICE_TOTALS.map(n => {
                  const count = rollCounts[n];
                  const barPct = (count / maxCount) * 100;
                  return (
                    <div key={n} className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px] w-4 text-right shrink-0">{n}</span>
                      <div className="flex-1 bg-slate-800 rounded-sm h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-slate-500 rounded-sm transition-all duration-300"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-slate-300 text-[10px] w-4 shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {/* Game log */}
            <div className="flex-1 min-h-0">
              <GameLog entries={logEntries} />
            </div>
          </>
        )}

      </div>
    </aside>
  );
}
