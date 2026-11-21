import { ViewTransition, type ReactNode } from "react";

import { PERIOD_EARLIER, PERIOD_LATER } from "@/shared/lib/period-transition";

export function PeriodSlide({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      update={{
        [PERIOD_EARLIER]: "slide-from-start",
        [PERIOD_LATER]: "slide-from-end",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
