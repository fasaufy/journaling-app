"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mood = "Great" | "Good" | "Neutral" | "Low" | "Rough";

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

const entries: Record<string, CalendarEntry> = {
  "2026-09-02": { mood: "Neutral", preview: "A quiet day to reset and take things slowly" },
  "2026-09-04": { mood: "Low", preview: "Feeling stuck on the project again" },
  "2026-09-06": { mood: "Good", preview: "Started the trip to Lisbon today" },
  "2026-09-07": { mood: "Low", preview: "Long day at work, but dinner with Sara helped" },
};

const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "search", href: "/search", icon: "/search-default.svg", activeIcon: "/search-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];

const mobileNavItems = [navItems[0], navItems[1], { label: "new entry", href: "/home?new=1", icon: "/add.svg", activeIcon: "/add.svg" }, navItems[2], navItems[3]];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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
  return (
    <aside className="calendar-sidebar">
      <Logo />
      <button className="calendar-new-entry" onClick={onNewEntry}>
        <img src="/add.svg" alt="" />
        <span>new entry</span>
      </button>
      <nav className="calendar-sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <a className={item.label === "calendar" ? "active" : ""} href={item.href} key={item.label}>
            <img src={item.label === "calendar" ? item.activeIcon : item.icon} alt="" />
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

function CalendarGrid({ month, onSelectDay }: { month: Date; onSelectDay: (date: Date) => void }) {
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
  return <nav className="calendar-mobile-nav" aria-label="Mobile navigation">{mobileNavItems.map((item) => <a className={item.label === "calendar" ? "active" : item.label === "new entry" ? "add" : ""} href={item.href} key={item.label}><img src={item.label === "calendar" ? item.activeIcon : item.icon} alt={item.label} /></a>)}</nav>;
}

export function CalendarPage() {
  const router = useRouter();
  const currentDate = new Date();
  const [month, setMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function openDay(date: Date) {
    const key = dateKey(date);
    router.push(entries[key] ? `/home?date=${key}` : `/home?new=1&date=${key}`);
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
          <CalendarGrid month={month} onSelectDay={openDay} />
          <CalendarFooter />
        </div>
        <div className="calendar-content-fade" aria-hidden="true" />
      </section>
      <MobileNavigation />
    </main>
  );
}