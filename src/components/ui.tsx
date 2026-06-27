import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl md:text-4xl text-love-deep flex items-center gap-3">
        {emoji && <span>{emoji}</span>}
        {title}
      </h1>
      {subtitle && <p className="text-ink-soft mt-1">{subtitle}</p>}
    </header>
  );
}

export function EmptyState({
  emoji = "🌱",
  children,
}: {
  emoji?: string;
  children: ReactNode;
}) {
  return (
    <div className="text-center text-ink-soft py-10">
      <div className="text-4xl mb-2">{emoji}</div>
      <p>{children}</p>
    </div>
  );
}

export function Pill({
  children,
  tone = "sea",
}: {
  children: ReactNode;
  tone?: "sea" | "love";
}) {
  const cls =
    tone === "love"
      ? "bg-rose text-love-deep"
      : "bg-sea-mist text-sea-deep";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

/** Shown on backend-backed pages when Supabase isn't configured yet. */
export function BackendNotice() {
  return (
    <Card className="border-2 border-dashed border-sea-light bg-sea-mist/50 mb-5">
      <p className="text-sea-deep text-sm">
        <strong>Demo mode.</strong> This page saves to Supabase once you add{" "}
        <code className="bg-white/60 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
        <code className="bg-white/60 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
        For now changes live only in this browser tab.
      </p>
    </Card>
  );
}
