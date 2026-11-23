// View transition types of a period change: the content slides toward the new period
export const PERIOD_EARLIER = "period-earlier";
export const PERIOD_LATER = "period-later";

export type PeriodDirection = typeof PERIOD_EARLIER | typeof PERIOD_LATER;

// For `enter`/`exit` inside the sliding content: they'd animate instead of moving with it
export const NO_PERIOD_ANIMATION = { [PERIOD_EARLIER]: "none", [PERIOD_LATER]: "none" } as const;
