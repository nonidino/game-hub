import { supabase, hasSupabase } from "../../lib/supabase";
import type { RoomData } from "./types";

export interface RoomBackend<S> {
  /** Load current data (or null if room doesn't exist yet). */
  load(): Promise<RoomData<S> | null>;
  /** Persist data. */
  save(data: RoomData<S>): Promise<void>;
  /** Subscribe to remote changes; returns an unsubscribe fn. */
  subscribe(cb: (data: RoomData<S>) => void): () => void;
}

/* ----------------------- localStorage / BroadcastChannel ----------------------- */
class LocalBackend<S> implements RoomBackend<S> {
  private key: string;
  private channel: BroadcastChannel;
  constructor(gameType: string, code: string) {
    this.key = `aaryahub.room.${gameType}.${code.toUpperCase()}`;
    this.channel = new BroadcastChannel("aaryahub-room");
  }
  async load(): Promise<RoomData<S> | null> {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as RoomData<S>) : null;
    } catch {
      return null;
    }
  }
  async save(data: RoomData<S>): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(data));
    this.channel.postMessage(this.key);
  }
  subscribe(cb: (data: RoomData<S>) => void): () => void {
    const onStorage = (e: StorageEvent) => {
      if (e.key === this.key && e.newValue) cb(JSON.parse(e.newValue));
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data === this.key) this.load().then((d) => d && cb(d));
    };
    window.addEventListener("storage", onStorage);
    this.channel.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("storage", onStorage);
      this.channel.removeEventListener("message", onMsg);
      this.channel.close();
    };
  }
}

/* ----------------------------- Supabase backend ----------------------------- */
class SupabaseBackend<S> implements RoomBackend<S> {
  private gameType: string;
  private code: string;
  private rowId: string | null = null;
  constructor(gameType: string, code: string) {
    this.gameType = gameType;
    this.code = code.toUpperCase();
  }
  private async ensureRow(): Promise<string> {
    if (this.rowId) return this.rowId;
    const { data: existing } = await supabase!
      .from("rooms")
      .select("id")
      .eq("code", this.code)
      .eq("game_type", this.gameType)
      .maybeSingle();
    if (existing) {
      this.rowId = existing.id as string;
      return this.rowId;
    }
    const { data: created } = await supabase!
      .from("rooms")
      .insert({ code: this.code, game_type: this.gameType, state: {} } as never)
      .select("id")
      .single();
    this.rowId = created!.id as string;
    return this.rowId;
  }
  async load(): Promise<RoomData<S> | null> {
    await this.ensureRow();
    const { data } = await supabase!
      .from("rooms")
      .select("state")
      .eq("id", this.rowId!)
      .single();
    const state = data?.state as RoomData<S> | Record<string, never> | undefined;
    if (!state || !("game" in state)) return null;
    return state as RoomData<S>;
  }
  async save(data: RoomData<S>): Promise<void> {
    const id = await this.ensureRow();
    await supabase!
      .from("rooms")
      .update({ state: data, updated_at: new Date().toISOString() } as never)
      .eq("id", id);
  }
  subscribe(cb: (data: RoomData<S>) => void): () => void {
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    this.ensureRow().then((id) => {
      channel = supabase!
        .channel(`room:${this.gameType}:${this.code}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${id}` },
          (payload) => {
            const state = (payload.new as { state?: RoomData<S> }).state;
            if (state && "game" in state) cb(state);
          }
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase!.removeChannel(channel);
    };
  }
}

export function makeBackend<S>(gameType: string, code: string): RoomBackend<S> {
  return hasSupabase
    ? new SupabaseBackend<S>(gameType, code)
    : new LocalBackend<S>(gameType, code);
}
