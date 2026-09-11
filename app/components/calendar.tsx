"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dateKey, entryDateKey, initialEntries, readEntries, type Mood } from "../lib/entries";

type CalendarEntry = {
  mood: Mood;
  preview: string;
};

type CalendarDay = {
  date: Date;
  currentMonth: boolean;
};

const moodColors: Record<Mood, string> = {
  Great: "#01b055",
  Good: "#0d6efd",
  Neutral: "#ff6025",
  Low: "#df91f2",
  Rough: "#ffadd2",
};

const moodIcons: Record<Mood, string> = {
  Great: "/Great.svg",
  Good: "/Good.svg",
  Neutral: "/Neutral.svg",
  Low: "/Low.svg",
  Rough: "/Rough.svg",
};

const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];

function getCalendarDays(month: Date): CalendarDay[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const totalDays = Math.ceil((leadingDays + dayCount) / 7) * 7;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index - leadingDays + 1);
    return { date, currentMonth: date.getMonth() === month.getMonth() };
  });
}

function GlassButton({ children, className = "", onClick, label }: { children: React.ReactNode; className?: string; onClick?: () => void; label: string }) {
  return <button className={`calendar-glass-button ${className}`} onClick={onClick} aria-label={label}>{children}</button>;
}

function Logo() {
  return <a className="calendar-logo" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a>;
}

function Sidebar({ onNewEntry }: { onNewEntry: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="calendar-sidebar">
      <Logo />
      <button className="calendar-new-entry" onClick={onNewEntry}>
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
      <div className="calendar-streak">🔥 12 day streak</div>
    </aside>
  );
}

function MonthHeader({ month, onChangeMonth, onToday }: { month: Date; onChangeMonth: (offset: number) => void; onToday: () => void }) {
  return (
    <header className="calendar-header">
      <div className="calendar-heading-group">
        <h1>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h1>
        <div className="calendar-month-buttons">
          <GlassButton onClick={() => onChangeMonth(-1)} label="Previous month"><img src="/arrow-left.svg" alt="" /></GlassButton>
          <GlassButton onClick={() => onChangeMonth(1)} label="Next month"><img src="/arrow-right.svg" alt="" /></GlassButton>
        </div>
      </div>
      <GlassButton className="calendar-today-button" onClick={onToday} label="Go to today">Today</GlassButton>
    </header>
  );
}

function CalendarGrid({ month, entries, onSelectDay }: { month: Date; entries: Record<string, CalendarEntry>; onSelectDay: (date: Date) => void }) {
  const days = getCalendarDays(month);
  const todayKey = dateKey(new Date());
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <section className="calendar-grid-section" aria-label="Monthly calendar">
      <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {days.map(({ date, currentMonth }) => {
          const key = dateKey(date);
          const entry = entries[key];
          const today = key === todayKey;
          return (
            <button className={`calendar-cell${currentMonth ? "" : " outside-month"}${today ? " today" : ""}`} key={key} onClick={() => onSelectDay(date)}>
              <span className="calendar-cell-heading">
                <span className="calendar-day-number">{date.getDate()}</span>
                {entry && <img className="mood-icon" src={moodIcons[entry.mood]} alt={`${entry.mood} mood`} />}
              </span>
              {today && <span className="today-label">today</span>}
              {entry && <span className="calendar-preview">{entry.preview}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CalendarFooter() {
  return (
    <footer className="calendar-footer">
      <div className="calendar-streak-summary">Current streak: 12 days <span>·</span> Longest streak: 34 days</div>
      <div className="mood-legend" aria-label="Mood legend">
        {(Object.keys(moodColors) as Mood[]).map((mood) => <span key={mood}><img src={moodIcons[mood]} alt="" />{mood}</span>)}
      </div>
    </footer>
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
      <a className="calendar-mobile-add" href="/home?new=1" aria-label="New entry">
        <img src="/add.svg" alt="New entry" />
      </a>
    </nav>
  );
}

export function CalendarPage() {
  const router = useRouter();
  const currentDate = new Date();
  const [month, setMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>(() => Object.fromEntries(initialEntries.map((entry) => [entryDateKey(entry.date), { mood: entry.mood, preview: entry.preview }])));

  useEffect(() => {
    const updateEntries = () => setEntries(Object.fromEntries(readEntries().map((entry) => [entryDateKey(entry.date), { mood: entry.mood, preview: entry.preview }])));
    updateEntries();
    window.addEventListener("storage", updateEntries);
    return () => window.removeEventListener("storage", updateEntries);
  }, []);

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function openDay(date: Date) {
    const key = dateKey(date);
    const entry = Object.entries(entries).find(([entryKey]) => entryKey === key)?.[1];
    if (entry) {
      const existingEntry = readEntries().find((item) => entryDateKey(item.date) === key);
      if (existingEntry) {
        router.push(`/home?edit=${existingEntry.id}&date=${key}`);
        return;
      }
    }
    router.push(`/home?new=1&date=${key}`);
  }

  function goToToday() {
    setMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }

  return (
    <main className="calendar-page">
      <Sidebar onNewEntry={() => router.push("/home?new=1")} />
      <section className="calendar-card">
        <div className="calendar-card-inner">
          <MonthHeader month={month} onChangeMonth={changeMonth} onToday={goToToday} />
          <CalendarGrid month={month} entries={entries} onSelectDay={openDay} />
          <CalendarFooter />
        </div>
        <div className="calendar-content-fade" aria-hidden="true" />
      </section>
      <MobileNavigation />
    </main>
  );
}