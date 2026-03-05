"use client";

import { useState, useRef } from "react";
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
  stealRandomResource, totalResources, applyMonopoly,
} from "@/lib/resources";
import { updateRoadLengths, updateLargestArmy } from "@/lib/roads";
import { useNpcSetupTurns } from "@/hooks/useNpcSetupTurns";
import { useNpcAutoPlay } from "@/hooks/useNpcAutoPlay";
import Board from "@/components/Board";
import GameLog, { type LogEntry } from "@/components/GameLog";
import LeftPanel from "@/components/LeftPanel";
import DiscardModal from "@/components/DiscardModal";
import BankTradeModal, { getExchangeRates } from "@/components/BankTradeModal";
import YearOfPlentyModal from "@/components/YearOfPlentyModal";
import MonopolyModal from "@/components/MonopolyModal";
import HumanHand from "@/components/HumanHand";
import HumanActions from "@/components/HumanActions";
import type { BoardState, Player, DevCard, PlayableResource, TurnPhase, DevCardType } from "@/types/game";
import {
  EMPTY_RESOURCES, ROAD_COST, VILLAGE_COST, TOWN_COST, DEV_CARD_COST,
  INITIAL_PLAYERS,
} from "@/lib/gameConfig";

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
  const nextLogId = useRef(0);
  const phaseBeforeRobber = useRef<"pre-roll" | "actions">("actions");

  // ── Robber state ─────────────────────────────────────────────────────────────

  /** "human-discard" = modal open; "place-robber" = human must click a hex */
  const [robberState, setRobberState] = useState<"human-discard" | "place-robber" | null>(null);
  const [discardAmount, setDiscardAmount] = useState(0);
  /**
   * Set when it's an NPC's turn and the robber tile is already chosen,
   * but we're waiting for the human player to discard first.
   */
  const [pendingNpcRobber, setPendingNpcRobber] = useState<{ tileId: number } | null>(null);

  const [bankTradeOpen, setBankTradeOpen] = useState(false);
  const [roadBuildingRemaining, setRoadBuildingRemaining] = useState(0);
  const [yearOfPlentyOpen, setYearOfPlentyOpen] = useState(false);
  const [monopolyOpen, setMonopolyOpen] = useState(false);
  const [turnNumber, setTurnNumber] = useState(1);
  const [rollHistory, setRollHistory] = useState<number[]>([]);

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
    setTurnNumber, setRollHistory, addLog,
  });

  // ── Derived state ─────────────────────────────────────────────────────────────

  const currentPlayer = players[activePlayerIdx];
  const humanPlayer = players.find(p => p.isHuman)!;

  const orderedPlayers = [
    ...players.filter(p => p.isHuman),
    ...players.filter(p => !p.isHuman),
  ];

  // ── Turn action handlers ───────────────────────────────────────────────────────

  function handleVillagePlace(locationId: number) {
    if (robberState !== null) return;
    const isSetup = gamePhase === "setup";
    if (!canPlaceVillage(board, locationId, currentPlayer.id, isSetup, currentPlayer.resources)) return;

    addLog(`${currentPlayer.name} placed a village`, currentPlayer.color);
    const newBoard = placeVillage(board, locationId, currentPlayer.id);
    setBoard(newBoard);
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== activePlayerIdx) return p;
      const base = { ...p, victoryPoints: p.victoryPoints + 1, villagesAvailable: p.villagesAvailable - 1 };
      if (isSetup && setupTurnIndex >= 4) {
        return { ...base, resources: addResources(p.resources, collectSetupResources(board, locationId)) };
      }
      if (!isSetup) {
        return { ...base, resources: subtractResources(p.resources, VILLAGE_COST) };
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
    const isFreeRoad = roadBuildingRemaining > 0;
    // Skip resource check for free roads (road building card)
    const resourcesForCheck = isFreeRoad ? undefined : currentPlayer.resources;
    if (!canPlaceRoad(board, roadId, currentPlayer.id, isSetup, resourcesForCheck)) return;

    addLog(`${currentPlayer.name} placed a road`, currentPlayer.color);
    const newBoard = placeRoad(board, roadId, currentPlayer.id);
    setBoard(newBoard);
    setPlayers(prev => {
      const updated = prev.map((p, idx) => {
        if (idx !== activePlayerIdx) return p;
        const base = { ...p, roadsAvailable: p.roadsAvailable - 1 };
        if (!isSetup && !isFreeRoad) {
          return { ...base, resources: subtractResources(p.resources, ROAD_COST) };
        }
        return base;
      });
      return updateRoadLengths(newBoard, updated);
    });
    setSetupLastVillageId(null);

    if (isFreeRoad) {
      const next = roadBuildingRemaining - 1;
      setRoadBuildingRemaining(next);
      return;
    }

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
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== activePlayerIdx) return p;
      return {
        ...p,
        victoryPoints: p.victoryPoints + 1,
        townsAvailable: p.townsAvailable - 1,
        villagesAvailable: p.villagesAvailable + 1,
        resources: subtractResources(p.resources, TOWN_COST),
      };
    }));
    setPlacementMode(null);
  }

  function handleRollDice() {
    if (gamePhase !== "playing" || turnPhase !== "pre-roll" || robberState !== null) return;
    addLog(`${currentPlayer.name}'s turn`, currentPlayer.color);
    const result = rollDice();
    setDice(result);
    setRollHistory(prev => [...prev, result.total]);
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
      setPlayers(updateRoadLengths(newBoard, updatedPlayers));
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
    setTurnPhase(phaseBeforeRobber.current);
    phaseBeforeRobber.current = "actions";
  }

  function handleEndTurn() {
    addLog(`${currentPlayer.name} ended their turn`, currentPlayer.color);
    setActivePlayerIdx(prev => (prev + 1) % players.length);
    setTurnPhase("pre-roll");
    setDice(null);
    setPlacementMode(null);
    setTurnNumber(prev => prev + 1);
  }

  function handleDrawDevCard() {
    if (gamePhase !== "playing" || turnPhase !== "actions" || !currentPlayer.isHuman) return;
    if (devDeck.length === 0) return;
    const { sheep, wheat, stone } = currentPlayer.resources;
    if (sheep < 1 || wheat < 1 || stone < 1) return;

    const [card, ...rest] = devDeck;
    setDevDeck(rest);
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== activePlayerIdx) return p;
      return {
        ...p,
        devCards: [...p.devCards, { ...card, drawnOnTurn: turnNumber }],
        resources: subtractResources(p.resources, DEV_CARD_COST),
        victoryPoints: p.victoryPoints + (card.type === "victoryPoint" ? 1 : 0),
      };
    }));
  }

  function handleUseDevCard(type: DevCardType) {
    const canPlayPreRoll = gamePhase === "playing" && currentPlayer.isHuman && robberState === null && roadBuildingRemaining === 0;
    if (type === "knight" ? !canPlayPreRoll : !isHumanActionPhase) return;
    // Cannot play a card the same turn it was drawn (except victoryPoint, which is passive)
    const cardInHand = currentPlayer.devCards.find(c => c.type === type);
    if (cardInHand && type !== "victoryPoint" && cardInHand.drawnOnTurn === turnNumber) return;
    if (type === "roadBuilding") {
      const roadsLeft = currentPlayer.roadsAvailable;
      if (roadsLeft === 0) return;
      // Remove one roadBuilding card from hand
      setPlayers(prev => prev.map((p, idx) => {
        if (idx !== activePlayerIdx) return p;
        const idx2 = p.devCards.findIndex(c => c.type === "roadBuilding");
        if (idx2 === -1) return p;
        const devCards = [...p.devCards];
        devCards.splice(idx2, 1);
        return { ...p, devCards };
      }));
      setRoadBuildingRemaining(Math.min(2, roadsLeft));
      addLog(`${currentPlayer.name} played Road Building`, currentPlayer.color);
    }
    if (type === "knight") {
      // Remove card, increment army count, update largest army immediately
      setPlayers(prev => {
        const updated = prev.map((p, idx) => {
          if (idx !== activePlayerIdx) return p;
          const devCards = [...p.devCards];
          devCards.splice(devCards.findIndex(c => c.type === "knight"), 1);
          return { ...p, devCards, armyCount: p.armyCount + 1 };
        });
        return updateLargestArmy(updated);
      });
      phaseBeforeRobber.current = turnPhase;
      setRobberState("place-robber");
      addLog(`${currentPlayer.name} played a Knight`, currentPlayer.color);
    }
    if (type === "yearOfPlenty") {
      setYearOfPlentyOpen(true);
    }
    if (type === "monopoly") {
      setMonopolyOpen(true);
    }
  }

  function handleYearOfPlentyConfirm(first: PlayableResource, second: PlayableResource) {
    // Remove the card from hand and grant both resources
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== activePlayerIdx) return p;
      const idx2 = p.devCards.findIndex(c => c.type === "yearOfPlenty");
      if (idx2 === -1) return p;
      const devCards = [...p.devCards];
      devCards.splice(idx2, 1);
      const gained: Record<PlayableResource, number> = { wood: 0, brick: 0, sheep: 0, wheat: 0, stone: 0 };
      gained[first]++;
      gained[second]++;
      return { ...p, devCards, resources: addResources(p.resources, gained) };
    }));
    addLog(`${currentPlayer.name} played Year of Plenty`, currentPlayer.color);
    setYearOfPlentyOpen(false);
  }

  function handleMonopolyConfirm(resource: PlayableResource) {
    const idx2 = currentPlayer.devCards.findIndex(c => c.type === "monopoly");
    if (idx2 === -1) return;
    // Remove the card first
    const withCardRemoved = players.map((p, idx) => {
      if (idx !== activePlayerIdx) return p;
      const devCards = [...p.devCards];
      devCards.splice(idx2, 1);
      return { ...p, devCards };
    });
    const { players: updated, totalStolen } = applyMonopoly(withCardRemoved, currentPlayer.id, resource);
    setPlayers(updated);
    addLog(`${currentPlayer.name} played Monopoly on ${resource} and stole ${totalStolen}`, currentPlayer.color);
    setMonopolyOpen(false);
  }

  function handleBankTrade(give: PlayableResource, receive: PlayableResource) {
    const cost = getExchangeRates(board, currentPlayer)[give];
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== activePlayerIdx) return p;
      return {
        ...p,
        resources: addResources(
          subtractResources(p.resources, { ...EMPTY_RESOURCES, [give]: cost }),
          { ...EMPTY_RESOURCES, [receive]: 1 },
        ),
      };
    }));
    addLog(`${currentPlayer.name} traded ${cost}× ${give} for 1× ${receive}`, currentPlayer.color);
    setBankTradeOpen(false);
  }

  // ── Derived UI values ────────────────────────────────────────────────────────

  const isRobberMode = robberState === "place-robber" && currentPlayer.isHuman;

  const isHumanActionPhase = gamePhase === "playing" && turnPhase === "actions"
    && currentPlayer.isHuman && robberState === null && roadBuildingRemaining === 0;

  // Derive which placement modes are active for the board overlay
  const activeModes = ((): ("village" | "town" | "road")[] => {
    if (robberState !== null || !currentPlayer.isHuman) return [];
    if (gamePhase === "setup") return placementMode ? [placementMode as "village" | "road"] : [];
    if (roadBuildingRemaining > 0) return ["road"];
    if (!isHumanActionPhase) return [];
    const res = currentPlayer.resources;
    const modes: ("village" | "town" | "road")[] = [];
    if (res.wood >= 1 && res.brick >= 1) modes.push("road");
    if (res.wood >= 1 && res.brick >= 1 && res.sheep >= 1 && res.wheat >= 1) modes.push("village");
    if (res.wheat >= 2 && res.stone >= 3) modes.push("town");
    return modes;
  })();

  // Status banner text
  const statusText = (() => {
    if (gamePhase === "setup") {
      if (!currentPlayer.isHuman) return "Placing…";
      return placementMode === "road" ? "Place a road" : "Place a village";
    }
    if (robberState === "place-robber") return "Place the robber on a hex";
    if (robberState === "human-discard") return "Discard resources";
    if (roadBuildingRemaining > 0) return `Place ${roadBuildingRemaining} road${roadBuildingRemaining > 1 ? "s" : ""}`;
    return turnPhase === "pre-roll" ? "— Roll the dice" : "— Take your actions";
  })();

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="h-screen w-screen bg-slate-900 px-6 py-4 flex flex-col overflow-hidden">

      {/* Bank trade modal */}
      {bankTradeOpen && (
        <BankTradeModal
          player={humanPlayer}
          board={board}
          onConfirm={handleBankTrade}
          onClose={() => setBankTradeOpen(false)}
        />
      )}

      {/* Discard modal */}
      {robberState === "human-discard" && (
        <DiscardModal
          player={humanPlayer}
          mustDiscard={discardAmount}
          onConfirm={handleHumanDiscard}
        />
      )}

      {/* Year of Plenty modal */}
      {yearOfPlentyOpen && (
        <YearOfPlentyModal
          onConfirm={handleYearOfPlentyConfirm}
          onClose={() => setYearOfPlentyOpen(false)}
        />
      )}

      {/* Monopoly modal */}
      {monopolyOpen && (
        <MonopolyModal
          onConfirm={handleMonopolyConfirm}
          onClose={() => setMonopolyOpen(false)}
        />
      )}



      {/* Main row */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Left panel */}
        <LeftPanel
          orderedPlayers={orderedPlayers}
          currentPlayer={currentPlayer}
          gamePhase={gamePhase}
          robberState={robberState}
          statusText={statusText}
          logEntries={logEntries}
          rollHistory={rollHistory}
        />

        {/* Center column — board + bottom bar */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Board */}
          <div className="flex items-center justify-center flex-1 min-h-0 overflow-hidden">
            <div className="w-full h-full drop-shadow-2xl">
              <Board
                board={board}
                players={players}
                activePlayerId={currentPlayer.id}
                isSetup={gamePhase === "setup"}
                activeModes={activeModes}
                setupLastVillageId={setupLastVillageId}
                onVillagePlace={handleVillagePlace}
                onTownPlace={handleTownPlace}
                onRoadPlace={handleRoadPlace}
                robberMode={isRobberMode}
                onRobberPlace={handleRobberPlace}
              />
            </div>
          </div>

          {/* Bottom bar — centered under board */}
          <div className="flex justify-center gap-4 shrink-0 items-stretch pb-3">
            <HumanHand
              player={humanPlayer}
              canDraw={
                isHumanActionPhase &&
                devDeck.length > 0 &&
                humanPlayer.resources.sheep >= 1 &&
                humanPlayer.resources.wheat >= 1 &&
                humanPlayer.resources.stone >= 1
              }
              canPlayKnight={gamePhase === "playing" && currentPlayer.isHuman && robberState === null && roadBuildingRemaining === 0}
              currentTurnNumber={turnNumber}
              onDraw={handleDrawDevCard}
              onUseDevCard={handleUseDevCard}
            />
            <HumanActions
              dice={dice}
              canRoll={gamePhase === "playing" && turnPhase === "pre-roll" && currentPlayer.isHuman && robberState === null}
              canTrade={isHumanActionPhase}
              canEndTurn={isHumanActionPhase}
              onRoll={handleRollDice}
              onBankTrade={() => setBankTradeOpen(true)}
              onPlayerTrade={() => {}}
              onEndTurn={handleEndTurn}
            />
          </div>

        </div>

      </div>

    </main>
  );
}
