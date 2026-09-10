"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "search", href: "/search", icon: "/search-default.svg", activeIcon: "/search-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];

export function AppPlaceholder({ title, description }: { title: string; description: string }) {
  const pathname = usePathname();
  const activeLabel = navItems.find((item) => item.href === pathname)?.label;

  return (
    <main className="app-placeholder-page">
      <aside className="app-placeholder-sidebar">
        <a className="calendar-logo" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a>
        <a className="calendar-new-entry" href="/home?new=1"><img src="/add.svg" alt="" /><span>new entry</span></a>
        <nav className="calendar-sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => <a className={item.label === activeLabel ? "active" : ""} href={item.href} key={item.label}><img src={item.label === activeLabel ? item.activeIcon : item.icon} alt="" /><span>{item.label}</span></a>)}
        </nav>
        <div className="calendar-streak">🔥 12 day streak</div>
      </aside>
      <section className="app-placeholder-card">
        <div className="app-placeholder-content">
          <p className="app-placeholder-eyebrow">daybük</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <a className="primary-button app-placeholder-action" href="/home?new=1"><span>new entry</span></a>
        </div>
      </section>
      <nav className="calendar-mobile-nav" aria-label="Mobile navigation">
        {[navItems[0], navItems[1], { label: "new entry", href: "/home?new=1", icon: "/add.svg", activeIcon: "/add.svg" }, navItems[2], navItems[3]].map((item) => <a className={item.label === activeLabel ? "active" : item.label === "new entry" ? "add" : ""} href={item.href} key={item.label}><img src={item.label === activeLabel ? item.activeIcon : item.icon} alt={item.label} /></a>)}
      </nav>
    </main>
  );
}