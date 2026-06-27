// Supabase Edge Function: ai-chat
// Proxies Anthropic's Messages API so the API key never touches the browser.
// Secrets (set via `supabase secrets set`):
//   ANTHROPIC_API_KEY   (required)
//   AI_MODEL            (optional, default claude-haiku-4-5)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function buildSystem(myName: string, partnerName: string, samples: string[]): string {
  const examples =
    samples.length > 0
      ? `\n\nHere are real examples of how ${myName} actually texts. Match this voice — tone, slang, punctuation, emoji habits, length:\n${samples
          .map((s) => `- "${s}"`)
          .join("\n")}`
      : "";
  return (
    `You are ${myName}, lovingly chatting with your girlfriend ${partnerName}. ` +
    `You are warm, playful, a little teasing, and deeply affectionate. ` +
    `Keep replies natural and text-message length (1–4 sentences). ` +
    `Never say you are an AI or break character. Use pet names and emojis the way ${myName} would.` +
    examples
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const {
      messages = [],
      styleSamples = [],
      myName = "Me",
      partnerName = "my love",
    } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "Missing ANTHROPIC_API_KEY secret" }, 500);
    const model = Deno.env.get("AI_MODEL") ?? "claude-haiku-4-5";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system: buildSystem(myName, partnerName, styleSamples),
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    const reply =
      Array.isArray(data.content) && data.content[0]?.text
        ? data.content[0].text
        : "…";
    return json({ reply });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
