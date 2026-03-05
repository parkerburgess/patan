"use client";

import DiceDisplay from "./DiceDisplay";

interface Props {
  dice: { die1: number; die2: number } | null;
  canRoll: boolean;
  canTrade: boolean;
  canEndTurn: boolean;
  onRoll: () => void;
  onBankTrade: () => void;
  onPlayerTrade: () => void;
  onEndTurn: () => void;
}

export default function HumanActions({ dice, canRoll, canTrade, canEndTurn, onRoll, onBankTrade, onPlayerTrade, onEndTurn }: Props) {
  return (
    <div className="flex gap-2 shrink-0 items-stretch">

      {/* Roll + Trade stacked */}
      <div className="flex flex-col gap-2">

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

        {/* Trade */}
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

      {/* End Turn — full height of the component */}
      <button
        onClick={onEndTurn}
        disabled={!canEndTurn}
        className="px-4 rounded-lg font-bold text-xs uppercase tracking-widest
                   transition-colors bg-green-700 hover:bg-green-600 active:bg-green-800
                   text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        End
      </button>

    </div>
  );
}
