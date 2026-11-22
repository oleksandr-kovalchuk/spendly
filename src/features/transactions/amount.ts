import { MAX_AMOUNT_KOPECKS } from "@/shared/db/app-constants";

type AmountError = "amountRequired" | "amountInvalid" | "amountTooLarge";
export type ParsedAmount = { kopecks: number } | { error: AmountError };

const AMOUNT_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;
const KOPECKS_PER_HRYVNIA = 100;

// Exact: the text is split into whole and fractional digits, so no float is involved
export function parseAmount(input: string): ParsedAmount {
  const text = input.trim();
  if (text === "") return { error: "amountRequired" };

  const match = AMOUNT_PATTERN.exec(text);
  if (!match) return { error: "amountInvalid" };

  const [, whole = "0", fraction = ""] = match;
  const kopecks = Number(whole) * KOPECKS_PER_HRYVNIA + Number(fraction.padEnd(2, "0"));
  if (kopecks === 0) return { error: "amountInvalid" };
  if (kopecks > MAX_AMOUNT_KOPECKS) return { error: "amountTooLarge" };

  return { kopecks };
}

// For text that has already passed `parseAmount`
export function kopecksOf(input: string) {
  const parsed = parseAmount(input);
  if ("error" in parsed) throw new Error("The amount is invalid", { cause: parsed.error });

  return parsed.kopecks;
}

export function amountInputOf(kopecks: number) {
  const whole = Math.trunc(kopecks / KOPECKS_PER_HRYVNIA);
  const fraction = String(kopecks % KOPECKS_PER_HRYVNIA).padStart(2, "0");

  return `${whole}.${fraction}`;
}
