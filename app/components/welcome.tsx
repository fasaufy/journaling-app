"use client";

import { PointerEvent, type CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className="photo-collage" aria-hidden="true">
        {collage.map((photo) => <DraggablePhoto key={photo.image} photo={photo} />)}
      </div>
    </aside>
  );
}

export function WelcomePage() {
  const router = useRouter();

  return (
    <div className="auth-page">
      <BrandingPanel />
      <main className="auth-card">
        <div className="welcome-content">
          <div className="welcome-logo">
            <img className="welcome-logo-mark" src="/logo-mark.svg" alt="" />
            <img className="welcome-logo-wordmark" src="/logo-wordmark.svg" alt="daybük" />
          </div>
          <div className="welcome-copy">
            <h1>Your personal space to <span>write</span>.</h1>
            <p>Journal from anywhere, on any device. Your words, your story, always private, always yours.</p>
          </div>
          <div className="welcome-actions">
            <button type="button" className="primary-button" onClick={() => router.push("/home?new=1")}>
              <span>make note now</span>
            </button>
            <p className="welcome-caption">no need to sign up. everything you jot down will be saved in your browser</p>
          </div>
        </div>
      </main>
    </div>
  );
}
