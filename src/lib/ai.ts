import { functionsBase, anonKey, hasSupabase } from "./supabase";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export const aiConfigured = hasSupabase && Boolean(functionsBase);

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
}

export async function callAiChat(
  messages: ChatMsg[],
  opts: { styleSamples: string[]; myName: string; partnerName: string }
): Promise<string> {
  if (!aiConfigured) throw new Error("AI backend not configured");
  const res = await fetch(`${functionsBase}/ai-chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ messages, ...opts }),
  });
  if (!res.ok) throw new Error(`ai-chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.reply as string;
}

/** Returns an object URL for the spoken audio (remember to revoke it). */
export async function callAiTts(text: string): Promise<string> {
  if (!aiConfigured) throw new Error("AI backend not configured");
  const res = await fetch(`${functionsBase}/ai-tts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`ai-tts ${res.status}: ${await res.text()}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
