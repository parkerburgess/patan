import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { BoardState, Player } from "@/types/game";
import { addResources, collectSetupResources } from "@/lib/resources";
import { placeStartingVillageAndRoadLocation } from "@/lib/npcMovesLogic";

interface UseNpcSetupTurnsOptions {
  gamePhase: "setup" | "playing";
  setupTurnIndex: number;
  activePlayerIdx: number;
  board: BoardState;
  players: Player[];
  setBoard: Dispatch<SetStateAction<BoardState>>;
  setPlayers: Dispatch<SetStateAction<Player[]>>;
  setActivePlayerIdx: Dispatch<SetStateAction<number>>;
  setSetupTurnIndex: Dispatch<SetStateAction<number>>;
  setGamePhase: Dispatch<SetStateAction<"setup" | "playing">>;
  setPlacementMode: Dispatch<SetStateAction<"village" | "town" | "road" | null>>;
  addLog: (message: string, playerColor: string) => void;
}

export function useNpcSetupTurns({
  gamePhase,
  setupTurnIndex,
  activePlayerIdx,
  board,
  players,
  setBoard,
  setPlayers,
  setActivePlayerIdx,
  setSetupTurnIndex,
  setGamePhase,
  setPlacementMode,
  addLog,
}: UseNpcSetupTurnsOptions) {
  const boardRef = useRef(board);
  const playersRef = useRef(players);
  boardRef.current = board;
  playersRef.current = players;

  useEffect(() => {
    if (gamePhase !== "setup") return;

    //setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
    const activePlayer = playersRef.current[activePlayerIdx];
    if (activePlayer.isHuman) {
      addLog(`${activePlayer.name}'s turn`, activePlayer.color);
      setPlacementMode("village");
      return;
    }

    // NPC turn: auto-place village + adjacent road after a short delay
    const timer = setTimeout(() => {
      const board = boardRef.current;
      const players = playersRef.current;
      const player = players[activePlayerIdx];

      addLog(`${player.name}'s turn`, player.color);

      const npcStartingPlacementResult = placeStartingVillageAndRoadLocation(board, player.id);
      if (npcStartingPlacementResult == null) return;
      addLog("Village and Road Placed", player.color);
      
      setBoard(npcStartingPlacementResult.newBoard);

      setPlayers(players.map((p, idx) => {
        if (idx !== activePlayerIdx) return p;
        const base = {
          ...p,
          victoryPoints: p.victoryPoints + 1,
          villagesAvailable: p.villagesAvailable - 1,
          roadsAvailable: p.roadsAvailable - 1,
        };
        
        if (player.victoryPoints === 2) {
          return { ...base, 
              resources: addResources(p.resources, 
                collectSetupResources(board, npcStartingPlacementResult.villageId)) };
        }
        
        addLog(`${player.name} ended their turn`, player.color);
       
        return base;
      }));

      if (setupTurnIndex >= 7) {
        setActivePlayerIdx(boardRef.current.startingPlayerIdx);
        setGamePhase("playing");
        setPlacementMode(null);
      } else {
        const nextTurnIndex = setupTurnIndex + 1;
        const n = players.length;
        const startIdx = boardRef.current.startingPlayerIdx;
        const nextPlayerIdx = nextTurnIndex < n
          ? (startIdx + nextTurnIndex) % n
          : (startIdx + (2 * n - 1 - nextTurnIndex) + n) % n;

        setActivePlayerIdx(nextPlayerIdx);
        setSetupTurnIndex(nextTurnIndex);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [gamePhase, setupTurnIndex]); // intentionally excludes board/players — use refs instead
}
