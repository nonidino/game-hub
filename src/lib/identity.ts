import { useEffect, useState } from "react";
import { PEOPLE, type PersonKey } from "./config";

const KEY = "aaryahub.identity";

export function getIdentity(): PersonKey | null {
  const v = localStorage.getItem(KEY);
  if (v === "you" || v === "aarya") return v;
  return null;
}

export function setIdentity(key: PersonKey) {
  localStorage.setItem(KEY, key);
  window.dispatchEvent(new Event("identity-change"));
}

export function clearIdentity() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("identity-change"));
}

export function personLabel(key: PersonKey | null): string {
  return PEOPLE.find((p) => p.key === key)?.label ?? "Someone";
}

export function personEmoji(key: PersonKey | null): string {
  return PEOPLE.find((p) => p.key === key)?.emoji ?? "💗";
}

/** Reactive hook for the current identity. */
export function useIdentity(): PersonKey | null {
  const [id, setId] = useState<PersonKey | null>(() => getIdentity());
  useEffect(() => {
    const handler = () => setId(getIdentity());
    window.addEventListener("identity-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("identity-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return id;
}
