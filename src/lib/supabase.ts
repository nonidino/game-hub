import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * The anon key is intentionally public (guarded by RLS). Secret keys for the AI /
 * voice features live ONLY in Supabase Edge Function secrets, never here.
 *
 * When env vars are absent (e.g. a fresh clone), `supabase` is null and the app
 * still runs in a local-only / demo mode so you can build and preview the UI.
 */
export const hasSupabase = Boolean(url && anon);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, anon!, {
      realtime: { params: { eventsPerSecond: 20 } },
    })
  : null;

/** Base URL for invoking edge functions (ai-chat, ai-tts). */
export const functionsBase = url ? `${url}/functions/v1` : "";
export const anonKey = anon ?? "";
