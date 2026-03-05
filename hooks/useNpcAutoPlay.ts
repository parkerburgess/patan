import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { BoardState, Player, PlayableResource, TurnPhase } from "@/types/game";
import { rollDice } from "@/lib/dice";
import { applyNpcDiscards, applyMonopoly, npcChooseMonopolyResource, distributeResources, moveRobber, stealRandomResource, totalResources } from "@/lib/resources";
import { npcChooseRobberTile } from "@/lib/robber";
import { updateRoadLengths, updateLargestArmy } from "@/lib/roads";

interface UseNpcAutoPlayOptions {
  gamePhase: "setup" | "playing";
  activePlayerIdx: number;
  board: BoardState;
  players: Player[];
  setDice: Dispatch<SetStateAction<{ die1: number; die2: number } | null>>;
  setPlayers: Dispatch<SetStateAction<Player[]>>;
  setBoard: Dispatch<SetStateAction<BoardState>>;
  setActivePlayerIdx: Dispatch<SetStateAction<number>>;
  setTurnPhase: Dispatch<SetStateAction<TurnPhase>>;
  setRobberState: Dispatch<SetStateAction<"human-discard" | "place-robber" | null>>;
  setDiscardAmount: Dispatch<SetStateAction<number>>;
  setPendingNpcRobber: Dispatch<SetStateAction<{ tileId: number } | null>>;
  setTurnNumber: Dispatch<SetStateAction<number>>;
  addLog: (message: string, playerColor: string) => void;
}

export function useNpcAutoPlay({
  gamePhase,
  activePlayerIdx,
  board,
  players,
  setDice,
  setPlayers,
  setBoard,
  setActivePlayerIdx,
  setTurnPhase,
  setRobberState,
  setDiscardAmount,
  setPendingNpcRobber,
  setTurnNumber,
  addLog,
}: UseNpcAutoPlayOptions) {
  const boardRef = useRef(board);
  const playersRef = useRef(players);
  boardRef.current = board;
  playersRef.current = players;

  useEffect(() => {
    if (gamePhase !== "playing") return;
    if (playersRef.current[activePlayerIdx].isHuman) return;

    const rollTimer = setTimeout(() => {
      const currentPlayers = playersRef.current;
      const npcPlayer = currentPlayers[activePlayerIdx];
      addLog(`${npcPlayer.name}'s turn`, npcPlayer.color);

      const result = rollDice();
      setDice(result);
      addLog(`${npcPlayer.name} rolled ${result.total}`, npcPlayer.color);

      if (result.total !== 7) {
        let afterRoll = distributeResources(boardRef.current, currentPlayers, result.total);

        // Play any monopoly cards
        const monopolyCount = npcPlayer.devCards.filter(c => c.type === "monopoly").length;
        for (let i = 0; i < monopolyCount; i++) {
          const resource = npcChooseMonopolyResource(afterRoll, npcPlayer.id);
          const { players: afterMonopoly, totalStolen } = applyMonopoly(afterRoll, npcPlayer.id, resource);
          // Remove one monopoly card
          afterRoll = afterMonopoly.map(p => {
            if (p.id !== npcPlayer.id) return p;
            const devCards = [...p.devCards];
            devCards.splice(devCards.findIndex(c => c.type === "monopoly"), 1);
            return { ...p, devCards };
          });
          addLog(`${npcPlayer.name} played Monopoly on ${resource} and stole ${totalStolen}`, npcPlayer.color);
        }

        // Play any knight cards
        const knightCount = npcPlayer.devCards.filter(c => c.type === "knight").length;
        let boardAfterKnights = boardRef.current;
        let playersAfterKnights = afterRoll;
        for (let i = 0; i < knightCount; i++) {
          const tileId = npcChooseRobberTile(boardAfterKnights, npcPlayer.id, playersAfterKnights);
          boardAfterKnights = moveRobber(boardAfterKnights, tileId);
          const { players: afterSteal, stolen, fromName } =
            stealRandomResource(boardAfterKnights, tileId, npcPlayer.id, playersAfterKnights);
          playersAfterKnights = afterSteal.map(p => {
            if (p.id !== npcPlayer.id) return p;
            const devCards = [...p.devCards];
            devCards.splice(devCards.findIndex(c => c.type === "knight"), 1);
            return { ...p, devCards, armyCount: p.armyCount + 1 };
          });
          addLog(`${npcPlayer.name} played a Knight`, npcPlayer.color);
          if (stolen && fromName) addLog(`${npcPlayer.name} stole ${stolen} from ${fromName}`, npcPlayer.color);
        }
        if (knightCount > 0) {
          playersAfterKnights = updateLargestArmy(playersAfterKnights);
          setBoard(boardAfterKnights);
        }

        setPlayers(playersAfterKnights);
        const endTimer = setTimeout(() => {
          addLog(`${npcPlayer.name} ended their turn`, npcPlayer.color);
          setPlayers(prev => updateRoadLengths(boardRef.current, prev));
          setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
          setTurnPhase("pre-roll");
          setTurnNumber(prev => prev + 1);
          setDice(null);
        }, 600);
        return () => clearTimeout(endTimer);
      }

      // ── 7 rolled ────────────────────────────────────────────────────────────

      // Apply NPC discards (including this NPC if they have >7)
      currentPlayers.forEach(p => {
        if (!p.isHuman && totalResources(p) > 7) {
          addLog(`${p.name} discarded ${Math.floor(totalResources(p) / 2)} cards`, p.color);
        }
      });
      const afterNpcDiscard = applyNpcDiscards(currentPlayers);

      // Choose the robber tile
      const tileId = npcChooseRobberTile(boardRef.current, npcPlayer.id, afterNpcDiscard);

      // Check if the human needs to discard
      const humanPlayer = currentPlayers.find(p => p.isHuman);
      const humanTotal = humanPlayer ? totalResources(humanPlayer) : 0;

      if (humanTotal > 7) {
        // Pause and wait for human to discard before completing robber
        setPlayers(afterNpcDiscard);
        setDiscardAmount(Math.floor(humanTotal / 2));
        setPendingNpcRobber({ tileId });
        setRobberState("human-discard");
        // The NPC turn will be completed by handleHumanDiscard in Game.tsx
        return;
      }

      // No human discard needed — resolve robber immediately
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
  }, [gamePhase, activePlayerIdx]); // turnPhase intentionally excluded; NPC skips actions phase
}
