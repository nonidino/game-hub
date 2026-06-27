import type { SeatId } from "../engine/types";

export const COLS = 7;
export const ROWS = 6;

export type Cell = SeatId | null;
export interface C4State {
  cells: Cell[]; // length ROWS*COLS, index = row*COLS + col, row 0 = top
}

export const idx = (row: number, col: number) => row * COLS + col;

export function c4Initial(): C4State {
  return { cells: Array(ROWS * COLS).fill(null) };
}

/** Lowest empty row in a column, or -1 if full. */
export function dropRow(cells: Cell[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (cells[idx(row, col)] === null) return row;
  }
  return -1;
}

export function drop(
  state: C4State,
  col: number,
  seat: SeatId
): { state: C4State; row: number } | null {
  const row = dropRow(state.cells, col);
  if (row < 0) return null;
  const cells = state.cells.slice();
  cells[idx(row, col)] = seat;
  return { state: { cells }, row };
}

const DIRS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
];

/** Returns the winning line of indices if `seat` has 4 in a row, else null. */
export function winningLine(cells: Cell[], seat: SeatId): number[] | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (cells[idx(row, col)] !== seat) continue;
      for (const [dr, dc] of DIRS) {
        const line = [idx(row, col)];
        for (let k = 1; k < 4; k++) {
          const r = row + dr * k;
          const c = col + dc * k;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
          if (cells[idx(r, c)] !== seat) break;
          line.push(idx(r, c));
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}

export function isFull(cells: Cell[]): boolean {
  return cells.every((c) => c !== null);
}
