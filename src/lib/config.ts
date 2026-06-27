// Central, easily-editable config for the hub.

// Relationship start: midnight, October 15, 2024 (local time).
export const RELATIONSHIP_START = new Date(2024, 9, 15, 0, 0, 0, 0); // month is 0-indexed => 9 = October

// Montheversaries happen on the 15th of every month.
export const MONTHEVERSARY_DAY = 15;

// The two people. `key` is stored in localStorage; labels are shown in the UI.
export const PEOPLE = [
  { key: "you", label: "Me", emoji: "🧑" },
  { key: "aarya", label: "Aarya", emoji: "👩" },
] as const;

export type PersonKey = (typeof PEOPLE)[number]["key"];

// Names used around the app.
export const PARTNER_NAME = "Aarya";
export const HUB_TITLE = "Us 💖";
