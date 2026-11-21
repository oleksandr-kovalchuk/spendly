import { cva } from "class-variance-authority";

// Income stands out in its color; its plus sign says the same for those who can't see color
export const amountVariants = cva("shrink-0 font-semibold tabular-nums", {
  variants: { type: { income: "text-income", expense: "" } },
});
