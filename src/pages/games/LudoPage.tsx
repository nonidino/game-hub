import { useRoom } from "../../games/engine/useRoom";
import { GameLayout } from "../../games/engine/GameShell";
import {
  ludoInitial,
  rollDie,
  movableTokens,
  moveToken,
  hasWon,
  other,
  tokenCoord,
  MAIN_PATH,
  HOME_COLUMN,
  BASE_SLOTS,
  SAFE,
  type LudoState,
} from "../../games/ludo/logic";
import type { SeatId } from "../../games/engine/types";

const GRID = 15;
const DICE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const COLOR: Record<SeatId, string> = { p1: "bg-love", p2: "bg-sea" };
const SOFT: Record<SeatId, string> = { p1: "bg-rose/50", p2: "bg-sea-mist" };

export default function LudoPage() {
  const room = useRoom<LudoState>("ludo", ludoInitial);
  const data = room.data;
  const seat = room.mySeat;
  const myTurn = room.isMyTurn && room.bothJoined && !data?.winner;
  const g = data?.game;

  const movable =
    g && seat && g.rolled && g.die ? movableTokens(g.tokens[seat], g.die) : [];

  function roll() {
    if (!g || !seat || !myTurn || g.rolled) return;
    const die = rollDie();
    const canMoveIdxs = movableTokens(g.tokens[seat], die);
    if (canMoveIdxs.length === 0) {
      // no moves — pass (a 6 with nothing to move still passes)
      room.update((prev) => ({
        ...prev,
        game: {
          ...prev.game,
          die,
          rolled: false,
          message: `${prev.players[seat]?.name ?? "You"} rolled ${die} — no moves.`,
        },
        turn: other(seat),
      }));
    } else {
      room.update((prev) => ({
        ...prev,
        game: { ...prev.game, die, rolled: true, message: `Rolled ${die} — pick a token.` },
      }));
    }
  }

  function tap(idx: number) {
    if (!g || !seat || !myTurn || !g.rolled || !g.die) return;
    if (!movable.includes(idx)) return;
    const res = moveToken(g, seat, idx, g.die);
    const win = hasWon(res.tokens[seat]);
    const extra = g.die === 6 || res.captured || res.finished;
    room.update((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        tokens: res.tokens,
        die: null,
        rolled: false,
        message: res.captured
          ? "Capture! Go again 🎉"
          : res.finished
          ? "Token home! Go again 🏠"
          : extra
          ? "Rolled a 6 — go again!"
          : "",
      },
      winner: win ? seat : null,
      turn: win ? prev.turn : extra ? seat : other(seat),
    }));
  }

  let status = "Get all 4 tokens home to win 🎲";
  if (data && g) {
    if (data.winner && data.winner !== "draw") {
      const w = data.players[data.winner];
      status = `${w?.emoji ?? ""} ${w?.name ?? "Someone"} got everyone home — winner! 🎉`;
    } else if (!room.bothJoined) status = "Waiting for your partner…";
    else if (myTurn)
      status = g.rolled ? g.message || "Pick a token to move." : "Your turn — roll!";
    else status = `${g.message ? g.message + " · " : ""}${data.players[data.turn ?? "p1"]?.name ?? "Partner"}'s turn…`;
  }

  // Build a quick lookup of which token (seat,idx) sits on each grid cell.
  const cellTokens = new Map<string, { seat: SeatId; idx: number }[]>();
  if (g) {
    (["p1", "p2"] as SeatId[]).forEach((s) =>
      g.tokens[s].forEach((pos, idx) => {
        const [r, c] = tokenCoord(s, pos, idx);
        const key = `${r},${c}`;
        if (!cellTokens.has(key)) cellTokens.set(key, []);
        cellTokens.get(key)!.push({ seat: s, idx });
      })
    );
  }

  // classify each grid cell for background
  const pathSet = new Set(MAIN_PATH.map(([r, c]) => `${r},${c}`));
  const safeSet = new Set(
    [...SAFE].map((mi) => `${MAIN_PATH[mi][0]},${MAIN_PATH[mi][1]}`)
  );
  const homeP1 = new Set(HOME_COLUMN.p1.map(([r, c]) => `${r},${c}`));
  const homeP2 = new Set(HOME_COLUMN.p2.map(([r, c]) => `${r},${c}`));
  const baseP1 = isBaseBlock("p1");
  const baseP2 = isBaseBlock("p2");

  return (
    <GameLayout
      emoji="🎲"
      title="Ludo"
      room={room}
      status={status}
      onNewGame={() => room.reset(ludoInitial(), "p1")}
      howTo={
        <>
          <p>Roll a 6 to bring a token out of base. Race all four around to home.</p>
          <p>Land on an opponent (off a ⭐ safe square) to send them back to base.</p>
          <p>A 6, a capture, or sending a token home earns another roll. Exact roll needed to finish.</p>
        </>
      }
    >
      <div className="text-center mb-3">
        <button
          onClick={roll}
          disabled={!myTurn || Boolean(g?.rolled) || Boolean(data?.winner)}
          className="btn btn-love text-xl px-7"
        >
          {g?.die ? DICE[g.die] : "🎲"} Roll
        </button>
        {g?.rolled && myTurn && (
          <span className="ml-3 text-sea-deep font-bold">Move a glowing token →</span>
        )}
      </div>

      <div className="mx-auto w-fit rounded-2xl bg-white/80 p-2 shadow-xl">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0,1fr))` }}
        >
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const r = Math.floor(i / GRID);
            const c = i % GRID;
            const key = `${r},${c}`;
            const center = r >= 6 && r <= 8 && c >= 6 && c <= 8;
            let bg = "bg-white";
            if (baseP1(r, c)) bg = "bg-rose/40";
            else if (baseP2(r, c)) bg = "bg-sea-mist";
            else if (homeP1.has(key)) bg = "bg-love/40";
            else if (homeP2.has(key)) bg = "bg-sea/40";
            else if (pathSet.has(key)) bg = "bg-blush-2";
            else if (center) bg = "bg-gradient-to-br from-love/30 to-sea/30";
            const toks = cellTokens.get(key) ?? [];
            return (
              <div
                key={i}
                className={`relative w-6 h-6 md:w-7 md:h-7 ${bg} grid place-items-center`}
              >
                {safeSet.has(key) && toks.length === 0 && (
                  <span className="text-[9px] text-ink-soft">⭐</span>
                )}
                {center && r === 7 && c === 7 && <span className="text-sm">🏁</span>}
                {toks.map(({ seat: s, idx }, k) => {
                  const isMovable = s === seat && myTurn && movable.includes(idx);
                  return (
                    <button
                      key={k}
                      onClick={() => isMovable && tap(idx)}
                      style={{ transform: toks.length > 1 ? `translate(${k * 3 - 3}px,0)` : undefined }}
                      className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white ${COLOR[s]} ${
                        isMovable ? "ring-2 ring-yellow-300 animate-pulse cursor-pointer" : ""
                      }`}
                      title={`${s} token ${idx + 1}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* token trackers */}
      <div className="flex justify-center gap-6 mt-3">
        {(["p1", "p2"] as SeatId[]).map((s) => (
          <div key={s} className={`flex items-center gap-2 rounded-full px-3 py-1 ${SOFT[s]}`}>
            <span className="font-bold text-sm">{data?.players[s]?.name ?? "…"}</span>
            <span className="text-xs text-ink-soft">
              home {g?.tokens[s].filter((p) => p === 57).length ?? 0}/4
            </span>
          </div>
        ))}
      </div>
    </GameLayout>
  );
}

function isBaseBlock(seat: SeatId) {
  // rough 6x6 corner blocks for visual base areas
  const slots = BASE_SLOTS[seat];
  const rows = slots.map((s) => s[0]);
  const cols = slots.map((s) => s[1]);
  const r0 = Math.min(...rows) - 1;
  const r1 = Math.max(...rows) + 1;
  const c0 = Math.min(...cols) - 1;
  const c1 = Math.max(...cols) + 1;
  return (r: number, c: number) => r >= r0 && r <= r1 && c >= c0 && c <= c1;
}
