"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

import type { SpendingItem } from "./spending-item";

const AXIS_WIDTH = 120;
const TICK_GAP = 8;
const FONT_SIZE = 14;
const BAR_SIZE = 16;
// The bar's data end is rounded, its baseline end stays square
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

// Without the accessibility layer the chart takes no arrow keys: it sits in an inert wrapper
export function SpendingBars({ items }: { items: SpendingItem[] }) {
  return (
    <BarChart
      responsive
      accessibilityLayer={false}
      data={items}
      layout="vertical"
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      barSize={BAR_SIZE}
      className="size-full"
    >
      <XAxis type="number" dataKey="amountKopecks" hide domain={[0, "dataMax"]} />
      <YAxis
        type="category"
        dataKey="label"
        width={AXIS_WIDTH}
        axisLine={false}
        tickLine={false}
        interval={0}
        tick={{
          fill: "var(--foreground)",
          fontSize: FONT_SIZE,
          maxLines: 1,
          width: AXIS_WIDTH - TICK_GAP,
        }}
      />
      <Bar
        dataKey="amountKopecks"
        fill="var(--chart-2)"
        radius={BAR_RADIUS}
        isAnimationActive={false}
      />
    </BarChart>
  );
}
