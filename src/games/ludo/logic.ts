import type { SeatId } from "../engine/types";

// 2-player Ludo (4 tokens each). Token positions:
//   0        = in base
//   1..51    = on the shared 52-cell loop (mainIndex = (offset + pos - 1) % 52)
//   52..57   = home column (6 cells); 57 = finished (center)
export const FINISH = 57;
export const startOffset: Record<SeatId, number> = { p1: 0, p2: 26 };
export const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export interface LudoState {
  tokens: { p1: number[]; p2: number[] };
  die: number | null;
  rolled: boolean; // current player has rolled and must now move (or has no move)
  message: string;
}

export function ludoInitial(): LudoState {
  return {
    tokens: { p1: [0, 0, 0, 0], p2: [0, 0, 0, 0] },
    die: null,
    rolled: false,
    message: "",
  };
}

export const rollDie = () => 1 + Math.floor(Math.random() * 6);
export const other = (s: SeatId): SeatId => (s === "p1" ? "p2" : "p1");

export function mainIndexOf(seat: SeatId, pos: number): number {
  if (pos >= 1 && pos <= 51) return (startOffset[seat] + pos - 1) % 52;
  return -1;
}

export function canMove(pos: number, die: number): boolean {
  if (pos === 0) return die === 6;
  if (pos >= FINISH) return false;
  return pos + die <= FINISH;
}

export function movableTokens(tokens: number[], die: number): number[] {
  return tokens.map((p, i) => (canMove(p, die) ? i : -1)).filter((i) => i >= 0);
}

export interface MoveResult {
  tokens: LudoState["tokens"];
  captured: boolean;
  finished: boolean;
}

/** Move token `idx` of `seat` by `die`, applying captures. */
export function moveToken(
  state: LudoState,
  seat: SeatId,
  idx: number,
  die: number
): MoveResult {
  const mine = state.tokens[seat].slice();
  const opp = state.tokens[other(seat)].slice();
  const pos = mine[idx];
  const newPos = pos === 0 ? 1 : pos + die;
  mine[idx] = newPos;

  let captured = false;
  const mIdx = mainIndexOf(seat, newPos);
  if (mIdx >= 0 && !SAFE.has(mIdx)) {
    for (let k = 0; k < opp.length; k++) {
      if (mainIndexOf(other(seat), opp[k]) === mIdx) {
        opp[k] = 0; // send home
        captured = true;
      }
    }
  }

  const tokens =
    seat === "p1" ? { p1: mine, p2: opp } : { p1: opp, p2: mine };
  return { tokens, captured, finished: newPos === FINISH };
}

export function hasWon(tokens: number[]): boolean {
  return tokens.every((p) => p === FINISH);
}

/* ----------------------- board geometry (15x15) ----------------------- */
export type RC = [number, number];

// 52 loop cells, clockwise, starting at p1's start cell.
export const MAIN_PATH: RC[] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

export const HOME_COLUMN: Record<SeatId, RC[]> = {
  p1: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6],
  ],
  p2: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8],
  ],
};

export const BASE_SLOTS: Record<SeatId, RC[]> = {
  p1: [
    [1, 1], [1, 4], [4, 1], [4, 4],
  ],
  p2: [
    [10, 10], [10, 13], [13, 10], [13, 13],
  ],
};

/** Grid coordinate of a token. */
export function tokenCoord(seat: SeatId, pos: number, tokenIdx: number): RC {
  if (pos === 0) return BASE_SLOTS[seat][tokenIdx];
  if (pos >= 1 && pos <= 51) return MAIN_PATH[mainIndexOf(seat, pos)];
  return HOME_COLUMN[seat][pos - 52];
}
