// Supabase Edge Function: ai-tts
// Proxies ElevenLabs text-to-speech so the API key never touches the browser.
// Returns audio/mpeg bytes. Secrets (set via `supabase secrets set`):
//   ELEVENLABS_API_KEY   (required)
//   ELEVENLABS_VOICE_ID  (required — your cloned voice)
//   ELEVENLABS_MODEL     (optional, default eleven_multilingual_v2)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const voiceId = Deno.env.get("ELEVENLABS_VOICE_ID");
    if (!apiKey || !voiceId) {
      return new Response(
        JSON.stringify({ error: "Missing ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
    const modelId = Deno.env.get("ELEVENLABS_MODEL") ?? "eleven_multilingual_v2";

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: { stability: 0.4, similarity_boost: 0.85 },
        }),
      }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ error: await res.text() }), {
        status: res.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: { ...cors, "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
