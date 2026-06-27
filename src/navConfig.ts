export interface NavItem {
  label: string;
  path: string;
  emoji: string;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  { label: "Home", path: "/", emoji: "🏠" },
  {
    label: "Calendar",
    path: "/calendar",
    emoji: "📅",
    children: [
      { label: "Our Counter", path: "/calendar", emoji: "⏱️" },
      { label: "Important Dates", path: "/calendar/dates", emoji: "🎂" },
    ],
  },
  {
    label: "Games",
    path: "/games",
    emoji: "🎮",
    children: [
      { label: "Lobby", path: "/games", emoji: "🛋️" },
      { label: "Battleship", path: "/games/battleship", emoji: "🚢" },
      { label: "Connect 4", path: "/games/connect4", emoji: "🔴" },
      { label: "Snakes & Ladders", path: "/games/snakes", emoji: "🐍" },
      { label: "Ludo", path: "/games/ludo", emoji: "🎲" },
      { label: "Draw a Heart", path: "/games/heart", emoji: "❤️" },
      { label: "Phrase Chain", path: "/games/phrase", emoji: "🔗" },
    ],
  },
  { label: "Love Notes", path: "/notes", emoji: "💌" },
  { label: "Memory Timeline", path: "/timeline", emoji: "📸" },
  { label: "Date Ideas", path: "/dates", emoji: "✨" },
  { label: "Reasons I Love You", path: "/reasons", emoji: "🫶" },
  { label: "Rom-Com Club", path: "/romcom", emoji: "🍿" },
  { label: "Chat with AI-Me", path: "/chat", emoji: "🤖" },
];
