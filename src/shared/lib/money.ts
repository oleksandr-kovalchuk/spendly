const KOPECKS_PER_HRYVNIA = 100;

// Money is stored as integer kopecks in one currency
export const MONEY_FORMAT = {
  style: "currency",
  currency: "UAH",
  currencyDisplay: "narrowSymbol",
} as const satisfies Intl.NumberFormatOptions;

export function hryvniasOf(kopecks: number) {
  return kopecks / KOPECKS_PER_HRYVNIA;
}
