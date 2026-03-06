"use client";

import { useState } from "react";
import Image from "next/image";
import type { Player, PlayableResource } from "@/types/game";

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
  humanPlayer: Player;
  otherPlayers: Player[];
  onConfirm: (offer: PlayableResource, request: PlayableResource, acceptingPlayerId: number) => void;
  onClose: () => void;
}

export default function PlayerTradeModal({ humanPlayer, otherPlayers, onConfirm, onClose }: Props) {
  const [offering, setOffering] = useState<PlayableResource | null>(null);
  const [requesting, setRequesting] = useState<PlayableResource | null>(null);

  const readyToSelect = offering !== null && requesting !== null && offering !== requesting;

  function canAccept(p: Player) {
    return readyToSelect && requesting !== null && p.resources[requesting] >= 1;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 shadow-2xl border border-slate-600">
        <h2 className="text-white font-bold text-lg mb-4">Player Trade</h2>

        {/* Offer section */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">You Offer</p>
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {RESOURCES.map(res => {
            const have = humanPlayer.resources[res];
            const selected = offering === res;
            return (
              <button
                key={res}
                onClick={() => {
                  setOffering(res);
                  if (requesting === res) setRequesting(null);
                }}
                disabled={have < 1}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors
                  ${selected
                    ? "border-yellow-400 bg-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                    : "border-slate-600 bg-slate-700 hover:bg-slate-600"}
                  disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image src={RESOURCE_IMAGES[res]} alt={RESOURCE_LABELS[res]} width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-[10px] font-semibold leading-none">{RESOURCE_LABELS[res]}</span>
                <span className="text-slate-400 text-[9px] leading-none">({have})</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="mx-3 text-slate-400 text-sm">↕</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        {/* Request section */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">You Request</p>
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {RESOURCES.map(res => {
            const selected = requesting === res;
            return (
              <button
                key={res}
                onClick={() => setRequesting(res)}
                disabled={offering === res}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors
                  ${selected
                    ? "border-yellow-400 bg-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                    : "border-slate-600 bg-slate-700 hover:bg-slate-600"}
                  disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image src={RESOURCE_IMAGES[res]} alt={RESOURCE_LABELS[res]} width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-[10px] font-semibold leading-none">{RESOURCE_LABELS[res]}</span>
              </button>
            );
          })}
        </div>

        {/* NPC selection + Cancel */}
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Trade With</p>
        <div className="flex gap-2">
          {otherPlayers.map(p => {
            const eligible = canAccept(p);
            return (
              <button
                key={p.id}
                onClick={() => offering && requesting && onConfirm(offering, requesting, p.id)}
                disabled={!eligible}
                className="flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-colors
                  disabled:opacity-30 disabled:cursor-not-allowed
                  enabled:hover:brightness-110"
                style={eligible ? {
                  borderColor: `${p.color}88`,
                  backgroundColor: `${p.color}22`,
                } : {
                  borderColor: "rgb(71 85 105)",
                  backgroundColor: "rgb(51 65 85)",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-white text-xs font-semibold">{p.name}</span>
              </button>
            );
          })}
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg
                       transition-colors text-sm uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
