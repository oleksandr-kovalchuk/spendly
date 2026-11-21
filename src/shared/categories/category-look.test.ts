import { CoffeeIcon, TagIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { CATEGORY_COLORS, categoryColor, categoryLook } from "./category-look";

const OWN_IDS = [
  "0195f3a4-7c1e-7d2a-9b3c-1a2b3c4d5e6f",
  "0195f3a4-7c1e-7d2a-9b3c-1a2b3c4d5e70",
  "0195f3a4-7c1e-7d2a-9b3c-1a2b3c4d5e71",
  "0195f3a4-7c1e-7d2a-9b3c-1a2b3c4d5e72",
];

describe("categoryLook", () => {
  it("gives a default category its own icon and color, whatever its id", () => {
    const first = categoryLook({ id: OWN_IDS[0] ?? "", defaultKey: "food", icon: null });
    const second = categoryLook({ id: OWN_IDS[1] ?? "", defaultKey: "food", icon: null });

    expect(first).toEqual(second);
    expect(first.icon).not.toBe(TagIcon);
  });

  it("gives an own category its chosen icon and the same palette color every time", () => {
    for (const id of OWN_IDS) {
      const look = categoryLook({ id, defaultKey: null, icon: "coffee" });

      expect(look.icon).toBe(CoffeeIcon);
      expect(CATEGORY_COLORS).toContain(look.color);
      expect(categoryLook({ id, defaultKey: null, icon: "coffee" })).toEqual(look);
    }
  });

  it("gives an own category without an icon the tag icon", () => {
    expect(categoryLook({ id: OWN_IDS[0] ?? "", defaultKey: null, icon: null }).icon).toBe(TagIcon);
  });

  it("keeps an own category's color when its icon changes", () => {
    const id = OWN_IDS[0] ?? "";

    expect(categoryLook({ id, defaultKey: null, icon: "coffee" }).color).toBe(
      categoryLook({ id, defaultKey: null, icon: "car" }).color,
    );
    expect(categoryColor({ id, defaultKey: null })).toBe(
      categoryLook({ id, defaultKey: null, icon: null }).color,
    );
  });

  it("spreads own categories over more than one color", () => {
    const colors = new Set(OWN_IDS.map((id) => categoryColor({ id, defaultKey: null })));

    expect(colors.size).toBeGreaterThan(1);
  });
});
