"use client";

import { useState } from "react";
import { createBoard } from "@/lib/board";
import { rollDice } from "@/lib/dice";
import Board from "@/components/Board";
import PlayerCard from "@/components/PlayerCard";
import DiceDisplay from "@/components/DiceDisplay";
import type { BoardState, Player } from "@/types/game";

const EMPTY_RESOURCES = { wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0 };

const LEGEND = [
  { color: "#2D6A2D", label: "Wood" },
  { color: "#B22222", label: "Brick" },
  { color: "#7EC850", label: "Sheep" },
  { color: "#DAA520", label: "Wheat" },
  { color: "#708090", label: "Stone" },
  { color: "#E8D5A3", label: "Desert" },
];

const INITIAL_PLAYERS: Player[] = [
  {
    id: 1,
    name: "You",
    color: "#DC2626",
    isHuman: true,
    victoryPoints: 0,
    roadLength: 0,
    armyCount: 0,
    hasLargestArmy: false,
    hasLongestRoad: false,
    roadsAvailable: 15,
    villagesAvailable: 5,
    townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
  {
    id: 2,
    name: "NPC 1",
    color: "#2563EB",
    isHuman: false,
    victoryPoints: 0,
    roadLength: 0,
    armyCount: 0,
    hasLargestArmy: false,
    hasLongestRoad: false,
    roadsAvailable: 15,
    villagesAvailable: 5,
    townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
  {
    id: 3,
    name: "NPC 2",
    color: "#EA580C",
    isHuman: false,
    victoryPoints: 0,
    roadLength: 0,
    armyCount: 0,
    hasLargestArmy: false,
    hasLongestRoad: false,
    roadsAvailable: 15,
    villagesAvailable: 5,
    townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
  {
    id: 4,
    name: "NPC 3",
    color: "#16A34A",
    isHuman: false,
    victoryPoints: 0,
    roadLength: 0,
    armyCount: 0,
    hasLargestArmy: false,
    hasLongestRoad: false,
    roadsAvailable: 15,
    villagesAvailable: 5,
    townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
];

export default function HomePage() {
  const [board, setBoard] = useState<BoardState>(() => createBoard());
  const [players] = useState<Player[]>(INITIAL_PLAYERS);
  const [activePlayerId] = useState<number>(1);
  const [dice, setDice] = useState<{ die1: number; die2: number } | null>(null);

  // Human player always first, then NPCs in order
  const orderedPlayers = [
    ...players.filter((p) => p.isHuman),
    ...players.filter((p) => !p.isHuman),
  ];

  return (
    <main className="min-h-screen bg-slate-900 py-8 px-6">
      {/* Dice — fixed top-right */}
      <div className="fixed top-3 right-3 flex items-center gap-2 bg-slate-800/90 backdrop-blur rounded-lg px-2.5 py-2 shadow-lg z-50">
        <DiceDisplay die1={dice?.die1 ?? null} die2={dice?.die2 ?? null} />
        <button
          onClick={() => setDice(rollDice())}
          className="px-2.5 py-1 bg-red-700 hover:bg-red-600 active:bg-red-800
                     text-white font-bold rounded transition-colors
                     text-[10px] uppercase tracking-widest"
        >
          Roll
        </button>
      </div>

<div className="flex flex-col items-center">
        {/* Board + Players side by side, aside stretches to board height */}
        <div className="flex gap-5 items-stretch">
          <aside className="flex flex-col gap-2 w-40 shrink-0">
            {orderedPlayers.map((player) => (
              <div key={player.id} className="flex-1 min-h-0">
                <PlayerCard
                  player={player}
                  isActive={player.id === activePlayerId}
                />
              </div>
            ))}
          </aside>

          <div className="max-w-2xl w-[672px] drop-shadow-2xl shrink-0">
            <Board board={board} />
          </div>
        </div>

        {/* Controls below the board */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {LEGEND.map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-slate-300 text-xs">
              <span
                className="inline-block w-3 h-3 rounded-sm border border-slate-600"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-1">
          <span className="text-slate-600 text-xs">
            Ports: resource = 2:1 · ? = any 3:1
          </span>
        </div>

        <button
          onClick={() => setBoard(createBoard())}
          className="mt-5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600
                     text-slate-900 font-bold rounded-lg transition-colors
                     shadow-lg text-xs uppercase tracking-widest"
        >
          Regenerate Board
        </button>
      </div>
    </main>
  );
}
