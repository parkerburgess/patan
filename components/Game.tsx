"use client";

import { useState, useRef, useMemo } from "react";
import { createBoard } from "@/lib/board";
import { rollDice } from "@/lib/dice";
import { buildDevDeck } from "@/lib/devDeck";
import {
  canPlaceVillage, canPlaceRoad, canPlaceTown,
  placeVillage, placeRoad, placeTown,
} from "@/lib/placement";
import {
  addResources, subtractResources, collectSetupResources,
  distributeResources, applyNpcDiscards, moveRobber,
  stealRandomResource, totalResources,
} from "@/lib/resources";
import { npcChooseRobberTile } from "@/lib/robber";
import { updateRoadLengths } from "@/lib/roads";
import { useNpcSetupTurns } from "@/hooks/useNpcSetupTurns";
import { useNpcAutoPlay } from "@/hooks/useNpcAutoPlay";
import Board from "@/components/Board";
import PlayerCard from "@/components/PlayerCard";
import DiceDisplay from "@/components/DiceDisplay";
import GameLog, { type LogEntry } from "@/components/GameLog";
import DiscardModal from "@/components/DiscardModal";
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
    id: 2, name: "NPC 1", color: "#042c83", isHuman: false,
    victoryPoints: 0, roadLength: 0, armyCount: 0,
    hasLargestArmy: false, hasLongestRoad: false,
    roadsAvailable: 15, villagesAvailable: 5, townsAvailable: 4,
    resources: { ...EMPTY_RESOURCES }, devCards: [],
  },
  {
    id: 3, name: "NPC 2", color: "#f1de2b", isHuman: false,
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

export default function Game() {
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
  const [logOpen, setLogOpen] = useState(true);
  const nextLogId = useRef(0);

  // ── Robber state ─────────────────────────────────────────────────────────────

  /** "human-discard" = modal open; "place-robber" = human must click a hex */
  const [robberState, setRobberState] = useState<"human-discard" | "place-robber" | null>(null);
  const [discardAmount, setDiscardAmount] = useState(0);
  /**
   * Set when it's an NPC's turn and the robber tile is already chosen,
   * but we're waiting for the human player to discard first.
   */
  const [pendingNpcRobber, setPendingNpcRobber] = useState<{ tileId: number } | null>(null);

  function addLog(message: string, playerColor: string) {
    const id = nextLogId.current++;
    setLogEntries(prev => [...prev, { id, message, playerColor }]);
  }

  // ── NPC automation ────────────────────────────────────────────────────────────

  useNpcSetupTurns({
    gamePhase, setupTurnIndex, activePlayerIdx, board, players,
    setBoard, setPlayers, setActivePlayerIdx, setSetupTurnIndex, setGamePhase, setPlacementMode, addLog
  });

  useNpcAutoPlay({
    gamePhase, activePlayerIdx, board, players,
    setDice, setPlayers, setBoard, setActivePlayerIdx, setTurnPhase,
    setRobberState, setDiscardAmount, setPendingNpcRobber,
    addLog,
  });

  // ── Derived state ─────────────────────────────────────────────────────────────

  const currentPlayerIdx = activePlayerIdx;
  const currentPlayer = players[currentPlayerIdx];
  const humanPlayer = players.find(p => p.isHuman)!;

  const orderedPlayers = [
    ...players.filter(p => p.isHuman),
    ...players.filter(p => !p.isHuman),
  ];

  // Tiles the human can place the robber on (all except the current robber tile)
  const validRobberTileIds = useMemo(() => {
    if (robberState !== "place-robber") return new Set<number>();
    return new Set(board.tiles.filter(t => !t.hasRobber).map(t => t.id));
  }, [board, robberState]);

  // ── Turn action handlers ───────────────────────────────────────────────────────

  function handleVillagePlace(locationId: number) {
    if (robberState !== null) return;
    const isSetup = gamePhase === "setup";
    if (!canPlaceVillage(board, locationId, currentPlayer.id, isSetup, currentPlayer.resources)) return;

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
    if (robberState !== null) return;
    const isSetup = gamePhase === "setup";
    if (!canPlaceRoad(board, roadId, currentPlayer.id, isSetup, currentPlayer.resources)) return;

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
        const nextTurnIndex = setupTurnIndex + 1;
        const n = players.length;
        const startIdx = board.startingPlayerIdx;
        const nextPlayerIdx = nextTurnIndex < n
          ? (startIdx + nextTurnIndex) % n
          : (startIdx + (2 * n - 1 - nextTurnIndex) + n) % n;
        setActivePlayerIdx(nextPlayerIdx);
        setSetupTurnIndex(nextTurnIndex);
        setPlacementMode(null);
      }
    } else {
      setPlacementMode(null);
    }
  }

  function handleTownPlace(locationId: number) {
    if (robberState !== null) return;
    if (!canPlaceTown(board, locationId, currentPlayer.id, currentPlayer.resources)) return;
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
    if (turnPhase !== "pre-roll" || robberState !== null) return;
    addLog(`${currentPlayer.name}'s turn`, currentPlayer.color);
    const result = rollDice();
    setDice(result);
    addLog(`${currentPlayer.name} rolled ${result.total}`, currentPlayer.color);

    if (result.total === 7) {
      // Apply NPC discards immediately
      players.forEach(p => {
        if (!p.isHuman && totalResources(p) > 7) {
          addLog(`${p.name} discarded ${Math.floor(totalResources(p) / 2)} cards`, p.color);
        }
      });
      const afterNpcDiscard = applyNpcDiscards(players);
      setPlayers(afterNpcDiscard);

      // Check if human must discard
      const humanTotal = totalResources(currentPlayer);
      if (humanTotal > 7) {
        setDiscardAmount(Math.floor(humanTotal / 2));
        setRobberState("human-discard");
      } else {
        setRobberState("place-robber");
      }
      // turnPhase stays "pre-roll" until robber is resolved
    } else {
      setPlayers(prev => distributeResources(board, prev, result.total));
      setTurnPhase("actions");
    }
  }

  function handleHumanDiscard(discard: Record<PlayableResource, number>) {
    addLog(`${humanPlayer.name} discarded ${discardAmount} cards`, humanPlayer.color);

    let updatedPlayers = players.map(p =>
      p.isHuman
        ? { ...p, resources: subtractResources(p.resources, discard) }
        : p
    );

    if (pendingNpcRobber) {
      // It was an NPC's turn — complete robber placement then end the NPC turn
      const npcPlayer = players[activePlayerIdx];
      const { tileId } = pendingNpcRobber;
      const newBoard = moveRobber(board, tileId);
      setBoard(newBoard);
      addLog(`${npcPlayer.name} moved the robber`, npcPlayer.color);

      const { players: afterSteal, stolen, fromName } =
        stealRandomResource(newBoard, tileId, npcPlayer.id, updatedPlayers);
      if (stolen && fromName) {
        addLog(`${npcPlayer.name} stole ${stolen} from ${fromName}`, npcPlayer.color);
      }
      updatedPlayers = afterSteal;

      addLog(`${npcPlayer.name} ended their turn`, npcPlayer.color);
      const withRoads = updateRoadLengths(newBoard, updatedPlayers);
      setPlayers(withRoads);
      setPendingNpcRobber(null);
      setRobberState(null);
      setActivePlayerIdx(prev => (prev + 1) % players.length);
      setTurnPhase("pre-roll");
      setDice(null);
    } else {
      // Human's own turn — proceed to place the robber
      setPlayers(updatedPlayers);
      setRobberState("place-robber");
    }
  }

  function handleRobberPlace(tileId: number) {
    const newBoard = moveRobber(board, tileId);
    setBoard(newBoard);
    addLog(`${currentPlayer.name} moved the robber`, currentPlayer.color);

    const { players: afterSteal, stolen, fromName } =
      stealRandomResource(newBoard, tileId, currentPlayer.id, players);
    if (stolen && fromName) {
      addLog(`${currentPlayer.name} stole ${stolen} from ${fromName}`, currentPlayer.color);
    } else if (fromName) {
      addLog(`${fromName} had no resources to steal`, currentPlayer.color);
    }
    setPlayers(afterSteal);

    setRobberState(null);
    setTurnPhase("actions");
  }

  function handleEndTurn() {
    addLog(`${currentPlayer.name} ended their turn`, currentPlayer.color);
    setPlayers(prev => updateRoadLengths(board, prev));
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
    // TODO: trigger robber flow (same as rolling 7) after removing knight card
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== currentPlayerIdx) return p;
      const ki = p.devCards.findIndex(c => c.type === "knight");
      if (ki === -1) return p;
      const cards = [...p.devCards];
      cards.splice(ki, 1);
      return { ...p, devCards: cards, armyCount: p.armyCount + 1 };
    }));
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
    setRobberState(null);
    setDiscardAmount(0);
    setPendingNpcRobber(null);
  }

  // ── Derived UI values ────────────────────────────────────────────────────────

  // Only pass placement mode to Board when it's the human player's turn and no robber active
  const activePlacementMode = (currentPlayer.isHuman && robberState === null) ? placementMode : null;
  const isRobberMode = robberState === "place-robber" && currentPlayer.isHuman;

  // Status banner text
  function statusText() {
    if (gamePhase === "setup") {
      if (!currentPlayer.isHuman) return "Placing…";
      return placementMode === "road" ? "Place a road" : "Place a village";
    }
    if (robberState === "place-robber") return "Place the robber on a hex";
    if (robberState === "human-discard") return "Discard resources";
    return turnPhase === "pre-roll" ? "— Roll the dice" : "— Take your actions";
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="h-screen bg-slate-900 px-6 py-4 flex flex-col overflow-hidden">

      {/* Discard modal */}
      {robberState === "human-discard" && (
        <DiscardModal
          player={humanPlayer}
          mustDiscard={discardAmount}
          onConfirm={handleHumanDiscard}
        />
      )}

      {/* Status banner */}
      {(gamePhase === "setup" || gamePhase === "playing") && (
        <div className={`mb-3 px-5 py-2 rounded-lg text-sm text-white font-medium shadow shrink-0 self-center ${
          robberState === "place-robber" ? "bg-yellow-700" : "bg-slate-700"
        }`}>
          {gamePhase === "setup" ? (
            <>
              <span className="text-slate-400 mr-1">Setup —</span>
              <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
                {currentPlayer.name}:
              </span>
              {statusText()}
            </>
          ) : (
            <>
              <span style={{ color: currentPlayer.color }} className="font-bold mr-1">
                {currentPlayer.name}
              </span>
              <span className="text-slate-300">{statusText()}</span>
            </>
          )}
        </div>
      )}

      {/* Main row */}
      <div className="flex gap-5 flex-1 min-h-0 justify-center">

        {/* Left panel — player cards */}
        <aside className="flex flex-col gap-2 w-40 shrink-0 overflow-hidden">
          {orderedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isActive={player.id === currentPlayer.id}
            />
          ))}
        </aside>

        {/* Center — board + legend */}
        <div className="flex flex-col items-center shrink-0 overflow-y-auto">
          <div className="w-[672px] drop-shadow-2xl">
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
              robberMode={isRobberMode}
              onRobberPlace={handleRobberPlace}
            />
          </div>

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
        </div>

        {/* Right panel */}
        <aside className="flex flex-col gap-2 w-44 shrink-0">

          {/* Dice + Roll */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2.5 py-2 shadow">
            <DiceDisplay die1={dice?.die1 ?? null} die2={dice?.die2 ?? null} />
            <button
              onClick={handleRollDice}
              disabled={
                gamePhase === "playing" &&
                (turnPhase === "actions" || !currentPlayer.isHuman || robberState !== null)
              }
              className="px-2.5 py-1 bg-red-700 hover:bg-red-600 active:bg-red-800
                         text-white font-bold rounded transition-colors
                         text-[10px] uppercase tracking-widest
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Roll
            </button>
          </div>

          {/* Trades */}
          <fieldset className="border border-slate-500 rounded px-2 pb-2">
            <legend className="text-[10px] text-slate-400 px-1">Trades</legend>
            <div className="flex gap-2">
              <button
                disabled={gamePhase === "playing" && (turnPhase === "actions" || !currentPlayer.isHuman)}
                className="flex-1 py-1 bg-red-700 hover:bg-red-600 active:bg-red-800
                           text-white font-bold rounded transition-colors
                           text-[10px] uppercase tracking-widest
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Bank
              </button>
              <button
                disabled={gamePhase === "playing" && (turnPhase === "actions" || !currentPlayer.isHuman)}
                className="flex-1 py-1 bg-red-700 hover:bg-red-600 active:bg-red-800
                           text-white font-bold rounded transition-colors
                           text-[10px] uppercase tracking-widest
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Player
              </button>
            </div>
          </fieldset>

          {/* Place */}
          <fieldset className="border border-slate-500 rounded px-2 pb-2">
            <legend className="text-[10px] text-slate-400 px-1">Place</legend>
            <div className="flex gap-2">
              {(["road", "village", "town"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => robberState === null && setPlacementMode(prev => prev === mode ? null : mode)}
                  disabled={robberState !== null}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-widest transition-colors ${
                    placementMode === mode
                      ? "bg-yellow-400 text-slate-900 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {mode === "village" ? "Village" : mode === "town" ? "Town" : "Road"}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Dev Cards */}
          {/*///TODO move the Play button to the player card? */}
          <fieldset className="border border-slate-500 rounded px-2 pb-2">
            <legend className="text-[10px] text-slate-400 px-1">Dev Cards</legend>
            <div className="flex gap-2">
              <button
                onClick={handleDrawDevCard}
                disabled={devDeck.length === 0}
                className="flex-1 py-1 bg-slate-700 text-slate-200 hover:bg-slate-600
                           rounded text-[10px] uppercase tracking-widest transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Draw ({devDeck.length})
              </button>

              <button
                onClick={handlePlayDevCard}
                className="flex-1 py-1 bg-slate-700 text-slate-200 hover:bg-slate-600
                           rounded text-[10px] uppercase tracking-widest transition-colors"
              >
                Play
              </button>
            </div>
          </fieldset>

          <div>
            show dev cards?
          </div>

          {/* Game log */}
          <div className="flex flex-col flex-1 min-h-0">
            <button
              onClick={() => setLogOpen(prev => !prev)}
              className="flex items-center justify-between w-full px-2 py-1 text-[10px]
                         uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span>Log</span>
              <span>{logOpen ? "▲" : "▼"}</span>
            </button>
            {logOpen && (
              <div className="flex-1 min-h-0">
                <GameLog entries={logEntries} />
              </div>
            )}
          </div>

          {/* End Turn */}
          {turnPhase === "actions" && currentPlayer.isHuman && robberState === null && (
            <button
              onClick={handleEndTurn}
              className="px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest
                         transition-colors bg-green-700 hover:bg-green-600 active:bg-green-800
                         text-white shadow-lg"
            >
              End Turn
            </button>
          )}

          {/* Regen Board */}
          <button
            onClick={handleRegenerateBoard}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600
                       text-slate-900 font-bold rounded-lg transition-colors
                       shadow-lg text-xs uppercase tracking-widest"
          >
            Regen Board
          </button>

        </aside>

      </div>
    </main>
  );
}
