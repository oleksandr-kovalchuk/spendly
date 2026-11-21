// Values the browser needs too (form schemas, labels): app-schema.ts loads the ORM, which
// would ship to every screen that imports a constant from it
export const CATEGORY_TYPES = ["expense", "income"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

// "other" is the default category of both types
export const DEFAULT_CATEGORY_KEYS = [
  "food",
  "transport",
  "housing",
  "utilities",
  "health",
  "shopping",
  "entertainment",
  "other",
  "salary",
  "gifts",
] as const;
export type DefaultCategoryKey = (typeof DEFAULT_CATEGORY_KEYS)[number];

// The icons a user's own category can have; a default category's icon comes from its key
export const CATEGORY_ICON_KEYS = [
  "tag",
  "coffee",
  "utensils",
  "pizza",
  "beer",
  "shirt",
  "car",
  "fuel",
  "plane",
  "bike",
  "baby",
  "pawPrint",
  "graduationCap",
  "bookOpen",
  "dumbbell",
  "pill",
  "scissors",
  "smartphone",
  "wifi",
  "gamepad",
  "music",
  "wrench",
  "sofa",
  "piggyBank",
  "wallet",
  "creditCard",
  "receipt",
  "trendingUp",
  "handCoins",
  "laptop",
  "heart",
  "gift",
] as const;
export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];
export const DEFAULT_CATEGORY_ICON = "tag" satisfies CategoryIconKey;

export const MAX_CATEGORY_NAME_LENGTH = 40;
export const MAX_NOTE_LENGTH = 200;
// 999,999,999.99 hryvnias in kopecks, which needs a bigint
export const MAX_AMOUNT_KOPECKS = 99_999_999_999;
