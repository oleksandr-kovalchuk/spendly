import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { DAY_TIME_ZONE } from "@/shared/lib/utc-date";
import { PageHeading } from "@/shared/ui/page-heading";

const CONTACT_EMAIL = "kov280396@gmail.com";
// Change it with the text, so readers see when the policy last changed
const UPDATED_ON = new Date("2026-11-21T00:00:00Z");

const DATA = [
  "email",
  "google",
  "password",
  "sessions",
  "passwordReset",
  "attempts",
  "money",
  "browser",
] as const;
const RETENTION = ["account", "sessions", "passwordReset", "attempts", "browser"] as const;
const PROCESSORS = ["vercel", "neon", "resend", "google"] as const;

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold">{heading}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="grid list-disc gap-1 ps-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export async function PrivacyPage() {
  const [t, format] = await Promise.all([getTranslations("Privacy"), getFormatter()]);

  return (
    <article className="mx-auto grid w-full max-w-3xl stagger gap-6 rounded-3xl bg-card p-6 shadow-soft lg:p-10">
      <header className="grid gap-2">
        <PageHeading>{t("title")}</PageHeading>
        <p className="text-sm text-muted-foreground">
          {t("updated", {
            date: format.dateTime(UPDATED_ON, { dateStyle: "long", timeZone: DAY_TIME_ZONE }),
          })}
        </p>
      </header>
      <p>{t("intro")}</p>
      <Section heading={t("data.heading")}>
        <List items={DATA.map((key) => t(`data.${key}`))} />
      </Section>
      <Section heading={t("purpose.heading")}>
        <p>{t("purpose.text")}</p>
      </Section>
      <Section heading={t("retention.heading")}>
        <List items={RETENTION.map((key) => t(`retention.${key}`))} />
      </Section>
      <Section heading={t("processors.heading")}>
        <List items={PROCESSORS.map((key) => t(`processors.${key}`))} />
      </Section>
      <Section heading={t("contact.heading")}>
        <p>
          {t.rich("contact.text", {
            email: CONTACT_EMAIL,
            link: (chunks) => (
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
                {chunks}
              </a>
            ),
          })}
        </p>
      </Section>
    </article>
  );
}
