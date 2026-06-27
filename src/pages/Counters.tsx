import { useNow } from "../lib/useNow";
import {
  togetherBreakdown,
  completedMontheversaries,
  yearsMonthsLabel,
  nextMontheversaryDate,
  isMontheversaryToday,
  countdownTo,
} from "../lib/relationship";
import { ordinal, pad2 } from "../lib/format";
import { RELATIONSHIP_START } from "../lib/config";
import { PageHeader, Card } from "../components/ui";

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-2">
      <div className="font-[Quicksand] font-bold text-3xl md:text-5xl text-love-deep tabular-nums">
        {pad2(value)}
      </div>
      <div className="text-[10px] md:text-xs uppercase tracking-wider text-ink-soft mt-1">
        {label}
      </div>
    </div>
  );
}

export default function Counters() {
  const now = useNow(1000);
  const t = togetherBreakdown(now);

  const completed = completedMontheversaries(now);
  const next = nextMontheversaryDate(now);
  const nextNumber = completed + 1;
  const cd = countdownTo(next, now);
  const today = isMontheversaryToday(now);

  const startLabel = RELATIONSHIP_START.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        emoji="⏱️"
        title="Our Forever Counter"
        subtitle={`Since midnight, ${startLabel}`}
      />

      {/* Live together time */}
      <Card className="mb-6 text-center">
        <div className="text-sm text-ink-soft mb-3">We've been together for</div>
        <div className="flex items-center justify-center gap-1 md:gap-3 flex-wrap">
          <Unit value={t.years} label="years" />
          <span className="text-2xl text-rose-2">·</span>
          <Unit value={t.months} label="months" />
          <span className="text-2xl text-rose-2">·</span>
          <Unit value={t.days} label="days" />
          <span className="text-2xl text-rose-2">·</span>
          <Unit value={t.hours} label="hours" />
          <span className="text-2xl text-rose-2">·</span>
          <Unit value={t.minutes} label="mins" />
          <span className="text-2xl text-rose-2">·</span>
          <Unit value={t.seconds} label="secs" />
        </div>
        <div className="mt-4 text-sm text-sea-deep font-semibold">
          that's {t.totalDays.toLocaleString()} days ·{" "}
          {t.totalHours.toLocaleString()} hours ·{" "}
          {t.totalSeconds.toLocaleString()} heartbeats of togetherness 💗
        </div>
      </Card>

      {/* Montheversary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="text-center">
          <div className="text-sm text-ink-soft mb-1">Right now we're at our</div>
          <div className="text-4xl md:text-5xl font-[Quicksand] font-bold text-sea-deep">
            {ordinal(completed)}
          </div>
          <div className="text-lg text-ink mt-1">montheversary 🥳</div>
          <div className="text-sm text-ink-soft mt-2">
            {yearsMonthsLabel(completed)} together
          </div>
        </Card>

        <Card className="text-center">
          {today ? (
            <div className="py-2">
              <div className="text-4xl mb-2">🎉💝🎉</div>
              <div className="text-xl font-bold text-love-deep">
                Happy {ordinal(completed)} montheversary!
              </div>
              <div className="text-sm text-ink-soft mt-1">
                It's the 15th — today is the day. I love you.
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-ink-soft mb-1">
                Counting down to our {ordinal(nextNumber)} montheversary
              </div>
              <div className="flex items-center justify-center gap-2 md:gap-3 mt-2">
                <Unit value={cd.days} label="days" />
                <span className="text-xl text-rose-2">:</span>
                <Unit value={cd.hours} label="hrs" />
                <span className="text-xl text-rose-2">:</span>
                <Unit value={cd.minutes} label="min" />
                <span className="text-xl text-rose-2">:</span>
                <Unit value={cd.seconds} label="sec" />
              </div>
              <div className="text-sm text-sea-deep mt-3">
                on{" "}
                {next.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
