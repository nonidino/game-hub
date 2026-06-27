import { useState } from "react";
import { useRoom, otherSeat } from "../../games/engine/useRoom";
import { GameLayout } from "../../games/engine/GameShell";
import {
  slInitial,
  rollDie,
  applyMove,
  boardOrder,
  LADDERS,
  SNAKES,
  type SLState,
} from "../../games/snakes/logic";
import type { SeatId } from "../../games/engine/types";

const ORDER = boardOrder();
const DICE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function SnakesPage() {
  const room = useRoom<SLState>("snakes", slInitial);
  const data = room.data;
  const [animRoll, setAnimRoll] = useState<number | null>(null);

  function roll() {
    if (!data || !room.mySeat || !room.isMyTurn || data.winner || !room.bothJoined) return;
    const seat = room.mySeat;
    const die = rollDie();
    setAnimRoll(die);
    const res = applyMove(data.game.pos[seat], die);
    const newPos = { ...data.game.pos, [seat]: res.pos };
    const win = res.pos === 100;
    const me = data.players[seat]?.name ?? "You";
    const msg = res.overshoot
      ? `${me} rolled ${die} — need an exact roll to reach 100!`
      : res.jumped === "ladder"
      ? `${me} climbed a ladder! 🪜`
      : res.jumped === "snake"
      ? `${me} slid down a snake! 🐍`
      : `${me} rolled a ${die}.`;
    room.update((prev) => ({
      ...prev,
      game: { pos: newPos, lastRoll: die, lastMover: seat, message: msg },
      winner: win ? seat : null,
      turn: win ? prev.turn : otherSeat(seat),
    }));
  }

  let status = "Roll the dice to race to 100! 🎲";
  if (data) {
    if (data.winner && data.winner !== "draw") {
      const w = data.players[data.winner];
      status = `${w?.emoji ?? ""} ${w?.name ?? "Someone"} reached 100 — winner! 🎉`;
    } else if (!room.bothJoined) status = "Waiting for your partner…";
    else if (room.isMyTurn) status = data.game.message || "Your turn — roll!";
    else status = `${data.game.message || ""} ${data.players[data.turn ?? "p1"]?.name ?? "Partner"}'s turn…`;
  }

  const tokenFor = (n: number): SeatId[] => {
    const out: SeatId[] = [];
    if (data?.game.pos.p1 === n) out.push("p1");
    if (data?.game.pos.p2 === n) out.push("p2");
    return out;
  };

  return (
    <GameLayout
      emoji="🐍"
      title="Snakes & Ladders"
      room={room}
      status={status}
      onNewGame={() => room.reset(slInitial(), otherSeat((data?.turn as SeatId) ?? "p2"))}
      howTo={
        <>
          <p>Take turns rolling the die and racing to square 100.</p>
          <p>🪜 Ladders lift you up · 🐍 snakes drag you down.</p>
          <p>You need an exact roll to land on 100.</p>
        </>
      }
    >
      <div className="text-center mb-4">
        <button
          onClick={roll}
          disabled={!room.isMyTurn || !room.bothJoined || Boolean(data?.winner)}
          className="btn btn-love text-2xl px-8"
        >
          {animRoll ? DICE[animRoll] : "🎲"} Roll
        </button>
      </div>

      {/* start markers */}
      <div className="flex justify-center gap-4 mb-2 text-sm">
        {(["p1", "p2"] as SeatId[]).map((s) =>
          data?.game.pos[s] === 0 ? (
            <span key={s} className="text-ink-soft">
              {data.players[s]?.emoji} at start
            </span>
          ) : null
        )}
      </div>

      <div className="mx-auto w-fit rounded-2xl bg-white/70 p-1.5 shadow-xl">
        <div className="grid grid-cols-10 gap-0.5">
          {ORDER.map((n) => {
            const tokens = tokenFor(n);
            const isLadder = LADDERS[n] !== undefined;
            const isSnake = SNAKES[n] !== undefined;
            return (
              <div
                key={n}
                className={`relative w-8 h-8 md:w-10 md:h-10 rounded grid place-items-center text-[9px] ${
                  n === 100
                    ? "bg-gradient-to-br from-love to-love-deep text-white font-bold"
                    : isLadder
                    ? "bg-sea-mist"
                    : isSnake
                    ? "bg-rose/60"
                    : "bg-blush-2"
                }`}
              >
                <span className="absolute top-0.5 left-0.5 text-ink-soft/70">{n}</span>
                <span className="text-xs">
                  {isLadder ? "🪜" : isSnake ? "🐍" : ""}
                </span>
                {tokens.length > 0 && (
                  <span className="absolute inset-0 grid place-items-center text-base md:text-lg">
                    {tokens.map((t) => data?.players[t]?.emoji ?? "🔵").join("")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}
