# Wireframes

`[ ]` button, `( )` segmented control, `▸` current nav item, `▮` chart bar. Phone: 360 px; desktop: 1440 px.

## Phone: Overview

```
┌──────────────────────────────┐
│ Spendly          УКР  ◐  ⇥   │  top bar: language, theme, sign out
├──────────────────────────────┤
│ Overview                     │  h1
│ (Day|Week|▸Month|Year)       │
│ [‹]   November 2026    [›]   │
│        [This month]          │
│ ┌──────────┐ ┌──────────┐    │
│ │ Income   │ │ Expenses │    │  cards
│ │ +1 000,00│ │ −500,00  │    │
│ └──────────┘ └──────────┘    │
│ ┌──────────────────────────┐ │
│ │ Balance        +500,00 ₴ │ │
│ └──────────────────────────┘ │
│ ┌ Spending by category ────┐ │
│ │ Food      ▮▮▮▮▮▮  300 60%│ │
│ │ Transport ▮▮▮▮    200 40%│ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ▸Overview Transact. [+] Cat. │  bottom nav, fixed; [+] raised
└──────────────────────────────┘
```

Bottom nav: icon + label per item; Add in the middle slot, within thumb reach.

## Phone: Transactions

```
┌──────────────────────────────┐
│ Spendly          УКР  ◐  ⇥   │
├──────────────────────────────┤
│ Transactions                 │
│ (Day|Week|▸Month|Year)       │
│ [‹]   November 2026    [›]   │
│ Tuesday, 17 November         │
│ ┌──────────────────────────┐ │
│ │ ↓ Food           −125,50 │ │  whole row opens the edit sheet
│ │   Lunch                  │ │
│ └──────────────────────────┘ │
│ Monday, 16 November          │
│ ┌──────────────────────────┐ │
│ │ ↑ Salary       +1 000,00 │ │
│ ├──────────────────────────┤ │
│ │ ↓ Transport       −40,00 │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Overview ▸Transact. [+] Cat. │
└──────────────────────────────┘
```

Empty: icon, "No transactions in this period", `[Add transaction]`.

## Phone: Categories

```
┌──────────────────────────────┐
│ Categories                   │
│ ┌ Expense ─────────────────┐ │
│ │ Food              [Rename]│ │
│ │ Transport         [Rename]│ │
│ │ …                        │ │
│ │ [New category name ][Add]│ │
│ └──────────────────────────┘ │
│ ┌ Income ──────────────────┐ │
│ │ Salary            [Rename]│ │
│ │ [New category name ][Add]│ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Overview Transact. [+] ▸Cat. │
└──────────────────────────────┘
```

## Phone: Add / edit sheet

```
┌──────────────────────────────┐
│ (screen dimmed behind)       │
├──────────────────────────────┤
│            ───               │  drag handle, swipe down to close
│ Edit transaction         [×] │
│ (▸Expense | Income)          │
│ Amount   [ 125,50         ]  │
│ Category [ Food         ▾ ]  │
│ Date     [ 17.11.2026     ]  │
│ Note     [ Lunch          ]  │
│ [          Save          ]   │  primary, full width
│ [ Delete ]                   │  edit only → confirm dialog
└──────────────────────────────┘
```

## Desktop: Overview

```
┌───────────────┬───────────────────────────────────────────────────────┐
│ Spendly       │ Overview                (Day|Week|▸Month|Year)        │
│               │                         [‹] November 2026 [›] [This m.]│
│ [ + Add     ] │ ┌ Income ──────┐ ┌ Expenses ────┐ ┌ Balance ─────┐     │
│               │ │ +1 000,00 ₴  │ │ −500,00 ₴    │ │ +500,00 ₴    │     │
│ ▸ Overview    │ └──────────────┘ └──────────────┘ └──────────────┘     │
│   Transactions│ ┌ Spending by category ────────────────────────────┐  │
│   Categories  │ │ Food      ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮      300,00  60%    │  │
│               │ │ Transport ▮▮▮▮▮▮▮▮▮▮▮▮            200,00  40%    │  │
│               │ └──────────────────────────────────────────────────┘  │
│ ───────────── │                                                       │
│ УКР   ◐   ⇥   │  content max ~64rem, sidebar ~16rem                   │
└───────────────┴───────────────────────────────────────────────────────┘
```

## Desktop: Transactions

```
┌───────────────┬───────────────────────────────────────────────────────┐
│ Spendly       │ Transactions            (Day|Week|▸Month|Year)        │
│ [ + Add     ] │                         [‹] November 2026 [›] [This m.]│
│   Overview    │ Tuesday, 17 November                                  │
│ ▸ Transactions│ ┌───────────────────────────────────────────────────┐ │
│   Categories  │ │ ↓ Food · Lunch                           −125,50 ₴ │ │
│               │ └───────────────────────────────────────────────────┘ │
│               │ Monday, 16 November                                   │
│               │ ┌───────────────────────────────────────────────────┐ │
│               │ │ ↑ Salary                               +1 000,00 ₴ │ │
│               │ │ ↓ Transport                               −40,00 ₴ │ │
│ УКР   ◐   ⇥   │ └───────────────────────────────────────────────────┘ │
└───────────────┴───────────────────────────────────────────────────────┘
```

Edit opens a centered dialog (same fields as the sheet, ~28rem wide).

## Desktop: Categories

```
┌───────────────┬───────────────────────────────────────────────────────┐
│ Spendly       │ Categories                                            │
│ [ + Add     ] │ ┌ Expense ─────────────────┐ ┌ Income ──────────────┐ │
│   Overview    │ │ Food            [Rename] │ │ Salary      [Rename] │ │
│   Transactions│ │ Transport       [Rename] │ │ Gifts       [Rename] │ │
│ ▸ Categories  │ │ …                        │ │ Other       [Rename] │ │
│               │ │ [New name     ] [Add]    │ │ [New name ] [Add]    │ │
│ УКР   ◐   ⇥   │ └──────────────────────────┘ └──────────────────────┘ │
└───────────────┴───────────────────────────────────────────────────────┘
```

## Signed out (sign in, sign up)

Phone and desktop: top bar (name, language, theme), the form in a centered card; no app navigation.
