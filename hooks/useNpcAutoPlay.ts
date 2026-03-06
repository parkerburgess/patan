import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { BoardState, Player, PlayableResource, TurnPhase, DevCard } from "@/types/game";
import { rollDice } from "@/lib/dice";
import { applyNpcDiscards, applyMonopoly, distributeResources, moveRobber, stealRandomResource, totalResources, addResources, subtractResources } from "@/lib/resources";
import {
  npcChooseRobberTile, npcChooseMonopolyResource,
  npcChooseVillagePlacement, npcChooseTownPlacement, npcChooseRoadPlacement,
  npcShouldBuyDevCard, npcChooseBankTrade,
} from "@/lib/npcAI";
import { updateRoadLengths, updateLargestArmy } from "@/lib/roads";
import { placeVillage, placeTown, placeRoad } from "@/lib/placement";
import { EMPTY_RESOURCES, ROAD_COST, VILLAGE_COST, TOWN_COST, DEV_CARD_COST } from "@/lib/gameConfig";

interface UseNpcAutoPlayOptions {
  gamePhase: "setup" | "playing";
  activePlayerIdx: number;
  board: BoardState;
  players: Player[];
  devDeck: DevCard[];
  turnNumber: number;
  setDice: Dispatch<SetStateAction<{ die1: number; die2: number } | null>>;
  setPlayers: Dispatch<SetStateAction<Player[]>>;
  setBoard: Dispatch<SetStateAction<BoardState>>;
  setDevDeck: Dispatch<SetStateAction<DevCard[]>>;
  setActivePlayerIdx: Dispatch<SetStateAction<number>>;
  setTurnPhase: Dispatch<SetStateAction<TurnPhase>>;
  setRobberState: Dispatch<SetStateAction<"human-discard" | "place-robber" | null>>;
  setDiscardAmount: Dispatch<SetStateAction<number>>;
  setPendingNpcRobber: Dispatch<SetStateAction<{ tileId: number } | null>>;
  setTurnNumber: Dispatch<SetStateAction<number>>;
  setRollHistory: Dispatch<SetStateAction<number[]>>;
  addLog: (message: string, playerColor: string) => void;
}

export function useNpcAutoPlay({
  gamePhase,
  activePlayerIdx,
  board,
  players,
  devDeck,
  turnNumber,
  setDice,
  setPlayers,
  setBoard,
  setDevDeck,
  setActivePlayerIdx,
  setTurnPhase,
  setRobberState,
  setDiscardAmount,
  setPendingNpcRobber,
  setTurnNumber,
  setRollHistory,
  addLog,
}: UseNpcAutoPlayOptions) {
  const boardRef = useRef(board);
  const playersRef = useRef(players);
  const devDeckRef = useRef(devDeck);
  const turnNumberRef = useRef(turnNumber);
  boardRef.current = board;
  playersRef.current = players;
  devDeckRef.current = devDeck;
  turnNumberRef.current = turnNumber;

  useEffect(() => {
    if (gamePhase !== "playing") return;
    if (playersRef.current[activePlayerIdx].isHuman) return;

    const rollTimer = setTimeout(() => {
      const currentPlayers = playersRef.current;
      const npcPlayer = currentPlayers[activePlayerIdx];
      addLog(`${npcPlayer.name}'s turn`, npcPlayer.color);

      const result = rollDice();
      setDice(result);
      setRollHistory(prev => [...prev, result.total]);
      addLog(`${npcPlayer.name} rolled ${result.total}`, npcPlayer.color);

      if (result.total !== 7) {
        let workingPlayers = distributeResources(boardRef.current, currentPlayers, result.total);
        let workingBoard = boardRef.current;
        let localDeck = devDeckRef.current;

        // ── Dev cards ───────────────────────────────────────────────────────
        const monopolyCount = npcPlayer.devCards.filter(c => c.type === "monopoly").length;
        for (let i = 0; i < monopolyCount; i++) {
          const resource = npcChooseMonopolyResource(workingPlayers, npcPlayer.id);
          const { players: afterMonopoly, totalStolen } = applyMonopoly(workingPlayers, npcPlayer.id, resource);
          workingPlayers = afterMonopoly.map(p => {
            if (p.id !== npcPlayer.id) return p;
            const devCards = [...p.devCards];
            devCards.splice(devCards.findIndex(c => c.type === "monopoly"), 1);
            return { ...p, devCards };
          });
          addLog(`${npcPlayer.name} played Monopoly on ${resource} and stole ${totalStolen}`, npcPlayer.color);
        }

        const knightCount = npcPlayer.devCards.filter(c => c.type === "knight").length;
        for (let i = 0; i < knightCount; i++) {
          const tileId = npcChooseRobberTile(workingBoard, npcPlayer.id, workingPlayers);
          workingBoard = moveRobber(workingBoard, tileId);
          const { players: afterSteal, stolen, fromName } =
            stealRandomResource(workingBoard, tileId, npcPlayer.id, workingPlayers);
          workingPlayers = afterSteal.map(p => {
            if (p.id !== npcPlayer.id) return p;
            const devCards = [...p.devCards];
            devCards.splice(devCards.findIndex(c => c.type === "knight"), 1);
            return { ...p, devCards, armyCount: p.armyCount + 1 };
          });
          addLog(`${npcPlayer.name} played a Knight`, npcPlayer.color);
          if (stolen && fromName) addLog(`${npcPlayer.name} stole ${stolen} from ${fromName}`, npcPlayer.color);
        }
        if (knightCount > 0) {
          workingPlayers = updateLargestArmy(workingPlayers);
        }

        // ── Actions: build / buy ────────────────────────────────────────────
        // Refresh NPC player reference after dev card plays
        let npc = workingPlayers.find(p => p.id === npcPlayer.id)!;

        // Bank trade — do up to 2 trades per turn to avoid excessive trading
        for (let t = 0; t < 2; t++) {
          const trade = npcChooseBankTrade(npc, workingBoard);
          if (!trade) break;
          const rate = [2, 3, 4].find(r =>
            workingBoard.villageLocations.some(loc =>
              loc.ownerId === npc.id && (loc.isVillage || loc.isTown) &&
              ((loc.bonus === trade.give && r === 2) || (loc.bonus === "generic" && r === 3))
            )
          ) ?? 4;
          const actualRate = workingBoard.villageLocations.reduce((best, loc) => {
            if (loc.ownerId !== npc.id || (!loc.isVillage && !loc.isTown) || !loc.bonus) return best;
            if (loc.bonus === trade.give) return Math.min(best, 2);
            if (loc.bonus === "generic") return Math.min(best, 3);
            return best;
          }, 4);
          if (npc.resources[trade.give] < actualRate) break;
          workingPlayers = workingPlayers.map(p => p.id !== npc.id ? p : {
            ...p,
            resources: addResources(
              subtractResources(p.resources, { ...EMPTY_RESOURCES, [trade.give]: actualRate }),
              { ...EMPTY_RESOURCES, [trade.receive]: 1 },
            ),
          });
          addLog(`${npcPlayer.name} traded ${actualRate}× ${trade.give} for 1× ${trade.receive}`, npcPlayer.color);
          npc = workingPlayers.find(p => p.id === npcPlayer.id)!;
        }

        // Build town
        const townId = npcChooseTownPlacement(workingBoard, npc);
        if (townId !== null) {
          workingBoard = placeTown(workingBoard, townId, npc.id);
          workingPlayers = workingPlayers.map(p => p.id !== npc.id ? p : {
            ...p,
            resources: subtractResources(p.resources, TOWN_COST),
            victoryPoints: p.victoryPoints + 1,
            townsAvailable: p.townsAvailable - 1,
            villagesAvailable: p.villagesAvailable + 1,
          });
          addLog(`${npcPlayer.name} built a town`, npcPlayer.color);
          npc = workingPlayers.find(p => p.id === npcPlayer.id)!;
        }

        // Build village
        const villageId = npcChooseVillagePlacement(workingBoard, npc);
        if (villageId !== null) {
          workingBoard = placeVillage(workingBoard, villageId, npc.id);
          workingPlayers = workingPlayers.map(p => p.id !== npc.id ? p : {
            ...p,
            resources: subtractResources(p.resources, VILLAGE_COST),
            victoryPoints: p.victoryPoints + 1,
            villagesAvailable: p.villagesAvailable - 1,
          });
          addLog(`${npcPlayer.name} built a village`, npcPlayer.color);
          npc = workingPlayers.find(p => p.id === npcPlayer.id)!;
        }

        // Buy dev card
        if (npcShouldBuyDevCard(npc) && localDeck.length > 0) {
          const [card, ...rest] = localDeck;
          localDeck = rest;
          const isVP = card.type === "victoryPoint";
          workingPlayers = workingPlayers.map(p => p.id !== npc.id ? p : {
            ...p,
            resources: subtractResources(p.resources, DEV_CARD_COST),
            devCards: [...p.devCards, { ...card, drawnOnTurn: turnNumberRef.current }],
            victoryPoints: isVP ? p.victoryPoints + 1 : p.victoryPoints,
          });
          addLog(`${npcPlayer.name} bought a dev card${isVP ? " (Victory Point!)" : ""}`, npcPlayer.color);
          npc = workingPlayers.find(p => p.id === npcPlayer.id)!;
          setDevDeck(localDeck);
        }

        // Build road
        const roadId = npcChooseRoadPlacement(workingBoard, npc);
        if (roadId !== null) {
          workingBoard = placeRoad(workingBoard, roadId, npc.id);
          workingPlayers = workingPlayers.map(p => p.id !== npc.id ? p : {
            ...p,
            resources: subtractResources(p.resources, ROAD_COST),
            roadsAvailable: p.roadsAvailable - 1,
          });
          addLog(`${npcPlayer.name} built a road`, npcPlayer.color);
        }

        // ── Commit and end turn ─────────────────────────────────────────────
        setBoard(workingBoard);
        setPlayers(workingPlayers);

        const endTimer = setTimeout(() => {
          addLog(`${npcPlayer.name} ended their turn`, npcPlayer.color);
          setPlayers(prev => updateRoadLengths(workingBoard, prev));
          setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
          setTurnPhase("pre-roll");
          setTurnNumber(prev => prev + 1);
          setDice(null);
        }, 600);
        return () => clearTimeout(endTimer);
      }

      // ── 7 rolled ──────────────────────────────────────────────────────────
      currentPlayers.forEach(p => {
        if (!p.isHuman && totalResources(p) > 7) {
          addLog(`${p.name} discarded ${Math.floor(totalResources(p) / 2)} cards`, p.color);
        }
      });
      const afterNpcDiscard = applyNpcDiscards(currentPlayers);
      const tileId = npcChooseRobberTile(boardRef.current, npcPlayer.id, afterNpcDiscard);
      const humanPlayer = currentPlayers.find(p => p.isHuman);
      const humanTotal = humanPlayer ? totalResources(humanPlayer) : 0;

      if (humanTotal > 7) {
        setPlayers(afterNpcDiscard);
        setDiscardAmount(Math.floor(humanTotal / 2));
        setPendingNpcRobber({ tileId });
        setRobberState("human-discard");
        return;
      }

      const newBoard = moveRobber(boardRef.current, tileId);
      setBoard(newBoard);
      addLog(`${npcPlayer.name} moved the robber`, npcPlayer.color);

      const { players: afterSteal, stolen, fromName } =
        stealRandomResource(newBoard, tileId, npcPlayer.id, afterNpcDiscard);
      if (stolen && fromName) {
        addLog(`${npcPlayer.name} stole ${stolen} from ${fromName}`, npcPlayer.color);
      }
      setPlayers(afterSteal);

      const endTimer = setTimeout(() => {
        addLog(`${npcPlayer.name} ended their turn`, npcPlayer.color);
        setPlayers(prev => updateRoadLengths(boardRef.current, prev));
        setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
        setTurnPhase("pre-roll");
        setDice(null);
      }, 600);
      return () => clearTimeout(endTimer);
    }, 500);

    return () => clearTimeout(rollTimer);
  }, [gamePhase, activePlayerIdx]);
}
