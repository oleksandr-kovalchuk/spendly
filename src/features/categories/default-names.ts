import type { Locale } from "@/i18n/routing";
import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";
import { DEFAULT_CATEGORY_KEYS, type DefaultCategoryKey } from "@/shared/db/app-schema";

const MESSAGES = { en, uk } satisfies Record<Locale, typeof en>;

// A default the user hasn't renamed shows its translation, so a name can't repeat it in any language: a switch would show two
export function defaultKeysNamed(name: string): DefaultCategoryKey[] {
  const wanted = name.toLowerCase();

  return DEFAULT_CATEGORY_KEYS.filter((key) =>
    Object.values(MESSAGES).some(
      (messages) => messages.Categories.defaults[key].toLowerCase() === wanted,
    ),
  );
}
