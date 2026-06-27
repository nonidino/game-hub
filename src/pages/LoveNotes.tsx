import { useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { hasSupabase } from "../lib/supabase";
import { useIdentity, personLabel, personEmoji } from "../lib/identity";
import { PageHeader, Card, EmptyState, BackendNotice } from "../components/ui";

interface Note extends BaseRow {
  body: string;
  author: string;
  hearts: number;
}

export default function LoveNotes() {
  const identity = useIdentity();
  const { rows, insert, update, remove } = useCollection<Note>("love_notes", {
    orderBy: "created_at",
    ascending: false,
  });
  const [body, setBody] = useState("");

  function post() {
    if (!body.trim() || !identity) return;
    insert({ body: body.trim(), author: identity, hearts: 0 });
    setBody("");
  }

  return (
    <div>
      <PageHeader
        emoji="💌"
        title="Love Notes"
        subtitle="Leave each other little messages. They show up for both of us."
      />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-6">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Write something sweet${identity ? ` as ${personLabel(identity)}` : ""}…`}
          rows={3}
          className="w-full rounded-2xl border border-rose-2 px-4 py-3 outline-none focus:ring-2 focus:ring-sea resize-none"
        />
        <div className="flex justify-end mt-2">
          <button onClick={post} className="btn btn-love" disabled={!body.trim()}>
            Send note 💕
          </button>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState emoji="💌">No notes yet. Be the first to say something lovely.</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((n) => {
            const mine = n.author === identity;
            return (
              <Card
                key={n.id}
                className={`flex gap-3 ${mine ? "ml-8 bg-sea-mist/60" : "mr-8"}`}
              >
                <div className="text-2xl">{personEmoji(n.author as "you" | "aarya")}</div>
                <div className="flex-1">
                  <div className="text-xs text-ink-soft mb-0.5">
                    {personLabel(n.author as "you" | "aarya")}
                    {n.created_at && (
                      <span> · {new Date(n.created_at).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-ink whitespace-pre-wrap">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => update(n.id, { hearts: (n.hearts ?? 0) + 1 })}
                      className="text-sm hover:scale-110 transition"
                      title="Love this"
                    >
                      ❤️ {n.hearts ?? 0}
                    </button>
                    {mine && (
                      <button
                        onClick={() => remove(n.id)}
                        className="text-xs text-ink-soft hover:text-love-deep"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
