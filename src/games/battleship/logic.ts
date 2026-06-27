import type { SeatId } from "../engine/types";

export const SIZE = 10;
export type Orientation = "h" | "v";

export interface Ship {
  name: string;
  len: number;
  cells: number[];
}
export interface BoardState {
  ships: Ship[];
  ready: boolean;
}
export interface BSState {
  phase: "place" | "battle";
  boards: { p1?: BoardState; p2?: BoardState };
  shots: { p1: number[]; p2: number[] }; // indices each seat has fired at the opponent
}

export const FLEET: { name: string; len: number }[] = [
  { name: "Carrier", len: 5 },
  { name: "Battleship", len: 4 },
  { name: "Cruiser", len: 3 },
  { name: "Submarine", len: 3 },
  { name: "Destroyer", len: 2 },
];

export const rc = (i: number) => ({ row: Math.floor(i / SIZE), col: i % SIZE });
export const ix = (row: number, col: number) => row * SIZE + col;

export function bsInitial(): BSState {
  return { phase: "place", boards: {}, shots: { p1: [], p2: [] } };
}

export function shipCells(start: number, len: number, o: Orientation): number[] | null {
  const { row, col } = rc(start);
  const cells: number[] = [];
  for (let k = 0; k < len; k++) {
    const r = o === "v" ? row + k : row;
    const c = o === "h" ? col + k : col;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
    cells.push(ix(r, c));
  }
  return cells;
}

export function overlaps(cells: number[], ships: Ship[]): boolean {
  const occupied = new Set(ships.flatMap((s) => s.cells));
  return cells.some((c) => occupied.has(c));
}

export function randomFleet(): Ship[] {
  const ships: Ship[] = [];
  for (const spec of FLEET) {
    let placed = false;
    let guard = 0;
    while (!placed && guard++ < 500) {
      const o: Orientation = Math.random() < 0.5 ? "h" : "v";
      const start = Math.floor(Math.random() * SIZE * SIZE);
      const cells = shipCells(start, spec.len, o);
      if (cells && !overlaps(cells, ships)) {
        ships.push({ name: spec.name, len: spec.len, cells });
        placed = true;
      }
    }
  }
  return ships;
}

export function shipSunk(ship: Ship, incomingShots: number[]): boolean {
  return ship.cells.every((c) => incomingShots.includes(c));
}

export function allSunk(ships: Ship[], incomingShots: number[]): boolean {
  return ships.every((s) => shipSunk(s, incomingShots));
}

export function isHit(ships: Ship[], index: number): boolean {
  return ships.some((s) => s.cells.includes(index));
}

/** How many of the opponent's ships are fully sunk by `shots`. */
export function sunkCount(ships: Ship[], shots: number[]): number {
  return ships.filter((s) => shipSunk(s, shots)).length;
}

export const other = (s: SeatId): SeatId => (s === "p1" ? "p2" : "p1");
