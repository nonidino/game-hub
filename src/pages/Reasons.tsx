import { useEffect, useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { hasSupabase } from "../lib/supabase";
import { useIdentity, personLabel } from "../lib/identity";
import { PageHeader, Card, EmptyState, BackendNotice } from "../components/ui";

interface Reason extends BaseRow {
  text: string;
  author: string;
}

export default function Reasons() {
  const identity = useIdentity();
  const { rows, insert, remove } = useCollection<Reason>("love_reasons");
  const [text, setText] = useState("");
  const [drawn, setDrawn] = useState<Reason | null>(null);
  const [spin, setSpin] = useState(false);

  function draw() {
    if (rows.length === 0) return;
    setSpin(true);
    setTimeout(() => {
      const pick = rows[Math.floor(Math.random() * rows.length)];
      setDrawn(pick);
      setSpin(false);
    }, 400);
  }

  useEffect(() => {
    if (!drawn && rows.length > 0) {
      setDrawn(rows[Math.floor(Math.random() * rows.length)]);
    }
  }, [rows, drawn]);

  function add() {
    if (!text.trim() || !identity) return;
    insert({ text: text.trim(), author: identity });
    setText("");
  }

  return (
    <div>
      <PageHeader
        emoji="🫶"
        title="Reasons I Love You"
        subtitle="A jar full of reasons. Draw one whenever you need a smile."
      />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-6 text-center bg-gradient-to-br from-rose/50 to-sea-mist/60">
        <div className="text-5xl mb-3">🏺</div>
        {rows.length === 0 ? (
          <p className="text-ink-soft">The jar is empty — add some reasons below 💕</p>
        ) : (
          <>
            <p
              className={`text-xl md:text-2xl font-[Quicksand] font-bold text-love-deep min-h-[3rem] transition ${
                spin ? "opacity-0 scale-90" : "opacity-100 scale-100"
              }`}
            >
              {drawn ? `"${drawn.text}"` : "…"}
            </p>
            <button onClick={draw} className="btn btn-sea mt-4">
              Draw another 🎴
            </button>
          </>
        )}
      </Card>

      <Card className="mb-6">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="…because your laugh is my favorite sound"
            className="flex-1 rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
          />
          <button onClick={add} className="btn btn-love" disabled={!text.trim()}>
            Add
          </button>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState emoji="🫶">Every reason you add lands in the jar above.</EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-ink">{r.text}</p>
                <p className="text-xs text-ink-soft mt-1">
                  — {personLabel(r.author as "you" | "aarya")}
                </p>
              </div>
              <button
                onClick={() => remove(r.id)}
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
