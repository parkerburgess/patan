"use client";

// Pip positions: [col, row] in a 3×3 grid (0-indexed, top-left origin)
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[2, 0], [0, 2]],
  3: [[2, 0], [1, 1], [0, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

const DIE_SIZE   = 30;
const PADDING    = 4;
const CELL_SIZE  = (DIE_SIZE - PADDING * 2) / 3;
const PIP_RADIUS = CELL_SIZE * 0.28;

function DieFace({ value }: { value: number | null }) {
  return (
    <svg width={DIE_SIZE} height={DIE_SIZE} viewBox={`0 0 ${DIE_SIZE} ${DIE_SIZE}`}>
      <rect
        x={1.5} y={1.5}
        width={DIE_SIZE - 3} height={DIE_SIZE - 3}
        rx={5} ry={5}
        fill="#F5F0DC"
        stroke="#8B7355"
        strokeWidth={2}
      />
      {value !== null &&
        PIPS[value]?.map(([col, row], i) => {
          const cx = PADDING + col * CELL_SIZE + CELL_SIZE / 2;
          const cy = PADDING + row * CELL_SIZE + CELL_SIZE / 2;
          return <circle key={i} cx={cx} cy={cy} r={PIP_RADIUS} fill="#1a1a1a" />;
        })}
    </svg>
  );
}

interface Props {
  die1: number | null;
  die2: number | null;
}

export default function DiceDisplay({ die1, die2 }: Props) {
  const total = die1 !== null && die2 !== null ? die1 + die2 : null;

  return (
    <div className="flex items-center gap-3">
      <DieFace value={die1} />
      <DieFace value={die2} />
      <span className="text-slate-300 text-sm font-bold w-6 text-center">
        {total !== null ? total : ""}
      </span>
    </div>
  );
}
