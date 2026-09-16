"use client";

import { FormEvent, PointerEvent, type CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

type PhotoAsset = {
  image: string;
  className: string;
  alt: string;
};

const collage: PhotoAsset[] = [
  { image: "/img-1.png", className: "photo-one", alt: "Friends looking up at the sky" },
  { image: "/img-2.png", className: "photo-two", alt: "Friends gathered together" },
  { image: "/img-3.png", className: "photo-three", alt: "Friends running through the mountains" },
];

function DraggablePhoto({ photo }: { photo: PhotoAsset }) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setOrigin({ x: event.clientX - offset.x, y: event.clientY - offset.y });
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragging) setOffset({ x: event.clientX - origin.x, y: event.clientY - origin.y });
  }

  function stopDragging() {
    setDragging(false);
  }

  return (
    <div
      className={`photo-element ${photo.className}${dragging ? " is-dragging" : ""}`}
      style={{ "--drag-x": `${offset.x}px`, "--drag-y": `${offset.y}px` } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <img className="photo-image" src={photo.image} alt={photo.alt} draggable={false} />
    </div>
  );
}

function BrandingPanel() {
  return (
    <aside className="branding-panel">
      <a className="brand" href="/login" aria-label="daybük home"><img src="/logo.svg" alt="daybük" /></a>
      <div className="brand-copy">
        <h1>your personal space to <span>write</span>.</h1>
        <p>Journal from anywhere, on any device. Your words, your story, always private, always yours.</p>
      </div>
      <div className="photo-collage" aria-hidden="true">
        {collage.map((photo) => <DraggablePhoto key={photo.image} photo={photo} />)}
      </div>
    </aside>
  );
}

function ModeTabs({ mode }: { mode: AuthMode }) {
  return (
    <nav className="mode-tabs" aria-label="Account access">
      <a className={mode === "login" ? "active" : ""} href="/login">log in</a>
      <a className={mode === "signup" ? "active" : ""} href="/signup">sign up</a>
    </nav>
  );
}

function MobileBrand() {
  return (
    <div className="mobile-brand">
      <div className="mobile-brand-mark" aria-hidden="true">
        <img src="/logo-mark.svg" alt="" />
      </div>
      <div className="mobile-brand-wordmark" aria-hidden="true">
        <img src="/logo-wordmark.svg" alt="" />
      </div>
      <p>Your personal space to <span>write</span>.</p>
    </div>
  );
}

function PasswordField({ signup }: { signup: boolean }) {
  const [visible, setVisible] = useState(signup);

  return (
    <div className="field password-field">
      <label htmlFor="password">password</label>
      <div className="input-wrap">
        <input id="password" name="password" type={visible ? "text" : "password"} defaultValue={signup ? "quietmorning4" : ""} placeholder="••••••••••" required minLength={8} />
        <button type="button" className="visibility-toggle" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? "hide" : "show"}</button>
      </div>
      {signup && <p className="password-hint">At least 8 characters, 1 number</p>}
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const signup = mode === "signup";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => router.push("/home"), 650);
  }

  return (
    <main className="auth-card">
      <div className="auth-form-shell">
        <MobileBrand />
        <ModeTabs mode={mode} />
        <form onSubmit={handleSubmit}>
          <div className="field email-field">
            <label htmlFor="email">email</label>
            <input id="email" name="email" type="email" defaultValue={signup ? "maya.oyelaran@email.com" : ""} placeholder="you@email.com" required />
          </div>
          <PasswordField signup={signup} />
          <button className="primary-button" type="submit" disabled={loading}><span>{loading ? "opening..." : signup ? "create account" : "log in"}</span></button>
          {!signup && <a className="underlined-link forgot-link" href="mailto:support@daybuk.app">Forgot password?</a>}
          <p className="account-switch">{signup ? "Already have an account?" : "Don't have an account?"}{" "}<a href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Sign up"}</a></p>
        </form>
      </div>
    </main>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  return <div className="auth-page"><BrandingPanel /><AuthForm mode={mode} /></div>;
}