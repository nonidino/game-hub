import { useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { hasSupabase } from "../lib/supabase";
import { PageHeader, Card, EmptyState, BackendNotice, Pill } from "../components/ui";

interface Movie extends BaseRow {
  title: string;
  genre: string;
  status: "to-watch" | "watched";
  rating: number;
  notes: string;
}

const GENRES = [
  "Action",
  "Comedy",
  "Rom-Com",
  "Drama",
  "Horror",
  "Thriller",
  "Sci-Fi",
  "Fantasy",
  "Animation",
  "Documentary",
  "Other",
];

type SortBy = "genre" | "rating" | "added";

export default function RomCom() {
  const { rows, insert, update, remove } = useCollection<Movie>("romcoms", {
    orderBy: "created_at",
  });
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortBy>("genre");
  const [pick, setPick] = useState<Movie | null>(null);
  const [rolling, setRolling] = useState(false);

  function add() {
    if (!title.trim()) return;
    insert({ title: title.trim(), genre, status: "to-watch", rating: 0, notes: "" });
    setTitle("");
  }

  const visible = rows
    .filter((m) => filter === "All" || m.genre === filter)
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "added")
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      // genre, then title
      const g = (a.genre ?? "").localeCompare(b.genre ?? "");
      return g !== 0 ? g : a.title.localeCompare(b.title);
    });

  function movieNight() {
    const pool = visible.length ? visible : rows;
    if (pool.length === 0) return;
    setRolling(true);
    let ticks = 0;
    const id = setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++ticks > 12) {
        clearInterval(id);
        setRolling(false);
      }
    }, 90);
  }

  return (
    <div>
      <PageHeader
        emoji="🎬"
        title="Movies"
        subtitle="Our shared movie list — sort by genre, rate the ones you've seen."
      />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-6 text-center bg-gradient-to-br from-rose/40 to-sea-mist/60">
        <div className="text-sm text-ink-soft mb-2">Can't decide what to watch?</div>
        <button onClick={movieNight} className="btn btn-love" disabled={rows.length === 0}>
          🍿 Pick our movie night!
        </button>
        {pick && (
          <div className={`mt-4 transition ${rolling ? "blur-[1px]" : "animate-pop"}`}>
            <div className="text-2xl font-[Quicksand] font-bold text-love-deep">
              {pick.title}
            </div>
            <div className="text-xs text-sea-deep">{pick.genre}</div>
            {!rolling && <div className="text-sm text-sea-deep mt-1">Tonight's the night! 💞</div>}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a movie…"
            className="flex-1 min-w-[160px] rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
          />
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-full border border-rose-2 px-3 py-2 outline-none"
          >
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <button onClick={add} className="btn btn-sea" disabled={!title.trim()}>
            Add
          </button>
        </div>
      </Card>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-ink-soft flex items-center gap-1">
          Genre:
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-full border border-rose-2 px-3 py-1 outline-none"
          >
            <option>All</option>
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink-soft flex items-center gap-1">
          Sort by:
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-full border border-rose-2 px-3 py-1 outline-none"
          >
            <option value="genre">Genre</option>
            <option value="rating">Rating</option>
            <option value="added">Recently added</option>
          </select>
        </label>
        <span className="text-xs text-ink-soft ml-auto">{visible.length} movies</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState emoji="🎬">No movies here yet — add one above.</EmptyState>
      ) : (
        <div className="space-y-2">
          {visible.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <div className="text-ink font-semibold flex items-center gap-2">
                  {m.title}
                  {m.status === "watched" && <span className="text-xs text-sea-deep">✓ seen</span>}
                </div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => update(m.id, { rating: star === m.rating ? 0 : star })}
                      className={star <= m.rating ? "text-love" : "text-rose-2"}
                      title={`${star} star${star > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <Pill tone="sea">{m.genre ?? "Other"}</Pill>
              <button
                onClick={() =>
                  update(m.id, {
                    status: m.status === "watched" ? "to-watch" : "watched",
                  })
                }
                className="btn btn-ghost text-xs"
              >
                {m.status === "watched" ? "↩ to-watch" : "mark seen ✓"}
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
    </div>
  );
}
