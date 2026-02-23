import { useScrollToBottom } from "@/hooks/useScrollToBottom";

export interface LogEntry {
  id: number;
  message: string;
  playerColor: string;
}

export default function GameLog({ entries }: { entries: LogEntry[] }) {
  const bottomRef = useScrollToBottom(entries.length);

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg overflow-hidden h-full">
      <div className="px-3 py-2 bg-slate-700 text-xs text-slate-300 font-semibold uppercase tracking-widest shrink-0">
        Game Log
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1 min-h-0">
        {entries.map(entry => (
          <div key={entry.id} className="text-xs text-slate-300 flex items-start gap-1.5">
            <span
              className="mt-[3px] w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.playerColor }}
            />
            <span>{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
