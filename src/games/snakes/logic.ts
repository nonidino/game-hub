import type { SeatId } from "../engine/types";

export interface SLState {
  pos: { p1: number; p2: number };
  lastRoll: number | null;
  lastMover: SeatId | null;
  message: string;
}

// Classic board. start -> destination.
export const LADDERS: Record<number, number> = {
  1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100,
};
export const SNAKES: Record<number, number> = {
  16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78,
};
export const JUMPS: Record<number, number> = { ...LADDERS, ...SNAKES };

export function slInitial(): SLState {
  return { pos: { p1: 0, p2: 0 }, lastRoll: null, lastMover: null, message: "" };
}

export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/** Move from `pos` by `roll`, applying exact-finish + any snake/ladder. */
export function applyMove(
  pos: number,
  roll: number
): { pos: number; jumped: "snake" | "ladder" | null; overshoot: boolean } {
  const target = pos + roll;
  if (target > 100) return { pos, jumped: null, overshoot: true };
  if (LADDERS[target] !== undefined)
    return { pos: LADDERS[target], jumped: "ladder", overshoot: false };
  if (SNAKES[target] !== undefined)
    return { pos: SNAKES[target], jumped: "snake", overshoot: false };
  return { pos: target, jumped: null, overshoot: false };
}

/** Display order of cell numbers (top-left first), boustrophedon. */
export function boardOrder(): number[] {
  const rows: number[][] = [];
  for (let r = 9; r >= 0; r--) {
    const nums: number[] = [];
    for (let c = 0; c < 10; c++) nums.push(r * 10 + c + 1);
    if (r % 2 === 1) nums.reverse();
    rows.push(nums);
  }
  return rows.flat();
}
