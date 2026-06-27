import { useCallback, useEffect, useState } from "react";
import { supabase, hasSupabase } from "./supabase";

export interface BaseRow {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

const lsKey = (table: string) => `aaryahub.tbl.${table}`;
const lsEvent = (table: string) => `ls-${table}`;

function readLS<T>(table: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(lsKey(table)) || "[]");
  } catch {
    return [];
  }
}
function writeLS<T>(table: string, rows: T[]) {
  localStorage.setItem(lsKey(table), JSON.stringify(rows));
  window.dispatchEvent(new Event(lsEvent(table)));
}

function sortRows<T extends BaseRow>(rows: T[], orderBy: string, asc: boolean): T[] {
  return [...rows].sort((a, b) => {
    const av = a[orderBy] as string | number;
    const bv = b[orderBy] as string | number;
    if (av === bv) return 0;
    const r = av > bv ? 1 : -1;
    return asc ? r : -r;
  });
}

export interface CollectionApi<T extends BaseRow> {
  rows: T[];
  loading: boolean;
  insert: (row: Partial<T>) => Promise<T | null>;
  update: (id: string, patch: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Realtime-ish collection backed by Supabase when configured, else localStorage
 * (cross-tab synced). Same API either way, so feature pages don't care.
 */
export function useCollection<T extends BaseRow>(
  table: string,
  opts?: { orderBy?: string; ascending?: boolean }
): CollectionApi<T> {
  const orderBy = opts?.orderBy ?? "created_at";
  const ascending = opts?.ascending ?? true;
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (hasSupabase && supabase) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .order(orderBy, { ascending });
      setRows((data as T[]) ?? []);
    } else {
      setRows(sortRows(readLS<T>(table), orderBy, ascending));
    }
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => {
    refetch();
    const sb = supabase;
    if (hasSupabase && sb) {
      const ch = sb
        .channel(`tbl:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => refetch()
        )
        .subscribe();
      return () => {
        sb.removeChannel(ch);
      };
    } else {
      const handler = () => refetch();
      window.addEventListener(lsEvent(table), handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener(lsEvent(table), handler);
        window.removeEventListener("storage", handler);
      };
    }
  }, [refetch, table]);

  const insert = useCallback(
    async (row: Partial<T>): Promise<T | null> => {
      if (hasSupabase && supabase) {
        const { data } = await supabase
          .from(table)
          .insert(row as never)
          .select()
          .single();
        return (data as T) ?? null;
      }
      const newRow = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...row,
      } as T;
      const local = readLS<T>(table);
      local.push(newRow);
      writeLS(table, local);
      return newRow;
    },
    [table]
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      if (hasSupabase && supabase) {
        await supabase.from(table).update(patch as never).eq("id", id);
        return;
      }
      const local = readLS<T>(table).map((r) =>
        r.id === id ? { ...r, ...patch } : r
      );
      writeLS(table, local);
    },
    [table]
  );

  const remove = useCallback(
    async (id: string) => {
      if (hasSupabase && supabase) {
        await supabase.from(table).delete().eq("id", id);
        return;
      }
      writeLS(
        table,
        readLS<T>(table).filter((r) => r.id !== id)
      );
    },
    [table]
  );

  return { rows, loading, insert, update, remove, refetch };
}
