import { useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { hasSupabase } from "../lib/supabase";
import { PageHeader, Card, EmptyState, BackendNotice, Pill } from "../components/ui";

interface Idea extends BaseRow {
  text: string;
  category: string;
  done: boolean;
}

const CATEGORIES = ["Date night", "Travel", "Cozy", "Adventure", "Someday"];

export default function DateIdeas() {
  const { rows, insert, update, remove } = useCollection<Idea>("date_ideas", {
    orderBy: "created_at",
  });
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const visible = rows.filter((r) =>
    filter === "all" ? true : filter === "done" ? r.done : !r.done
  );
  const doneCount = rows.filter((r) => r.done).length;

  function add() {
    if (!text.trim()) return;
    insert({ text: text.trim(), category, done: false });
    setText("");
  }

  return (
    <div>
      <PageHeader
        emoji="✨"
        title="Date Ideas & Bucket List"
        subtitle={`${doneCount} of ${rows.length} done together`}
      />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Watch the sunrise together"
            className="flex-1 min-w-[180px] rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-rose-2 px-3 py-2 outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button onClick={add} className="btn btn-love" disabled={!text.trim()}>
            Add
          </button>
        </div>
      </Card>

      <div className="flex gap-2 mb-4">
        {(["all", "todo", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn text-sm ${filter === f ? "btn-sea" : "btn-ghost"}`}
          >
            {f === "all" ? "All" : f === "todo" ? "To do" : "Done ✓"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState emoji="🗺️">Nothing here yet — dream up a date above.</EmptyState>
      ) : (
        <div className="space-y-2">
          {visible.map((idea) => (
            <Card
              key={idea.id}
              className={`flex items-center gap-3 ${idea.done ? "opacity-60" : ""}`}
            >
              <button
                onClick={() => update(idea.id, { done: !idea.done })}
                className={`w-7 h-7 rounded-full border-2 grid place-items-center transition ${
                  idea.done
                    ? "bg-sea border-sea text-white"
                    : "border-rose-2 hover:border-sea"
                }`}
              >
                {idea.done && "✓"}
              </button>
              <span className={`flex-1 text-ink ${idea.done ? "line-through" : ""}`}>
                {idea.text}
              </span>
              <Pill tone="sea">{idea.category}</Pill>
              <button
                onClick={() => remove(idea.id)}
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
