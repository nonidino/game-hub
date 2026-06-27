import { useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { hasSupabase } from "../lib/supabase";
import { useNow } from "../lib/useNow";
import { PageHeader, Card, EmptyState, Pill, BackendNotice } from "../components/ui";

interface ImportantDate extends BaseRow {
  title: string;
  emoji: string;
  month: number; // 1-12
  day: number; // 1-31
}

function nextOccurrence(month: number, day: number, now: Date): Date {
  let d = new Date(now.getFullYear(), month - 1, day, 0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d < today) d = new Date(now.getFullYear() + 1, month - 1, day);
  return d;
}

function daysUntil(target: Date, now: Date): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - a.getTime()) / 86_400_000);
}

export default function ImportantDates() {
  const { rows, insert, remove } = useCollection<ImportantDate>("important_dates", {
    orderBy: "created_at",
  });
  const now = useNow(60_000);

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎂");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  const sorted = [...rows].sort(
    (a, b) =>
      daysUntil(nextOccurrence(a.month, a.day, now), now) -
      daysUntil(nextOccurrence(b.month, b.day, now), now)
  );

  function add() {
    if (!title.trim()) return;
    insert({ title: title.trim(), emoji, month, day });
    setTitle("");
    setEmoji("🎂");
  }

  return (
    <div>
      <PageHeader emoji="🎂" title="Important Dates" subtitle="The days we never want to miss." />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-ink-soft">What's the occasion?</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Aarya's birthday"
              className="w-full rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
            />
          </div>
          <div>
            <label className="text-xs text-ink-soft">Emoji</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              className="w-16 text-center rounded-full border border-rose-2 px-2 py-2 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink-soft">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-full border border-rose-2 px-3 py-2 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString(undefined, { month: "short" })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-soft">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="rounded-full border border-rose-2 px-3 py-2 outline-none"
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <button onClick={add} className="btn btn-sea">
            Add
          </button>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState emoji="🗓️">No dates yet — add your first one above.</EmptyState>
      ) : (
        <div className="space-y-3">
          {sorted.map((d) => {
            const next = nextOccurrence(d.month, d.day, now);
            const until = daysUntil(next, now);
            return (
              <Card key={d.id} className="flex items-center gap-4">
                <div className="text-3xl">{d.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-ink">{d.title}</div>
                  <div className="text-sm text-ink-soft">
                    {next.toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <Pill tone={until <= 7 ? "love" : "sea"}>
                  {until === 0 ? "Today! 🎉" : until === 1 ? "Tomorrow" : `in ${until} days`}
                </Pill>
                <button
                  onClick={() => remove(d.id)}
                  className="text-ink-soft hover:text-love-deep text-sm"
                  title="Remove"
                >
                  ✕
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
