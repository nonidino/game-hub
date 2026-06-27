import { useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { hasSupabase } from "../lib/supabase";
import { PageHeader, Card, EmptyState, BackendNotice, Pill } from "../components/ui";

interface Movie extends BaseRow {
  title: string;
  status: "to-watch" | "watched";
  rating: number;
  notes: string;
}

export default function RomCom() {
  const { rows, insert, update, remove } = useCollection<Movie>("romcoms", {
    orderBy: "created_at",
  });
  const [title, setTitle] = useState("");
  const [pick, setPick] = useState<Movie | null>(null);
  const [rolling, setRolling] = useState(false);

  const toWatch = rows.filter((m) => m.status === "to-watch");
  const watched = rows.filter((m) => m.status === "watched");

  function add() {
    if (!title.trim()) return;
    insert({ title: title.trim(), status: "to-watch", rating: 0, notes: "" });
    setTitle("");
  }

  function movieNight() {
    if (toWatch.length === 0) return;
    setRolling(true);
    let ticks = 0;
    const id = setInterval(() => {
      setPick(toWatch[Math.floor(Math.random() * toWatch.length)]);
      if (++ticks > 12) {
        clearInterval(id);
        setRolling(false);
      }
    }, 90);
  }

  return (
    <div>
      <PageHeader
        emoji="🍿"
        title="Rom-Com Club"
        subtitle="Our shared watchlist — because Aarya loves a good rom-com."
      />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-6 text-center bg-gradient-to-br from-rose/40 to-sea-mist/60">
        <div className="text-sm text-ink-soft mb-2">Can't decide what to watch?</div>
        <button onClick={movieNight} className="btn btn-love" disabled={toWatch.length === 0}>
          🎬 Pick our movie night!
        </button>
        {pick && (
          <div className={`mt-4 transition ${rolling ? "blur-[1px]" : "animate-pop"}`}>
            <div className="text-2xl font-[Quicksand] font-bold text-love-deep">
              {pick.title}
            </div>
            {!rolling && <div className="text-sm text-sea-deep">Tonight's the night! 💞</div>}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a rom-com… (e.g. When Harry Met Sally)"
            className="flex-1 rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
          />
          <button onClick={add} className="btn btn-sea" disabled={!title.trim()}>
            Add
          </button>
        </div>
      </Card>

      <h2 className="text-lg text-love-deep mb-2">🎟️ To watch ({toWatch.length})</h2>
      {toWatch.length === 0 ? (
        <EmptyState emoji="🍿">Your watchlist is empty. Add something dreamy.</EmptyState>
      ) : (
        <div className="space-y-2 mb-8">
          {toWatch.map((m) => (
            <Card key={m.id} className="flex items-center gap-3">
              <span className="flex-1 text-ink font-semibold">{m.title}</span>
              <button
                onClick={() => update(m.id, { status: "watched" })}
                className="btn btn-ghost text-sm"
              >
                Mark watched ✓
              </button>
              <button
                onClick={() => remove(m.id)}
                className="text-ink-soft hover:text-love-deep text-sm"
              >
                ✕
              </button>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg text-sea-deep mb-2">💕 Watched together ({watched.length})</h2>
      {watched.length === 0 ? (
        <p className="text-ink-soft text-sm">Nothing watched yet — go make some memories.</p>
      ) : (
        <div className="space-y-2">
          {watched.map((m) => (
            <Card key={m.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-ink font-semibold">{m.title}</div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => update(m.id, { rating: star })}
                      className={star <= m.rating ? "text-love" : "text-rose-2"}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <Pill tone="sea">watched</Pill>
              <button
                onClick={() => remove(m.id)}
                className="text-ink-soft hover:text-love-deep text-sm"
              >
                ✕
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
