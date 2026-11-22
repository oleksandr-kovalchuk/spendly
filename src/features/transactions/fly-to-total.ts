import "client-only";

import type { CategoryType } from "@/shared/db/app-constants";
import { totalTargetSelector } from "@/shared/lib/total-target";

const FLIGHT_MS = 800;
const LANDING_MS = 450;
const FLIGHT_EASING = "cubic-bezier(0.45, 0, 0.2, 1)";
const LIFT_PX = 10;
const LIFT_SCALE = 1.06;
const LIFT_AT = 0.2;
const ARC = 0.2;
const ARC_AT = 0.55;
const FADE_FROM = 0.7;
const LANDING_SCALE = 1.15;
const FLYER_Z_INDEX = "100";
const FLIGHT_NAME = "amount-flight";
const FLIGHT_ACTIVE_CLASS = "amount-flight-active";
const LANDING_DELAY_PROPERTY = "--amount-flight-landing";

function isOnScreen(element: HTMLElement) {
  if (!element.checkVisibility()) return false;
  const { top, bottom, width } = element.getBoundingClientRect();
  return width > 0 && bottom > 0 && top < innerHeight;
}

function textBoxOf(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect();
}

function land(target: HTMLElement) {
  const origin = getComputedStyle(target).direction === "rtl" ? "right center" : "left center";
  target.animate(
    [
      { scale: 1, transformOrigin: origin },
      { scale: LANDING_SCALE, transformOrigin: origin },
      { scale: 1, transformOrigin: origin },
    ],
    { duration: LANDING_MS, easing: "ease-out" },
  );
}

export function flyToTotal(amount: HTMLElement, type: CategoryType) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = Array.from(document.querySelectorAll<HTMLElement>(totalTargetSelector(type))).find(
    isOnScreen,
  );
  const flyer = amount.cloneNode(true);
  if (target === undefined || !(flyer instanceof HTMLElement)) return;

  const from = amount.getBoundingClientRect();
  const to = textBoxOf(target);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = to.height / from.height;

  const field = flyer.querySelector("input");
  if (field) {
    const text = document.createElement("span");
    text.className = field.className;
    text.textContent = amount.querySelector("input")?.value ?? "";
    field.replaceWith(text);
  }
  flyer.setAttribute("aria-hidden", "true");
  flyer.inert = true;
  Object.assign(flyer.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    borderColor: "transparent",
    pointerEvents: "none",
    zIndex: FLYER_Z_INDEX,
  });
  flyer.style.setProperty("view-transition-name", FLIGHT_NAME);
  document.body.append(flyer);
  amount.style.visibility = "hidden";
  const root = document.documentElement;
  root.style.setProperty(LANDING_DELAY_PROPERTY, `${FLIGHT_MS * FADE_FROM}ms`);
  root.classList.add(FLIGHT_ACTIVE_CLASS);

  const flight = flyer.animate(
    [
      { translate: "0 0", scale: 1, color: getComputedStyle(amount).color, opacity: 1 },
      { translate: `0 ${-LIFT_PX}px`, scale: LIFT_SCALE, offset: LIFT_AT },
      {
        translate: `${dx / 2 - Math.abs(dy) * ARC}px ${dy / 2}px`,
        scale: (1 + scale) / 2,
        offset: ARC_AT,
      },
      { opacity: 1, offset: FADE_FROM },
      {
        translate: `${dx}px ${dy}px`,
        scale,
        color: getComputedStyle(target).color,
        opacity: 0,
      },
    ],
    { duration: FLIGHT_MS, easing: FLIGHT_EASING },
  );
  flight.addEventListener("finish", () => {
    flyer.remove();
    root.classList.remove(FLIGHT_ACTIVE_CLASS);
    land(target);
  });
  flight.addEventListener("cancel", () => {
    flyer.remove();
    root.classList.remove(FLIGHT_ACTIVE_CLASS);
  });
}
