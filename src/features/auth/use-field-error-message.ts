import { useTranslations } from "next-intl";

import { isFieldError } from "./auth-errors";

// A field's error code, from the schema or the server, as the text shown under the field
export function useFieldErrorMessage() {
  const t = useTranslations("Auth");

  return (message: string | undefined) =>
    isFieldError(message) ? t(`errors.${message}`) : undefined;
}
