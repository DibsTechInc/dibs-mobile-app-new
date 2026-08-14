/**
 * The studio's packages, as a client reads them.
 *
 * PURE TypeScript. The screen renders this and decides nothing.
 *
 * ── Two products wearing one table ─────────────────────────────────────────────────────────────
 * `studio_packages` holds both class PACKS (buy ten, use ten, done) and MEMBERSHIPS (a recurring
 * charge that renews until cancelled). They are entirely different commitments and a client must
 * never mistake one for the other, so `kind` is decided once, here, and every piece of copy on the
 * card follows from it: a pack is priced "$200 · $20 per class", a membership "$145 per month".
 *
 * ── The unlimited trap, again ─────────────────────────────────────────────────────────────────
 * `classAmount` is populated on unlimited packages too — as a sentinel, usually 1 or 999 — so
 * reading it without checking `unlimited` first produces "1 class" for a monthly unlimited
 * membership. That exact mistake has been shipped on six different surfaces of this platform
 * (`passes.totalUses` in the shared CLAUDE.md). `unlimited` is checked FIRST, everywhere, and an
 * unlimited package gets the WORD rather than a number it does not have.
 *
 * ── What is deliberately not shown ────────────────────────────────────────────────────────────
 * Tax. `taxrate` rides on every row, but a studio's package prices are quoted pre-tax on the
 * widget and adding it here would make the app's number disagree with the web's for the same
 * product. The figure a card is charged is settled at checkout, by the server, as it is for a
 * class.
 */
import { formatPrice } from '@/domain/money/format';
import type { StudioPackage } from '@/api/schemas/packages';

export type PackageKind = 'pack' | 'membership';

export interface PackageView {
  id: number;
  /** The studio's name for it, or a generic one when they have asked for the name to be hidden. */
  name: string;
  kind: PackageKind;
  /** "$200" — the one-off price, or the recurring price for a membership. Null when unpriced. */
  priceLabel: string | null;
  /** "per month" for a membership; null for a pack. Set beside the price, quietly. */
  priceSuffix: string | null;
  /** "10 classes" / "Unlimited classes" / null when the package says nothing about a count. */
  allowanceLabel: string | null;
  /** "$20 per class" — only when the studio asked for it AND it can be computed honestly. */
  perClassLabel: string | null;
  /** "Valid for 3 months" — how long the pass lives once bought. */
  validityLabel: string | null;
  /** "3-month minimum" — a membership commitment. Never hidden; it is what somebody signs up to. */
  commitmentLabel: string | null;
  /** The studio's own copy, trimmed. Rendered verbatim when present. */
  description: string | null;
  /** An intro offer — only sellable as a first purchase. Worth flagging, it is a good deal. */
  isIntroOffer: boolean;
}

/** Anything not recognised is treated as a one-off. Never guess somebody into a subscription. */
function kindOf(pkg: StudioPackage): PackageKind {
  return pkg.autopay === 'FORCE' ? 'membership' : 'pack';
}

function isUnlimited(pkg: StudioPackage): boolean {
  return pkg.unlimited === true;
}

/**
 * How many sessions, in words.
 *
 * `unlimited` is checked before `classAmount` is READ, not merely before it is rendered — see the
 * note at the top of this file. `999` is a legacy sentinel for the same idea and is treated as
 * unlimited even when the flag is missing.
 */
function allowanceLabel(pkg: StudioPackage): string | null {
  if (isUnlimited(pkg)) return 'Unlimited classes';

  const count = pkg.classAmount;
  if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) return null;
  if (count >= 999) return 'Unlimited classes';

  return `${count} ${count === 1 ? 'class' : 'classes'}`;
}

/**
 * "$20 per class", and only when it is TRUE.
 *
 * Shown when the studio ticked `show_price_per_class`. An explicit `price_per_class_override`
 * wins — a studio that has typed a figure means that figure. Otherwise it is derived, but never
 * for an unlimited package: dividing a membership price by a sentinel count produces a per-class
 * rate nobody is being charged.
 */
function perClassLabel(pkg: StudioPackage, currency: string | undefined): string | null {
  if (pkg.show_price_per_class !== true) return null;

  const override = pkg.price_per_class_override;
  if (typeof override === 'number' && override > 0) {
    return `${formatPrice(override, currency)} per class`;
  }

  if (isUnlimited(pkg)) return null;

  const price = pkg.price;
  const count = pkg.classAmount;
  if (
    typeof price !== 'number' ||
    price <= 0 ||
    typeof count !== 'number' ||
    count <= 0 ||
    count >= 999
  ) {
    return null;
  }

  return `${formatPrice(price / count, currency)} per class`;
}

/** "Valid for 3 months". Singular/plural handled; an interval we do not recognise is passed on. */
function validityLabel(pkg: StudioPackage): string | null {
  const amount = pkg.passesValidFor;
  const interval = pkg.validForInterval?.trim();
  if (typeof amount !== 'number' || amount <= 0 || !interval) return null;

  const unit = amount === 1 ? interval.replace(/s$/, '') : interval.endsWith('s') ? interval : `${interval}s`;
  return `Valid for ${amount} ${unit}`;
}

/** "3-month minimum". `0` and `1` are both "no commitment" — one month is just the billing cycle. */
function commitmentLabel(pkg: StudioPackage): string | null {
  const months = pkg.commitment_period;
  if (typeof months !== 'number' || months <= 1) return null;
  return `${months}-month minimum`;
}

export interface BuildPackagesOptions {
  currency?: string;
}

/**
 * The one predicate for "can a client see this".
 *
 * The endpoint already filters `available`, `front_desk_only` and `is_placeholder`, and this
 * filters again — `is_placeholder` has been written inconsistently across this platform for years
 * and a placeholder package appearing in a storefront would offer a client the studio's internal
 * spot-hold mechanism for sale.
 */
function isSellable(pkg: StudioPackage): boolean {
  if (pkg.is_placeholder === true) return false;
  if (pkg.private === true) return false;
  return true;
}

export function buildPackages(
  packages: StudioPackage[],
  { currency }: BuildPackagesOptions = {},
): PackageView[] {
  return packages.filter(isSellable).map<PackageView>((pkg) => {
    const kind = kindOf(pkg);

    // A membership quotes what it will charge every cycle; a pack quotes what it costs once.
    // `priceAutopay` is the recurring figure and `price` the one-off, and they differ in live
    // data — showing a membership's one-off `price` would quote a number nobody is ever billed.
    const amount =
      kind === 'membership'
        ? (pkg.priceAutopay ?? pkg.price ?? null)
        : (pkg.price ?? null);

    return {
      id: pkg.id,
      // `should_display_name === false` is the studio asking for the name to be withheld. Rare,
      // and honoured — with a generic label rather than a blank card.
      name:
        pkg.should_display_name === false
          ? kind === 'membership'
            ? 'Membership'
            : 'Class package'
          : pkg.name.trim(),
      kind,
      priceLabel:
        typeof amount === 'number' && Number.isFinite(amount) && amount > 0
          ? formatPrice(amount, currency)
          : null,
      priceSuffix: kind === 'membership' ? 'per month' : null,
      allowanceLabel: allowanceLabel(pkg),
      perClassLabel: perClassLabel(pkg, currency),
      // A membership's pass is reissued every cycle, so "valid for 1 month" beside "per month" is
      // noise that reads like a restriction. Packs are where the expiry is real news.
      validityLabel: kind === 'membership' ? null : validityLabel(pkg),
      commitmentLabel: commitmentLabel(pkg),
      description: pkg.customDescription?.trim() || null,
      isIntroOffer: pkg.onlyFirstPurchase === true,
    };
  });
}
