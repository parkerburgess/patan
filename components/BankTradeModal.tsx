"use client";

import { useState } from "react";
import Image from "next/image";
import type { BoardState, Player, PlayableResource } from "@/types/game";

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

/** Compute the bank exchange rate for each resource given the player's port access. */
export function getExchangeRates(
  board: BoardState,
  player: Player,
): Record<PlayableResource, number> {
  const rates: Record<PlayableResource, number> = {
    wood: 4, brick: 4, sheep: 4, wheat: 4, stone: 4,
  };

  for (const loc of board.villageLocations) {
    if (loc.ownerId !== player.id) continue;
    if (!loc.isVillage && !loc.isTown) continue;
    if (!loc.bonus) continue;

    if (loc.bonus === "generic") {
      for (const res of RESOURCES) {
        if (rates[res] > 3) rates[res] = 3;
      }
    } else if (loc.bonus !== "desert") {
      const res = loc.bonus as PlayableResource;
      rates[res] = 2;
    }
  }

  return rates;
}

interface Props {
  player: Player;
  board: BoardState;
  onConfirm: (give: PlayableResource, receive: PlayableResource) => void;
  onClose: () => void;
}

export default function BankTradeModal({ player, board, onConfirm, onClose }: Props) {
  const [giving, setGiving] = useState<PlayableResource | null>(null);
  const [receiving, setReceiving] = useState<PlayableResource | null>(null);

  const rates = getExchangeRates(board, player);

  const canTrade =
    giving !== null &&
    receiving !== null &&
    giving !== receiving &&
    player.resources[giving] >= rates[giving];

  function handleConfirm() {
    if (!canTrade || !giving || !receiving) return;
    onConfirm(giving, receiving);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 shadow-2xl border border-slate-600">
        <h2 className="text-white font-bold text-lg mb-4">Bank Trade</h2>

        {/* Give section */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Give</p>
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {RESOURCES.map(res => {
            const rate = rates[res];
            const have = player.resources[res];
            const affordable = have >= rate;
            const selected = giving === res;

            return (
              <button
                key={res}
                onClick={() => {
                  setGiving(res);
                  if (receiving === res) setReceiving(null);
                }}
                disabled={!affordable}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors
                  ${selected
                    ? "border-yellow-400 bg-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                    : "border-slate-600 bg-slate-700 hover:bg-slate-600"}
                  disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={RESOURCE_IMAGES[res]}
                    alt={RESOURCE_LABELS[res]}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white text-[10px] font-semibold leading-none">
                  {RESOURCE_LABELS[res]}
                </span>
                <span className={`text-[10px] font-bold leading-none ${
                  rate === 2 ? "text-green-400" : rate === 3 ? "text-yellow-400" : "text-slate-400"
                }`}>
                  {rate}:1
                </span>
                <span className="text-slate-400 text-[9px] leading-none">({have})</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="mx-3 text-slate-400 text-sm">↓</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        {/* Receive section */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Receive</p>
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {RESOURCES.map(res => {
            const selected = receiving === res;
            const sameAsGiving = giving === res;

            return (
              <button
                key={res}
                onClick={() => setReceiving(res)}
                disabled={sameAsGiving}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors
                  ${selected
                    ? "border-yellow-400 bg-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                    : "border-slate-600 bg-slate-700 hover:bg-slate-600"}
                  disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={RESOURCE_IMAGES[res]}
                    alt={RESOURCE_LABELS[res]}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white text-[10px] font-semibold leading-none">
                  {RESOURCE_LABELS[res]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="h-5 mb-4 flex items-center justify-center">
          {giving && receiving && giving !== receiving && (
            <p className="text-slate-300 text-xs">
              Give{" "}
              <span className="text-white font-bold">{rates[giving]}× {RESOURCE_LABELS[giving]}</span>
              {" "}→ receive{" "}
              <span className="text-white font-bold">1× {RESOURCE_LABELS[receiving]}</span>
            </p>
          )}
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
            disabled={!canTrade}
            className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                       text-sm uppercase tracking-widest"
          >
            Trade
          </button>
        </div>
      </div>
    </div>
  );
}
