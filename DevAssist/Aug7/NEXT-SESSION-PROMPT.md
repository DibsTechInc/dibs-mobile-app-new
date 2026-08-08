# Next session — paste this whole file as your first message

You are picking up the **dibs-mobile-app** rebuild, mid-flight. Read this entire file before
running anything. It is self-contained: do not assume Alicia remembers any prior context.

---

## 0. Permissions you have — use them

Alicia has granted these explicitly (2026-08-07). **You do not need to ask again.**

| You may | Command |
|---|---|
| **Screenshot her booted iOS simulator and look at it** | `xcrun simctl io booted screenshot <file>` |
| List simulators | `xcrun simctl list devices booted` |
| **Run Expo yourself** — dev server, native builds | `npx expo start`, `npx expo run:ios` |

**The screenshot is the single most important thing in this file.** The previous session shipped
four broken builds because it wrote React Native UI without ever seeing it render, then "fixed"
the result five times by hypothesis instead of measurement. Every one of those guesses cost Alicia
a test cycle. That is the failure mode this session exists to end.

`xcrun simctl io booted screenshot out.png` writes a PNG you can `Read`. It is exactly what she
sees. It needs a filename — running it bare just prints usage.

**Rule: never tell her a screen is done until you have screenshotted it and looked at it.**

---

## 1. Run this first, in this order

```bash
cd /Users/aliciaulin/Desktop/dibs/code/dibs-mobile-app

# 1. Confirm you can see the simulator. If nothing is booted, ask her to open it.
xcrun simctl list devices booted
xcrun simctl io booted screenshot /tmp/sim-check.png   # then Read that file

# 2. Gate — should be green before you change anything
npm run typecheck && npx jest && npm run lint
# Expect: typecheck clean · 648/648 · 0 errors (2 pre-existing Decimal warnings)

# 3. Dev server, pointed at STAGING (not local — see §3)
EXPO_PUBLIC_API_URL=https://dibs-api-staging-production.up.railway.app/api/v2 \
  STUDIO_SLUG=everyday-ballet npx expo start
```

Branch: `feature/modernize-dibs-mobile-app`. **Commit locally, never push.** Alicia reviews in
GitKraken and pushes herself. Recent work is ~18 unpushed commits.

---

## 2. THE ONE TASK — do this and nothing else until she has seen it

**Schedule rows render stacked vertically on device.** Time, duration, class name, instructor and
price each land on their own full-width line instead of laying out as a row. Confirmed on the real
simulator at 19:52 on 2026-08-07 — not a web artifact.

The same symptom hit the Home menu (three choices ran together, labels overlapping) and the account
rows. It looks like `flexDirection: 'row'` is being partially or wholly ignored inside `Pressable`.

### What has already been ruled OUT — do not retry these

| Tried | Result |
|---|---|
| Returning an array from the Pressable style function instead of an object | Did not fix it. (Worth keeping anyway — every older component does it, and there is now a CI guardrail.) |
| `minWidth: 0` on the flex children | No change |
| `width: '100%'` on the row container | No change |
| Making the row a plain `View` inside `FadeRise` rather than styling `FadeRise` itself | No change |
| Explicit `width={windowWidth / 3}` per cell | Made it worse — labels collapsed together |
| Removing `inset: 0` (a CSS shorthand RN ignores, so absolutely-positioned layers had no bounds) | **Real bug, genuinely fixed** — but not the cause of the stacking |

### The untried hypothesis, and how to test it CHEAPLY

Symptom fits a **transform problem, not a flexbox one**: NativeWind's JSX transform is active
(`babel.config.js` sets `jsxImportSource: 'nativewind'`), and styles on `Pressable` appear to apply
*partially and inconsistently* — some properties land, others vanish.

**Test it in isolation before touching a real screen:**

1. There is an unused route at `src/app/dev-shell.tsx`. Put ONE schedule row in it with hardcoded
   fixture props — no data, no auth, no network.
2. Render three variants side by side:
   - the current `Pressable` with a style function
   - a `Pressable` with **no style at all**, wrapping a plain `<View>` that owns all the layout
   - a plain `<View>` with `onTouchEnd` (no Pressable)
3. Screenshot the simulator. Whichever lays out correctly is the answer.

If the second or third works, the fix is mechanical: **`Pressable` carries no layout; a plain View
inside it does.** Apply that everywhere and re-screenshot.

**Show Alicia the dev-shell screenshot before wiring anything back into the real screens.**

---

## 3. The process she asked for — follow it

Her instinct, and it is correct: **build the shell, then plug in the pipes.**

1. Component into `/dev-shell` with fixture props. No data.
2. `xcrun simctl io booted screenshot` → Read it → fix → repeat until right.
3. **Show her the screenshot.**
4. Only then wire real data.

The previous session built four screens *and* their data wiring together, so every layout fix had
to travel through auth, queries and a rebuild before anything could be seen. Do not repeat that.

Small increments. One component, one screenshot, her eyes, next component.

---

## 4. Environment — everything you need

| | |
|---|---|
| **Staging API** | `https://dibs-api-staging-production.up.railway.app/api/v2` — sandbox Stripe, HTTPS, has real data |
| **Test login** | `alicia.ulin@gmail.com` / `password` |
| **Use studio 88** (`everyday-ballet`) | userid 2502 holds **two live passes** there and none at 210 |
| Local API | `http://localhost:3001/api/v2` — works, but its DB has **zero** `passes` and `dibs_transactions`. Second choice. |
| Staging DB (direct psql) | `STAGING_DATABASE_URL` in `../dibs-api/.env` — 87k passes, 594k transactions |

A web preview also exists (`npx expo start --web`, Stripe stubbed for web in `metro.config.js`).
**Trust the simulator over it.** The web harness gave a 495px viewport when told 393 and sent the
last session chasing an artifact for two rounds.

---

## 5. Design — SETTLED and approved, do not redesign

Approved mock: **`design/mockups/rework.html`** (open it in a browser). Full spec is in
`EXECUTION_STATE.md` under "Design decisions made". The short version:

- **Home = a photograph and three choices. Nothing else.** No schedule, no upcoming classes, no
  CTA. The photo is full-bleed and never cropped by a panel. A **flat** veil over the whole frame
  plus a soft foot — never a gradient that reaches full strength and stops, which draws a visible
  edge across the picture.
- **No tab bar anywhere.** Three choices push a screen with a back chevron; the hamburger drawer
  moves sideways.
- **Schedule:** the studio's accent colour owns the header block, holding the month label and the
  day strip. The month label is load-bearing — without it the strip reads `18 · 19 · 2 · 8` across
  a month boundary and looks broken. Empty days stay in the strip, dimmed and still tappable.
  **Rows align to the TOP** — the time sits level with the first line of the class name.
- **Account:** money first — credit and passes above navigation.
- **Icons: Lucide at 1.5px stroke, never unicode glyphs.** Named by meaning in
  `src/components/icons.tsx`. Packages is the widget's `shopping-bag`; the cart is a trolley.

Alicia's design bar: editorial, restrained, Fraunces + DM Sans, borders not shadows, the studio's
colour as the personality. **When in doubt, remove something.** The version she rejected had seven
elements on the photograph; the approved one has three.

---

## 6. What is already DONE and working — do not rebuild it

- **P0** — API client, zod schemas, auth (Firebase against `dibs-studio-clients`), theme system,
  white-label loader, CI.
- **P1** — schedule + class detail data layer, one shared query with Home.
- **P2** — passes, credit, saved cards, profile edit, and the card write paths (add via
  PaymentSheet, remove, set default). Endpoints verified against live staging.
- **Domain logic** — `pricing`, `time`, `schedule`, `home`, `bookings`, `cancellation`, `auth`,
  `passes`, `payments`, `wallet`, `profile`, `money`. 648 tests.

**Only the presentation is in question.** The data layer is sound.

---

## 7. Invariants that must not be broken

Read `MOBILE_MASTER_PLAN.md` §9 in full. The ones most likely to bite:

1. **Never create PaymentIntents client-side.**
2. **`source: 'dibs'`** on every booking payload, never `'zf'`.
3. **All times UTC, displayed verbatim.** Arithmetic through `studioNow()`. The one exception is
   `passes.expiresAt`, a real instant that must be formatted in the studio's zone.
4. **`is_placeholder` passes never appear in any list.**
5. **No hardcoded studio ids, colours, keys or URLs in `src/`.**
6. **No raw hex in components** — theme tokens only.
7. **`inset` is not a valid RN style prop.** Write `top/left/right/bottom` individually.
8. **Pressable style functions must return an ARRAY**, not an object. There is a CI guardrail.

Ask before: DB schema changes, new dibs-api endpoints, anything touching billing or Stripe,
deleting files or features.

`POST /update-profile` is being hardened by **another agent** — do not touch that route.

---

## 8. Definition of done for any UI change

1. `npm run typecheck && npx jest && npm run lint` green.
2. All 5 CI grep guardrails clean (see `.github/workflows/ci.yml`).
3. **You have screenshotted the simulator and looked at it.**
4. You have shown Alicia the screenshot.

**Report honestly.** If you have not seen something render, say so in those words. The previous
session's worst failure was not the bug — it was presenting unverified guesses as diagnoses.

---

## 9. Suggested opening message to Alicia

> I've read the handoff. Before I change anything I'm going to put a single schedule row into
> `/dev-shell` with fixture props and screenshot the simulator, to find out why rows stack instead
> of laying out horizontally. Three variants — Pressable with a style function, Pressable with the
> layout on a plain View inside it, and no Pressable at all. I'll show you the screenshot before
> touching any real screen.
>
> Is your simulator booted?
