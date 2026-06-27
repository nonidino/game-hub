import { Link } from "react-router-dom";
import { useNow } from "../lib/useNow";
import {
  togetherBreakdown,
  completedMontheversaries,
  nextMontheversaryDate,
  countdownTo,
  isMontheversaryToday,
} from "../lib/relationship";
import { ordinal } from "../lib/format";
import { useIdentity, personLabel } from "../lib/identity";
import { Card } from "../components/ui";

const QUICK = [
  { to: "/calendar", emoji: "⏱️", label: "Our Counter" },
  { to: "/games", emoji: "🎮", label: "Play a Game" },
  { to: "/dates", emoji: "✨", label: "Date Ideas" },
  { to: "/romcom", emoji: "🎬", label: "Movies" },
];

export default function Home() {
  const now = useNow(1000);
  const identity = useIdentity();
  const t = togetherBreakdown(now);
  const completed = completedMontheversaries(now);
  const next = nextMontheversaryDate(now);
  const cd = countdownTo(next, now);
  const today = isMontheversaryToday(now);

  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Hey there" : "Good evening";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl md:text-5xl text-love-deep">
          {greeting}{identity ? `, ${personLabel(identity)}` : ""} 💖
        </h1>
      </div>

      {/* Hero counter */}
      <Card className="mb-6 text-center bg-gradient-to-br from-white/80 to-rose/40">
        <div className="text-sm text-ink-soft">Together for</div>
        <div className="font-[Quicksand] font-bold text-2xl md:text-4xl text-love-deep mt-1">
          {t.years}y · {t.months}m · {t.days}d ·{" "}
          <span className="tabular-nums">
            {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:
            {String(t.seconds).padStart(2, "0")}
          </span>
        </div>
      </Card>

      {/* Montheversary */}
      <Card className="mb-6 text-center">
        {today ? (
          <>
            <div className="text-3xl mb-1">🎉</div>
            <div className="font-bold text-love-deep text-lg">
              Happy {ordinal(completed)} montheversary!
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-ink-soft">
              Next montheversary (our {ordinal(completed + 1)}) in
            </div>
            <div className="font-[Quicksand] font-bold text-2xl text-sea-deep mt-1 tabular-nums">
              {cd.days}d {String(cd.hours).padStart(2, "0")}h{" "}
              {String(cd.minutes).padStart(2, "0")}m {String(cd.seconds).padStart(2, "0")}s
            </div>
          </>
        )}
        <Link to="/calendar" className="text-xs text-sea-deep hover:underline mt-2 inline-block">
          see the full counter →
        </Link>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="card p-4 text-center hover:scale-[1.04] transition"
          >
            <div className="text-2xl">{q.emoji}</div>
            <div className="text-xs font-semibold mt-1 text-ink">{q.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
