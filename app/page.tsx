"use client";

import { useState, useRef } from "react";
import { createBoard } from "@/lib/board";
import { rollDice } from "@/lib/dice";
import { buildDevDeck } from "@/lib/devDeck";
import {
  canPlaceVillage, canPlaceRoad, canPlaceTown,
  placeVillage, placeRoad, placeTown,
} from "@/lib/placement";
import { addResources, collectSetupResources, distributeResources, processRobber } from "@/lib/resources";
import { useNpcSetupTurns } from "@/hooks/useNpcSetupTurns";
import { useNpcAutoPlay } from "@/hooks/useNpcAutoPlay";
import Board from "@/components/Board";
import PlayerCard from "@/components/PlayerCard";
import DiceDisplay from "@/components/DiceDisplay";
import GameLog, { type LogEntry } from "@/components/GameLog";
import type { BoardState, Player, DevCard, PlayableResource, TurnPhase } from "@/types/game";

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
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 2, name: "NPC 1", color: "#2563EB", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 3, name: "NPC 2", color: "#EA580C", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 4, name: "NPC 3", color: "#16A34A", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [board, setBoard] = useState<BoardState>(() => createBoard());
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [devDeck, setDevDeck] = useState<DevCard[]>(() => buildDevDeck());
  const [gamePhase, setGamePhase] = useState<"setup" | "playing">("setup");
  const [setupTurnIndex, setSetupTurnIndex] = useState(0);
  const [placementMode, setPlacementMode] = useState<"village" | "town" | "road" | null>("village");
  const [setupLastVillageId, setSetupLastVillageId] = useState<number | null>(null);
  const [dice, setDice] = useState<{ die1: number; die2: number } | null>(null);
  const [activePlayerIdx, setActivePlayerIdx] = useState(board.startingPlayerIdx);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>("pre-roll");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const nextLogId = useRef(0);

  function addLog(message: string, playerColor: string) {
    const id = nextLogId.current++;
    setLogEntries(prev => [...prev, { id, message, playerColor }]);
  }

  // ── NPC automation ────────────────────────────────────────────────────────────

  useNpcSetupTurns({
    gamePhase, setupTurnIndex, activePlayerIdx, board, players,
    setBoard, setPlayers, setActivePlayerIdx, setSetupTurnIndex, setGamePhase, setPlacementMode,
    addLog,
  });

  useNpcAutoPlay({
    gamePhase, activePlayerIdx, board, players,
    setDice, setPlayers, setBoard, setActivePlayerIdx, setTurnPhase,
    addLog,
  });

  // ── Derived state ─────────────────────────────────────────────────────────────

  const currentPlayerIdx = activePlayerIdx;
  const currentPlayer = players[currentPlayerIdx];

  const orderedPlayers = [
    ...players.filter(p => p.isHuman),
    ...players.filter(p => !p.isHuman),
  ];

  // ── Turn action handlers ───────────────────────────────────────────────────────

  function handleVillagePlace(locationId: number) {
    const isSetup = gamePhase === "setup";
    if (!canPlaceVillage(board, locationId, currentPlayer.id, isSetup)) return;

    addLog(`${currentPlayer.name} placed a village`, currentPlayer.color);
    const newBoard = placeVillage(board, locationId, currentPlayer.id);
    setBoard(newBoard);
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== currentPlayerIdx) return p;
      const base = { ...p, victoryPoints: p.victoryPoints + 1, villagesAvailable: p.villagesAvailable - 1 };
      if (isSetup && setupTurnIndex >= 4) {
        return { ...base, resources: addResources(p.resources, collectSetupResources(board, locationId)) };
      }
      return base;
    }));

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

    addLog(`${currentPlayer.name} placed a road`, currentPlayer.color);
    setBoard(placeRoad(board, roadId, currentPlayer.id));
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx
        ? { ...p, roadsAvailable: p.roadsAvailable - 1 }
        : p
    ));
    setSetupLastVillageId(null);

    if (isSetup) {
      addLog(`${currentPlayer.name} ended their turn`, currentPlayer.color);
      if (setupTurnIndex >= 7) {
        setActivePlayerIdx(board.startingPlayerIdx);
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
    addLog(`${currentPlayer.name} placed a town`, currentPlayer.color);
    setBoard(placeTown(board, locationId, currentPlayer.id));
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx
        ? { ...p, victoryPoints: p.victoryPoints + 1, townsAvailable: p.townsAvailable - 1, villagesAvailable: p.villagesAvailable + 1 }
        : p
    ));
    setPlacementMode(null);
  }

  function handleRollDice() {
    if (turnPhase !== "pre-roll") return;
    addLog(`${currentPlayer.name}'s turn`, currentPlayer.color);
    const result = rollDice();
    setDice(result);
    addLog(`${currentPlayer.name} rolled ${result.total}`, currentPlayer.color);
    if (result.total === 7) {
      setBoard(prev => processRobber(prev));
    } else {
      setPlayers(prev => distributeResources(board, prev, result.total));
    }
    setTurnPhase("actions");
  }

  function handleEndTurn() {
    addLog(`${currentPlayer.name} ended their turn`, currentPlayer.color);
    setActivePlayerIdx(prev => (prev + 1) % players.length);
    setTurnPhase("pre-roll");
    setDice(null);
    setPlacementMode(null);
  }

  function handleDrawDevCard() {
    if (devDeck.length === 0) return;
    const [card, ...rest] = devDeck;
    setDevDeck(rest);
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx ? { ...p, devCards: [...p.devCards, card] } : p
    ));
  }

  function handleInitiateTrade() {
    // TODO: open trade UI
  }

  function handlePlayKnight() {
    // Knight can be played before or after the roll
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== currentPlayerIdx) return p;
      const ki = p.devCards.findIndex(c => c.type === "knight");
      if (ki === -1) return p;
      const cards = [...p.devCards];
      cards.splice(ki, 1);
      return { ...p, devCards: cards, armyCount: p.armyCount + 1 };
    }));
    setBoard(prev => processRobber(prev));
  }

  function handlePlayDevCard() {
    // TODO: show card-selection UI and dispatch per DevCardType
  }

  function handleRegenerateBoard() {
    setBoard(createBoard());
    setPlayers(INITIAL_PLAYERS);
    setDevDeck(buildDevDeck());
    setGamePhase("setup");
    setSetupTurnIndex(0);
    setPlacementMode(null);
    setSetupLastVillageId(null);
    setDice(null);
    setActivePlayerIdx(0);
    setTurnPhase("pre-roll");
    setLogEntries([]);
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
        {gamePhase === "playing" && currentPlayer.isHuman && currentPlayer.devCards.some(c => c.type === "knight") && (
          <button
            onClick={handlePlayKnight}
            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 active:bg-purple-800
                       text-white font-bold rounded transition-colors
                       text-[10px] uppercase tracking-widest"
          >
            Knight
          </button>
        )}
        <button
          onClick={handleRollDice}
          disabled={gamePhase === "playing" && (turnPhase === "actions" || !currentPlayer.isHuman)}
          className="px-2.5 py-1 bg-red-700 hover:bg-red-600 active:bg-red-800
                     text-white font-bold rounded transition-colors
                     text-[10px] uppercase tracking-widest
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Roll
        </button>
      </div>

      <div className="flex flex-col items-center">
        {/* Status banner */}
        {(gamePhase === "setup" || gamePhase === "playing") && (
          <div className="mb-3 px-5 py-2 bg-slate-700 rounded-lg text-sm text-white font-medium shadow">
            {gamePhase === "setup" ? (
              <>
                <span className="text-slate-400 mr-1">Setup —</span>
                <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
                  {currentPlayer.name}:
                </span>
                {currentPlayer.isHuman
                  ? (placementMode === "road" ? "Place a road" : "Place a village")
                  : "Placing…"}
              </>
            ) : (
              <>
                <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
                  {currentPlayer.name}
                </span>
                <span className="text-slate-300">
                  {turnPhase === "pre-roll" ? "— Roll the dice" : "— Take your actions"}
                </span>
              </>
            )}
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
              onTownPlace={handleTownPlace}
              onRoadPlace={handleRoadPlace}
            />
          </div>

          <aside className="w-44 shrink-0">
            <GameLog entries={logEntries} />
          </aside>
        </div>

        {/* Playing-phase action bar */}
        {gamePhase === "playing" && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {turnPhase === "actions" && currentPlayer.isHuman && (
              <div className="flex gap-2 flex-wrap justify-center">
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
                <button
                  onClick={handlePlayDevCard}
                  className="px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-widest transition-colors bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Play Dev Card
                </button>
                <button
                  onClick={handleDrawDevCard}
                  disabled={devDeck.length === 0}
                  className="px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-widest transition-colors bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Draw Dev Card ({devDeck.length})
                </button>
                <button
                  onClick={handleInitiateTrade}
                  className="px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-widest transition-colors bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Trade
                </button>
              </div>
            )}
            {turnPhase === "actions" && currentPlayer.isHuman && (
              <button
                onClick={handleEndTurn}
                className="px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors bg-green-700 hover:bg-green-600 active:bg-green-800 text-white shadow-lg"
              >
                End Turn
              </button>
            )}
            {!currentPlayer.isHuman && (
              <p className="text-slate-400 text-xs">{currentPlayer.name} is thinking…</p>
            )}
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
