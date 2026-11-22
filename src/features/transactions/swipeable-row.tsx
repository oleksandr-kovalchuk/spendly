"use client";

import { cva } from "class-variance-authority";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from "react";

import { ACTION_WIDTH, armedActionOf, OPEN_DISTANCE, pullOf } from "./swipe-pull";

type SwipeableRowProps = {
  editQuery: Record<string, string>;
  editLabel: string;
  deleteLabel: string;
  deleteAction: ReactNode;
  children: ReactNode;
};

type Gesture = { pointerId: number; x: number; y: number; from: number; axis: "x" | "y" | null };

const AXIS_LOCK = 8;
const HAPTIC_MS = 10;

const surfaceVariants = cva("relative bg-card", {
  variants: {
    isDragging: { true: "", false: "transition-[translate] duration-500 ease-spring-soft" },
  },
});

// Shows that letting go will take the action
const actionIconVariants = cva("transition-transform duration-500 ease-spring", {
  variants: { isArmed: { true: "scale-125", false: "" } },
});

// Safari has no `vibrate`
function buzz() {
  if ("vibrate" in navigator) navigator.vibrate(HAPTIC_MS);
}

// Physical left/right, not logical: the row follows the finger, not the text direction
export function SwipeableRow({
  editQuery,
  editLabel,
  deleteLabel,
  deleteAction,
  children,
}: SwipeableRowProps) {
  const router = useRouter();
  const locale = useLocale();
  const rowRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const hasSwipedRef = useRef(false);
  const armedRef = useRef<ReturnType<typeof armedActionOf>>(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isOpen = offset === -ACTION_WIDTH && !isDragging;
  const armed = isDragging ? armedActionOf(offset) : null;

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsidePointerDown(event: globalThis.PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (rowRef.current?.contains(target) || target?.closest('[role="alertdialog"]')) return;
      setOffset(0);
    }
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [isOpen]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    gestureRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: offset,
      axis: null,
    };
    hasSwipedRef.current = false;
    armedRef.current = armedActionOf(offset);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (gesture?.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;

    if (gesture.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      gesture.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (gesture.axis === "x") setIsDragging(true);
    }
    if (gesture.axis !== "x") return;

    hasSwipedRef.current = true;
    const next = pullOf(gesture.from + dx);
    const nextArmed = armedActionOf(next);
    if (nextArmed !== null && nextArmed !== armedRef.current) buzz();
    armedRef.current = nextArmed;
    setOffset(next);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.pointerId !== event.pointerId || gesture.axis !== "x") return;

    setIsDragging(false);
    const end = gesture.from + event.clientX - gesture.x;
    if (event.type === "pointerup" && end >= ACTION_WIDTH) {
      setOffset(0);
      router.push(`/${locale}/transactions?${new URLSearchParams(editQuery).toString()}`, {
        scroll: false,
      });
    } else {
      setOffset(end <= -OPEN_DISTANCE ? -ACTION_WIDTH : 0);
    }
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!hasSwipedRef.current && !isOpen) return;
    event.preventDefault();
    event.stopPropagation();
    hasSwipedRef.current = false;
    setOffset(0);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (hasSwipedRef.current || isOpen) event.stopPropagation();
  }

  return (
    <div
      ref={rowRef}
      className="relative touch-pan-y overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onTouchEnd={handleTouchEnd}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 flex w-full items-center gap-2 bg-primary ps-5 text-sm font-medium text-primary-foreground"
      >
        <PencilIcon
          className={actionIconVariants({ className: "size-4", isArmed: armed === "edit" })}
        />
        {editLabel}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-1 bg-destructive text-xs font-medium text-destructive-foreground"
      >
        <Trash2Icon
          className={actionIconVariants({ className: "size-5", isArmed: armed === "delete" })}
        />
        {deleteLabel}
      </div>
      {isOpen ? <div className="absolute inset-y-0 right-0 flex w-24">{deleteAction}</div> : null}
      <div
        className={surfaceVariants({ isDragging })}
        style={{ translate: `${offset}px 0` }}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
