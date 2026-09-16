"use client";

import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "home", href: "/home", icon: "/home-default.svg", activeIcon: "/home-active.svg" },
  { label: "calendar", href: "/calendar", icon: "/calendar-default.svg", activeIcon: "/calendar-active.svg" },
  { label: "settings", href: "/settings", icon: "/settings-default.svg", activeIcon: "/settings-active.svg" },
];

type Account = { id: string; name: string; email: string };

// Mock session data — swap for a real session/account object once auth exists.
const currentAccount: Account = { id: "acc-1", name: "Jo Almeida", email: "jo@almeida.co" };
const otherAccounts: Account[] = [];

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <aside className="calendar-sidebar">
      <a className="calendar-logo" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a>
      <button className="calendar-new-entry" onClick={() => router.push("/home?new=1")}>
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
    </aside>
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

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  const handleAddAccount = () => {
    router.push("/login");
  };

  return (
    <main className="settings-page">
      <Sidebar />

      <section className="settings-panel">
        <div className="settings-heading">
          <h1>Settings</h1>
          <p>Everything else lives where it is used — reminders in the entry editor, export on an entry. This page only manages who is signed in.</p>
        </div>

        <div className="settings-accounts">
          <div className="settings-account-card">
            <div className="settings-account-avatar mono" aria-hidden="true">avatar</div>
            <div className="settings-account-info">
              <strong>{currentAccount.name}</strong>
              <span>{currentAccount.email}</span>
            </div>
            <span className="settings-account-badge">Signed in</span>
          </div>

          <button type="button" className="settings-add-account" onClick={handleAddAccount}>
            <span className="settings-add-account-icon"><img src="/add.svg" alt="" /></span>
            <span className="settings-add-account-text">
              <strong>Add account</strong>
              <span>Sign in with another email and switch without logging out</span>
            </span>
          </button>
        </div>

        <div className="settings-logout-row">
          <button type="button" className="calendar-glass-button settings-logout-button" onClick={handleLogout}>log out</button>
          <p className="settings-logout-caption">
            Signs out of {currentAccount.name} on this browser.
            {otherAccounts.length > 0 ? ` ${otherAccounts[0].name} stays available.` : ""}
          </p>
        </div>
      </section>

      <MobileNavigation />
    </main>
  );
}
