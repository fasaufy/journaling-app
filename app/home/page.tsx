"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { entryDateKey, initialEntries, type PlacedSticker, stickerAssets, stickerKeys, type Entry, type Mood, readEntries, type StickerKey, writeEntries } from "../lib/entries";

const moodIcons: Record<Mood, string> = { Great: "/Great.svg", Good: "/Good.svg", Neutral: "/Neutral.svg", Low: "/Low.svg", Rough: "/Rough.svg" };
const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];
const moodOptions: Mood[] = ["Great", "Good", "Neutral", "Low", "Rough"];
type HomeFilter = "all" | "thisMonth" | Mood;
const formatNewEntryDate = () => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
const formatDateKey = (key: string | null) => {
  if (!key) return formatNewEntryDate();
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? formatNewEntryDate() : new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
};
const countWords = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};
const stripHtml = (html: string) => {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent ?? "";
};
const htmlToParagraphs = (html: string) => {
  const normalized = html
    .replace(/<div>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");
  return normalized.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
};
const makeStickerId = () => `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const stickerPositionStyle = (sticker: { x: number; y: number }): CSSProperties => ({
  left: `${sticker.x}%`,
  top: `${sticker.y}%`,
});
const stickerRotationStyle = (sticker: { rotation: number }): CSSProperties => ({
  transform: `rotate(${sticker.rotation}deg)`,
});

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  return <aside className="calendar-sidebar"><a className="calendar-logo" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a><button className="calendar-new-entry" onClick={() => router.push("/home?new=1")}><img src="/add.svg" alt="" /><span>new entry</span></button><nav className="calendar-sidebar-nav" aria-label="Main navigation">{navItems.map((item) => <a className={pathname === item.href ? "active" : ""} href={item.href} key={item.label}><img src={pathname === item.href ? item.activeIcon : item.icon} alt="" /><span>{item.label}</span></a>)}</nav><div className="calendar-streak">🔥 12 day streak</div></aside>;
}

function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="calendar-mobile-nav" aria-label="Mobile navigation">
      <div className="calendar-mobile-segmented">
        {navItems.map((item) => (
          <a className={pathname === item.href ? "active" : ""} href={item.href} key={item.label}>
            <img src={pathname === item.href ? item.activeIcon : item.icon} alt={item.label} />
          </a>
        ))}
      </div>
      <a className="calendar-mobile-add" href="/home?new=1" aria-label="New entry">
        <img src="/add.svg" alt="New entry" />
      </a>
    </nav>
  );
}

function SearchField({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return <div className="home-search"><img src="/search-default.svg" alt="" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entries" aria-label="Search entries" /></div>;
}

function FilterBar({ activeFilter, onChange }: { activeFilter: HomeFilter; onChange: (nextFilter: HomeFilter) => void }) {
  return (
    <div className="home-filter-row" role="toolbar" aria-label="Quick filters">
      <button type="button" className={`home-filter-chip${activeFilter === "all" ? " active" : ""}`} onClick={() => onChange("all")} aria-pressed={activeFilter === "all"}>all entries</button>
      <button type="button" className={`home-filter-chip${activeFilter === "thisMonth" ? " active" : ""}`} onClick={() => onChange("thisMonth")} aria-pressed={activeFilter === "thisMonth"}>this month</button>
      {moodOptions.map((mood) => (
        <button key={mood} type="button" className={`home-filter-chip home-filter-chip-mood${activeFilter === mood ? " active" : ""}`} onClick={() => onChange(mood)} aria-pressed={activeFilter === mood}>
          <img src={moodIcons[mood]} alt="" />
          <span>{mood}</span>
        </button>
      ))}
    </div>
  );
}

function EntryCard({ entry, selected, onSelect }: { entry: Entry; selected: boolean; onSelect: () => void }) {
  const card = <div className="home-entry-card-content"><time>{entry.date}</time><div className="home-entry-meta"><img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} /><strong>{entry.mood}</strong><div className="home-entry-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="home-entry-preview">{entry.preview}</div></div>;
  return <button className={`home-entry-card${selected ? " selected" : ""}`} onClick={onSelect}>{card}</button>;
}

function StickerFrame({ stickerKey, style }: { stickerKey: StickerKey; style?: CSSProperties }) {
  return (
    <div className="entry-sticker-frame" style={style}>
      <span className="entry-sticker-corner entry-sticker-corner-tl" aria-hidden="true" />
      <span className="entry-sticker-corner entry-sticker-corner-tr" aria-hidden="true" />
      <span className="entry-sticker-corner entry-sticker-corner-bl" aria-hidden="true" />
      <span className="entry-sticker-corner entry-sticker-corner-br" aria-hidden="true" />
      <img src={stickerAssets[stickerKey]} alt="" />
    </div>
  );
}

function StickerCanvas({ stickers }: { stickers?: PlacedSticker[] }) {
  if (!stickers || stickers.length === 0) return null;
  return (
    <div className="entry-sticker-canvas" aria-hidden="true">
      {stickers.map((sticker) => (
        <div key={sticker.id} className="entry-sticker-placed" style={stickerPositionStyle(sticker)}>
          <StickerFrame stickerKey={sticker.key} style={stickerRotationStyle(sticker)} />
        </div>
      ))}
    </div>
  );
}

function DetailPanel({ entry, onDelete, onEdit }: { entry: Entry; onDelete: () => void; onEdit: () => void }) {
  return <article className="home-detail-panel"><header className="home-detail-header"><div><h2>{entry.date}</h2><div className="home-detail-meta"><img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} /><strong>{entry.mood}</strong><span className="home-detail-divider" />{entry.tags.map((tag) => <span className="home-tag-chip" key={tag}>{tag}</span>)}</div></div><div className="home-detail-actions"><button className="calendar-glass-button" onClick={onEdit} aria-label="Edit entry"><img src="/edit.svg" alt="" /></button><button className="calendar-glass-button" onClick={onDelete} aria-label="Delete entry"><img src="/delete.svg" alt="" /></button></div></header><div className="home-detail-body">{entry.body.map((paragraph, index) => <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />)}<StickerCanvas stickers={entry.stickers} /></div></article>;
}

function MobileDetail({ entry, onBack, onDelete, onEdit }: { entry: Entry; onBack: () => void; onDelete: () => void; onEdit: () => void }) {
  return <motion.article initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }} className="home-mobile-detail"><header className="home-mobile-detail-top"><button onClick={onBack} aria-label="Back to all entries"><img src="/arrow-left.svg" alt="" /></button><span>All entries</span><button onClick={onDelete} aria-label="Delete entry"><img src="/delete.svg" alt="" /></button></header><div className="home-mobile-detail-heading"><h2>{entry.date}</h2><div className="home-detail-meta"><img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} /><strong>{entry.mood}</strong><span className="home-detail-divider" />{entry.tags.map((tag) => <span className="home-tag-chip" key={tag}>{tag}</span>)}</div></div><div className="home-detail-body">{entry.body.map((paragraph, index) => <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />)}<StickerCanvas stickers={entry.stickers} /></div><button className="primary-button home-edit-note" onClick={onEdit}><img src="/edit.svg" alt="" /><span>Edit note</span></button></motion.article>;
}

function DraggableSticker({
  sticker,
  onChange,
  onRemove,
}: {
  sticker: PlacedSticker;
  onChange: (patch: Partial<PlacedSticker>) => void;
  onRemove: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [live, setLive] = useState<{ x: number; y: number; rotation: number } | null>(null);
  const [dragMode, setDragMode] = useState<"move" | "rotate" | null>(null);
  const current = live ?? sticker;

  function handleMovePointerDown(event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    const container = wrapRef.current?.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDragMode("move");
    let next = { x: sticker.x, y: sticker.y, rotation: sticker.rotation };
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      next = { ...next, x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) };
      setLive(next);
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setDragMode(null);
      setLive(null);
      onChange(next);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handleRotatePointerDown(event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    const frame = frameRef.current;
    if (!frame) return;
    setDragMode("rotate");
    let next = { x: sticker.x, y: sticker.y, rotation: sticker.rotation };
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = (Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * 180) / Math.PI;
      next = { ...next, rotation: Math.round(angle - 45) };
      setLive(next);
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setDragMode(null);
      setLive(null);
      onChange(next);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div
      ref={wrapRef}
      className={`entry-sticker-placed${dragMode ? " dragging" : ""}`}
      style={stickerPositionStyle(current)}
    >
      <div ref={frameRef} className="entry-sticker-frame" style={stickerRotationStyle(current)} onPointerDown={handleMovePointerDown}>
        <span className="entry-sticker-corner entry-sticker-corner-tl" aria-hidden="true" />
        <span className="entry-sticker-corner entry-sticker-corner-tr" aria-hidden="true" />
        <span className="entry-sticker-corner entry-sticker-corner-bl" aria-hidden="true" />
        <span
          className="entry-sticker-corner entry-sticker-corner-br"
          onPointerDown={handleRotatePointerDown}
          role="slider"
          aria-label="Rotate sticker"
          aria-valuenow={current.rotation}
          tabIndex={0}
        />
        <img src={stickerAssets[sticker.key]} alt="" draggable={false} />
      </div>
      <button type="button" className="entry-sticker-remove" onClick={onRemove}>remove</button>
    </div>
  );
}

function EditorToolbar({
  onAction,
  onAddSticker,
  pickerOpen,
  onTogglePicker,
}: {
  onAction: (action: "bold" | "italic" | "underline" | "bullet" | "numbered" | "quote") => void;
  onAddSticker: (key: StickerKey) => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
}) {
  const stopStealingFocus = (event: React.MouseEvent) => event.preventDefault();

  return (
    <div className="entry-editor-toolbar-wrap">
      <div className="entry-editor-toolbar" role="toolbar" aria-label="Formatting toolbar">
        <button type="button" className="entry-editor-tool" onMouseDown={stopStealingFocus} onClick={() => onAction("bold")} aria-label="Bold">B</button>
        <button type="button" className="entry-editor-tool" onMouseDown={stopStealingFocus} onClick={() => onAction("italic")} aria-label="Italic"><em>I</em></button>
        <button type="button" className="entry-editor-tool" onMouseDown={stopStealingFocus} onClick={() => onAction("underline")} aria-label="Underline"><span className="underline-text">U</span></button>
        <span className="entry-editor-toolbar-divider" aria-hidden="true" />
        <button type="button" className="entry-editor-tool" onMouseDown={stopStealingFocus} onClick={() => onAction("bullet")} aria-label="Bullet list">•</button>
        <button type="button" className="entry-editor-tool" onMouseDown={stopStealingFocus} onClick={() => onAction("numbered")} aria-label="Numbered list">1.</button>
        <button type="button" className="entry-editor-tool" onMouseDown={stopStealingFocus} onClick={() => onAction("quote")} aria-label="Block quote">❝</button>
        <span className="entry-editor-toolbar-divider" aria-hidden="true" />
        <button type="button" className="entry-editor-sticker-toggle" onClick={onTogglePicker} aria-pressed={pickerOpen} aria-label="Add a sticker">
          <img src="/Sticker.png" alt="" />
          <span>sticker</span>
        </button>
      </div>

      <AnimatePresence>
        {pickerOpen ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: -6, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: .22, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: -4, scale: .98, transition: { duration: .15, ease: [0.4, 0, 1, 1] } }}
            className="entry-sticker-picker"
          >
            <div className="entry-sticker-picker-header">
              <span>add a sticker</span>
              <button type="button" onClick={onTogglePicker}>close</button>
            </div>
            <div className="entry-sticker-grid">
              {stickerKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="entry-sticker-option"
                  onClick={() => onAddSticker(key)}
                  aria-label={`Add ${key} sticker`}
                >
                  <img src={stickerAssets[key]} alt="" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function EditorSurface({
  editorRef,
  onInput,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onInput: (html: string) => void;
}) {
  return (
    <div
      ref={editorRef}
      className="entry-editor-surface"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Write your entry"
      data-placeholder="What's on your mind today?"
      onInput={(event) => onInput(event.currentTarget.innerHTML)}
    />
  );
}

function EditorMoodsAndTags({
  draftMood,
  setDraftMood,
  draftTags,
  removeTag,
  tagInput,
  setTagInput,
  addTag,
  setHasEdited,
}: {
  draftMood: Mood | null;
  setDraftMood: (mood: Mood | null) => void;
  draftTags: string[];
  removeTag: (tag: string) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: () => void;
  setHasEdited: (value: boolean) => void;
}) {
  return (
    <div className="entry-editor-meta-row">
      <div className="entry-editor-moods" aria-label="Mood selector">
        {moodOptions.map((mood) => (
          <button
            key={mood}
            type="button"
            className={`entry-editor-mood${draftMood === mood ? " selected" : ""}`}
            onClick={() => {
              setDraftMood(draftMood === mood ? null : mood);
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
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const desktopEditorRef = useRef<HTMLDivElement | null>(null);
  const mobileEditorRef = useRef<HTMLDivElement | null>(null);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HomeFilter>("all");
  const [selectedId, setSelectedId] = useState(entries[0].id);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [draftDate, setDraftDate] = useState(formatNewEntryDate());
  const [draftBody, setDraftBody] = useState("");
  const [draftMood, setDraftMood] = useState<Mood | null>(null);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [draftStickers, setDraftStickers] = useState<PlacedSticker[]>([]);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [saveState, setSaveState] = useState("Saved");
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  const routeMode = searchParams.get("new") === "1" ? "new" : searchParams.get("edit") ? "edit" : null;
  const editorEntryPoint = searchParams.get("from") === "calendar" ? "/calendar" : "/home";
  const selectedDate = searchParams.get("date");
  const directEntry = entries.find((entry) => entryDateKey(entry.date) === selectedDate);
  const isDirectEntry = Boolean(directEntry && !routeMode);
  const isEditorOpen = Boolean(routeMode);
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries.find((entry) => entryDateKey(entry.date) === selectedDate) ?? entries[0];
  const visibleEntries = useMemo(() => {
    const now = new Date();
    return entries.filter((entry) => {
      const matchesQuery = `${entry.date} ${entry.preview} ${entry.body.join(" ")} ${entry.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      if (activeFilter === "all") return true;
      if (activeFilter === "thisMonth") {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth();
      }
      return entry.mood === activeFilter;
    });
  }, [activeFilter, entries, query]);

  function syncEditorContent(html: string) {
    if (desktopEditorRef.current) desktopEditorRef.current.innerHTML = html;
    if (mobileEditorRef.current) mobileEditorRef.current.innerHTML = html;
  }

  useEffect(() => {
    if (routeMode === "new") {
      setDraftDate(formatDateKey(selectedDate));
      setDraftBody("");
      setDraftMood(null);
      setDraftTags([]);
      setTagInput("");
      setDraftStickers([]);
      setStickerPickerOpen(false);
      setSaveState("Saved");
      setHasEdited(false);
      syncEditorContent("");
      return;
    }

    if (routeMode === "edit") {
      const entry = entries.find((item) => item.id === searchParams.get("edit"));
      if (!entry) return;
      setDraftDate(entry.date);
      const html = entry.body.map((paragraph) => `<div>${paragraph}</div>`).join("");
      setDraftBody(html);
      setDraftMood(entry.mood);
      setDraftTags(entry.tags);
      setTagInput("");
      setDraftStickers(entry.stickers ?? []);
      setStickerPickerOpen(false);
      setSaveState("Saved");
      setHasEdited(false);
      syncEditorContent(html);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMode, searchParams, selectedDate]);

  useEffect(() => {
    if (routeMode) return;
    const entry = entries.find((item) => entryDateKey(item.date) === selectedDate);
    if (entry) setSelectedId(entry.id);
    setMobileDetail(Boolean(entry));
  }, [routeMode, selectedDate]);

  useEffect(() => {
    if (!routeMode || !hasEdited) return;
    const entryId = searchParams.get("edit") ?? `entry-${entryDateKey(draftDate)}`;
    const plainText = stripHtml(draftBody);
    const nextEntry: Entry = {
      id: entryId,
      date: draftDate,
      mood: draftMood ?? "Neutral",
      tags: draftTags,
      preview: plainText.trim().split(/\s+/).slice(0, 10).join(" ") || "New journal entry",
      body: plainText.trim() ? htmlToParagraphs(draftBody) : [""],
      stickers: draftStickers.length > 0 ? draftStickers : undefined,
    };
    setEntries((current) => {
      const next = current.some((entry) => entry.id === entryId) ? current.map((entry) => entry.id === entryId ? nextEntry : entry) : [nextEntry, ...current];
      writeEntries(next);
      return next;
    });
    const timer = window.setTimeout(() => {
      setSaveState("Saved");
    }, 700);
    setSaveState("saving…");
    return () => window.clearTimeout(timer);
  }, [draftBody, draftDate, draftMood, draftTags, draftStickers, hasEdited, routeMode]);

  useEffect(() => {
    if (!routeMode) return;
    const target = desktopEditorRef.current?.offsetParent ? desktopEditorRef.current : mobileEditorRef.current;
    if (!target) return;
    target.focus();
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [routeMode]);

  const deleteEntry = () => {
    if (!selected) return;
    if (window.confirm(`Delete the entry from ${selected.date}?`)) {
      setMobileDetail(false);
      router.push("/home");
    }
  };

  const handleEditorInput = (source: "desktop" | "mobile", html: string) => {
    setDraftBody(html);
    setHasEdited(true);
    const other = source === "desktop" ? mobileEditorRef.current : desktopEditorRef.current;
    if (other && other.innerHTML !== html) other.innerHTML = html;
  };

  const handleToolbarAction = (action: "bold" | "italic" | "underline" | "bullet" | "numbered" | "quote") => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !active.isContentEditable) return;

    const commandByAction: Record<typeof action, string> = {
      bold: "bold",
      italic: "italic",
      underline: "underline",
      bullet: "insertUnorderedList",
      numbered: "insertOrderedList",
      quote: "formatBlock",
    };
    const command = commandByAction[action];
    if (command === "formatBlock") {
      document.execCommand(command, false, "blockquote");
    } else {
      document.execCommand(command, false);
    }

    const html = active.innerHTML;
    setDraftBody(html);
    setHasEdited(true);
    const other = active === desktopEditorRef.current ? mobileEditorRef.current : desktopEditorRef.current;
    if (other && other.innerHTML !== html) other.innerHTML = html;
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

  const toggleStickerPicker = () => {
    setStickerPickerOpen((open) => !open);
  };

  const addSticker = (key: StickerKey) => {
    const sticker: PlacedSticker = { id: makeStickerId(), key, x: 50, y: 50, rotation: 0 };
    setDraftStickers((current) => [...current, sticker]);
    setStickerPickerOpen(false);
    setHasEdited(true);
  };

  const updateSticker = (id: string, patch: Partial<PlacedSticker>) => {
    setDraftStickers((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setHasEdited(true);
  };

  const removeStickerById = (id: string) => {
    setDraftStickers((current) => current.filter((item) => item.id !== id));
    setHasEdited(true);
  };

  const editorWordCount = countWords(stripHtml(draftBody));

  return (
    <main className={`home-page${isDirectEntry ? " direct-entry-page" : ""}${isEditorOpen ? " editor-open-page" : ""}`}>
      <Sidebar />
      <section className={`home-list-panel${isDirectEntry ? " direct-entry-list" : ""}${isEditorOpen ? " editor-open-list" : ""}`}>
        <div className="home-list-inner">
          <SearchField query={query} setQuery={setQuery} />
          <FilterBar activeFilter={activeFilter} onChange={setActiveFilter} />
          <div className="home-entry-list home-entry-list-desktop">{visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} selected={entry.id === selectedId} onSelect={() => setSelectedId(entry.id)} />)}</div>
          <div className="home-entry-list home-entry-list-mobile">{!mobileDetail && visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} selected={entry.id === selectedId} onSelect={() => { setSelectedId(entry.id); setMobileDetail(true); }} />)}</div>
        </div>
      </section>

      <section className={`home-desktop-detail${isDirectEntry ? " direct-entry-detail" : ""}`}>
        {!routeMode ? (
          <DetailPanel entry={selected} onDelete={deleteEntry} onEdit={() => router.push(`/home?edit=${selected.id}`)} />
        ) : (
          <div className="entry-editor-screen entry-editor-desktop">
            <div className="entry-editor-topbar">
              <button type="button" className="entry-editor-close" onClick={() => router.push(editorEntryPoint)}>
                <img src="/Close.svg" alt="" />
                <span>Close</span>
              </button>
              <div className="entry-editor-status mono">{saveState}</div>
              <button type="button" className="entry-editor-delete" onClick={() => {
                if (window.confirm("Delete this entry?")) router.push(editorEntryPoint);
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

              <EditorToolbar
                onAction={handleToolbarAction}
                onAddSticker={addSticker}
                pickerOpen={stickerPickerOpen}
                onTogglePicker={toggleStickerPicker}
              />

              <div className="entry-editor-surface-wrap">
                <EditorSurface editorRef={desktopEditorRef} onInput={(html) => handleEditorInput("desktop", html)} />
                {draftStickers.map((sticker) => (
                  <DraggableSticker
                    key={sticker.id}
                    sticker={sticker}
                    onChange={(patch) => updateSticker(sticker.id, patch)}
                    onRemove={() => removeStickerById(sticker.id)}
                  />
                ))}
                <div className="entry-editor-wordcount mono">{editorWordCount} words</div>
              </div>

              <div className="entry-editor-divider" aria-hidden="true" />

              <EditorMoodsAndTags
                draftMood={draftMood}
                setDraftMood={setDraftMood}
                draftTags={draftTags}
                removeTag={removeTag}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                setHasEdited={setHasEdited}
              />
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
            <button type="button" className="entry-editor-close" onClick={() => router.push(editorEntryPoint)}>
              <img src="/Close.svg" alt="" />
              <span>Close</span>
            </button>
            <div className="entry-editor-status mono">{saveState}</div>
            <button type="button" className="entry-editor-delete" onClick={() => {
              if (window.confirm("Delete this entry?")) router.push(editorEntryPoint);
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
              <EditorSurface editorRef={mobileEditorRef} onInput={(html) => handleEditorInput("mobile", html)} />
              {draftStickers.map((sticker) => (
                <DraggableSticker
                  key={sticker.id}
                  sticker={sticker}
                  onChange={(patch) => updateSticker(sticker.id, patch)}
                  onRemove={() => removeStickerById(sticker.id)}
                />
              ))}
            </div>

            <EditorToolbar
              onAction={handleToolbarAction}
              onAddSticker={addSticker}
              pickerOpen={stickerPickerOpen}
              onTogglePicker={toggleStickerPicker}
            />

            <div className="entry-editor-divider" aria-hidden="true" />

            <EditorMoodsAndTags
              draftMood={draftMood}
              setDraftMood={setDraftMood}
              draftTags={draftTags}
              removeTag={removeTag}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addTag={addTag}
              setHasEdited={setHasEdited}
            />
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
