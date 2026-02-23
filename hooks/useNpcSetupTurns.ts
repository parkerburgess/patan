import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { BoardState, Player } from "@/types/game";
import { canPlaceVillage, placeVillage, placeRoad } from "@/lib/placement";
import { addResources, collectSetupResources } from "@/lib/resources";

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

    setActivePlayerIdx(prev => (prev + 1) % playersRef.current.length);
    const activePlayer = playersRef.current[activePlayerIdx];
    if (activePlayer.isHuman) {
      addLog(`${activePlayer.name}'s turn`, activePlayer.color);
      setPlacementMode("village");
      return;
    }

    // NPC turn: auto-place village + adjacent road after a short delay
    const timer = setTimeout(() => {
      const b = boardRef.current;
      const ps = playersRef.current;
      const player = ps[activePlayerIdx];
      addLog(`${player.name}'s turn`, player.color);

      const validVillages = b.villageLocations.filter(loc =>
        canPlaceVillage(b, loc.id, player.id, true)
      );
      if (validVillages.length === 0) return;
      const village = validVillages[Math.floor(Math.random() * validVillages.length)];

      let newBoard = placeVillage(b, village.id, player.id);

      const adjRoads = newBoard.roadLocations.filter(r =>
        r.ownerId === null && (
          r.villageLocationId1 === village.id || r.villageLocationId2 === village.id
        )
      );
      if (adjRoads.length > 0) {
        const road = adjRoads[Math.floor(Math.random() * adjRoads.length)];
        newBoard = placeRoad(newBoard, road.id, player.id);
      }

      addLog(`${player.name} placed a village`, player.color);
      if (adjRoads.length > 0) addLog(`${player.name} placed a road`, player.color);
      addLog(`${player.name} ended their turn`, player.color);

      setBoard(newBoard);
      setPlayers(ps.map((p, idx) => {
        if (idx !== activePlayerIdx) return p;
        const base = {
          ...p,
          victoryPoints: p.victoryPoints + 1,
          villagesAvailable: p.villagesAvailable - 1,
          roadsAvailable: p.roadsAvailable - 1,
        };
        // TODO: use player.victoryPoints === 1 instead of setupTurnIndex to detect second round
        if (setupTurnIndex >= 4) {
          return { ...base, resources: addResources(p.resources, collectSetupResources(b, village.id)) };
        }
        return base;
      }));

      if (setupTurnIndex >= 7) {
        setActivePlayerIdx(boardRef.current.startingPlayerIdx);
        setGamePhase("playing");
        setPlacementMode(null);
      } else {
        setSetupTurnIndex(prev => prev + 1);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [gamePhase, setupTurnIndex]); // intentionally excludes board/players — use refs instead
}
