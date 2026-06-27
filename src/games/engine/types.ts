export interface Seat {
  client: string;
  name: string;
  emoji: string;
}

export type SeatId = "p1" | "p2";

export interface RoomData<S> {
  game: S;
  players: { p1?: Seat; p2?: Seat };
  turn: SeatId | null;
  winner: SeatId | "draw" | null;
  rev: number;
}

export function emptyRoom<S>(initial: S, firstTurn: SeatId | null = "p1"): RoomData<S> {
  return { game: initial, players: {}, turn: firstTurn, winner: null, rev: 0 };
}
