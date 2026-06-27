import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentity, personLabel, personEmoji } from "../../lib/identity";
import { makeBackend, type RoomBackend } from "./backend";
import { emptyRoom, type RoomData, type SeatId, type Seat } from "./types";

function useClientId(): string {
  const ref = useRef<string>("");
  if (!ref.current) {
    let id = sessionStorage.getItem("aaryahub.client");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("aaryahub.client", id);
    }
    ref.current = id;
  }
  return ref.current;
}

function seatOf<S>(data: RoomData<S>, client: string): SeatId | null {
  if (data.players.p1?.client === client) return "p1";
  if (data.players.p2?.client === client) return "p2";
  return null;
}

function claimSeat<S>(data: RoomData<S>, me: Seat): RoomData<S> {
  const existing = seatOf(data, me.client);
  if (existing) {
    // refresh display name/emoji in case identity changed
    return { ...data, players: { ...data.players, [existing]: me } };
  }
  if (!data.players.p1) return { ...data, players: { ...data.players, p1: me } };
  if (!data.players.p2) return { ...data, players: { ...data.players, p2: me } };
  return data; // spectator
}

export interface UseRoom<S> {
  code: string | null;
  data: RoomData<S> | null;
  mySeat: SeatId | null;
  isMyTurn: boolean;
  bothJoined: boolean;
  join: (code: string) => void;
  leave: () => void;
  /** Apply a full transition to the room (rev is bumped + persisted automatically). */
  update: (mutator: (prev: RoomData<S>) => RoomData<S>) => void;
  /** Convenience: replace the game state, optionally setting turn/winner. */
  commit: (
    game: S,
    opts?: { turn?: SeatId | null; winner?: SeatId | "draw" | null }
  ) => void;
  /** Reset to a fresh game. */
  reset: (game: S, firstTurn?: SeatId) => void;
}

export function useRoom<S>(
  gameType: string,
  makeInitial: () => S
): UseRoom<S> {
  const identity = useIdentity();
  const clientId = useClientId();
  const [code, setCode] = useState<string | null>(null);
  const [data, setData] = useState<RoomData<S> | null>(null);
  const backendRef = useRef<RoomBackend<S> | null>(null);

  const me: Seat = {
    client: clientId,
    name: personLabel(identity),
    emoji: personEmoji(identity),
  };
  const meRef = useRef(me);
  meRef.current = me;

  const join = useCallback(
    (joinCode: string) => {
      const c = joinCode.toUpperCase().trim();
      if (!c) return;
      localStorage.setItem(`aaryahub.lastcode.${gameType}`, c);
      setCode(c);
    },
    [gameType]
  );

  const leave = useCallback(() => {
    localStorage.removeItem(`aaryahub.lastcode.${gameType}`);
    setCode(null);
    setData(null);
  }, [gameType]);

  // auto-rejoin last room for this game
  useEffect(() => {
    const last = localStorage.getItem(`aaryahub.lastcode.${gameType}`);
    if (last) setCode(last);
  }, [gameType]);

  // connect + subscribe whenever code changes
  useEffect(() => {
    if (!code) return;
    const backend = makeBackend<S>(gameType, code);
    backendRef.current = backend;
    let cancelled = false;
    let unsub = () => {};

    (async () => {
      let current = await backend.load();
      if (!current) current = emptyRoom(makeInitial(), "p1");
      current = claimSeat(current, meRef.current);
      current = { ...current, rev: (current.rev ?? 0) + 1 };
      await backend.save(current);
      if (cancelled) return;
      setData(current);
      unsub = backend.subscribe((d) => {
        if (!cancelled) setData(d);
      });
    })();

    return () => {
      cancelled = true;
      unsub();
      backendRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, gameType]);

  const update = useCallback((mutator: (prev: RoomData<S>) => RoomData<S>) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...mutator(prev) };
      next.rev = (prev.rev ?? 0) + 1;
      backendRef.current?.save(next);
      return next;
    });
  }, []);

  const commit = useCallback<UseRoom<S>["commit"]>(
    (game, opts) => {
      update((prev) => ({
        ...prev,
        game,
        turn: opts?.turn !== undefined ? opts.turn : prev.turn,
        winner: opts?.winner !== undefined ? opts.winner : prev.winner,
      }));
    },
    [update]
  );

  const reset = useCallback<UseRoom<S>["reset"]>(
    (game, firstTurn = "p1") => {
      update((prev) => ({ ...prev, game, turn: firstTurn, winner: null }));
    },
    [update]
  );

  const mySeat = data ? seatOf(data, clientId) : null;
  const isMyTurn = Boolean(data && !data.winner && data.turn === mySeat);
  const bothJoined = Boolean(data?.players.p1 && data?.players.p2);

  return { code, data, mySeat, isMyTurn, bothJoined, join, leave, update, commit, reset };
}

export const otherSeat = (s: SeatId): SeatId => (s === "p1" ? "p2" : "p1");
