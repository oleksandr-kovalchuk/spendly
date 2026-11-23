import { cva } from "class-variance-authority";

// The plus sign marks income for those who can't see color
export const amountVariants = cva("shrink-0 font-semibold tabular-nums", {
  variants: { type: { income: "text-income", expense: "" } },
});
