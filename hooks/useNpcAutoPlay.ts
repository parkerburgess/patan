import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { BoardState, Player, TurnPhase } from "@/types/game";
import { rollDice } from "@/lib/dice";
import { distributeResources, processRobber } from "@/lib/resources";

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
      const player = playersRef.current[activePlayerIdx];
      addLog(`${player.name}'s turn`, player.color);

      const result = rollDice();
      setDice(result);
      addLog(`${player.name} rolled ${result.total}`, player.color);

      if (result.total !== 7) {
        setPlayers(prev => distributeResources(boardRef.current, prev, result.total));
      } else {
        setBoard(prev => processRobber(prev));
      }
      const endTimer = setTimeout(() => {
        addLog(`${player.name} ended their turn`, player.color);
        setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
        setTurnPhase("pre-roll");
        setDice(null);
      }, 600);
      return () => clearTimeout(endTimer);
    }, 500);

    return () => clearTimeout(rollTimer);
  }, [gamePhase, activePlayerIdx]); // turnPhase intentionally excluded; NPC skips actions phase
}
