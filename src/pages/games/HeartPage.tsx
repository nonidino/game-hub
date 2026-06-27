import { useRef, useState, useEffect } from "react";
import { useRoom, otherSeat } from "../../games/engine/useRoom";
import { GameLayout } from "../../games/engine/GameShell";
import { heartAccuracy, idealPath, type Pt } from "../../games/heart/heart-score";
import type { SeatId } from "../../games/engine/types";

const SIZE = 320;

interface HeartState {
  scores: { p1: number[]; p2: number[] };
  last: {
    p1?: { points: Pt[]; score: number };
    p2?: { points: Pt[]; score: number };
  };
}
const heartInitial = (): HeartState => ({ scores: { p1: [], p2: [] }, last: {} });

function best(arr: number[]): number {
  return arr.length ? Math.max(...arr) : 0;
}

export default function HeartPage() {
  const room = useRoom<HeartState>("heart", heartInitial);
  const data = room.data;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [path, setPath] = useState<Pt[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const myTurn = room.isMyTurn && room.bothJoined && !data?.winner;

  // redraw canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (showGuide) {
      const guide = idealPath(SIZE);
      ctx.beginPath();
      guide.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = "rgba(20,163,168,0.35)";
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (path.length > 1) {
      ctx.beginPath();
      path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = "#d6315b";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }, [path, showGuide]);

  function pos(e: React.PointerEvent): Pt {
    const r = canvasRef.current!.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * SIZE,
      ((e.clientY - r.top) / r.height) * SIZE,
    ];
  }
  function down(e: React.PointerEvent) {
    if (!myTurn) return;
    setDrawing(true);
    setPath([pos(e)]);
  }
  function move(e: React.PointerEvent) {
    if (!drawing) return;
    setPath((p) => [...p, pos(e)]);
  }
  function up() {
    setDrawing(false);
  }

  function submit() {
    if (!room.mySeat || path.length < 8) return;
    const seat = room.mySeat;
    const score = heartAccuracy(path);
    const points = path;
    room.update((prev) => ({
      ...prev,
      game: {
        scores: { ...prev.game.scores, [seat]: [...prev.game.scores[seat], score] },
        last: { ...prev.game.last, [seat]: { points, score } },
      },
      turn: otherSeat(seat),
    }));
    setPath([]);
  }

  let status = "Take turns drawing the most perfect heart ❤️";
  if (data) {
    if (!room.bothJoined) status = "Waiting for your partner…";
    else if (myTurn)
      status = path.length > 1 ? "Nice — hit Score it when you're happy!" : "Your turn — draw a heart!";
    else status = `${data.players[data.turn ?? "p1"]?.name ?? "Partner"} is drawing…`;
  }

  const leader =
    data && best(data.game.scores.p1) !== best(data.game.scores.p2)
      ? best(data.game.scores.p1) > best(data.game.scores.p2)
        ? "p1"
        : "p2"
      : null;

  return (
    <GameLayout
      emoji="❤️"
      title="Draw a Perfect Heart"
      room={room}
      status={status}
      onNewGame={() => {
        setPath([]);
        room.reset(heartInitial(), "p1");
      }}
      howTo={
        <>
          <p>On your turn, draw a heart in one stroke, then tap "Score it".</p>
          <p>You get an accuracy % vs a mathematically perfect heart.</p>
          <p>Highest score brags. Toggle the guide if you want a hint!</p>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="text-center">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            className={`mx-auto rounded-2xl bg-white shadow-inner border-2 touch-none ${
              myTurn ? "border-love cursor-crosshair" : "border-rose-2 opacity-70"
            }`}
            style={{ width: SIZE, maxWidth: "100%", aspectRatio: "1 / 1", height: "auto" }}
          />
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            <button onClick={() => setPath([])} className="btn btn-ghost text-sm" disabled={!myTurn}>
              Clear
            </button>
            <button
              onClick={() => setShowGuide((s) => !s)}
              className="btn btn-ghost text-sm"
            >
              {showGuide ? "Hide guide" : "Show guide"}
            </button>
            <button
              onClick={submit}
              className="btn btn-love text-sm"
              disabled={!myTurn || path.length < 8}
            >
              Score it ✨
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {(["p1", "p2"] as SeatId[]).map((s) => {
            const p = data?.players[s];
            const last = data?.game.last[s];
            const scores = data?.game.scores[s] ?? [];
            return (
              <div
                key={s}
                className={`card p-4 ${leader === s ? "ring-2 ring-love" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">
                    {p?.emoji} {p?.name ?? "waiting…"}
                    {leader === s && " 👑"}
                  </span>
                  <span className="text-sm text-sea-deep">best {best(scores)}%</span>
                </div>
                {last && (
                  <div className="flex items-center gap-3 mt-2">
                    <MiniHeart points={last.points} />
                    <div>
                      <div className="text-2xl font-bold text-love-deep">{last.score}%</div>
                      <div className="text-xs text-ink-soft">last attempt</div>
                    </div>
                  </div>
                )}
                {scores.length > 0 && (
                  <div className="text-xs text-ink-soft mt-2">
                    {scores.length} attempt{scores.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}

function MiniHeart({ points }: { points: Pt[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 64, 64);
    if (points.length < 2) return;
    // fit points into 64x64
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const w = maxX - minX || 1,
      h = maxY - minY || 1,
      scale = (52 / Math.max(w, h)) * 1;
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      const px = 6 + (x - minX) * scale;
      const py = 6 + (y - minY) * scale;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.strokeStyle = "#d6315b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }, [points]);
  return <canvas ref={ref} width={64} height={64} className="rounded-lg bg-blush" />;
}
