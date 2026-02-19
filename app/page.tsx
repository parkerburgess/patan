"use client";

import { useState } from "react";
import { createBoard } from "@/lib/board";
import Board from "@/components/Board";
import type { BoardState } from "@/types/game";

const LEGEND = [
  { color: "#2D6A2D", label: "Wood" },
  { color: "#B22222", label: "Brick" },
  { color: "#7EC850", label: "Sheep" },
  { color: "#DAA520", label: "Wheat" },
  { color: "#708090", label: "Stone" },
  { color: "#E8D5A3", label: "Desert" },
];

export default function HomePage() {
  const [board, setBoard] = useState<BoardState>(() => createBoard());

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center py-8 px-4">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-amber-400 tracking-wide">
          Patan
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Standard 19-tile board · randomly generated
        </p>
      </header>

      <div className="w-full max-w-5xl drop-shadow-2xl">
        <Board board={board} />
      </div>

      {/* Resource legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-slate-300 text-sm">
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm border border-slate-600"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Port legend */}
      <div className="mt-2 flex gap-4 justify-center">
        <span className="text-slate-500 text-xs">Ports: specific resource = 2:1 trade · ? = any 3:1 trade</span>
      </div>

      <button
        onClick={() => setBoard(createBoard())}
        className="mt-8 px-7 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600
                   text-slate-900 font-bold rounded-lg transition-colors
                   shadow-lg text-sm uppercase tracking-widest"
      >
        Regenerate Board
      </button>

      <p className="mt-4 text-slate-700 text-xs">
        {board.tiles.length} tiles · {board.ports.length} ports
      </p>
    </main>
  );
}
