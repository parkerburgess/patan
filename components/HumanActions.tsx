"use client";

import type { DiceRoll } from "@/types/game";
import DiceDisplay from "./DiceDisplay";

interface Props {
  dice: DiceRoll | null;
  canRoll: boolean;
  canTrade: boolean;
  onRoll: () => void;
  onBankTrade: () => void;
  onPlayerTrade: () => void;
}

export default function HumanActions({ dice, canRoll, canTrade, onRoll, onBankTrade, onPlayerTrade }: Props) {
  return (
    <div className="flex flex-col gap-2 shrink-0 justify-center pb-3">

      {/* Dice + Roll */}
      <fieldset className="border border-slate-500 rounded px-3 pb-2">
        <legend className="text-[10px] text-slate-400 px-1 uppercase tracking-widest">Roll</legend>
        <div className="flex items-center gap-2 pt-1">
          <DiceDisplay die1={dice?.die1 ?? null} die2={dice?.die2 ?? null} />
          <button
            onClick={onRoll}
            disabled={!canRoll}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 active:bg-red-800
                       text-white font-bold rounded transition-colors
                       text-[10px] uppercase tracking-widest
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Roll
          </button>
        </div>
      </fieldset>

      {/* Trades */}
      <fieldset className="border border-slate-500 rounded px-3 pb-2">
        <legend className="text-[10px] text-slate-400 px-1 uppercase tracking-widest">Trade</legend>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onBankTrade}
            disabled={!canTrade}
            className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 active:bg-red-800
                       text-white font-bold rounded transition-colors
                       text-[10px] uppercase tracking-widest
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Bank
          </button>
          <button
            onClick={onPlayerTrade}
            disabled={!canTrade}
            className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 active:bg-red-800
                       text-white font-bold rounded transition-colors
                       text-[10px] uppercase tracking-widest
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Player
          </button>
        </div>
      </fieldset>

    </div>
  );
}
