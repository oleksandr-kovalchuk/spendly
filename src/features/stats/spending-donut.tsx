import { cva } from "class-variance-authority";
import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";

import { categoryStrokeVariants } from "@/shared/categories/category-look";
import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import { donutSegments, RING_LENGTH } from "./donut-segments";
import type { SpendingItem } from "./spending-item";

const RADIUS = 40;
const STROKE = 10;
// A round cap reaches past an arc's end by half the stroke (in path units): the gap leaves room for
// both caps and a visible sliver between them
const CAP = (STROKE / 2 / (2 * Math.PI * RADIUS)) * RING_LENGTH;
const GAP = CAP * 2 + 1.5;

const segmentVariants = cva("fill-none transition-opacity duration-200", {
  variants: { isMuted: { true: "opacity-30", false: "" } },
});

type SpendingDonutProps = {
  items: SpendingItem[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

// The legend carries the same data as a table, so the chart stays out of the accessibility tree.
// Its middle shows the hovered category, or the total
export function SpendingDonut({ items, activeId, onActiveChange }: SpendingDonutProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const maskId = useId();
  const total = items.reduce((sum, item) => sum + item.amountKopecks, 0);
  const active = items.find((item) => item.id === activeId);
  // Other data draws the ring again from empty: arcs morphing into their new places would crawl
  // around it, and a shrinking one would end up a wandering dot
  const drawKey = items.map((item) => `${item.id}:${item.amountKopecks}`).join();

  return (
    <div
      aria-hidden="true"
      className="relative grid size-44 shrink-0 place-items-center justify-self-center @[26rem]:size-36"
    >
      <svg key={drawKey} viewBox="0 0 100 100" className="absolute inset-0 size-full">
        {/* In a mask, white shows what's under it */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            pathLength={RING_LENGTH}
            fill="none"
            stroke="white"
            strokeWidth={STROKE + 4}
            className="donut-sweep"
          />
        </mask>
        <g transform="rotate(-90 50 50)" mask={`url(#${maskId})`}>
          {donutSegments(items, GAP).map(({ item, offset, length }) => (
            <circle
              key={item.id}
              cx="50"
              cy="50"
              r={RADIUS}
              pathLength={RING_LENGTH}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${length} ${RING_LENGTH - length}`}
              strokeDashoffset={-offset}
              className={cn(
                segmentVariants({ isMuted: active !== undefined && active.id !== item.id }),
                categoryStrokeVariants({ color: item.color }),
              )}
              onPointerEnter={() => onActiveChange(item.id)}
              onPointerLeave={() => onActiveChange(null)}
            />
          ))}
        </g>
      </svg>
      <div className="grid max-w-26 justify-items-center gap-0.5 text-center @[26rem]:max-w-22">
        <span className="max-w-full truncate text-xs text-muted-foreground">
          {active?.label ?? t("expenses")}
        </span>
        <span className="font-semibold tracking-tight tabular-nums @[26rem]:text-sm">
          {format.number(hryvniasOf(active?.amountKopecks ?? total), MONEY_FORMAT)}
        </span>
      </div>
    </div>
  );
}
