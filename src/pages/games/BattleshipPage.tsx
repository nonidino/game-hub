import { useState } from "react";
import { useRoom } from "../../games/engine/useRoom";
import { GameLayout } from "../../games/engine/GameShell";
import {
  bsInitial,
  shipCells,
  overlaps,
  randomFleet,
  allSunk,
  isHit,
  sunkCount,
  shipSunk,
  FLEET,
  SIZE,
  other,
  type BSState,
  type Ship,
  type Orientation,
} from "../../games/battleship/logic";

const CELLS = Array.from({ length: SIZE * SIZE }, (_, i) => i);

function colLabels() {
  return "ABCDEFGHIJ".split("");
}

export default function BattleshipPage() {
  const room = useRoom<BSState>("battleship", bsInitial);
  const data = room.data;
  const seat = room.mySeat;

  const [placing, setPlacing] = useState<Ship[]>([]);
  const [orient, setOrient] = useState<Orientation>("h");
  const [hover, setHover] = useState<number | null>(null);

  const myBoard = seat ? data?.game.boards[seat] : undefined;
  const ready = Boolean(myBoard?.ready);
  const phase = data?.game.phase ?? "place";

  // ----- placement helpers -----
  const nextSpec = placing.length < FLEET.length ? FLEET[placing.length] : null;
  const previewCells =
    nextSpec && hover !== null ? shipCells(hover, nextSpec.len, orient) : null;
  const previewValid = previewCells !== null && !overlaps(previewCells, placing);

  function placeAt(start: number) {
    if (!nextSpec) return;
    const cells = shipCells(start, nextSpec.len, orient);
    if (cells && !overlaps(cells, placing)) {
      setPlacing([...placing, { name: nextSpec.name, len: nextSpec.len, cells }]);
    }
  }

  function confirmReady() {
    if (!seat || placing.length !== FLEET.length) return;
    room.update((prev) => {
      const boards = {
        ...prev.game.boards,
        [seat]: { ships: placing, ready: true },
      };
      const bothReady = Boolean(boards.p1?.ready && boards.p2?.ready);
      return {
        ...prev,
        game: { ...prev.game, boards, phase: bothReady ? "battle" : "place" },
        turn: bothReady ? "p1" : prev.turn,
      };
    });
  }

  // ----- battle helpers -----
  function fire(target: number) {
    if (!seat || phase !== "battle" || !room.isMyTurn || data?.winner) return;
    const myShots = data!.game.shots[seat];
    if (myShots.includes(target)) return;
    const opp = other(seat);
    const oppShips = data!.game.boards[opp]?.ships ?? [];
    const newShots = [...myShots, target];
    const win = allSunk(oppShips, newShots);
    room.update((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        shots: { ...prev.game.shots, [seat]: newShots },
      },
      winner: win ? seat : null,
      turn: win ? prev.turn : opp,
    }));
  }

  function newGame() {
    setPlacing([]);
    room.reset(bsInitial(), "p1");
  }

  // ----- status text -----
  let status = "Place your fleet to begin 🚢";
  if (data) {
    if (data.winner && data.winner !== "draw") {
      const w = data.players[data.winner];
      status = `${w?.emoji ?? ""} ${w?.name ?? "Someone"} sank the fleet! 🎉`;
    } else if (phase === "place") {
      if (!seat) status = "Spectating…";
      else if (ready) status = "Fleet ready! Waiting for your partner to place theirs…";
      else status = "Drag-free placement: pick orientation, then click to drop each ship.";
    } else if (phase === "battle") {
      if (room.isMyTurn) status = "Your turn — fire at the enemy waters! 🎯";
      else status = `${data.players[data.turn ?? "p1"]?.name ?? "Partner"} is taking aim…`;
    }
  }

  return (
    <GameLayout
      emoji="🚢"
      title="Battleship"
      room={room}
      status={status}
      onNewGame={newGame}
      howTo={
        <>
          <p>1. Place all 5 ships on your grid, then hit Ready.</p>
          <p>2. Once you've both placed, take turns firing one shot each.</p>
          <p>💥 = hit, ○ = miss. Sink the whole enemy fleet to win.</p>
          <p className="text-xs opacity-70">
            Note: this is honor-system — ship positions live in shared state, so
            don't go peeking in devtools 😉
          </p>
        </>
      }
    >
      {!seat && (
        <p className="text-center text-ink-soft">You're spectating this game.</p>
      )}

      {/* PLACEMENT */}
      {seat && phase === "place" && !ready && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setOrient((o) => (o === "h" ? "v" : "h"))}
              className="btn btn-ghost"
            >
              Orientation: {orient === "h" ? "↔ Horizontal" : "↕ Vertical"}
            </button>
            <button onClick={() => setPlacing(randomFleet())} className="btn btn-sea">
              🎲 Randomize
            </button>
            <button
              onClick={() => setPlacing(placing.slice(0, -1))}
              className="btn btn-ghost"
              disabled={placing.length === 0}
            >
              ↩ Undo
            </button>
            <button
              onClick={confirmReady}
              className="btn btn-love"
              disabled={placing.length !== FLEET.length}
            >
              ✓ Ready ({placing.length}/{FLEET.length})
            </button>
          </div>

          <Grid
            label="Your waters"
            onCell={placeAt}
            onHover={setHover}
            render={(i) => {
              const mine = placing.some((s) => s.cells.includes(i));
              const inPreview = previewCells?.includes(i);
              return {
                className: mine
                  ? "bg-sea text-white"
                  : inPreview
                  ? previewValid
                    ? "bg-sea-light"
                    : "bg-love/60"
                  : "bg-sea-mist/40 hover:bg-sea-mist",
                content: mine ? "•" : "",
              };
            }}
          />
          {nextSpec && (
            <p className="text-center text-sm text-ink-soft">
              Placing: <strong>{nextSpec.name}</strong> ({nextSpec.len} cells)
            </p>
          )}
        </div>
      )}

      {seat && phase === "place" && ready && (
        <p className="text-center text-sea-deep">
          🛳️ Your fleet is set. Sit tight while your partner places theirs.
        </p>
      )}

      {/* BATTLE */}
      {seat && phase === "battle" && data && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tracking grid (fire here) */}
          <div>
            <h3 className="text-center font-bold text-love-deep mb-2">
              Enemy waters 🎯
            </h3>
            <Grid
              label="enemy"
              onCell={fire}
              render={(i) => {
                const fired = data.game.shots[seat].includes(i);
                const oppShips = data.game.boards[other(seat)]?.ships ?? [];
                const hit = fired && isHit(oppShips, i);
                return {
                  className: fired
                    ? hit
                      ? "bg-love text-white"
                      : "bg-white text-sea-deep"
                    : `bg-sea-mist/50 ${
                        room.isMyTurn && !data.winner ? "hover:bg-sea-light cursor-crosshair" : ""
                      }`,
                  content: fired ? (hit ? "💥" : "○") : "",
                };
              }}
            />
            <p className="text-center text-xs text-ink-soft mt-1">
              Sunk {sunkCount(data.game.boards[other(seat)]?.ships ?? [], data.game.shots[seat])}/
              {FLEET.length}
            </p>
          </div>

          {/* Own grid (incoming) */}
          <div>
            <h3 className="text-center font-bold text-sea-deep mb-2">Your fleet 🛟</h3>
            <Grid
              label="own"
              render={(i) => {
                const incoming = data.game.shots[other(seat)];
                const mine = myBoard?.ships.some((s) => s.cells.includes(i));
                const struck = incoming.includes(i);
                const hit = struck && mine;
                return {
                  className: hit
                    ? "bg-love text-white"
                    : struck
                    ? "bg-white"
                    : mine
                    ? "bg-sea text-white"
                    : "bg-sea-mist/40",
                  content: hit ? "💥" : struck ? "○" : mine ? "•" : "",
                };
              }}
            />
            <p className="text-center text-xs text-ink-soft mt-1">
              Ships lost:{" "}
              {(myBoard?.ships ?? []).filter((s) =>
                shipSunk(s, data.game.shots[other(seat)])
              ).length}
              /{FLEET.length}
            </p>
          </div>
        </div>
      )}
    </GameLayout>
  );
}

/* ---- 10x10 grid with A–J / 1–10 labels ---- */
function Grid({
  label,
  onCell,
  onHover,
  render,
}: {
  label: string;
  onCell?: (i: number) => void;
  onHover?: (i: number | null) => void;
  render: (i: number) => { className: string; content: string };
}) {
  return (
    <div className="mx-auto w-fit select-none">
      <div className="flex">
        <div className="w-5" />
        {colLabels().map((c) => (
          <div key={c} className="w-7 md:w-8 text-center text-[10px] text-ink-soft">
            {c}
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: `1.25rem repeat(${SIZE}, minmax(0,1fr))` }}
        onMouseLeave={() => onHover?.(null)}
      >
        {Array.from({ length: SIZE }, (_, row) => (
          <Row
            key={row}
            row={row}
            cells={CELLS.slice(row * SIZE, row * SIZE + SIZE)}
            onCell={onCell}
            onHover={onHover}
            render={render}
            label={label}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  row,
  cells,
  onCell,
  onHover,
  render,
  label,
}: {
  row: number;
  cells: number[];
  onCell?: (i: number) => void;
  onHover?: (i: number | null) => void;
  render: (i: number) => { className: string; content: string };
  label: string;
}) {
  return (
    <>
      <div className="w-5 grid place-items-center text-[10px] text-ink-soft">
        {row + 1}
      </div>
      {cells.map((i) => {
        const r = render(i);
        return (
          <button
            key={`${label}-${i}`}
            onClick={() => onCell?.(i)}
            onMouseEnter={() => onHover?.(i)}
            className={`w-7 h-7 md:w-8 md:h-8 border border-white/60 grid place-items-center text-sm ${r.className}`}
          >
            {r.content}
          </button>
        );
      })}
    </>
  );
}
