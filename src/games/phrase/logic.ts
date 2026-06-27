import type { SeatId } from "../engine/types";

export const CHAIN_LEN = 6; // start word + 5 to solve

export interface SolveProgress {
  solvedIndex: number; // 0..5 ; words 1..5 are the ones to solve
  revealed: number; // extra letters shown on the current word (beyond the always-given first)
  hints: number; // total hint letters used (lower = better)
  done: boolean;
}

export interface PCState {
  phase: "setup" | "solve" | "done";
  chains: { p1?: string[]; p2?: string[] }; // each seat's chain is solved by the OTHER seat
  progress: { p1: SolveProgress; p2: SolveProgress };
}

const freshProgress = (): SolveProgress => ({
  solvedIndex: 0,
  revealed: 0,
  hints: 0,
  done: false,
});

export function pcInitial(): PCState {
  return {
    phase: "setup",
    chains: {},
    progress: { p1: freshProgress(), p2: freshProgress() },
  };
}

export const otherSeat = (s: SeatId): SeatId => (s === "p1" ? "p2" : "p1");

/** The chain a given seat is solving (the one their partner created). */
export function chainFor(state: PCState, seat: SeatId): string[] | undefined {
  return state.chains[otherSeat(seat)];
}

export const currentWordIndex = (p: SolveProgress) => p.solvedIndex + 1;

export function normalizeWord(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Clue letters visible for word at `idx` given progress. */
export function visibleLetters(word: string, idx: number, p: SolveProgress): string {
  if (idx === 0) return word; // start word fully shown
  if (idx < currentWordIndex(p)) return word; // already solved
  if (idx > currentWordIndex(p)) return word[0]; // future: first letter only
  // current word: first letter + revealed extras
  return word.slice(0, 1 + p.revealed);
}

/** Apply a correct/incorrect guess. Returns updated progress + whether correct. */
export function applyGuess(
  chain: string[],
  p: SolveProgress,
  guess: string
): { progress: SolveProgress; correct: boolean } {
  const idx = currentWordIndex(p);
  if (p.done || idx >= CHAIN_LEN) return { progress: p, correct: false };
  const correct = normalizeWord(guess) === normalizeWord(chain[idx]);
  if (!correct) return { progress: p, correct: false };
  const solvedIndex = p.solvedIndex + 1;
  return {
    progress: { ...p, solvedIndex, revealed: 0, done: solvedIndex >= CHAIN_LEN - 1 },
    correct: true,
  };
}

/** Reveal one more hint letter on the current word; auto-solves if fully revealed. */
export function applyReveal(chain: string[], p: SolveProgress): SolveProgress {
  const idx = currentWordIndex(p);
  if (p.done || idx >= CHAIN_LEN) return p;
  const word = chain[idx];
  const revealed = p.revealed + 1;
  const hints = p.hints + 1;
  if (1 + revealed >= word.length) {
    // whole word now shown -> counts as solved, move on
    const solvedIndex = p.solvedIndex + 1;
    return { solvedIndex, revealed: 0, hints, done: solvedIndex >= CHAIN_LEN - 1 };
  }
  return { ...p, revealed, hints };
}
