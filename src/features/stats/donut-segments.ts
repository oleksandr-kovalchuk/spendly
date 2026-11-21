import type { SpendingItem } from "./spending-item";

// The ring's length in SVG path units (its pathLength), so a share maps straight to a length
export const RING_LENGTH = 100;

// A zero-length arc with round caps is a dot
const DOT_LENGTH = 0.01;

export type DonutSegment = { item: SpendingItem; offset: number; length: number };

// Each category's part of the ring: its share, but at least `minArc`, so a tiny share's dot doesn't
// run into its neighbours; the larger parts give up the difference in proportion
function arcsOf(shares: number[], minArc: number) {
  if (shares.length * minArc >= RING_LENGTH) return shares.map(() => RING_LENGTH / shares.length);

  let isRaised = shares.map((share) => share < minArc);
  for (;;) {
    const raisedCount = isRaised.filter(Boolean).length;
    const rest = shares.reduce((sum, share, i) => (isRaised[i] === true ? sum : sum + share), 0);
    const scale = (RING_LENGTH - raisedCount * minArc) / rest;
    const arcs = shares.map((share, i) => (isRaised[i] === true ? minArc : share * scale));
    const next = arcs.map((arc, i) => isRaised[i] === true || arc < minArc);
    if (next.every((raised, i) => raised === isRaised[i])) return arcs;
    isRaised = next;
  }
}

// An arc per category in the given order; `gap` is left between arcs, half on each side, except
// when one category fills the whole ring
export function donutSegments(items: SpendingItem[], gap: number): DonutSegment[] {
  const total = items.reduce((sum, item) => sum + item.amountKopecks, 0);
  if (total === 0) return [];
  if (items.length === 1) return items.map((item) => ({ item, offset: 0, length: RING_LENGTH }));

  const arcs = arcsOf(
    items.map((item) => (item.amountKopecks / total) * RING_LENGTH),
    gap,
  );
  const segments: DonutSegment[] = [];
  let start = 0;
  for (const [i, item] of items.entries()) {
    const arc = arcs[i] ?? 0;
    segments.push({ item, offset: start + gap / 2, length: Math.max(arc - gap, DOT_LENGTH) });
    start += arc;
  }
  return segments;
}
