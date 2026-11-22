const KOPECKS_PER_HRYVNIA = 100;

export const MONEY_FORMAT = {
  style: "currency",
  currency: "UAH",
  currencyDisplay: "narrowSymbol",
} as const satisfies Intl.NumberFormatOptions;

export const SIGNED_MONEY_FORMAT = {
  ...MONEY_FORMAT,
  signDisplay: "always",
} as const satisfies Intl.NumberFormatOptions;

export function hryvniasOf(kopecks: number) {
  return kopecks / KOPECKS_PER_HRYVNIA;
}
