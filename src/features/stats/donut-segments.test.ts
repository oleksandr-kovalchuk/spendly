import { expect, test } from "vitest";

import { donutSegments } from "./donut-segments";
import type { SpendingItem } from "./spending-item";

function item(id: string, amountKopecks: number): SpendingItem {
  return { id, label: id, amountKopecks, color: "cat1" };
}

test("gives each category an arc in its share, in order, with the gap split around it", () => {
  const segments = donutSegments([item("a", 600), item("b", 300), item("c", 100)], 4);

  expect(segments.map(({ item: { id }, offset, length }) => [id, offset, length])).toEqual([
    ["a", 2, 56],
    ["b", 62, 26],
    ["c", 92, 6],
  ]);
});

test("one category fills the whole ring without a gap", () => {
  expect(donutSegments([item("a", 500)], 4)).toEqual([
    { item: item("a", 500), offset: 0, length: 100 },
  ]);
});

test("a share smaller than the gap gets room for a dot, taken from the larger arcs", () => {
  const segments = donutSegments([item("a", 990), item("b", 5), item("c", 5)], 4);

  expect(segments.map(({ offset, length }) => [offset, Number(length.toFixed(2))])).toEqual([
    [2, 88],
    [94, 0.01],
    [98, 0.01],
  ]);
});

test("an arc pushed under the minimum by the others' room gets the minimum too", () => {
  const arcs = donutSegments([item("a", 600), item("b", 350), item("c", 50)], 30).map(
    ({ length }) => Number(length.toFixed(2)),
  );

  expect(arcs).toEqual([10, 0.01, 0.01]);
});

test("too many categories for the gap share the ring equally", () => {
  const segments = donutSegments([item("a", 97), item("b", 2), item("c", 1)], 40);

  expect(segments.map(({ offset }) => Number(offset.toFixed(2)))).toEqual([20, 53.33, 86.67]);
});

test("nothing spent gives no arcs", () => {
  expect(donutSegments([], 4)).toEqual([]);
});
