# Design Brief — Dibs White-Label Studio App

**How to use this file:** paste everything below the line into a fresh Claude session (claude.ai or Claude Code with the frontend-design skill) to generate the mockup set. It is self-contained. Output mocks land in `design/mockups/` in this repo; Alicia reviews in a browser before any screen is implemented (see MOBILE_MASTER_PLAN.md §5.3).

---

You are an experienced product designer — the kind who has shipped consumer apps people describe as "expensive-feeling." You are designing the screen system for a **white-label mobile app template** for boutique fitness studios (yoga, pilates, cycling, barre, wellness). Read this whole brief before designing anything.

## The product

Dibs is a booking platform that spins up a branded iOS/Android app for each studio. The studio provides exactly three things: a **logo**, an **accent color**, and **one vertical hero photograph**. Everything else — typography, layout, motion, component anatomy — is the template. Clients of the studio use the app to browse the schedule, book classes and appointments, buy class packs and memberships, manage cards and subscriptions, and collect credits.

The bar: a studio owner opening their app for the first time should think "this looks like WE hired a design studio." Their clients should feel the app belongs at Alo Yoga or Equinox tier, not "gym software." If any screen could pass for a generic Bootstrap/AI-generated app, it has failed.

## The two-layer design system (the core concept)

**Layer 1 — Template DNA. Fixed. Identical in every studio's app.**

- **Typography IS the identity.** Fraunces (serif, optical sizing, weight 400–500, letter-spacing -0.02em on display sizes) for headlines, numerals-as-heroes, and editorial moments. DM Sans (400/500/600/700) for everything else. The serif/sans interplay is what makes the template unmistakable. Both fonts are OFL — they ship embedded.
- **Warm neutrals, never pure white/black:** background `#FDFBF7`, subtle surface `#F7F4EF`, text `#2D3436`, secondary `#5D6469`, tertiary `#8A9099`, border `#E8E4DF`, divider `#EEEAE5`. Dark mode is out of scope for v1 (note it, don't design it).
- **Borders, not shadows.** 1px `#E8E4DF`. If depth is truly needed: `0 1px 3px rgba(0,0,0,0.06)` max.
- Radii: cards 8px, buttons 6px, inputs 4px, sheets 16px top corners. Spacing on an 8px base: 4/8/12/16/24/32/48/64.
- Icons: Lucide, 1.5px stroke, inherit text color. Icons clarify, never decorate.
- Semantic colors (fixed): success `#45B585`, warning `#D4A574`, error/destructive `#C0675A`, info `#7E92A3`.
- Motion: 200–300ms, ease-out or gentle spring. Motion communicates causality (sheet rises from the tapped card), never decorates.

**Layer 2 — Studio Personality. Variable per studio. Expressed as CSS variables in your mocks.**

- `--accent`: the studio's brand color, plus derived tones you should compute per variant: `--accent-pressed` (darkened ~12%), `--accent-wash` (very light tint for backgrounds, ~92% toward the bg neutral), `--on-accent` (white or near-black, whichever passes WCAG AA on the accent).
- `--hero-image`: one vertical photograph. It appears in exactly three places: splash, the Home header, and the auth backdrop — always under a consistent legibility treatment (subtle bottom-up darkening gradient, `rgba(20,18,16,0)` → `rgba(20,18,16,0.55)`).
- Logo: header wordmark slot (max-height 28px) and splash.
- **The accent is used with terracotta-like scarcity:** primary CTA fills, the selected state, progress, one highlight per screen. Never large background floods (the wash tint is the only permitted large use). This restraint is what keeps a neon-brand studio's app from looking like a toy.
- **No Dibs brand colors anywhere.** This is the studio's app. Dibs appears only as a "Powered by Dibs" caption on the Account screen, set in tertiary text.

## The three proof studios (every screen ships in all three)

These are the REAL pilot studios launching first — the mocks you produce are reviewed as the actual products. Build each mock so the personality layer is swappable via CSS variables, and render all three variants side-by-side. If a screen only works for one of them, the template is broken.

1. **Carlsbad Village Yoga** — coastal California yoga studio. Accent `#356280` (slate blue — passes AA with white text). Classes-only: schedule, class packs, class checkout. Hero: use a warm sunlit yoga-studio placeholder photo (their real hero is `https://dibs-email-assets.s3.amazonaws.com/images/studio-images/cvyoga_hero.png` if reachable). The "calm" case.
2. **Everyday Ballet** — NYC ballet studio. Accent `#F986A5` (light pink — **fails contrast with white text**; your derived `--on-accent` MUST flip to near-black on this one, and pressed/wash tones must stay elegant, never candy-like). Classes-only. This is the built-in theming stress test.
3. **Independent Training Spot (IGTS)** — NYC training facility that rents space to independent trainers. Accent: `#1A92E4` — confirmed final (2026-07-21); design with it as-is. **Appointments-only: this variant has NO class schedule.** Its Home leads with appointment booking and active subscriptions instead of a schedule rail — you must design that Home composition, not just re-skin the class one. Also: **no instructor names shown anywhere in this variant** (their instructor data is auto-assigned and meaningless). It's also the flash-credits studio — screen 13 gets reviewed primarily in this variant.

Additionally, render the Home screen and payment sheet once in a fourth hostile variant — accent `#E8442A` (loud red-orange, "VOLT" energy) — purely to prove a hot brand color stays premium under the scarcity rules. No other screens need it.

## Screens to design (17)

For each: mobile frame 390×844, real-feeling content (use the proof-studio contexts, never lorem ipsum), all states noted below.

**A. Arrival**
1. **Splash → Home transition** (show as 2 frames): full-bleed hero photo with logo, settling into Home. This is the studio's "cover."
2. **Home** — the editorial heart. Hero header (photo + studio name in Fraunces), "Your next class" card if booked, today's schedule rail, flash-credit surface slot (see screen 13), quiet entry points to Packages and Account. Asymmetric composition welcome; no card-grid-of-everything. **Two compositions required:** classes-mode (schedule rail) and appointments-mode (book-a-session entry + active subscription card in place of the rail — the IGTS variant).
3. **Auth** (sign in / create account) — hero backdrop, minimal fields, calm. No social buttons in v1.

**B. Browse & book**
4. **Class schedule** — day strip + list. Class cards: time as a Fraunces numeral moment, class name, instructor, capacity state (open / "3 spots left" / waitlist). Filters as quiet chips.
5. **Class detail** — description, instructor, location, price logic ("Included in your membership" / "1 credit from your 10-pack" / "$28"), sticky book CTA.
6. **Appointment booking flow** (2 frames): service selection; date+time slot picker. Slot grid must feel designed, not `<table>`-default.
7. **Payment selection sheet** — THE money moment. Bottom sheet: preselected smart default (their pass), alternates (credit balance, saved card, Apple Pay), promo code entry folded behind a quiet text link. Total in Fraunces. One accent CTA.
8. **Booking success** — a designed moment, not an alert. Confirmation, class details, "Add to calendar," subtle celebratory motion note (e.g., a drawn checkmark, 400ms). This screen earns the push-permission ask later — make it feel like a win.

**C. Money & membership**
9. **Packages storefront** — class packs + memberships. Price hierarchy in Fraunces; membership card visually distinct (accent-wash field) from packs (bordered cards). "Best value" as editorial caption, not a badge screaming.
10. **Wallet** — owned passes (uses remaining as big numerals), credit balance, saved cards, upcoming subscription payments ("Next invoice · charged on the 25th · $200"). Dense but breathing.
11. **Membership/subscription detail** — status, next billing, sessions this cycle, cancel entry point (quiet, not hidden — trust is the brand).
12. **Cancel flow** (sheet) — states: on-time cancel (what returns to them) vs late/early-cancel consequences vs membership cancel-at-period-end ("you keep access until Aug 31"). Honest, specific copy; destructive action in `#C0675A`, never the accent.

**D. Delight**
13. **Flash credits surface** — the "fun and exciting" one, and the hardest tone to hit. A time-limited credit ("$15 off any class — expires in 6h 12m"). Needs: live countdown, the amount as a Fraunces hero numeral, an accent-wash field that feels charged without violating calm (think: a ticket, a stamped voucher, an editorial "limited edition" object — NOT a coupon, NOT confetti, NO pulsing). Show it in two densities: Home inline card + expanded detail sheet. Also show its "applied at checkout" line item state.
14. **Milestone celebration** — full-screen takeover for "Your 25th class." Editorial poster energy: giant Fraunces numeral, class-count context, studio hero photo treatment. One-tap dismiss. Tasteful haptic/motion note.
15. **Your journey card** (Account) — visits count, next milestone progress (thin accent progress line), lifetime-member-since. Understated; the pipes for future gamification.

**E. Account**
16. **Account hub** — profile, wallet entry, journey card, notification prefs, refer-a-friend row ("Give $10, get $10" — specific, calm), support, terms, a quiet "Delete account" row (destructive color `#C0675A`, tucked at the bottom with sign-out — required by Apple, designed with dignity: its confirmation states plainly what is kept for financial records and that active memberships must be canceled first), Powered by Dibs caption.
17. **System states sheet** — one reference frame showing the template's skeleton loading, empty state (e.g., "No classes Thursday. The 6am Flow has space Friday."), error/retry, and the **studio-unavailable degraded mode** (studio's booking is paused platform-side: read access and cancellations remain, booking CTAs replaced by a calm "Booking is temporarily unavailable — contact {studio}" notice — composed, never alarming). Empty states get editorial copy, never sad-face illustrations.

## Anti-patterns — instant failures

- Even 16px spacing everywhere; card-wrapping every element; icon next to every label
- Drop shadows, gradients (except the hero legibility gradient), pure white backgrounds
- Generic blue defaults; accent used as large background fills; three accents fighting per screen
- Symmetric grid monotony when asymmetry serves the content
- Exclamation-point copy, "Hurry!", badge-spam, fake urgency — even on flash credits (ESPECIALLY on flash credits: the countdown itself is the urgency; the design stays composed)
- Bottom-sheet CTAs that look bolted on; hover/pressed states as afterthoughts (spec pressed states: accent-pressed fill, 150ms)
- Anything that looks like it came from a UI kit

## Deliverable format

- Standalone HTML files, no build step, Google Fonts import for Fraunces + DM Sans.
- One file per screen group (arrival.html, browse.html, money.html, delight.html, account.html), each showing its screens × 3 studio variants side-by-side in 390×844 device frames on a neutral review canvas.
- All personality-layer values as CSS variables scoped per variant container, so re-theming is visibly just variables.
- Kebab-case `id` attributes on meaningful containers (`payment-sheet`, `flash-credit-card`, `hero-header`) for review conversation.
- Brief design-rationale comment at the top of each file: what the composition is doing and why it won't age into "generic."
- Where motion matters, implement it in CSS (countdown tick, checkmark draw, sheet rise) so the review shows feel, not just layout.

## Copy voice (for all mock content)

Calm, specific, honest. "3 spots left," not "Almost full!!" — "You'll keep access until August 31," not "Are you sure you want to cancel??" — "Your 25th class at Drift" not "WOW! Amazing milestone!" Respect the reader's intelligence; the studio's clients are adults who chose a considered studio.
