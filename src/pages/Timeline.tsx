import { useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { supabase, hasSupabase } from "../lib/supabase";
import { PageHeader, Card, EmptyState, BackendNotice } from "../components/ui";

interface Event extends BaseRow {
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  photo_url: string | null;
}

const STORAGE_BUCKET = "memories";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function uploadPhoto(file: File): Promise<string> {
  if (hasSupabase && supabase) {
    const path = `${Date.now()}-${file.name.replace(/[^\w.]+/g, "_")}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  // demo mode: keep as a data URL (fine for previewing, may be large)
  return fileToDataUrl(file);
}

export default function Timeline() {
  const { rows, insert, remove } = useCollection<Event>("timeline_events", {
    orderBy: "event_date",
    ascending: true,
  });
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title.trim() || !date) return;
    setBusy(true);
    try {
      let photo_url: string | null = null;
      if (file) photo_url = await uploadPhoto(file);
      await insert({
        title: title.trim(),
        description: description.trim(),
        event_date: date,
        photo_url,
      });
      setTitle("");
      setDate("");
      setDescription("");
      setFile(null);
    } catch (e) {
      alert("Couldn't save that memory: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        emoji="📸"
        title="Our Memory Timeline"
        subtitle="Every milestone, in order, with the photos to prove it."
      />
      {!hasSupabase && <BackendNotice />}

      <Card className="mb-8">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The day we met"
            className="rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-full border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? How did it feel?"
          rows={2}
          className="w-full mt-3 rounded-2xl border border-rose-2 px-4 py-2 outline-none focus:ring-2 focus:ring-sea resize-none"
        />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-ink-soft"
          />
          <button onClick={add} className="btn btn-love" disabled={busy || !title.trim() || !date}>
            {busy ? "Saving…" : "Add memory 💞"}
          </button>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState emoji="📷">No memories yet — add the very first one above.</EmptyState>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-rose-2" />
          <div className="space-y-6">
            {rows.map((ev) => (
              <div key={ev.id} className="relative">
                <div className="absolute -left-[18px] top-1 w-4 h-4 rounded-full bg-love border-2 border-white shadow" />
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-sea-deep font-bold">
                        {new Date(ev.event_date + "T00:00:00").toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-lg font-bold text-love-deep">{ev.title}</div>
                      {ev.description && (
                        <p className="text-ink mt-1 whitespace-pre-wrap">{ev.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(ev.id)}
                      className="text-ink-soft hover:text-love-deep text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  {ev.photo_url && (
                    <img
                      src={ev.photo_url}
                      alt={ev.title}
                      className="mt-3 rounded-xl max-h-80 w-full object-cover"
                    />
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
