import type { MetadataRoute } from "next";

import { APP_NAME } from "@/shared/lib/page-title";
import { BACKGROUND_LIGHT } from "@/shared/lib/theme-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    // "/" leads to the user's language and sign-in
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BACKGROUND_LIGHT,
    theme_color: BACKGROUND_LIGHT,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
