"use client";

import { useRef, type ReactNode, type TouchEvent } from "react";

import { PERIOD_SWIPE_EVENT } from "./period-swipe-event";

// A swipe this long, and at least twice as far sideways as up or down, changes the period
const SWIPE_DISTANCE = 60;

type Point = { x: number; y: number };

// On a touch screen, swiping the content left shows the next period and right the previous one,
// like the control's arrows. The wrapper has no box, so the content keeps its layout
export function PeriodSwipeArea({ children }: { children: ReactNode }) {
  const startRef = useRef<Point | null>(null);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches.length === 1 ? event.touches[0] : undefined;
    // A sheet in a portal passes its touches up the React tree too
    const isInside = event.target instanceof Node && event.currentTarget.contains(event.target);
    startRef.current =
      touch !== undefined && isInside ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = startRef.current;
    const touch = event.changedTouches[0];
    startRef.current = null;
    if (start === null || touch === undefined) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return;
    window.dispatchEvent(new CustomEvent(PERIOD_SWIPE_EVENT, { detail: dx < 0 ? 1 : -1 }));
  }

  return (
    <div
      className="contents"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        startRef.current = null;
      }}
    >
      {children}
    </div>
  );
}
