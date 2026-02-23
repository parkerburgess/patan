"use client";

import { useState, useEffect, useRef } from "react";
import { createBoard } from "@/lib/board";
import { rollDice } from "@/lib/dice";
import { buildDevDeck } from "@/lib/devDeck";
import {
  canPlaceVillage, canPlaceRoad, canPlaceTown,
  placeVillage, placeRoad, placeTown,
} from "@/lib/placement";
import Board from "@/components/Board";
import PlayerCard from "@/components/PlayerCard";
import DiceDisplay from "@/components/DiceDisplay";
import type { BoardState, Player, DevCard, PlayableResource, TurnPhase } from "@/types/game";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns one resource per non-desert tile adjacent to the given village location. */
function collectSetupResources(
  board: BoardState,
  locationId: number,
): Record<PlayableResource, number> {
  const delta: Record<PlayableResource, number> = { wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0 };
  const loc = board.villageLocations.find(l => l.id === locationId);
  if (!loc) return delta;
  for (const tileId of loc.adjacentTileIds) {
    const tile = board.tiles.find(t => t.id === tileId);
    if (tile && tile.resource !== "desert") {
      delta[tile.resource as PlayableResource]++;
    }
  }
  return delta;
}

function addResources(
  a: Record<PlayableResource, number>,
  b: Record<PlayableResource, number>,
): Record<PlayableResource, number> {
  return {
    wood:  a.wood  + b.wood,
    brick: a.brick + b.brick,
    sheep: a.sheep + b.sheep,
    wheat: a.wheat + b.wheat,
    stone: a.stone + b.stone,
  };
}

function distributeResources(board: BoardState, players: Player[], rollTotal: number): Player[] {
  const matchingTileIds = new Set(
    board.tiles.filter(t => t.dieNumber === rollTotal && !t.hasRobber).map(t => t.id)
  );
  if (matchingTileIds.size === 0) return players;
  return players.map(player => {
    const delta: Record<PlayableResource, number> = { wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0 };
    for (const loc of board.villageLocations) {
      if (loc.ownerId !== player.id) continue;
      const mult = loc.isTown ? 2 : loc.isVillage ? 1 : 0;
      if (mult === 0) continue;
      for (const tileId of loc.adjacentTileIds) {
        if (!matchingTileIds.has(tileId)) continue;
        const tile = board.tiles.find(t => t.id === tileId)!;
        if (tile.resource !== "desert")
          delta[tile.resource as PlayableResource] += mult;
      }
    }
    return Object.values(delta).some(v => v > 0)
      ? { ...player, resources: addResources(player.resources, delta) }
      : player;
  });
}

function processRobber(board: BoardState): BoardState {
  // TODO: move robber, discard logic
  return board;
}

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

  // Refs so NPC setTimeout callback sees current board/players without stale closure
  const boardRef = useRef(board);
  const playersRef = useRef(players);
  boardRef.current = board;
  playersRef.current = players;

  // ── Derived state ────────────────────────────────────────────────────────────

  /// TODO remove commented code below
  //const currentPlayerIdx = gamePhase === "setup" ? SETUP_ORDER[setupTurnIndex] : activePlayerIdx;
  const currentPlayerIdx = activePlayerIdx;
  const currentPlayer = players[currentPlayerIdx];

  const orderedPlayers = [
    ...players.filter(p => p.isHuman),
    ...players.filter(p => !p.isHuman),
  ];

  // ── NPC auto-placement during setup ─────────────────────────────────────────

  useEffect(() => {
    if (gamePhase !== "setup") return;

    setActivePlayerIdx(prev => (prev + 1) % players.length);
    if (playersRef.current[activePlayerIdx].isHuman) {
      setPlacementMode("village");
      return;
    }

    // NPC turn: auto-place village + adjacent road after a short delay
    const timer = setTimeout(() => {
      const b = boardRef.current;
      const ps = playersRef.current;
      const player = ps[activePlayerIdx];

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
      setPlayers(ps.map((p, idx) => {
        if (idx !== activePlayerIdx) return p;
        const base = { ...p, victoryPoints: p.victoryPoints + 1, villagesAvailable: p.villagesAvailable - 1, roadsAvailable: p.roadsAvailable - 1 };
        /// TODO refactor this to not use setupTurnIndex - maybe use player victory points === 1
        if (setupTurnIndex >= 4) {
          return { ...base, resources: addResources(p.resources, collectSetupResources(b, village.id)) };
        }
        return base;
      }));
      /// TODO:  is this testing the index every turn for the entire game?  Then maybe look at gamePhase =="startUp"
      if (setupTurnIndex >= 7) {
        /// TODO: the line below should not be needed, just increment to the next player;  or has it already been incremented?
        setActivePlayerIdx(boardRef.current.startingPlayerIdx);
        setGamePhase("playing");
        setPlacementMode(null);
      } else {
        setSetupTurnIndex(prev => prev + 1);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [gamePhase, setupTurnIndex]); // intentionally excludes board/players — use refs instead

  // ── NPC auto-play during playing phase ───────────────────────────────────────

  useEffect(() => {
    if (gamePhase !== "playing") return;
    if (playersRef.current[activePlayerIdx].isHuman) return;

    const rollTimer = setTimeout(() => {
      const result = rollDice();
      setDice(result);
      if (result.total !== 7) {
        setPlayers(prev => distributeResources(boardRef.current, prev, result.total));
      } else {
        setBoard(prev => processRobber(prev));
      }
      const endTimer = setTimeout(() => {
        setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
        setTurnPhase("pre-roll");
        setDice(null);
      }, 600);
      return () => clearTimeout(endTimer);
    }, 500);

    return () => clearTimeout(rollTimer);
  }, [gamePhase, activePlayerIdx]); // turnPhase intentionally excluded; NPC skips actions phase

  // ── turn action handlers ───────────────────────────────────────────────────────

  function handleVillagePlace(locationId: number) {
    const isSetup = gamePhase === "setup";
    if (!canPlaceVillage(board, locationId, currentPlayer.id, isSetup)) return;

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

    setBoard(placeRoad(board, roadId, currentPlayer.id));
    setPlayers(prev => prev.map((p, idx) =>
      idx === currentPlayerIdx
        ? { ...p, roadsAvailable: p.roadsAvailable - 1 }
        : p
    ));
    setSetupLastVillageId(null);

    if (isSetup) {
      /// TODO: why are we doing this again
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
    const result = rollDice();
    setDice(result);
    if (result.total === 7) {
      setBoard(prev => processRobber(prev));
    } else {
      setPlayers(prev => distributeResources(board, prev, result.total));
    }
    setTurnPhase("actions");
  }

  function handleEndTurn() {
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
