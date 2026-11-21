"use client";

import { useState } from "react";

import { SpendingDonut } from "./spending-donut";
import type { SpendingItem } from "./spending-item";
import { SpendingLegend } from "./spending-legend";

type SpendingBreakdownProps = { items: SpendingItem[]; labelledBy: string };

export function SpendingBreakdown({ items, labelledBy }: SpendingBreakdownProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="@container">
      <div className="grid items-center gap-5 @[26rem]:grid-cols-[auto_1fr]">
        <SpendingDonut items={items} activeId={activeId} onActiveChange={setActiveId} />
        <SpendingLegend
          items={items}
          labelledBy={labelledBy}
          activeId={activeId}
          onActiveChange={setActiveId}
        />
      </div>
    </div>
  );
}
