import { PEOPLE } from "../lib/config";
import { setIdentity, useIdentity } from "../lib/identity";

/** One-time "who are you?" picker. Blocks the app until chosen. */
export default function IdentityPicker() {
  const identity = useIdentity();
  if (identity) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-love-deep/30 backdrop-blur-sm p-6">
      <div className="card p-8 text-center max-w-md animate-pop">
        <div className="text-5xl mb-2">💞</div>
        <h2 className="text-2xl text-love-deep mb-4">Who's visiting?</h2>
        <div className="grid grid-cols-2 gap-4">
          {PEOPLE.map((p) => (
            <button
              key={p.key}
              onClick={() => setIdentity(p.key)}
              className="card p-6 hover:scale-[1.03] transition border-2 border-transparent hover:border-sea"
            >
              <div className="text-4xl mb-2">{p.emoji}</div>
              <div className="font-bold text-ink">{p.label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-soft mt-5">
          You can switch anytime from the sidebar.
        </p>
      </div>
    </div>
  );
}
