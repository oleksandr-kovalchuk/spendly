// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, test, vi } from "vitest";

import en from "@/i18n/messages/en.json";

import { SwipeableRow } from "./swipeable-row";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const onLinkClick = vi.fn();

beforeEach(() => {
  push.mockReset();
  onLinkClick.mockReset();
});

function renderRow() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SwipeableRow
        editHref="/en?period=week&edit=42"
        editLabel="Edit"
        deleteLabel="Delete"
        deleteAction={<button type="button">Delete</button>}
      >
        <a
          href="#food"
          onClick={(event) => {
            event.preventDefault();
            onLinkClick();
          }}
        >
          Food
        </a>
      </SwipeableRow>
    </NextIntlClientProvider>,
  );
  return screen.getByRole("link", { name: "Food" });
}

function swipe(target: Element, dx: number, pointerType = "touch") {
  const start = { clientX: 100, clientY: 20, pointerId: 1, pointerType };
  fireEvent.pointerDown(target, start);
  fireEvent.pointerMove(target, { ...start, clientX: 100 + dx / 2 });
  fireEvent.pointerMove(target, { ...start, clientX: 100 + dx });
  fireEvent.pointerUp(target, { ...start, clientX: 100 + dx });
}

function isDeleteUsable() {
  return screen.queryByRole("button", { name: "Delete" }) !== null;
}

test("a swipe right past the action's width opens the edit form", () => {
  const row = renderRow();

  swipe(row, 120);

  expect(push).toHaveBeenCalledWith("/en?period=week&edit=42", { scroll: false });
});

test("a short swipe right springs back without opening anything", () => {
  const row = renderRow();

  swipe(row, 40);

  expect(push).not.toHaveBeenCalled();
  expect(isDeleteUsable()).toBe(false);
});

test("a swipe left uncovers the delete button, and a tap on the row covers it again", () => {
  const row = renderRow();
  expect(isDeleteUsable()).toBe(false);

  swipe(row, -80);
  expect(isDeleteUsable()).toBe(true);

  fireEvent.click(row);
  expect(onLinkClick).not.toHaveBeenCalled();
  expect(isDeleteUsable()).toBe(false);
});

test("a mouse drag doesn't swipe, and a click opens the row's link", () => {
  const row = renderRow();

  swipe(row, -80, "mouse");
  fireEvent.click(row);

  expect(isDeleteUsable()).toBe(false);
  expect(onLinkClick).toHaveBeenCalled();
});
