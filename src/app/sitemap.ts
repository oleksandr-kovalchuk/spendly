import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { languageLinks } from "@/shared/lib/localized-alternates";
import { SITE_URL } from "@/shared/lib/site-url";

// Only the public pages worth finding; the others are private or set noindex
const INDEXED_PATHS = ["/sign-in", "/sign-up", "/privacy"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: { languages: languageLinks(path, SITE_URL) },
    })),
  );
}
