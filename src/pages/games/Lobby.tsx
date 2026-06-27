import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui";

const GAMES = [
  { to: "/games/battleship", emoji: "🚢", name: "Battleship", desc: "Aarya's favorite. Sink the fleet.", tone: "from-sea-mist" },
  { to: "/games/connect4", emoji: "🔴", name: "Connect 4", desc: "Four in a row to win.", tone: "from-rose/50" },
  { to: "/games/heart", emoji: "❤️", name: "Draw a Perfect Heart", desc: "Whose heart is more perfect?", tone: "from-rose/50" },
  { to: "/games/phrase", emoji: "🔗", name: "Phrase Chain", desc: "Guess the linked-word chain.", tone: "from-sea-mist" },
];

export default function Lobby() {
  return (
    <div>
      <PageHeader
        emoji="🎮"
        title="Game Room"
        subtitle="Pick a game, share a room code, and play together in real time."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className={`card p-5 hover:scale-[1.03] transition bg-gradient-to-br ${g.tone} to-white/40`}
          >
            <div className="text-4xl mb-2">{g.emoji}</div>
            <div className="text-lg font-bold text-ink">{g.name}</div>
            <div className="text-sm text-ink-soft">{g.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
