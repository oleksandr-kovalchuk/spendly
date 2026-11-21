// View transition types of a period change by the arrows or a swipe (addTransitionType): the shown
// period's content slides toward the period it moves to
export const PERIOD_EARLIER = "period-earlier";
export const PERIOD_LATER = "period-later";

export type PeriodDirection = typeof PERIOD_EARLIER | typeof PERIOD_LATER;

// For the `enter` and `exit` of animations inside the sliding content: they'd animate on their own
// instead of moving with it
export const NO_PERIOD_ANIMATION = { [PERIOD_EARLIER]: "none", [PERIOD_LATER]: "none" } as const;
