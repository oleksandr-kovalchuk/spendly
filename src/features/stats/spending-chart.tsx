"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/shared/ui/skeleton";

import type { SpendingItem } from "./spending-item";

const ROW_HEIGHT = 32;

// Recharts measures its container in the browser and isn't needed for the first paint
const SpendingBars = dynamic(() => import("./spending-bars").then((mod) => mod.SpendingBars), {
  ssr: false,
  loading: () => <Skeleton className="size-full" />,
});

// The legend next to the chart carries the same data as text, so the chart stays out of
// the accessibility tree; `inert` also keeps it out of the tab order, since Chromium tabs
// into Recharts' SVG layers. The wrapper fixes the height, so loading doesn't shift the layout
export function SpendingChart({ items }: { items: SpendingItem[] }) {
  return (
    <div inert aria-hidden="true" style={{ height: items.length * ROW_HEIGHT }}>
      <SpendingBars items={items} />
    </div>
  );
}
