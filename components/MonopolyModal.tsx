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
  onConfirm: (resource: PlayableResource) => void;
  onClose: () => void;
}

export default function MonopolyModal({ onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<PlayableResource | null>(null);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 shadow-2xl border border-slate-600">
        <h2 className="text-white font-bold text-lg mb-1">Monopoly</h2>
        <p className="text-slate-400 text-xs mb-4">Choose a resource — all players must give you every card of that type.</p>

        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Resource</p>
        <div className="grid grid-cols-5 gap-1.5 mb-6">
          {RESOURCES.map(res => (
            <button
              key={res}
              onClick={() => setSelected(res)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors
                ${selected === res
                  ? "border-yellow-400 bg-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                  : "border-slate-600 bg-slate-700 hover:bg-slate-600"}`}
            >
              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <Image src={RESOURCE_IMAGES[res]} alt={RESOURCE_LABELS[res]} width={40} height={40}
                  className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-[10px] font-semibold leading-none">{RESOURCE_LABELS[res]}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg
                       transition-colors text-sm uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                       text-sm uppercase tracking-widest"
          >
            Claim
          </button>
        </div>
      </div>
    </div>
  );
}
