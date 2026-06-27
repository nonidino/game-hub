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
import { useCollection, type BaseRow } from "../lib/store";
import { useIdentity, personLabel } from "../lib/identity";
import { Card } from "../components/ui";

interface Reason extends BaseRow {
  text: string;
}
interface Note extends BaseRow {
  body: string;
  author: string;
}

const QUICK = [
  { to: "/calendar", emoji: "⏱️", label: "Our Counter" },
  { to: "/games", emoji: "🎮", label: "Play a Game" },
  { to: "/notes", emoji: "💌", label: "Love Notes" },
  { to: "/timeline", emoji: "📸", label: "Memories" },
  { to: "/reasons", emoji: "🫶", label: "Reasons" },
  { to: "/chat", emoji: "🤖", label: "Chat with AI-Nauni" },
];

export default function Home() {
  const now = useNow(1000);
  const identity = useIdentity();
  const t = togetherBreakdown(now);
  const completed = completedMontheversaries(now);
  const next = nextMontheversaryDate(now);
  const cd = countdownTo(next, now);
  const today = isMontheversaryToday(now);

  const { rows: reasons } = useCollection<Reason>("love_reasons");
  const { rows: notes } = useCollection<Note>("love_notes", {
    orderBy: "created_at",
    ascending: false,
  });

  const reasonOfNow =
    reasons.length > 0
      ? reasons[Math.floor((now.getTime() / 8000) % reasons.length)]
      : null;

  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Hey there" : "Good evening";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl md:text-5xl text-love-deep">
          {greeting}{identity ? `, ${personLabel(identity)}` : ""} 💖
        </h1>
        <p className="text-ink-soft mt-1">Welcome back to our little universe.</p>
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
        <div className="text-sm text-sea-deep mt-2">
          {t.totalDays.toLocaleString()} days and counting 🥰
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="text-center">
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

        <Card className="text-center flex flex-col justify-center">
          <div className="text-sm text-ink-soft mb-1">A reason I love you</div>
          {reasonOfNow ? (
            <p className="text-lg text-ink font-semibold">"{reasonOfNow.text}"</p>
          ) : (
            <p className="text-ink-soft text-sm">
              Add your first one on the{" "}
              <Link to="/reasons" className="text-sea-deep underline">
                Reasons
              </Link>{" "}
              page 🫶
            </p>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
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

      {/* Latest notes */}
      {notes.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-love-deep">💌 Latest love notes</h2>
            <Link to="/notes" className="text-xs text-sea-deep hover:underline">
              all notes →
            </Link>
          </div>
          <div className="space-y-2">
            {notes.slice(0, 3).map((n) => (
              <div key={n.id} className="text-sm">
                <span className="font-bold text-sea-deep">
                  {personLabel(n.author as "you" | "aarya")}:
                </span>{" "}
                <span className="text-ink">{n.body}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
