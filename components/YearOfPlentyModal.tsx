"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlayableResource } from "@/types/game";

const RESOURCES: PlayableResource[] = ["wood", "brick", "sheep", "wheat", "stone"];

const RESOURCE_LABELS: Record<PlayableResource, string> = {
  wood: "Wood", brick: "Brick", sheep: "Sheep", wheat: "Wheat", stone: "Stone",
};

const RESOURCE_IMAGES: Record<PlayableResource, string> = {
  wood:  "/images/wood.png",
  brick: "/images/brick.png",
  sheep: "/images/sheep.png",
  wheat: "/images/wheat.png",
  stone: "/images/stone.png",
};

interface Props {
  onConfirm: (first: PlayableResource, second: PlayableResource) => void;
  onClose: () => void;
}

export default function YearOfPlentyModal({ onConfirm, onClose }: Props) {
  const [picks, setPicks] = useState<PlayableResource[]>([]);

  function handlePick(res: PlayableResource) {
    if (picks.length < 2) {
      setPicks([...picks, res]);
    }
  }

  function handleRemove(index: number) {
    setPicks(picks.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (picks.length === 2) onConfirm(picks[0], picks[1]);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 shadow-2xl border border-slate-600">
        <h2 className="text-white font-bold text-lg mb-1">Year of Plenty</h2>
        <p className="text-slate-400 text-xs mb-4">Choose 2 resources to take from the bank.</p>

        {/* Resource picker */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Pick</p>
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {RESOURCES.map(res => (
            <button
              key={res}
              onClick={() => handlePick(res)}
              disabled={picks.length >= 2}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-600
                         bg-slate-700 hover:bg-slate-600 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <Image src={RESOURCE_IMAGES[res]} alt={RESOURCE_LABELS[res]} width={40} height={40}
                  className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-[10px] font-semibold leading-none">{RESOURCE_LABELS[res]}</span>
            </button>
          ))}
        </div>

        {/* Selected picks */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Selected</p>
        <div className="flex gap-2 mb-5 min-h-[72px]">
          {[0, 1].map(i => {
            const res = picks[i];
            return res ? (
              <button
                key={i}
                onClick={() => handleRemove(i)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border
                           border-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30 transition-colors"
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image src={RESOURCE_IMAGES[res]} alt={RESOURCE_LABELS[res]} width={40} height={40}
                    className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-[10px] font-semibold leading-none">{RESOURCE_LABELS[res]}</span>
              </button>
            ) : (
              <div key={i} className="w-[72px] flex flex-col items-center justify-center gap-1 p-2
                                      rounded-lg border border-dashed border-slate-600 text-slate-600 text-xs">
                —
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg
                       transition-colors text-sm uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={picks.length < 2}
            className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                       text-sm uppercase tracking-widest"
          >
            Take
          </button>
        </div>
      </div>
    </div>
  );
}
