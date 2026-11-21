import { startTransition, type MouseEvent } from "react";

// The shell stays mounted while a link inside the account panel (Settings, the other language)
// navigates, so the panel closes itself; in a transition, together with the navigation
export function closeOnLink(close: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest("a")) startTransition(close);
  };
}
