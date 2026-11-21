import { useTranslations } from "next-intl";

import { isFieldError } from "./category-errors";

// The name field's error code as its text; a code the form doesn't know shows the general error
export function useNameErrorMessage() {
  const t = useTranslations("Categories");

  return (error: string | undefined) => {
    if (error === undefined) return undefined;
    return t(isFieldError(error) ? `errors.${error}` : "errors.unknown");
  };
}
