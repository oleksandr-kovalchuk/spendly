import { useTranslations } from "next-intl";

import { isFieldError } from "./auth-errors";

export function useFieldErrorMessage() {
  const t = useTranslations("Auth");

  return (message: string | undefined) =>
    isFieldError(message) ? t(`errors.${message}`) : undefined;
}
