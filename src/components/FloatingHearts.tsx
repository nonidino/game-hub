import { useMemo } from "react";

const HEARTS = ["💕", "💖", "💗", "🩵", "💞", "🫶"];

/** Subtle, slow hearts drifting up the background. Pure decoration. */
export default function FloatingHearts({ count = 14 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 14 + Math.random() * 26,
        duration: 16 + Math.random() * 20,
        delay: -Math.random() * 30,
        emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
      })),
    [count]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      {items.map((h) => (
        <span
          key={h.id}
          className="absolute bottom-[-40px]"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animation: `floatUp ${h.duration}s linear ${h.delay}s infinite`,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
