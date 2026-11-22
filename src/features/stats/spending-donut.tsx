import { cva } from "class-variance-authority";
import { cn } from "cn";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId } from "react";

import { categoryStrokeVariants } from "@/shared/categories/category-look";
import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import { donutSegments, RING_LENGTH } from "./donut-segments";
import type { SpendingItem } from "./spending-item";

const RADIUS = 40;
const STROKE = 10;
// Room for both round caps and a visible gap between them
const CAP = (STROKE / 2 / (2 * Math.PI * RADIUS)) * RING_LENGTH;
const GAP = CAP * 2 + 1.5;

// stroke-12 stays within the mask's STROKE + 4
const segmentVariants = cva(
  "cursor-pointer fill-none transition-[opacity,stroke-width] duration-500 ease-spring",
  {
    variants: {
      isActive: { true: "stroke-12", false: "" },
      isMuted: { true: "opacity-30", false: "" },
    },
  },
);

type SpendingDonutProps = {
  items: SpendingItem[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
};

// aria-hidden and mouse-only clicks: the legend's table has the same data and links
export function SpendingDonut({ items, activeId, onActiveChange }: SpendingDonutProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const maskId = useId();
  const total = items.reduce((sum, item) => sum + item.amountKopecks, 0);
  const active = items.find((item) => item.id === activeId);
  const drawKey = items.map((item) => `${item.id}:${item.amountKopecks}`).join();

  return (
    <div
      aria-hidden="true"
      className="relative grid size-44 shrink-0 place-items-center justify-self-center @[26rem]:size-36"
    >
      <svg key={drawKey} viewBox="0 0 100 100" className="absolute inset-0 size-full">
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
                segmentVariants({
                  isActive: active?.id === item.id,
                  isMuted: active !== undefined && active.id !== item.id,
                }),
                categoryStrokeVariants({ color: item.color }),
              )}
              onPointerEnter={() => onActiveChange(item.id)}
              onPointerLeave={() => onActiveChange(null)}
              onClick={() =>
                router.push(
                  `/${locale}/transactions?${new URLSearchParams(item.transactionsQuery).toString()}`,
                )
              }
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
