import { flushSync } from "react-dom";

const REVEAL_CLASS = "theme-reveal";

export function revealTheme(origin: Element, applyTheme: () => void) {
  if (
    typeof document.startViewTransition !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    applyTheme();
    return;
  }

  const { left, top, width, height } = origin.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  // The circle ends at the screen's farthest corner
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const root = document.documentElement;
  root.style.setProperty("--reveal-x", `${x}px`);
  root.style.setProperty("--reveal-y", `${y}px`);
  root.style.setProperty("--reveal-radius", `${radius}px`);
  root.classList.add(REVEAL_CLASS);

  // next-themes sets the class in an effect, which a sync render runs before flushSync returns,
  // so the new snapshot already has the new theme
  const transition = document.startViewTransition(() => flushSync(applyTheme));
  void transition.finished.finally(() => root.classList.remove(REVEAL_CLASS));
}
