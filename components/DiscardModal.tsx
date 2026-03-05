"use client";

import { useState } from "react";
import type { Player, PlayableResource } from "@/types/game";

const RESOURCES: PlayableResource[] = ["wood", "brick", "sheep", "wheat", "stone"];

const RESOURCE_LABELS: Record<PlayableResource, string> = {
  wood: "Wood", brick: "Brick", sheep: "Sheep", wheat: "Wheat", stone: "Stone",
};

const RESOURCE_COLORS: Record<PlayableResource, string> = {
  wood: "#2D6A2D", brick: "#B22222", sheep: "#7EC850", wheat: "#DAA520", stone: "#708090",
};

interface Props {
  player: Player;
  mustDiscard: number;
  onConfirm: (discard: Record<PlayableResource, number>) => void;
}

export default function DiscardModal({ player, mustDiscard, onConfirm }: Props) {
  const [selected, setSelected] = useState<Record<PlayableResource, number>>({
    wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0,
  });

  const totalSelected = Object.values(selected).reduce((s, n) => s + n, 0);
  const remaining = mustDiscard - totalSelected;

  function adjust(res: PlayableResource, delta: number) {
    setSelected(prev => {
      const next = prev[res] + delta;
      if (next < 0 || next > player.resources[res]) return prev;
      if (delta > 0 && totalSelected >= mustDiscard) return prev;
      return { ...prev, [res]: next };
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-80 shadow-2xl border border-slate-600">
        <h2 className="text-white font-bold text-lg mb-1">Discard Resources</h2>
        <p className="text-slate-400 text-sm mb-4">
          You must discard{" "}
          <span className="text-red-400 font-bold">{mustDiscard}</span>{" "}
          resource{mustDiscard !== 1 ? "s" : ""}.{" "}
          {remaining > 0
            ? <span className="text-yellow-400">{remaining} more to select.</span>
            : <span className="text-green-400">Ready!</span>}
        </p>

        <div className="space-y-2 mb-5">
          {RESOURCES.map(res => {
            const have = player.resources[res];
            const disc = selected[res];
            if (have === 0) return null;
            return (
              <div key={res} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-500"
                  style={{ backgroundColor: RESOURCE_COLORS[res] }}
                />
                <span className="text-slate-200 text-sm flex-1">{RESOURCE_LABELS[res]}</span>
                <span className="text-slate-400 text-xs">({have})</span>
                <button
                  onClick={() => adjust(res, -1)}
                  disabled={disc === 0}
                  className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold
                             disabled:opacity-30 transition-colors"
                >
                  −
                </button>
                <span className="text-white font-bold w-4 text-center text-sm">{disc}</span>
                <button
                  onClick={() => adjust(res, 1)}
                  disabled={disc >= have || remaining === 0}
                  className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold
                             disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onConfirm(selected)}
          disabled={remaining !== 0}
          className="w-full py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     text-sm uppercase tracking-widest"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
