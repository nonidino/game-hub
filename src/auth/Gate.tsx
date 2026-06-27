import { useState, type FormEvent, type ReactNode } from "react";

// SHA-256 of the password. The plaintext is intentionally NOT in the bundle.
// (This is a casual gate, not real security — the repo source is public.)
const PASSWORD_HASH =
  "ceceee554330ac965ea9c292c9280c62778e9d5e849fd6101cdb1af6fd322485";

const STORAGE_KEY = "aaryahub.unlocked";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isUnlocked(): boolean {
  return (
    sessionStorage.getItem(STORAGE_KEY) === "1" ||
    localStorage.getItem(STORAGE_KEY) === "1"
  );
}

export function lock() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

export default function Gate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const hash = await sha256Hex(value);
    if (hash === PASSWORD_HASH) {
      (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <form
        onSubmit={submit}
        className={`card w-full max-w-sm p-8 text-center ${shake ? "animate-[pop_0.3s]" : ""}`}
        style={shake ? { animation: "pop .3s, floatUp 0s" } : undefined}
      >
        <div className="text-5xl mb-2">🎮</div>
        <h1 className="text-2xl text-love-deep mb-1">Game Hub</h1>
        <p className="text-ink-soft text-sm mb-6">
          Enter the password to continue.
        </p>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Our password…"
          className={`w-full rounded-full border px-5 py-3 text-center outline-none transition focus:ring-2 focus:ring-sea ${
            error ? "border-love bg-rose/30" : "border-rose-2"
          }`}
        />
        {error && (
          <p className="text-love-deep text-sm mt-2">
            That's not it 🥺 try again
          </p>
        )}
        <label className="flex items-center justify-center gap-2 text-sm text-ink-soft mt-4 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Keep me logged in on this device
        </label>
        <button type="submit" className="btn btn-love w-full mt-5">
          Enter
        </button>
      </form>
    </div>
  );
}
