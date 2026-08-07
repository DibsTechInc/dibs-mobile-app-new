/**
 * The app's icon vocabulary. One name per idea, imported from here and nowhere else.
 *
 * ── Two rules ───────────────────────────────────────────────────────────────────────────────
 * **1. Lucide, at 1.5px stroke.** Never a unicode glyph. `▤ ◇ ○ ⌂` are characters that happen to
 * look vaguely iconic in a font that has them — a striped rectangle, a lozenge, a bare circle —
 * and they render exactly that badly on device (rejected 2026-08-07). Lucide's default stroke is
 * 2px, which reads heavy against DM Sans; `DESIGN_SYSTEM.md` specifies 1.5.
 *
 * **2. `Packages` is the shopping BAG, and the cart is a TROLLEY.** The bag is what the widget
 * uses for its own Packages tab, so a client moving between the two products meets the same mark
 * for the same thing. They were briefly the same icon here, which is how a cart and a storefront
 * came to look identical.
 *
 * Naming is by MEANING, not by shape — `Packages`, not `ShoppingBag`. When the mark for an idea
 * changes, it changes in this file and nowhere else.
 */
import {
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gift,
  House,
  Mail,
  Menu,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
  type LucideIcon,
} from 'lucide-react-native';

/** Lucide's own default is 2, which is too heavy beside DM Sans. */
export const ICON_STROKE = 1.5;

export type IconName = keyof typeof icons;

const icons = {
  /** The studio's schedule — what you tap to book. */
  book: Calendar,
  /** The client's own booked classes. The check is what separates it from `book`. */
  myCalendar: CalendarCheck,
  account: User,
  /** Class packs and memberships. The widget's mark for the same idea. */
  packages: ShoppingBag,
  /** Items pending purchase. Deliberately NOT the bag — see rule 2. */
  cart: ShoppingCart,
  menu: Menu,
  close: X,
  back: ChevronLeft,
  forward: ChevronRight,
  paymentMethods: CreditCard,
  contact: Mail,
  refer: Gift,
  home: House,
} satisfies Record<string, LucideIcon>;

export interface IconProps {
  name: IconName;
  size?: number;
  /** Any theme colour. Icons inherit meaning from context, so this is usually the parent's. */
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color, strokeWidth = ICON_STROKE }: IconProps) {
  const Glyph = icons[name];
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}
