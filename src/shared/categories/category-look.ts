import { cva } from "class-variance-authority";
import {
  BabyIcon,
  BeerIcon,
  BikeIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BusIcon,
  CarIcon,
  ClapperboardIcon,
  CoffeeIcon,
  CreditCardIcon,
  DumbbellIcon,
  FuelIcon,
  Gamepad2Icon,
  GiftIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HeartIcon,
  HeartPulseIcon,
  HouseIcon,
  LaptopIcon,
  MusicIcon,
  PawPrintIcon,
  PiggyBankIcon,
  PillIcon,
  PizzaIcon,
  PlaneIcon,
  ReceiptIcon,
  ScissorsIcon,
  ShapesIcon,
  ShirtIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  SofaIcon,
  TagIcon,
  TrendingUpIcon,
  UtensilsIcon,
  WalletIcon,
  WifiIcon,
  WrenchIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";

import type { CategoryIconKey, DefaultCategoryKey } from "@/shared/db/app-constants";

export const CATEGORY_COLORS = [
  "cat1",
  "cat2",
  "cat3",
  "cat4",
  "cat5",
  "cat6",
  "cat7",
  "cat8",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

type CategoryLook = { icon: LucideIcon; color: CategoryColor };

const DEFAULT_LOOKS = {
  food: { icon: ShoppingCartIcon, color: "cat3" },
  transport: { icon: BusIcon, color: "cat2" },
  housing: { icon: HouseIcon, color: "cat8" },
  utilities: { icon: ZapIcon, color: "cat4" },
  health: { icon: HeartPulseIcon, color: "cat6" },
  shopping: { icon: ShoppingBagIcon, color: "cat1" },
  entertainment: { icon: ClapperboardIcon, color: "cat7" },
  other: { icon: ShapesIcon, color: "cat8" },
  salary: { icon: BriefcaseIcon, color: "cat5" },
  gifts: { icon: GiftIcon, color: "cat6" },
} as const satisfies Record<DefaultCategoryKey, CategoryLook>;

export const CATEGORY_ICONS = {
  tag: TagIcon,
  coffee: CoffeeIcon,
  utensils: UtensilsIcon,
  pizza: PizzaIcon,
  beer: BeerIcon,
  shirt: ShirtIcon,
  car: CarIcon,
  fuel: FuelIcon,
  plane: PlaneIcon,
  bike: BikeIcon,
  baby: BabyIcon,
  pawPrint: PawPrintIcon,
  graduationCap: GraduationCapIcon,
  bookOpen: BookOpenIcon,
  dumbbell: DumbbellIcon,
  pill: PillIcon,
  scissors: ScissorsIcon,
  smartphone: SmartphoneIcon,
  wifi: WifiIcon,
  gamepad: Gamepad2Icon,
  music: MusicIcon,
  wrench: WrenchIcon,
  sofa: SofaIcon,
  piggyBank: PiggyBankIcon,
  wallet: WalletIcon,
  creditCard: CreditCardIcon,
  receipt: ReceiptIcon,
  trendingUp: TrendingUpIcon,
  handCoins: HandCoinsIcon,
  laptop: LaptopIcon,
  heart: HeartIcon,
  gift: GiftIcon,
} as const satisfies Record<CategoryIconKey, LucideIcon>;

// 32-bit FNV-1a: the same id always picks the same color, without storing one
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function hashOf(text: string) {
  let hash = FNV_OFFSET_BASIS;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash;
}

type LookSource = { id: string; defaultKey: DefaultCategoryKey | null };

// A renamed default category keeps its color; the user's own ones get one from their id
export function categoryColor(category: LookSource): CategoryColor {
  if (category.defaultKey !== null) return DEFAULT_LOOKS[category.defaultKey].color;

  return CATEGORY_COLORS[hashOf(category.id) % CATEGORY_COLORS.length] ?? "cat1";
}

// The user's own categories created before icons existed have none: they keep the tag icon
export function categoryLook(
  category: LookSource & { icon: CategoryIconKey | null },
): CategoryLook {
  if (category.defaultKey !== null) return DEFAULT_LOOKS[category.defaultKey];

  return { icon: CATEGORY_ICONS[category.icon ?? "tag"], color: categoryColor(category) };
}

export const categorySwatchVariants = cva("", {
  variants: {
    color: {
      cat1: "bg-cat-1",
      cat2: "bg-cat-2",
      cat3: "bg-cat-3",
      cat4: "bg-cat-4",
      cat5: "bg-cat-5",
      cat6: "bg-cat-6",
      cat7: "bg-cat-7",
      cat8: "bg-cat-8",
    },
  },
});

// The icon in its color on a 15% tint of it: the icon passes 3:1 on the tint in both themes
export const categoryTileVariants = cva(
  "flex shrink-0 items-center justify-center rounded-xl [&_svg]:shrink-0",
  {
    variants: {
      color: {
        cat1: "bg-cat-1/15 text-cat-1",
        cat2: "bg-cat-2/15 text-cat-2",
        cat3: "bg-cat-3/15 text-cat-3",
        cat4: "bg-cat-4/15 text-cat-4",
        cat5: "bg-cat-5/15 text-cat-5",
        cat6: "bg-cat-6/15 text-cat-6",
        cat7: "bg-cat-7/15 text-cat-7",
        cat8: "bg-cat-8/15 text-cat-8",
      },
      size: {
        default: "size-10 [&_svg]:size-5",
        sm: "size-8 rounded-lg [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);
