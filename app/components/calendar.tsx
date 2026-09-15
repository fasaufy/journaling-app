"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { dateKey, entryDateKey, type PlacedSticker, readEntries, stickerAssets, type Entry, type Mood, type StickerKey, writeEntries } from "../lib/entries";

const moodIcons: Record<Mood, string> = {
  Great: "/Great.svg",
  Good: "/Good.svg",
  Neutral: "/Neutral.svg",
  Low: "/Low.svg",
  Rough: "/Rough.svg",
};

function StickerFrame({ stickerKey, style }: { stickerKey: StickerKey; style?: React.CSSProperties }) {
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
        <div
          key={sticker.id}
          className="entry-sticker-placed"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
        >
          <StickerFrame stickerKey={sticker.key} style={{ transform: `rotate(${sticker.rotation}deg)` }} />
        </div>
      ))}
    </div>
  );
}

const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];

function getWeekDates(anchorDate: Date) {
  const start = new Date(anchorDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return value;
  });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}

function GlassButton({ children, className = "", onClick, label }: { children: React.ReactNode; className?: string; onClick?: () => void; label: string }) {
  return <button type="button" className={`calendar-glass-button ${className}`.trim()} onClick={onClick} aria-label={label}>{children}</button>;
}

function Logo() {
  return <a className="calendar-logo" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a>;
}

function Sidebar({ onNewEntry }: { onNewEntry: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="calendar-sidebar">
      <Logo />
      <button type="button" className="calendar-new-entry" onClick={onNewEntry}>
        <img src="/add.svg" alt="" />
        <span>new entry</span>
      </button>
      <nav className="calendar-sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <a className={pathname === item.href ? "active" : ""} href={item.href} key={item.label}>
            <img src={pathname === item.href ? item.activeIcon : item.icon} alt="" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="calendar-streak">🔥 12 day current streak</div>
    </aside>
  );
}

function MonthHeader({ month, onChangeMonth, onToday }: { month: Date; onChangeMonth: (offset: number) => void; onToday: () => void }) {
  return (
    <header className="calendar-header">
      <div className="calendar-heading-group">
        <h1>{formatMonthYear(month)}</h1>
        <div className="calendar-month-buttons">
          <GlassButton onClick={() => onChangeMonth(-1)} label="Previous week"><img src="/arrow-left.svg" alt="" /></GlassButton>
          <GlassButton onClick={() => onChangeMonth(1)} label="Next week"><img src="/arrow-right.svg" alt="" /></GlassButton>
        </div>
      </div>
      <GlassButton className="calendar-today-button" onClick={onToday} label="Go to today">Today</GlassButton>
    </header>
  );
}

function WeekList({ weekDates, entries, selectedDate, onSelectDay }: { weekDates: Date[]; entries: Record<string, Entry>; selectedDate: Date; onSelectDay: (date: Date) => void; }) {
  const todayKey = dateKey(new Date());

  return (
    <div className="calendar-week-list" aria-label="Weekly calendar">
      {weekDates.map((date) => {
        const key = dateKey(date);
        const entry = entries[key];
        const isSelected = key === dateKey(selectedDate);
        const isToday = key === todayKey;
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);

        return (
          <button
            key={key}
            type="button"
            className={`calendar-day-row${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
            onClick={() => onSelectDay(date)}
            aria-label={entry ? `Open ${formatFullDate(date)}` : `Select ${formatFullDate(date)}`}
          >
            <div className="calendar-day-label-block">
              <span className="calendar-day-initial">{dayLabel}</span>
              <span className="calendar-day-number">{date.getDate()}</span>
            </div>
            <div className="calendar-day-preview">{entry ? entry.preview : ""}</div>
            <div className="calendar-day-mood">
              {entry ? (
                <img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} />
              ) : (
                <span className="calendar-day-mood-placeholder" aria-hidden="true" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailPanel({ entry, onDelete, onEdit }: { entry: Entry | null; onDelete: () => void; onEdit: () => void }) {
  if (!entry) {
    return (
      <div className="calendar-empty-detail">
        <img className="calendar-empty-icon" src="/Notepad.svg" alt="" />
        <h2>Nothing here just yet</h2>
        <button type="button" className="calendar-new-entry calendar-empty-action" onClick={onEdit}>
          <img src="/add.svg" alt="" />
          <span>new entry</span>
        </button>
      </div>
    );
  }

  return (
    <article className="calendar-detail-panel">
      <header className="calendar-detail-header">
        <div>
          <h2>{entry.date}</h2>
          <div className="calendar-detail-meta">
            <img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} />
            <strong>{entry.mood}</strong>
            <span className="calendar-detail-divider" aria-hidden="true" />
            {entry.tags.map((tag) => (
              <span key={tag} className="home-tag-chip">{tag}</span>
            ))}
          </div>
        </div>
        <div className="calendar-detail-actions">
          <GlassButton onClick={onEdit} label="Edit entry"><img src="/edit.svg" alt="" /></GlassButton>
          <GlassButton onClick={onDelete} label="Delete entry"><img src="/delete.svg" alt="" /></GlassButton>
        </div>
      </header>
      <div className="calendar-detail-body">
        {entry.body.map((paragraph, index) => (
          <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
        ))}
        <StickerCanvas stickers={entry.stickers} />
      </div>
    </article>
  );
}

function MobileDetail({ entry, onBack, onDelete, onEdit }: { entry: Entry | null; onBack: () => void; onDelete: () => void; onEdit: () => void }) {
  return (
    <motion.article
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ x: "100%", opacity: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
      className="calendar-mobile-detail"
    >
      <header className="calendar-mobile-detail-top">
        <button type="button" onClick={onBack} aria-label="Back to calendar">
          <img src="/arrow-left.svg" alt="" />
        </button>
        <span>Week view</span>
        {entry ? (
          <button type="button" onClick={onDelete} aria-label="Delete entry">
            <img src="/delete.svg" alt="" />
          </button>
        ) : (
          <span className="calendar-mobile-detail-spacer" aria-hidden="true" />
        )}
      </header>
      {entry ? (
        <>
          <div className="calendar-mobile-detail-heading">
            <h2>{entry.date}</h2>
            <div className="calendar-detail-meta">
              <img src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} />
              <strong>{entry.mood}</strong>
              <span className="calendar-detail-divider" aria-hidden="true" />
              {entry.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="home-tag-chip">{tag}</span>
              ))}
            </div>
          </div>
          <div className="calendar-detail-body">
            {entry.body.map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
            <StickerCanvas stickers={entry.stickers} />
          </div>
          <button type="button" className="primary-button calendar-mobile-edit" onClick={onEdit}>
            <img src="/edit.svg" alt="" />
            <span>Edit note</span>
          </button>
        </>
      ) : (
        <div className="calendar-empty-detail">
          <img className="calendar-empty-icon" src="/Notepad.svg" alt="" />
          <h2>Nothing here just yet</h2>
          <button type="button" className="calendar-new-entry calendar-empty-action" onClick={onEdit}>
            <img src="/add.svg" alt="" />
            <span>new entry</span>
          </button>
        </div>
      )}
    </motion.article>
  );
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
      <a className="calendar-mobile-add" href="/home?new=1&from=calendar" aria-label="New entry">
        <img src="/add.svg" alt="New entry" />
      </a>
    </nav>
  );
}

export function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [entries, setEntries] = useState<Entry[]>(() => readEntries());
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [mobileDetailDate, setMobileDetailDate] = useState<Date | null>(null);

  useEffect(() => {
    const handleStorage = () => setEntries(readEntries());
    handleStorage();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const entriesByKey = useMemo(
    () => Object.fromEntries(entries.map((entry) => [entryDateKey(entry.date), entry])),
    [entries]
  );

  const selectedKey = dateKey(selectedDate);
  const selectedEntry = entriesByKey[selectedKey] ?? null;
  const mobileEntry = mobileDetailDate ? entriesByKey[dateKey(mobileDetailDate)] ?? null : null;

  function shiftWeek(offset: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
  }

  function goToToday() {
    const now = new Date();
    setSelectedDate(now);
    setMobileDetailOpen(false);
    setMobileDetailDate(null);
  }

  function openDay(date: Date) {
    setSelectedDate(date);
    setMobileDetailDate(date);
    setMobileDetailOpen(true);
  }

  function deleteEntryForDate(date: Date) {
    const key = dateKey(date);
    const nextEntries = entries.filter((entry) => entryDateKey(entry.date) !== key);
    writeEntries(nextEntries);
    setEntries(nextEntries);
    if (mobileDetailOpen) {
      setMobileDetailOpen(false);
      setMobileDetailDate(null);
    }
  }

  function editEntry(entry: Entry | null) {
    if (!entry) {
      router.push(`/home?new=1&date=${selectedKey}&from=calendar`);
      return;
    }

    router.push(`/home?edit=${entry.id}&date=${selectedKey}&from=calendar`);
  }

  return (
    <main className="calendar-page">
      <Sidebar onNewEntry={() => router.push("/home?new=1&from=calendar")} />

      <section className="calendar-shell" aria-label="Calendar overview">
        <div className="calendar-list-pane">
          <MonthHeader month={selectedDate} onChangeMonth={shiftWeek} onToday={goToToday} />
          <WeekList weekDates={weekDates} entries={entriesByKey} selectedDate={selectedDate} onSelectDay={openDay} />
        </div>

        <aside className="calendar-detail-pane">
          <DetailPanel entry={selectedEntry} onDelete={() => deleteEntryForDate(selectedDate)} onEdit={() => editEntry(selectedEntry)} />
        </aside>
      </section>

      <div className="calendar-mobile-layer">
        <AnimatePresence mode="wait">
          {mobileDetailOpen ? (
            <MobileDetail
              key={dateKey(mobileDetailDate ?? selectedDate)}
              entry={mobileEntry}
              onBack={() => {
                setMobileDetailOpen(false);
                setMobileDetailDate(null);
              }}
              onDelete={() => {
                if (mobileDetailDate) deleteEntryForDate(mobileDetailDate);
              }}
              onEdit={() => editEntry(mobileEntry)}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <MobileNavigation />
    </main>
  );
}