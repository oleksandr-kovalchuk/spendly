import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "uk"],
  defaultLocale: "en",
  // The language comes from the URL and the browser, so no cookie is set
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
