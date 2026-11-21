import { useTranslations } from "next-intl";

import { isFieldError } from "./category-errors";

export function useNameErrorMessage() {
  const t = useTranslations("Categories");

  return (error: string | undefined) => {
    if (error === undefined) return undefined;
    return t(isFieldError(error) ? `errors.${error}` : "errors.unknown");
  };
}
