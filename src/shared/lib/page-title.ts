export const APP_NAME = "Spendly";

// A layout's title template doesn't apply to the page in the same segment
export function pageTitle(title: string) {
  return `${title} | ${APP_NAME}`;
}
