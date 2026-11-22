"use client";

import { cn } from "cn";
import type { PointerEvent, ReactNode } from "react";

const MAX_TILT_DEG = 5;

function clampToUnit(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

// CSS variables, not state: no render on every pointer move
function tiltTo(card: HTMLElement, clientX: number, clientY: number) {
  const { left, top, width, height } = card.getBoundingClientRect();
  const x = clampToUnit((clientX - left) / width);
  const y = clampToUnit((clientY - top) / height);
  card.style.setProperty("--pointer-x", `${x * 100}%`);
  card.style.setProperty("--pointer-y", `${y * 100}%`);
  // The side under the pointer sinks away from the viewer
  card.style.setProperty("--tilt-x", `${(0.5 - y) * 2 * MAX_TILT_DEG}deg`);
  card.style.setProperty("--tilt-y", `${(x - 0.5) * 2 * MAX_TILT_DEG}deg`);
  card.dataset.tilt = "";
}

// Keeps the pointer's place, so the glare fades out where it was
function release(card: HTMLElement) {
  delete card.dataset.tilt;
}

export function TiltCard({ className, children }: { className: string; children: ReactNode }) {
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") tiltTo(event.currentTarget, event.clientX, event.clientY);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    tiltTo(event.currentTarget, event.clientX, event.clientY);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") release(event.currentTarget);
  }

  return (
    <div
      className={cn("tilt-card", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={(event) => release(event.currentTarget)}
      onPointerLeave={(event) => release(event.currentTarget)}
    >
      {children}
    </div>
  );
}
