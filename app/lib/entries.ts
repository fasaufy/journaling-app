export type Mood = "Great" | "Good" | "Neutral" | "Low" | "Rough";

export type Entry = {
  id: string;
  date: string;
  mood: Mood;
  tags: string[];
  preview: string;
  body: string[];
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
    return Array.isArray(parsed) ? parsed : initialEntries;
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
