/**
 * Input/output types for the purchase-breakdown waterfall.
 * Ported from legacy app/selectors/CartSelectors/PurchaseBreakdown (see
 * /legacy-reference). All money values are plain numbers at the boundary;
 * decimal.js is used internally.
 */

export type PromoType = 'FREE_CLASS' | 'PERCENT_OFF' | 'CASH_OFF';
export type PromoProduct = 'CLASS' | 'PACKAGE' | 'UNIVERSAL';

export interface Promo {
  type: PromoType | string;
  amount: number;
  product: PromoProduct | string;
}

/** One cart line for a class/event. One line per event+pass combination. */
export interface CartEventItem {
  eventid: number;
  /** Pass used to pay for this line, or null when paying with money. */
  passid: number | null;
  price: number;
  quantity: number;
  /** Tax rate percent (e.g. 8.875) of the event's location. */
  taxRatePercent: number;
}

/** A package cart line, already joined with its studio_packages row. */
export interface CartPackageItem {
  packageid: number;
  /** Effective price (discount_price when present, else list price). */
  price: number;
  quantity: number;
  /** Per-unit tax, already rounded to 2dp (see computeDetailedPackage). */
  packageTaxes: number;
  /** Tax rate as a fraction (e.g. 0.08875). */
  taxRate: number;
}

/** A credit-load cart line, already joined with its credit tier. */
export interface CartCreditItem {
  /** Tier payAmount — what the user pays. */
  price: number;
  quantity: number;
  /** Tier receiveAmount — credit balance the user receives. */
  receiveAmount: number;
  /** Tier loadBonus — bonus portion of receiveAmount. */
  loadBonus: number;
}

/** A user pass enriched against the cart (see enrichPassesInCart). */
export interface PassInCart {
  id: number;
  passValue: number;
  /** Sum of quantities of cart lines using this pass. */
  quantity: number;
  /** Sum of unit prices (NOT × quantity — legacy behavior) of those lines. */
  eventPrices: number;
  /** True for non-unlimited, non-third-party passes: show passValue math. */
  displayPassValue: boolean;
}

export interface UserCreditBalances {
  /** Studio credit balance (this studio). */
  studioCredit: number;
  /** Portion of studio credit that came from load bonuses. */
  studioCreditLoadBonus: number;
  /** Refer-a-friend credit balance. */
  rafCredit: number;
  /** Unexpired flash credit at this studio. */
  flashCredit: number;
}

export interface PricingInput {
  events: CartEventItem[];
  packages: CartPackageItem[];
  credits: CartCreditItem[];
  promo: Promo | null;
  passesInCart: PassInCart[];
  userCredits: UserCreditBalances;
}

/**
 * Full waterfall result. Field names mirror the legacy selectors 1:1 so the
 * golden-master tests read naturally; see breakdown.ts for the math.
 */
export interface PurchaseBreakdown {
  hasPackages: boolean;
  hasEvents: boolean;
  promoAppliedToPackage: boolean;
  promoAppliedToEvent: boolean;
  promoCodeAmount: number;
  flashCreditAmount: number;
  passesValue: number;
  adjustedPrices: number[];
  adjustedValue: number;
  valueBack: number;
  eventSubtotal: number;
  eventDiscountAmount: number;
  packSubtotal: number;
  packDiscountAmount: number;
  creditTotal: number;
  subtotal: number;
  subtotalWithPackageClasses: number;
  discountAmount: number;
  eventTaxAmount: number;
  packTaxAmount: number;
  taxAmount: number;
  subtotalAfterTax: number;
  studioCreditAppliedToPacks: number;
  studioCreditAppliedToEvents: number;
  studioCreditsApplied: number;
  amountAfterStudioCredits: number;
  rafCreditApplied: number;
  total: number;
}
