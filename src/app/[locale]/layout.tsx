import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { locale } from "next/root-params";
import "../globals.css";

import { CLIENT_NAMESPACES } from "@/i18n/client-namespaces";
import { routing } from "@/i18n/routing";
import { APP_NAME } from "@/shared/lib/page-title";
import { SITE_URL } from "@/shared/lib/site-url";
import { BACKGROUND_DARK, BACKGROUND_LIGHT } from "@/shared/lib/theme-colors";
import { AppProviders } from "@/shared/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export function generateStaticParams() {
  return routing.locales.map((value) => ({ locale: value }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Layout");

  return {
    metadataBase: new URL(SITE_URL),
    title: APP_NAME,
    description: t("description"),
    // The home screen name on iPhone, which otherwise suggests the page's title
    appleWebApp: { title: APP_NAME },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BACKGROUND_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: BACKGROUND_DARK },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const current = await locale();
  if (!hasLocale(routing.locales, current)) notFound();

  const t = await getTranslations("Layout");
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  );

  return (
    // The theme script of next-themes sets the class before hydration;
    // the scroll padding keeps a focused control above the phone's bottom navigation
    <html
      lang={current}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased max-lg:scroll-pb-24`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={clientMessages}>
          <AppProviders>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-3 focus:ring-ring"
            >
              {t("skipLink")}
            </a>
            {/* The route groups' layouts hold the top bar or navigation and the main landmark */}
            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
