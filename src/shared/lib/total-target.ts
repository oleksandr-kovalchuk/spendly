import type { CategoryType } from "@/shared/db/app-constants";

export function totalTarget(type: CategoryType) {
  return { "data-total-target": type } as const;
}

export function totalTargetSelector(type: CategoryType) {
  return `[data-total-target="${type}"]`;
}
