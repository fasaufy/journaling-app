"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type Mood = "Great" | "Good" | "Neutral" | "Low" | "Rough";
type Entry = { id: string; date: string; mood: Mood; tags: string[]; preview: string; body: string[] };

const moodIcons: Record<Mood, string> = { Great: "/Great.svg", Good: "/Good.svg", Neutral: "/Neutral.svg", Low: "/Low.svg", Rough: "/Rough.svg" };
const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "search", href: "/search", icon: "/search-default.svg", activeIcon: "/search-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];
const moodOptions: Mood[] = ["Great", "Good", "Neutral", "Low", "Rough"];
const entries: Entry[] = [
  { id: "sep-07", date: "Monday, September 7, 2026", mood: "Low", tags: ["work", "family"], preview: "Long day at work, but dinner with Sara helped", body: ["The day was full from the first meeting to the last message, but dinner with Sara made everything feel lighter.", "We talked about the little things and made plans for the weekend."] },
  { id: "sep-06", date: "Sunday, September 6, 2026", mood: "Good", tags: ["travel", "lisbon"], preview: "Started the trip to Lisbon today", body: ["The first day of the trip felt quiet and unfamiliar in a good way. I spent the afternoon wandering without a plan.", "Tomorrow I want to find the market everyone keeps recommending."] },
  { id: "sep-04", date: "Friday, September 4, 2026", mood: "Low", tags: ["work"], preview: "Feeling stuck on the project again", body: ["I kept circling the same problem today. It is frustrating to feel so close and still not see the way through.", "A walk after lunch helped me reset."] },
  { id: "sep-02", date: "Wednesday, September 2, 2026", mood: "Neutral", tags: ["health"], preview: "A quiet day to reset and take things slowly", body: ["I woke up with a heavy feeling and gave myself permission to move slowly.", "Small rituals are becoming the best part of my week."] },
];

const formatNewEntryDate = () => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
const formatDateKey = (key: string | null) => {
  if (!key) return formatNewEntryDate();
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? formatNewEntryDate() : new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
};
const entryDateKey = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};
const countWords = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

function Sidebar() {
  const router = useRouter();
  return <aside className="calendar-sidebar"><a className="calendar-logo" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a><button className="calendar-new-entry" onClick={() => router.push("/home?new=1")}><img src="/add.svg" alt="" /><span>new entry</span></button><nav className="calendar-sidebar-nav" aria-label="Main navigation">{navItems.map((item) => <a className={item.label === "home" ? "active" : ""} href={item.href} key={item.label}><img src={item.label === "home" ? item.activeIcon : item.icon} alt="" /><span>{item.label}</span></a>)}</nav><div className="calendar-streak">🔥 12 day streak</div></aside>;
}

function MobileNavigation() {
  return <nav className="calendar-mobile-nav" aria-label="Mobile navigation">{[navItems[0], navItems[1], { label: "new entry", href: "/home?new=1", icon: "/add.svg", activeIcon: "/add.svg" }, navItems[2], navItems[3]].map((item) => <a className={item.label === "home" ? "active" : item.label === "new entry" ? "add" : ""} href={item.href} key={item.label}><img src={item.label === "home" ? item.activeIcon : item.icon} alt={item.label} /></a>)}</nav>;
}

function SearchField({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return <div className="home-search"><img src="/search-default.svg" alt="" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entries" aria-label="Search entries" /></div>;
}

function EntryCard({ entry, selected, onSelect }: { entry: Entry; selected: boolean; onSelect: () => void }) {
  const card = <div className="home-entry-card-content"><time>{entry.date}</time><div className="home-entry-meta"><img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} /><strong>{entry.mood}</strong><div className="home-entry-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="home-entry-preview">{entry.preview}</div></div>;
  return <button className={`home-entry-card${selected ? " selected" : ""}`} onClick={onSelect}>{card}</button>;
}

function DetailPanel({ entry, onDelete, onEdit }: { entry: Entry; onDelete: () => void; onEdit: () => void }) {
  return <article className="home-detail-panel"><header className="home-detail-header"><div><h2>{entry.date}</h2><div className="home-detail-meta"><img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} /><strong>{entry.mood}</strong><span className="home-detail-divider" />{entry.tags.map((tag) => <span className="home-tag-chip" key={tag}>{tag}</span>)}</div></div><div className="home-detail-actions"><button className="calendar-glass-button" onClick={onEdit} aria-label="Edit entry"><img src="/edit.svg" alt="" /></button><button className="calendar-glass-button" onClick={onDelete} aria-label="Delete entry"><img src="/delete.svg" alt="" /></button></div></header><div className="home-detail-body">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article>;
}

function MobileDetail({ entry, onBack, onDelete, onEdit }: { entry: Entry; onBack: () => void; onDelete: () => void; onEdit: () => void }) {
  return <motion.article initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }} className="home-mobile-detail"><header className="home-mobile-detail-top"><button onClick={onBack} aria-label="Back to all entries"><img src="/arrow-left.svg" alt="" /></button><span>All entries</span><button onClick={onDelete} aria-label="Delete entry"><img src="/delete.svg" alt="" /></button></header><div className="home-mobile-detail-heading"><h2>{entry.date}</h2><div className="home-detail-meta"><img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} /><strong>{entry.mood}</strong><span className="home-detail-divider" />{entry.tags.map((tag) => <span className="home-tag-chip" key={tag}>{tag}</span>)}</div></div><div className="home-detail-body">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><button className="primary-button home-edit-note" onClick={onEdit}><img src="/edit.svg" alt="" /><span>Edit note</span></button></motion.article>;
}

function EditorToolbar({ onAction }: { onAction: (action: "bold" | "italic" | "underline" | "bullet" | "numbered" | "quote") => void }) {
  return <div className="entry-editor-toolbar" role="toolbar" aria-label="Formatting toolbar"><button type="button" className="entry-editor-tool" onClick={() => onAction("bold")} aria-label="Bold">B</button><button type="button" className="entry-editor-tool" onClick={() => onAction("italic")} aria-label="Italic"><em>I</em></button><button type="button" className="entry-editor-tool" onClick={() => onAction("underline")} aria-label="Underline"><span className="underline-text">U</span></button><span className="entry-editor-toolbar-divider" aria-hidden="true" /><button type="button" className="entry-editor-tool" onClick={() => onAction("bullet")} aria-label="Bullet list">•</button><button type="button" className="entry-editor-tool" onClick={() => onAction("numbered")} aria-label="Numbered list">1.</button><button type="button" className="entry-editor-tool" onClick={() => onAction("quote")} aria-label="Block quote">❝</button></div>;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(entries[0].id);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [draftDate, setDraftDate] = useState(formatNewEntryDate());
  const [draftBody, setDraftBody] = useState("");
  const [draftMood, setDraftMood] = useState<Mood | null>(null);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saveState, setSaveState] = useState("Saved");
  const [hasEdited, setHasEdited] = useState(false);

  const routeMode = searchParams.get("new") === "1" ? "new" : searchParams.get("edit") ? "edit" : null;
  const selectedDate = searchParams.get("date");
  const directEntry = entries.find((entry) => entryDateKey(entry.date) === selectedDate);
  const isDirectEntry = Boolean(directEntry && !routeMode);
  const isEditorOpen = Boolean(routeMode);
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries.find((entry) => entryDateKey(entry.date) === selectedDate) ?? entries[0];
  const visibleEntries = useMemo(() => entries.filter((entry) => `${entry.date} ${entry.preview} ${entry.body.join(" ")} ${entry.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    if (routeMode === "new") {
      setDraftDate(formatDateKey(selectedDate));
      setDraftBody("");
      setDraftMood(null);
      setDraftTags([]);
      setTagInput("");
      setSaveState("Saved");
      setHasEdited(false);
      return;
    }

    if (routeMode === "edit") {
      const entry = entries.find((item) => item.id === searchParams.get("edit"));
      if (!entry) return;
      setDraftDate(entry.date);
      setDraftBody(entry.body.join("\n\n"));
      setDraftMood(entry.mood);
      setDraftTags(entry.tags);
      setTagInput("");
      setSaveState("Saved");
      setHasEdited(false);
    }
  }, [routeMode, searchParams, selectedDate]);

  useEffect(() => {
    if (routeMode) return;
    const entry = entries.find((item) => entryDateKey(item.date) === selectedDate);
    if (entry) setSelectedId(entry.id);
    setMobileDetail(Boolean(entry));
  }, [routeMode, selectedDate]);

  useEffect(() => {
    if (!routeMode || !hasEdited) return;
    const timer = window.setTimeout(() => {
      setSaveState("Saved");
    }, 700);
    setSaveState("saving…");
    return () => window.clearTimeout(timer);
  }, [draftBody, draftDate, draftMood, draftTags, hasEdited, routeMode]);

  useEffect(() => {
    if (routeMode && editorRef.current) {
      editorRef.current.focus();
      const length = editorRef.current.value.length;
      editorRef.current.setSelectionRange(length, length);
    }
  }, [routeMode]);

  const deleteEntry = () => {
    if (!selected) return;
    if (window.confirm(`Delete the entry from ${selected.date}?`)) {
      setMobileDetail(false);
      router.push("/home");
    }
  };

  const handleToolbarAction = (action: "bold" | "italic" | "underline" | "bullet" | "numbered" | "quote") => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draftBody.slice(start, end) || "text";
    setHasEdited(true);

    let replacement = selectedText;
    if (action === "bold") replacement = `**${selectedText}**`;
    if (action === "italic") replacement = `*${selectedText}*`;
    if (action === "underline") replacement = `<u>${selectedText}</u>`;
    if (action === "bullet") replacement = `\n- ${selectedText}`;
    if (action === "numbered") replacement = `\n1. ${selectedText}`;
    if (action === "quote") replacement = `\n> ${selectedText}`;

    const nextValue = `${draftBody.slice(0, start)}${replacement}${draftBody.slice(end)}`;
    setDraftBody(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + replacement.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag || draftTags.length >= 5) return;
    setDraftTags((current) => [...current, nextTag]);
    setTagInput("");
    setHasEdited(true);
  };

  const removeTag = (tag: string) => {
    setDraftTags((current) => current.filter((item) => item !== tag));
    setHasEdited(true);
  };

  const editorWordCount = countWords(draftBody);

  return (
    <main className={`home-page${isDirectEntry ? " direct-entry-page" : ""}${isEditorOpen ? " editor-open-page" : ""}`}>
      <Sidebar />
      <section className={`home-list-panel${isDirectEntry ? " direct-entry-list" : ""}${isEditorOpen ? " editor-open-list" : ""}`}>
        <div className="home-list-inner">
          <SearchField query={query} setQuery={setQuery} />
          <div className="home-entry-list home-entry-list-desktop">{visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} selected={entry.id === selectedId} onSelect={() => setSelectedId(entry.id)} />)}</div>
          <div className="home-entry-list home-entry-list-mobile">{!mobileDetail && visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} selected={entry.id === selectedId} onSelect={() => { setSelectedId(entry.id); setMobileDetail(true); }} />)}</div>
        </div>
        <div className="scroll-bottom-fade" aria-hidden="true" />
      </section>

      <section className={`home-desktop-detail${isDirectEntry ? " direct-entry-detail" : ""}`}>
        {!routeMode ? (
          <DetailPanel entry={selected} onDelete={deleteEntry} onEdit={() => router.push(`/home?edit=${selected.id}`)} />
        ) : (
          <div className="entry-editor-screen entry-editor-desktop">
            <div className="entry-editor-topbar">
              <button type="button" className="entry-editor-close" onClick={() => router.push("/home")}>
                <img src="/Close.svg" alt="" />
                <span>Close</span>
              </button>
              <div className="entry-editor-status mono">{saveState}</div>
              <button type="button" className="entry-editor-delete" onClick={() => {
                if (window.confirm("Delete this entry?")) router.push("/home");
              }}>
                <img src="/delete.svg" alt="" />
                <span>Delete</span>
              </button>
            </div>

            <div className="entry-editor-shell">
              <header className="entry-editor-header">
                <input
                  aria-label="Entry date"
                  className="entry-editor-title"
                  value={draftDate}
                  onChange={(event) => {
                    setDraftDate(event.target.value);
                    setHasEdited(true);
                  }}
                />
              </header>

              <EditorToolbar onAction={handleToolbarAction} />

              <div className="entry-editor-surface-wrap">
                <textarea
                  ref={editorRef}
                  className="entry-editor-surface"
                  value={draftBody}
                  placeholder="What's on your mind today?"
                  onChange={(event) => {
                    setDraftBody(event.target.value);
                    setHasEdited(true);
                  }}
                  aria-label="Write your entry"
                />
                <div className="entry-editor-wordcount mono">{editorWordCount} words</div>
              </div>

              <div className="entry-editor-divider" aria-hidden="true" />

              <div className="entry-editor-meta-row">
                <div className="entry-editor-moods" aria-label="Mood selector">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      className={`entry-editor-mood${draftMood === mood ? " selected" : ""}`}
                      onClick={() => {
                      setDraftMood((current) => current === mood ? null : mood);
                      setHasEdited(true);
                    }}
                    >
                      <img src={moodIcons[mood]} alt="" />
                      <span>{mood}</span>
                    </button>
                  ))}
                </div>

                <div className="entry-editor-tags">
                  {draftTags.map((tag) => (
                    <span key={tag} className="entry-editor-tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                        ×
                      </button>
                    </span>
                  ))}

                  <div className="entry-editor-tag-input-wrap">
                    <input
                      aria-label="Add a tag"
                      value={tagInput}
                      placeholder="Add a tag"
                      maxLength={18}
                      onChange={(event) => {
                      setTagInput(event.target.value);
                      setHasEdited(true);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <button type="button" className="entry-editor-tag-add" onClick={addTag} aria-label="Add tag"><img src="/add.svg" alt="" /></button>
                  </div>
                  <span className="entry-editor-tag-counter mono">{draftTags.length} of 5</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="home-mobile-layer">
        <AnimatePresence mode="wait">{mobileDetail && <MobileDetail key={selected.id} entry={selected} onBack={() => setMobileDetail(false)} onDelete={deleteEntry} onEdit={() => router.push(`/home?edit=${selected.id}`)} />}</AnimatePresence>
      </div>

      <MobileNavigation />

      {routeMode && (
        <div className="entry-editor-screen entry-editor-mobile">
          <div className="entry-editor-topbar">
            <button type="button" className="entry-editor-close" onClick={() => router.push("/home")}>
              <img src="/Close.svg" alt="" />
              <span>Close</span>
            </button>
            <div className="entry-editor-status mono">{saveState}</div>
            <button type="button" className="entry-editor-delete" onClick={() => {
              if (window.confirm("Delete this entry?")) router.push("/home");
            }}>
              <img src="/delete.svg" alt="" />
              <span>Delete</span>
            </button>
          </div>

          <div className="entry-editor-shell">
            <header className="entry-editor-header">
              <input
                aria-label="Entry date"
                className="entry-editor-title"
                value={draftDate}
                onChange={(event) => {
                  setDraftDate(event.target.value);
                  setHasEdited(true);
                }}
              />
            </header>

            <div className="entry-editor-surface-wrap">
              <div className="entry-editor-wordcount mono">{editorWordCount} words</div>
              <textarea
                ref={editorRef}
                className="entry-editor-surface"
                value={draftBody}
                placeholder="What's on your mind today?"
                onChange={(event) => {
                  setDraftBody(event.target.value);
                  setHasEdited(true);
                }}
                aria-label="Write your entry"
              />
            </div>

            <EditorToolbar onAction={handleToolbarAction} />

            <div className="entry-editor-divider" aria-hidden="true" />

            <div className="entry-editor-meta-row">
              <div className="entry-editor-moods" aria-label="Mood selector">
                {moodOptions.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    className={`entry-editor-mood${draftMood === mood ? " selected" : ""}`}
                    onClick={() => {
                      setDraftMood((current) => current === mood ? null : mood);
                      setHasEdited(true);
                    }}
                  >
                    <img src={moodIcons[mood]} alt="" />
                    <span>{mood}</span>
                  </button>
                ))}
              </div>

              <div className="entry-editor-tags">
                {draftTags.map((tag) => (
                  <span key={tag} className="entry-editor-tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                      ×
                    </button>
                  </span>
                ))}

                <div className="entry-editor-tag-input-wrap">
                  <input
                    aria-label="Add a tag"
                    value={tagInput}
                    placeholder="Add a tag"
                    maxLength={18}
                    onChange={(event) => {
                      setTagInput(event.target.value);
                      setHasEdited(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button type="button" className="entry-editor-tag-add" onClick={addTag} aria-label="Add tag"><img src="/add.svg" alt="" /></button>
                </div>
                <span className="entry-editor-tag-counter mono">{draftTags.length} of 5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="home-page"><div className="home-placeholder">Loading…</div></main>}>
      <HomePageContent />
    </Suspense>
  );
}