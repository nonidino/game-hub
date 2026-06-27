import { useRoom, otherSeat } from "../../games/engine/useRoom";
import { GameLayout } from "../../games/engine/GameShell";
import {
  c4Initial,
  drop,
  winningLine,
  isFull,
  COLS,
  ROWS,
  type C4State,
} from "../../games/connect4/logic";
import type { SeatId } from "../../games/engine/types";

const DISC: Record<SeatId, string> = { p1: "bg-love", p2: "bg-sea" };

export default function Connect4Page() {
  const room = useRoom<C4State>("connect4", c4Initial);
  const data = room.data;

  function play(col: number) {
    if (!data || !room.mySeat || !room.isMyTurn || data.winner || !room.bothJoined) return;
    const res = drop(data.game, col, room.mySeat);
    if (!res) return;
    const line = winningLine(res.state.cells, room.mySeat);
    const winner = line ? room.mySeat : isFull(res.state.cells) ? "draw" : null;
    room.commit(res.state, {
      winner,
      turn: winner ? data.turn : otherSeat(room.mySeat),
    });
  }

  let status = "Connect four in a row to win 🔴🟦";
  let winLine: number[] = [];
  if (data) {
    if (data.winner === "draw") status = "It's a draw! 🤝";
    else if (data.winner) {
      const w = data.players[data.winner];
      status = `${w?.emoji ?? ""} ${w?.name ?? "Someone"} wins! 🎉`;
      winLine = winningLine(data.game.cells, data.winner) ?? [];
    } else if (!room.bothJoined) status = "Waiting for your partner…";
    else if (room.isMyTurn) status = "Your turn — drop a disc!";
    else status = `${data.players[data.turn ?? "p1"]?.name ?? "Partner"}'s turn…`;
  }

  return (
    <GameLayout
      emoji="🔴"
      title="Connect 4"
      room={room}
      status={status}
      onNewGame={() => room.reset(c4Initial(), otherSeat((data?.turn as SeatId) ?? "p2"))}
      howTo={
        <p>
          Take turns dropping discs into the columns. First to line up four of
          their colour — horizontally, vertically, or diagonally — wins.
        </p>
      }
    >
      <div className="mx-auto w-fit rounded-2xl bg-gradient-to-b from-neutral-900 to-black p-2 md:p-3 shadow-xl">
        <div
          className="grid gap-1.5 md:gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: ROWS * COLS }, (_, i) => {
            const cell = data?.game.cells[i] ?? null;
            const col = i % COLS;
            const isWin = winLine.includes(i);
            return (
              <button
                key={i}
                onClick={() => play(col)}
                disabled={!room.isMyTurn || !room.bothJoined || Boolean(data?.winner)}
                className="grid place-items-center"
              >
                <span
                  className={`block w-9 h-9 md:w-12 md:h-12 rounded-full transition ${
                    cell ? DISC[cell] : "bg-white/90"
                  } ${isWin ? "ring-4 ring-yellow-300 scale-105" : ""}`}
                />
              </button>
            );
          })}
        </div>
      </div>
      {/* clickable column hints */}
      <div
        className="mx-auto w-fit grid gap-1.5 md:gap-2 mt-2 px-2 md:px-3"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            onClick={() => play(c)}
            disabled={!room.isMyTurn || !room.bothJoined || Boolean(data?.winner)}
            className="w-9 md:w-12 text-sea-deep disabled:opacity-30 hover:text-love"
            title={`Drop in column ${c + 1}`}
          >
            ▼
          </button>
        ))}
      </div>
    </GameLayout>
  );
}
