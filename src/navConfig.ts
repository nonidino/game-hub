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
      { label: "Draw a Heart", path: "/games/heart", emoji: "❤️" },
      { label: "Phrase Chain", path: "/games/phrase", emoji: "🔗" },
    ],
  },
  { label: "Date Ideas", path: "/dates", emoji: "✨" },
  { label: "Movies", path: "/romcom", emoji: "🎬" },
];
