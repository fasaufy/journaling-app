export type Mood = "Great" | "Good" | "Neutral" | "Low" | "Rough";

export const stickerKeys = [
  "wave", "fist", "love", "see", "peace", "star", "camera", "film", "earth", "island", "mountains",
  "great", "good", "neutral", "low", "rough",
] as const;

export type StickerKey = typeof stickerKeys[number];

export const stickerAssets: Record<StickerKey, string> = {
  wave: "/wave.svg",
  fist: "/fist.svg",
  love: "/love.svg",
  see: "/see.svg",
  peace: "/peace.svg",
  star: "/star.svg",
  camera: "/camera.svg",
  film: "/film.svg",
  earth: "/earth.svg",
  island: "/Island.svg",
  mountains: "/Mountains.svg",
  great: "/Great.svg",
  good: "/Good.svg",
  neutral: "/Neutral.svg",
  low: "/Low.svg",
  rough: "/Rough.svg",
};

export type PlacedSticker = {
  id: string;
  key: StickerKey;
  x: number;
  y: number;
  rotation: number;
  color?: string;
};

export const stickerColors = [
  { key: "blue", value: "#0d6efd" },
  { key: "red", value: "#fd354c" },
  { key: "orange", value: "#ff6025" },
  { key: "green", value: "#01b055" },
  { key: "pink", value: "#fd3596" },
  { key: "lime", value: "#a6cf3e" },
  { key: "black", value: "#131313" },
] as const;

export type Entry = {
  id: string;
  date: string;
  mood: Mood;
  tags: string[];
  preview: string;
  body: string[];
  stickers?: PlacedSticker[];
};

export const initialEntries: Entry[] = [
  { id: "sep-07", date: "Monday, September 7, 2026", mood: "Low", tags: ["work", "family"], preview: "Long day at work, but dinner with Sara helped", body: ["The day was full from the first meeting to the last message, but dinner with Sara made everything feel lighter.", "We talked about the little things and made plans for the weekend."] },
  { id: "sep-06", date: "Sunday, September 6, 2026", mood: "Good", tags: ["travel", "lisbon"], preview: "Started the trip to Lisbon today", body: ["The first day of the trip felt quiet and unfamiliar in a good way. I spent the afternoon wandering without a plan.", "Tomorrow I want to find the market everyone keeps recommending."] },
  { id: "sep-04", date: "Friday, September 4, 2026", mood: "Low", tags: ["work"], preview: "Feeling stuck on the project again", body: ["I kept circling the same problem today. It is frustrating to feel so close and still not see the way through.", "A walk after lunch helped me reset."] },
  { id: "sep-02", date: "Wednesday, September 2, 2026", mood: "Neutral", tags: ["health"], preview: "A quiet day to reset and take things slowly", body: ["I woke up with a heavy feeling and gave myself permission to move slowly.", "Small rituals are becoming the best part of my week."] },
];

export const entriesStorageKey = "daybuk-entries";

export function readEntries() {
  if (typeof window === "undefined") return initialEntries;
  const stored = window.localStorage.getItem(entriesStorageKey);
  if (!stored) return initialEntries;
  try {
    const parsed = JSON.parse(stored) as Entry[];
    if (!Array.isArray(parsed)) return initialEntries;
    return parsed;
  } catch {
    return initialEntries;
  }
}

export function writeEntries(entries: Entry[]) {
  window.localStorage.setItem(entriesStorageKey, JSON.stringify(entries));
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function entryDateKey(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : dateKey(parsed);
}
