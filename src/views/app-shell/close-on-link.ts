import { startTransition, type MouseEvent } from "react";

// The shell stays mounted on navigation, so the panel closes itself, in the navigation's transition
export function closeOnLink(close: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest("a")) startTransition(close);
  };
}
