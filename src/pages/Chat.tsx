import { useEffect, useRef, useState } from "react";
import { useCollection, type BaseRow } from "../lib/store";
import { callAiChat, callAiTts, aiConfigured, type ChatMsg } from "../lib/ai";
import { useIdentity, personLabel } from "../lib/identity";
import { PARTNER_NAME } from "../lib/config";
import { PageHeader, Card } from "../components/ui";

interface ChatRow extends BaseRow {
  role: "user" | "assistant";
  content: string;
  speaker?: string;
}
interface StyleRow extends BaseRow {
  text: string;
}

export default function Chat() {
  const identity = useIdentity();
  const { rows: history, insert } = useCollection<ChatRow>("chat_messages", {
    orderBy: "created_at",
    ascending: true,
  });
  const { rows: samples, insert: addSample, remove: removeSample } =
    useCollection<StyleRow>("style_samples");

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [sample, setSample] = useState("");
  const [showTrainer, setShowTrainer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length, busy]);

  async function speak(text: string) {
    try {
      const url = await callAiTts(text);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) {
      console.warn("TTS failed:", e);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await insert({ role: "user", content: text, speaker: identity ?? "aarya" });
    setBusy(true);
    try {
      const convo: ChatMsg[] = [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];
      const reply = aiConfigured
        ? await callAiChat(convo, {
            styleSamples: samples.map((s) => s.text),
            myName: personLabel("you"),
            partnerName: PARTNER_NAME,
          })
        : `🤖 (Demo) The AI brain isn't wired up yet — add your Anthropic key to the Supabase \`ai-chat\` function and I'll really start talking like him. For now: you said "${text}" 💛`;
      await insert({ role: "assistant", content: reply });
      if (autoSpeak && aiConfigured) speak(reply);
    } catch (e) {
      await insert({
        role: "assistant",
        content: "😅 I hit a snag reaching my brain: " + (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100svh-7rem)]">
      <PageHeader
        emoji="🤖"
        title={`Chat with AI-${personLabel("you")}`}
        subtitle="An AI that talks like me — for whenever you miss me 💕"
      />

      {!aiConfigured && (
        <Card className="mb-3 border-2 border-dashed border-sea-light bg-sea-mist/40 text-sm">
          <strong className="text-sea-deep">Demo mode.</strong> Set up the Supabase{" "}
          <code className="bg-white/60 px-1 rounded">ai-chat</code> &{" "}
          <code className="bg-white/60 px-1 rounded">ai-tts</code> edge functions (with
          your Anthropic + ElevenLabs keys) to make this really talk and speak in my
          voice. See the README.
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {history.length === 0 && (
          <p className="text-center text-ink-soft py-10">
            Say hi 👋 — I'll reply like {personLabel("you")}.
          </p>
        )}
        {history.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-sea text-white rounded-br-sm"
                  : "bg-white text-ink rounded-bl-sm shadow"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && aiConfigured && (
                <button
                  onClick={() => speak(m.content)}
                  className="text-xs text-sea-deep mt-1 hover:underline"
                >
                  🔊 speak
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-2 shadow text-ink-soft">
              typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3">
        <div className="flex items-center justify-between mb-2 text-xs">
          <label className="flex items-center gap-1 text-ink-soft">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
            />
            🔊 Auto-speak replies
          </label>
          <button
            onClick={() => setShowTrainer((s) => !s)}
            className="text-sea-deep hover:underline"
          >
            {showTrainer ? "hide" : "✍️ teach me your voice"}
          </button>
        </div>

        {showTrainer && (
          <Card className="mb-2">
            <p className="text-xs text-ink-soft mb-2">
              Add real examples of how <strong>you</strong> text. The AI uses these to
              sound more like you — the more you add, the better.
            </p>
            <div className="flex gap-2">
              <input
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && sample.trim()) {
                    addSample({ text: sample.trim() });
                    setSample("");
                  }
                }}
                placeholder="e.g. haha you're such a goofball, get back here"
                className="flex-1 rounded-full border border-rose-2 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sea"
              />
              <button
                onClick={() => {
                  if (sample.trim()) {
                    addSample({ text: sample.trim() });
                    setSample("");
                  }
                }}
                className="btn btn-sea text-sm"
              >
                Add
              </button>
            </div>
            {samples.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {samples.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs bg-sea-mist text-sea-deep rounded-full px-2 py-0.5 flex items-center gap-1"
                  >
                    {s.text.slice(0, 30)}
                    {s.text.length > 30 ? "…" : ""}
                    <button onClick={() => removeSample(s.id)} className="hover:text-love-deep">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-rose-2 px-4 py-3 outline-none focus:ring-2 focus:ring-sea"
          />
          <button onClick={send} className="btn btn-love" disabled={busy || !input.trim()}>
            Send 💌
          </button>
        </div>
      </div>
    </div>
  );
}
