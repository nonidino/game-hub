import { useState, type ReactNode } from "react";
import type { UseRoom } from "./useRoom";
import { hasSupabase } from "../../lib/supabase";
import { PageHeader, Card } from "../../components/ui";

function JoinForm({
  emoji,
  title,
  onJoin,
}: {
  emoji: string;
  title: string;
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  return (
    <div>
      <PageHeader emoji={emoji} title={title} />
      <Card className="max-w-md mx-auto text-center">
        <p className="text-ink-soft mb-4">
          Pick a <strong>room code</strong> and share it with your partner. When
          you both enter the <em>same</em> code, you're connected and the game
          syncs live.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onJoin(code || "US")}
          placeholder="e.g. US"
          maxLength={12}
          className="w-full text-center text-lg tracking-widest font-bold rounded-full border border-rose-2 px-4 py-3 outline-none focus:ring-2 focus:ring-sea uppercase"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={() => onJoin(code || "US")} className="btn btn-love flex-1">
            Enter room
          </button>
          <button onClick={() => onJoin("US")} className="btn btn-ghost">
            Quick play
          </button>
        </div>
        <p className="text-xs text-ink-soft mt-4">
          {hasSupabase
            ? "Connected via Supabase — play from any two devices."
            : "Demo mode: open this page in two browser tabs/windows to play locally."}
        </p>
      </Card>
    </div>
  );
}

export function GameLayout<S>({
  emoji,
  title,
  room,
  status,
  howTo,
  onNewGame,
  children,
}: {
  emoji: string;
  title: string;
  room: UseRoom<S>;
  status: ReactNode;
  howTo?: ReactNode;
  onNewGame?: () => void;
  children: ReactNode;
}) {
  if (!room.code || !room.data) {
    return <JoinForm emoji={emoji} title={title} onJoin={room.join} />;
  }

  const { players } = room.data;
  const seatChip = (id: "p1" | "p2", color: string) => {
    const p = players[id];
    const isMe = room.mySeat === id;
    return (
      <div
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${color} ${
          room.data?.turn === id && !room.data?.winner ? "ring-2 ring-offset-1 ring-ink/30" : ""
        }`}
      >
        <span>{p?.emoji ?? "⬡"}</span>
        <span>{p ? p.name : "waiting…"}</span>
        {isMe && <span className="opacity-70">(you)</span>}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl text-love-deep flex items-center gap-2">
          <span>{emoji}</span>
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-soft">room</span>
          <span className="font-bold tracking-widest text-sea-deep">{room.code}</span>
          <button onClick={room.leave} className="text-xs text-ink-soft hover:underline ml-1">
            leave
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          {seatChip("p1", "bg-rose text-love-deep")}
          <span className="text-ink-soft text-sm">vs</span>
          {seatChip("p2", "bg-sea-mist text-sea-deep")}
        </div>
        {onNewGame && (
          <button onClick={onNewGame} className="btn btn-ghost text-sm">
            ↻ New game
          </button>
        )}
      </div>

      <Card className="mb-4 text-center font-semibold text-ink">{status}</Card>

      {!room.bothJoined && (
        <Card className="mb-4 text-center text-sm text-sea-deep bg-sea-mist/50">
          Waiting for your partner to join room <strong>{room.code}</strong>…
        </Card>
      )}

      {children}

      {howTo && (
        <details className="mt-6 text-sm text-ink-soft">
          <summary className="cursor-pointer font-semibold">How to play</summary>
          <div className="mt-2 space-y-1">{howTo}</div>
        </details>
      )}
    </div>
  );
}
