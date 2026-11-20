import { useSyncExternalStore } from "react";

// Tailwind's `lg` breakpoint, where the sidebar replaces the bottom navigation
const DESKTOP_QUERY = "(width >= 64rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// The server renders mobile first; a sheet is never open in the server HTML
function isDesktopOnServer() {
  return false;
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, isDesktop, isDesktopOnServer);
}
