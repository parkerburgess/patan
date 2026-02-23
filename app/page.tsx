"use client";

import { useState, useEffect, useRef } from "react";
import { createBoard } from "@/lib/board";
import { rollDice } from "@/lib/dice";
import {
  canPlaceVillage, canPlaceRoad, canPlaceTown,
  placeVillage, placeRoad, placeTown,
} from "@/lib/placement";
import Board from "@/components/Board";
import PlayerCard from "@/components/PlayerCard";
import DiceDisplay from "@/components/DiceDisplay";
import type { BoardState, Player } from "@/types/game";

// ── Constants ─────────────────────────────────────────────────────────────────

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
    id: 1, name: "You", color: "#DC2626", isHuman: true,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
  {
    id: 2, name: "NPC 1", color: "#2563EB", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
  {
    id: 3, name: "NPC 2", color: "#EA580C", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
  {
    id: 4, name: "NPC 3", color: "#16A34A", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES },
  },
];

/** P1→P2→P3→P4→P4→P3→P2→P1 snake order (player array indices, 0-based). */
const SETUP_ORDER = [0, 1, 2, 3, 3, 2, 1, 0];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [board, setBoard] = useState<BoardState>(() => createBoard());
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [gamePhase, setGamePhase] = useState<"setup" | "playing">("setup");
  const [setupTurnIndex, setSetupTurnIndex] = useState(0);
  const [placementMode, setPlacementMode] = useState<"village" | "town" | "road" | null>("village");
  const [setupLastVillageId, setSetupLastVillageId] = useState<number | null>(null);
  const [dice, setDice] = useState<{ die1: number; die2: number } | null>(null);

  // Refs so NPC setTimeout callback sees current board/players without stale closure
  const boardRef = useRef(board);
  const playersRef = useRef(players);
  boardRef.current = board;
  playersRef.current = players;

  // ── Derived state ────────────────────────────────────────────────────────────

  const currentPlayerIdx = gamePhase === "setup" ? SETUP_ORDER[setupTurnIndex] : 0;
  const currentPlayer = players[currentPlayerIdx];

  const orderedPlayers = [
    ...players.filter(p => p.isHuman),
    ...players.filter(p => !p.isHuman),
  ];

  // ── NPC auto-placement during setup ─────────────────────────────────────────

  useEffect(() => {
    if (gamePhase !== "setup") return;
    const playerIdx = SETUP_ORDER[setupTurnIndex];
    if (playersRef.current[playerIdx].isHuman) {
      setPlacementMode("village");
      return;
    }

    // NPC turn: auto-place village + adjacent road after a short delay
    const timer = setTimeout(() => {
      const b = boardRef.current;
      const ps = playersRef.current;
      const player = ps[playerIdx];

      // Pick a random valid village location
      const validVillages = b.villageLocations.filter(loc =>
        canPlaceVillage(b, loc.id, player.id, true)
      );
      if (validVillages.length === 0) return;
      const village = validVillages[Math.floor(Math.random() * validVillages.length)];

      let newBoard = placeVillage(b, village.id, player.id);

      // Pick a random adjacent unowned road
      const adjRoads = newBoard.roadLocations.filter(r =>
        r.ownerId === null && (
          r.villageLocationId1 === village.id || r.villageLocationId2 === village.id
        )
      );
      if (adjRoads.length > 0) {
        const road = adjRoads[Math.floor(Math.random() * adjRoads.length)];
        newBoard = placeRoad(newBoard, road.id, player.id);
      }

      setBoard(newBoard);
      setPlayers(ps.map((p, idx) =>
        idx === playerIdx
          ? { ...p, victoryPoints: p.victoryPoints + 1, villagesAvailable: p.villagesAvailable - 1, roadsAvailable: p.roadsAvailable - 1 }
          : p
      ));

      if (setupTurnIndex >= 7) {
        setGamePhase("playing");
        setPlacementMode(null);
      } else {
        setSetupTurnIndex(prev => prev + 1);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [gamePhase, setupTurnIndex]); // intentionally excludes board/players — use refs instead

  // ── Placement handlers ───────────────────────────────────────────────────────

  function handleVillagePlace(locationId: number) {
    const isSetup = gamePhase === "setup";
    if (!canPlaceVillage(board, locationId, currentPlayer.id, isSetup)) return;

    const newBoard = placeVillage(board, locationId, currentPlayer.id);
    setBoard(newBoard);
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx
        ? { ...p, victoryPoints: p.victoryPoints + 1, villagesAvailable: p.villagesAvailable - 1 }
        : p
    ));

    if (isSetup) {
      setSetupLastVillageId(locationId);
      setPlacementMode("road");
    } else {
      setPlacementMode(null);
    }
  }

  function handleRoadPlace(roadId: number) {
    const isSetup = gamePhase === "setup";
    if (!canPlaceRoad(board, roadId, currentPlayer.id, isSetup)) return;

    setBoard(placeRoad(board, roadId, currentPlayer.id));
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx
        ? { ...p, roadsAvailable: p.roadsAvailable - 1 }
        : p
    ));
    setSetupLastVillageId(null);

    if (isSetup) {
      if (setupTurnIndex >= 7) {
        setGamePhase("playing");
        setPlacementMode(null);
      } else {
        setSetupTurnIndex(prev => prev + 1);
        setPlacementMode(null);
      }
    } else {
      setPlacementMode(null);
    }
  }

  function handleTownPlace(locationId: number) {
    if (!canPlaceTown(board, locationId, currentPlayer.id)) return;
    setBoard(placeTown(board, locationId, currentPlayer.id));
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx
        ? { ...p, victoryPoints: p.victoryPoints + 1, townsAvailable: p.townsAvailable - 1, villagesAvailable: p.villagesAvailable + 1 }
        : p
    ));
    setPlacementMode(null);
  }

  function handleRegenerateBoard() {
    setBoard(createBoard());
    setPlayers(INITIAL_PLAYERS);
    setGamePhase("setup");
    setSetupTurnIndex(0);
    setPlacementMode(null);
    setSetupLastVillageId(null);
    setDice(null);
  }

  // ── Derived UI values ────────────────────────────────────────────────────────

  // Only pass placement mode to Board when it's the human player's turn
  const activePlacementMode = currentPlayer.isHuman ? placementMode : null;

  // ── Render ───────────────────────────────────────────────────────────────────

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
        {/* Setup status banner */}
        {gamePhase === "setup" && (
          <div className="mb-3 px-5 py-2 bg-slate-700 rounded-lg text-sm text-white font-medium shadow">
            <span className="text-slate-400 mr-1">Setup —</span>
            <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
              {currentPlayer.name}:
            </span>
            {currentPlayer.isHuman
              ? (placementMode === "road" ? "Place a road" : "Place a village")
              : "Placing…"}
          </div>
        )}

        {/* Board + Players side by side */}
        <div className="flex gap-5 items-stretch">
          <aside className="flex flex-col gap-2 w-40 shrink-0">
            {orderedPlayers.map((player) => (
              <div key={player.id} className="flex-1 min-h-0">
                <PlayerCard
                  player={player}
                  isActive={player.id === currentPlayer.id}
                />
              </div>
            ))}
          </aside>

          <div className="max-w-2xl w-[672px] drop-shadow-2xl shrink-0">
            <Board
              board={board}
              players={players}
              activePlayerId={currentPlayer.id}
              isSetup={gamePhase === "setup"}
              placementMode={activePlacementMode}
              setupLastVillageId={setupLastVillageId}
              onVillagePlace={handleVillagePlace}
              onRoadPlace={handleRoadPlace}
            />
          </div>
        </div>

        {/* Playing-phase placement buttons */}
        {gamePhase === "playing" && (
          <div className="mt-4 flex gap-2">
            {(["village", "town", "road"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPlacementMode(prev => prev === mode ? null : mode)}
                className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-widest transition-colors ${
                  placementMode === mode
                    ? "bg-yellow-400 text-slate-900 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Place {mode === "village" ? "Village" : mode === "town" ? "Town" : "Road"}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
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
          onClick={handleRegenerateBoard}
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
