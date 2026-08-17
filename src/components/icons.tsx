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
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  House,
  Mail,
  Menu,
  Phone,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/** Lucide's own default is 2, which is too heavy beside DM Sans. */
export const ICON_STROKE = 1.5;

/** What every glyph in the map accepts — the subset of Lucide's props this app passes. */
interface GlyphProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * The ONE hand-drawn glyph, and the reason it is not a Lucide import.
 *
 * The approved mock (`design/mockups/rework.html`, `#ic-calendar`) draws Book as a calendar with
 * two flush-left content lines, long over short — it reads as "a schedule with entries in it".
 * Lucide has no equivalent. `Calendar` is empty inside, so at 21px it reads as a blank date box
 * and says nothing about a schedule. `CalendarDays` puts six dots in a grid, which reads as a
 * month view. `CalendarRange` is the closest in structure but interrupts both lines with dots,
 * which at 21px reads as noise rather than as lines. Rendered side by side at true size against
 * the mock, this one was the only match (2026-08-07).
 *
 * Drawn in Lucide's own grammar — 24×24 viewBox, no fill, 1.5 stroke, round caps and joins — so
 * it sits in a row beside real Lucide marks without looking like a different family. That is what
 * rule 1 below is actually protecting: real vector marks at a consistent weight, never a unicode
 * character. If Lucide ever ships a clean two-line calendar, replace this with it and delete the
 * component.
 */
function CalendarLines({ size = 24, color = 'currentColor', strokeWidth = ICON_STROKE }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M8 2v4" />
      <Path d="M16 2v4" />
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Path d="M3 10h18" />
      <Path d="M7.5 14h9" />
      <Path d="M7.5 17.5h5" />
    </Svg>
  );
}

export type IconName = keyof typeof icons;

const icons = {
  /** The studio's schedule — what you tap to book. See CalendarLines for why it is hand-drawn. */
  book: CalendarLines,
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
  /** A selected state — the services checkbox, the booked-success mark. */
  check: Check,
  contact: Mail,
  phone: Phone,
  document: FileText,
  refer: Gift,
  home: House,
} satisfies Record<string, ComponentType<GlyphProps>>;

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
