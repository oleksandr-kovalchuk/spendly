import { createLoader, parseAsString } from "nuqs/server";

// Raw strings: `parsePeriod` validates them together, so an invalid pair falls back as one
export const periodSearchParsers = { period: parseAsString, date: parseAsString };

export const loadPeriodSearch = createLoader(periodSearchParsers);
