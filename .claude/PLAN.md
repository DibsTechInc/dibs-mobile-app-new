# Dibs Mobile App Modernization Plan (Revised)

## Overview

Modernize the Dibs mobile app from a 2022 React Native/Expo SDK 36 codebase to a modern, whitelabel-capable booking application for end customers of appointment-based service businesses (fitness studios, salons, spas, etc.).

**Migration strategy: Fresh start.** The existing codebase (Expo SDK 36, React 16, React Navigation v4, JavaScript, Redux) is too outdated for incremental upgrades. We will create a new Expo project, port business logic, and build new UI from scratch — while the old app stays live until the new one is ready.

---

## Architectural Decisions

All decisions are final. No open questions remain.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React Native + Expo SDK 52 | Fastest cross-platform development, managed workflow |
| Language | TypeScript (strict mode) | Type safety, better DX, catch bugs at compile time |
| Navigation | Expo Router v4 | File-based routing, deep linking built-in, wraps React Navigation |
| State Management | Zustand (UI) + TanStack Query (server) | Minimal boilerplate, automatic caching/revalidation for API data |
| Styling | NativeWind v4 | Tailwind CSS for RN, dark mode nearly free, fast iteration |
| Auth | Firebase Auth (existing) | Already integrated in dibs-api backend |
| Payments | Stripe React Native SDK | Already integrated in dibs-api with connected accounts |
| Push Notifications | Expo Notifications | Wraps FCM/APNs, simplest with Expo managed workflow |
| Analytics | Firebase Analytics | Same ecosystem as Firebase Auth, no new vendor |
| Offline | Minimal | Cache last-viewed schedule via TanStack Query; require network for bookings |
| Whitelabel | Config-driven theming + EAS build profiles | Maps to existing `config.json` pattern, build-time branding injection |
| Biometric Login | Yes (expo-local-authentication) | Trivial to add, major UX win for returning users |
| Dark Mode | Yes, follow system setting | NativeWind makes this nearly free; design tokens from day one |
| Tablet Layouts | No (V1) | Responsive design handles minor size differences |
| Watch Support | No (V1) | Out of scope for initial release |
| Testing | Jest + RNTL + Maestro (E2E) | Maestro is far simpler than Detox for Expo apps |
| CI/CD | EAS Build + EAS Submit | Native Expo toolchain, build profiles per studio |

---

## Project Context

### What We're Building
- **Primary user**: End customer (studio's client, not the studio owner)
- **Core purpose**: Make booking appointments/classes as convenient as possible
- **Branding strategy**: Light Dibs branding; studio branding takes center stage
- **Distribution**:
  - Single Dibs app (multi-studio aggregator)
  - Whitelabeled apps per studio (App Store ready with studio branding)

### Existing Assets
| Asset | Path | Status | Notes |
|-------|------|--------|-------|
| dibs-mobile-app | `/code/dibs-mobile-app` | Outdated (2022) | React Native + Expo SDK 36, Redux |
| dibs_mobile_app_new | `/code/dibs_mobile_app_new` | Incomplete | Partial rewrite attempt |
| dibs-api | `/code/dibs-api` | Active | Node.js/Express, Firebase Auth, Stripe |

### Key Backend Capabilities (Already Available — No Backend Changes Needed)
- Firebase authentication
- Stripe payments (connected accounts per studio)
- User management (dibs_user model)
- Studio configuration and theming
- Event/class scheduling
- Booking and checkout flows
- Pass/package management
- Credit system (studio credits, flash credits, RAF credits)
- Friend referral program
- Widget routes for customer-facing operations

---

## Tech Stack

```yaml
Framework:          React Native 0.76+ with Expo SDK 52
Language:           TypeScript (strict mode)
State Management:   Zustand (global/UI state) + TanStack Query v5 (server state)
Navigation:         Expo Router v4 (file-based routing)
Styling:            NativeWind v4 (Tailwind CSS for React Native)
Auth:               Firebase Auth (via @react-native-firebase/auth)
Payments:           @stripe/stripe-react-native
Push Notifications: expo-notifications
Biometric Auth:     expo-local-authentication
Analytics:          Firebase Analytics (via @react-native-firebase/analytics)
Deep Linking:       Expo Router (built-in) + expo-linking
Calendar:           expo-calendar
Maps:               react-native-maps
Testing:            Jest + React Native Testing Library + Maestro (E2E)
CI/CD:              EAS Build + EAS Submit + GitHub Actions
Error Tracking:     Sentry (via @sentry/react-native)
```

---

## Project Structure

```
/dibs-mobile-app/
├── app/                              # Expo Router — file-based routing
│   ├── (auth)/                       # Auth flow (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx               # Landing / intro screen
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── reset-password.tsx
│   │   └── terms.tsx
│   ├── (main)/                       # Main app (authenticated)
│   │   ├── _layout.tsx               # Tab navigator layout
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # Tab bar configuration
│   │   │   ├── schedule.tsx          # Schedule / home
│   │   │   ├── bookings.tsx          # Upcoming & past bookings
│   │   │   ├── rewards.tsx           # Credits, flash credits, referrals
│   │   │   └── profile.tsx           # User profile & settings
│   │   ├── studio/
│   │   │   ├── [id].tsx              # Studio profile
│   │   │   └── search.tsx            # Studio search & discovery
│   │   ├── class/[id].tsx            # Class detail & booking
│   │   ├── checkout.tsx              # Checkout flow
│   │   ├── packages/
│   │   │   ├── index.tsx             # Available packages
│   │   │   └── [id].tsx              # Package detail
│   │   ├── payment-methods/
│   │   │   ├── index.tsx             # Saved payment methods
│   │   │   └── add.tsx               # Add new card
│   │   ├── referrals.tsx             # Refer-a-friend
│   │   └── settings/
│   │       ├── index.tsx             # Settings menu
│   │       ├── edit-profile.tsx
│   │       ├── edit-email.tsx
│   │       └── notifications.tsx
│   ├── _layout.tsx                   # Root layout (auth gate, providers)
│   └── index.tsx                     # Entry redirect
├── components/
│   ├── ui/                           # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx              # Loading skeletons
│   │   ├── Toast.tsx                 # In-app notifications
│   │   └── ErrorBoundary.tsx         # Error boundary component
│   ├── schedule/                     # Schedule-related components
│   │   ├── DaySelector.tsx
│   │   ├── ClassCard.tsx
│   │   ├── FilterBar.tsx
│   │   └── TimeSlot.tsx
│   ├── booking/                      # Booking flow components
│   │   ├── BookingCard.tsx
│   │   ├── PriceBreakdown.tsx
│   │   ├── CreditApplier.tsx
│   │   └── ConfirmationView.tsx
│   ├── studio/                       # Studio-related components
│   │   ├── StudioCard.tsx
│   │   ├── StudioHeader.tsx
│   │   └── StudioSwitcher.tsx
│   └── rewards/                      # Credits/rewards components
│       ├── CreditBalance.tsx
│       ├── FlashCreditBanner.tsx
│       └── RewardProgress.tsx
├── hooks/
│   ├── useAuth.ts                    # Auth state & actions
│   ├── useStudio.ts                  # Active studio context
│   ├── useBooking.ts                 # Booking mutations
│   ├── useCredits.ts                 # Credit queries
│   ├── useSchedule.ts               # Schedule queries with filters
│   └── useBiometric.ts              # Biometric auth
├── services/
│   ├── api/
│   │   ├── client.ts                 # Fetch wrapper (auth, refresh, errors)
│   │   ├── endpoints.ts              # Typed endpoint definitions
│   │   └── queries/                  # TanStack Query definitions
│   │       ├── auth.ts
│   │       ├── studio.ts
│   │       ├── schedule.ts
│   │       ├── booking.ts
│   │       ├── payments.ts
│   │       ├── credits.ts
│   │       └── packages.ts
│   ├── auth/
│   │   └── firebase.ts              # Firebase Auth wrapper
│   ├── payments/
│   │   └── stripe.ts                # Stripe integration
│   └── notifications/
│       └── push.ts                  # Push notification setup & handlers
├── store/
│   ├── auth.ts                      # Auth state (Zustand)
│   ├── studio.ts                    # Active studio selection (Zustand)
│   ├── cart.ts                      # Cart/checkout state (Zustand)
│   └── ui.ts                        # UI state — modals, toasts (Zustand)
├── theme/
│   ├── tokens.ts                    # Design tokens (colors, spacing, typography)
│   ├── ThemeProvider.tsx            # Theme context with dark mode + studio branding
│   └── tailwind.config.ts          # NativeWind/Tailwind configuration
├── config/
│   ├── studio.config.ts            # Studio-specific runtime config
│   ├── app.config.ts               # Expo dynamic config
│   └── constants.ts                # App-wide constants
├── utils/
│   ├── format.ts                   # Date, currency, number formatting
│   ├── validation.ts               # Input validation helpers
│   └── linking.ts                  # Deep link helpers
├── types/
│   ├── api.ts                      # API request/response types
│   ├── models.ts                   # Domain models (User, Studio, Event, etc.)
│   └── navigation.ts               # Route params
├── assets/
│   ├── images/
│   ├── fonts/
│   └── studios/                    # Whitelabel assets per studio
├── e2e/                            # Maestro E2E test flows
│   ├── auth.yaml
│   ├── booking.yaml
│   └── checkout.yaml
├── __tests__/                      # Unit & component tests
├── app.config.ts                   # Expo config (dynamic)
├── eas.json                        # EAS build profiles
├── tailwind.config.ts
├── tsconfig.json
├── babel.config.js
└── package.json
```

---

## Development Phases

### Phase 0: Foundation (Week 1)

> **Goal**: Every subsequent phase builds on this foundation. No screen work yet — just infrastructure.

#### 0.1 Project Scaffolding
- Create new Expo project: `npx create-expo-app@latest dibs-mobile-app --template tabs`
- Configure TypeScript strict mode (`tsconfig.json`)
- Set up ESLint + Prettier (consistent code style)
- Configure path aliases (`@/components`, `@/hooks`, etc.)
- Set up NativeWind v4 with `tailwind.config.ts`

#### 0.2 CI/CD Pipeline
- EAS Build configuration (`eas.json`) with profiles:
  - `development` — development client for testing
  - `preview` — internal distribution (TestFlight / internal track)
  - `production` — App Store / Play Store submission
- GitHub Actions workflow: lint + type-check + test on every PR
- Sentry integration for error tracking

#### 0.3 API Client & Auth Foundation
- Build `services/api/client.ts` — typed fetch wrapper ported from existing `dibsFetch`:
  - Bearer token authentication
  - Automatic token refresh (port from existing `refreshUserToken` logic)
  - Network connectivity check
  - Sentry error capture
  - Request/response type safety
- Set up Firebase Auth (`services/auth/firebase.ts`)
- Build `useAuth` hook with auth state listener
- Token persistence with `expo-secure-store` (upgrade from AsyncStorage)
- Biometric authentication setup (`expo-local-authentication`)

#### 0.4 Theme & Design System
- Define design tokens (`theme/tokens.ts`): colors, spacing, typography, shadows
- Build `ThemeProvider.tsx`:
  - Studio branding colors (from config)
  - Dark mode support (follows system setting)
  - NativeWind CSS variable integration
- Build core UI components with theming:
  - `Button`, `Card`, `Input`, `Badge`, `Skeleton`, `Toast`
  - `ErrorBoundary` with fallback UI
- Set up toast/notification system for in-app feedback

#### 0.5 Whitelabel Config System (Early Setup)
- Define `StudioConfig` type and `studio.config.ts`
- Configure `app.config.ts` (Expo dynamic config) to read studio environment variables
- Set up EAS build environment variable injection
- This ensures every screen built in Phase 1+ automatically uses studio theming

#### 0.6 State Management Setup
- Configure Zustand stores: `auth.ts`, `studio.ts`, `cart.ts`, `ui.ts`
- Configure TanStack Query provider with default options (stale time, retry, etc.)
- Set up query key factory pattern for organized cache management

**Phase 0 Deliverable**: A runnable app shell with auth infrastructure, themed components, and API client — ready for feature screens.

---

### Phase 1: Browse & Discover (Weeks 2-5)

> **Goal**: Users can sign up, find studios, browse schedules, and view class details. Read-only value — no transactions yet.

#### 1.1 Authentication & Onboarding (Week 2)

**Screens:**
- `WelcomeScreen` — app intro, sign in / sign up options
- `LoginScreen` — email + password, biometric re-auth for returning users
- `SignupScreen` — minimal friction: name, email, password
- `PasswordResetScreen` — email-based password reset
- `TermsScreen` — terms of service acceptance
- `OnboardingCarousel` — 3-4 slides explaining value prop (first-time users only)

**Features:**
- Email/password login (Firebase Auth)
- Social login (Google Sign-In, Apple Sign-In)
- Biometric re-authentication (Face ID / Touch ID) for returning users
- Account creation with progressive profiling (minimal upfront, collect more later)
- Password reset flow
- Terms of service acceptance
- Persistent auth state (auto-login on app relaunch)

**API Endpoints:**
- `POST /api/user/login`
- `POST /api/user/register`
- `POST /api/user/password/reset`
- `POST /api/user/refresh-token`

#### 1.2 Studio Discovery & Subscription (Week 3)

**Screens:**
- `StudioSearchScreen` — search by name, browse nearby (location-based)
- `StudioProfileScreen` — logo, description, location map, contact info, class types
- `MyStudiosScreen` — list of subscribed studios with quick-switch

**Features:**
- Search studios by name
- Browse nearby studios (location-based with `react-native-maps`)
- View studio profile (logo, description, location, contact)
- "Subscribe" to follow a studio
- Manage subscriptions (add/remove studios)
- Quick-switch between subscribed studios (persistent studio selector)

**API Endpoints:**
- `GET /api/studios/search?query=X`
- `GET /api/studios/nearby?lat=X&lng=X`
- `POST /api/user/subscriptions/:studioId`
- `DELETE /api/user/subscriptions/:studioId`
- `GET /api/user/subscriptions`
- `POST /widget/get-basic-config` (studio configuration & branding)

#### 1.3 Schedule Viewing (Weeks 4-5)

**Screens:**
- `ScheduleScreen` — day view with time slots, date selector, filters
- `ClassDetailScreen` — instructor, description, spots remaining, waitlist status

**Features:**
- View class/appointment schedule by day (scrollable day selector)
- Filter by instructor, class type, time of day
- View class details: instructor bio, class description, duration, spots remaining
- See waitlist status for full classes
- Add to device calendar (read-only — booking comes in Phase 2)
- Pull-to-refresh for schedule updates
- Skeleton loading states while data loads

**API Endpoints:**
- `POST /widget/get-schedule`

#### 1.4 User Profile (Week 5)

**Screens:**
- `ProfileScreen` — profile summary, upcoming bookings count, quick links
- `EditProfileScreen` — name, email, phone
- `SettingsScreen` — notification preferences, about, logout

**Features:**
- View/edit profile information
- Notification preferences
- App settings (dark mode follows system by default)
- Logout

**Phase 1 Deliverable**: A testable browsing experience. Users can sign up, find studios, browse schedules, and view class details.

---

### Phase 2: Transact (Weeks 6-8)

> **Goal**: End-to-end booking flow works. Users can pay and book classes.

#### 2.1 Payment Methods (Week 6)

**Screens:**
- `PaymentMethodsScreen` — list saved cards, set default
- `AddPaymentMethodScreen` — Stripe card input, Apple Pay / Google Pay setup

**Features:**
- Add credit/debit card (Stripe SetupIntent flow)
- View saved payment methods
- Set default payment method
- Remove payment method
- Apple Pay / Google Pay integration

**API Endpoints:**
- `POST /stripe/create-setup-intent`
- `POST /stripe-get-payment-methods`
- `POST /stripe/remove-card`

#### 2.2 Booking & Checkout (Weeks 7-8)

**Screens:**
- `CheckoutScreen` — price breakdown, credit application, promo codes, payment selection
- `BookingConfirmationScreen` — success state with calendar add, share options
- `WaitlistConfirmationScreen` — waitlist position, notification opt-in

**Features:**
- Book a class/appointment from ClassDetailScreen
- Join waitlist if class is full
- Checkout flow:
  - Apply available credits automatically (studio credits, flash credits, RAF credits)
  - Apply promo codes
  - Use passes if available
  - Clear price breakdown
  - One-tap booking with saved payment method
- Cancel booking (within studio's cancel policy)
- Add booking to device calendar
- View upcoming bookings list
- View booking history

**API Endpoints:**
- `POST /checkout-with-pass-and-or-credit`
- `POST /drop-event`
- `POST /add-to-waitlist`
- `POST /verify-promo-code-exists`
- `POST /get-credit`

#### 2.3 Packages & Memberships (Week 8)

**Screens:**
- `PackagesScreen` — available packages/memberships for the studio
- `PackageDetailScreen` — package details, pricing, purchase
- `MyPackagesScreen` — active packages with remaining credits, membership status

**Features:**
- View available packages/memberships
- Purchase packages (Stripe checkout)
- View active packages with remaining credits
- View membership status and next billing date

**API Endpoints:**
- `POST /widget/get-packages`
- `POST /get-passes`
- `POST /checkout-package-cc`

**Phase 2 Deliverable**: Fully functional booking app. Users can browse, book, pay, and manage bookings end-to-end.

---

### Phase 3: Engage (Weeks 9-10)

> **Goal**: Rewards, credits, and referrals drive retention and repeat bookings.

#### 3.1 Credits & Rewards Dashboard (Week 9)

**Screens:**
- `RewardsScreen` — dashboard showing all credits across studios
- `CreditDetailScreen` — per-studio credit breakdown and transaction history

**Features:**
- Dashboard showing all credits across studios:
  - Studio credits (standard balance)
  - Flash credits (time-limited, with expiration countdown)
  - Refer-a-friend credits
- Credit history/transactions per studio
- Visual progress toward reward tiers
- Prominent notification when new flash credit earned
- Countdown timer for expiring flash credits

**Data Model (existing):**
- `credits` — studio-specific credit balance
- `flash_credits` — time-limited bonus credits (loyalty rewards)
- `raf_credits` — refer-a-friend credits

**API Endpoints:**
- `POST /get-credit`

#### 3.2 Flash Credits System (Week 9)

**Existing Behavior (display-only, backend handles logic):**
- Users earn flash credits for frequent attendance
- Credits have short expiration (encourages quick return)
- Applied automatically at checkout

**Display Requirements:**
- Prominent in-app notification (toast/banner) when new flash credit earned
- Countdown to expiration (e.g., "Expires in 2 days")
- Amount and applicable studio clearly shown
- Flash credit badge on schedule screen when credits are available

#### 3.3 Friend Referrals (Week 10)

**Screens:**
- `ReferFriendScreen` — share referral code/link via native share sheet
- `ReferralHistoryScreen` — track referral status and earned credits

**Features:**
- Generate and share referral code/link (native share sheet)
- Deep link support — referral links open the app directly
- Track referral status (pending, completed)
- View earned referral credits

**API Endpoints:**
- `POST /get-friend-referrals`
- `POST /create-friend-referral`

**Phase 3 Deliverable**: Full engagement layer. Users see their rewards, track flash credits, and refer friends.

---

### Phase 4: Whitelabel (Weeks 11-12)

> **Goal**: Any studio can have their own branded app built from the same codebase.

#### 4.1 Theming System

**Configuration per studio:**
```typescript
interface StudioConfig {
  // Identity
  studioId: number;
  studioName: string;
  bundleId: string;            // com.studioname.app
  appName: string;             // Display name on home screen

  // Branding
  theme: {
    primaryColor: string;      // Hex — buttons, headers, accents
    secondaryColor: string;    // Hex — secondary UI elements
    backgroundColor: string;   // Hex — app background
    textColor: string;         // Hex — primary text
  };
  logoUrl: string;
  iconUrl: string;             // App icon (1024x1024)
  splashUrl: string;           // Splash screen

  // Features (toggle per studio)
  features: {
    spotBooking: boolean;      // Room/spot selection
    packages: boolean;         // Sell packages
    memberships: boolean;      // Subscription memberships
    referrals: boolean;        // Refer-a-friend
    flashCredits: boolean;     // Dynamic loyalty credits
    studioDiscovery: boolean;  // false for whitelabel (single studio)
  };

  // Config
  timezone: string;
  currency: string;
  cancelPolicy: {
    hoursBeforeClass: number;
    penaltyAmount?: number;
  };

  // Integrations
  stripePublishableKey: string;
  sentryDsn?: string;
  firebaseConfig: Record<string, string>;
}
```

**Implementation:**
- `ThemeProvider` reads `StudioConfig` and generates NativeWind CSS variables
- All components use theme tokens (never hardcoded colors)
- Feature flags hide/show sections based on `features` config
- Studio logo/branding injected via context

#### 4.2 Aggregator vs. Whitelabel Mode

**When running as "Dibs" app (aggregator):**
- `features.studioDiscovery = true`
- Studio search and subscription enabled
- User can switch between studios
- Credits shown aggregated and per-studio
- Minimal Dibs branding in footer/about

**When running as whitelabel (single studio):**
- `features.studioDiscovery = false`
- Single studio experience — auto-subscribed
- No search/discovery UI
- Studio branding throughout
- No Dibs branding visible to user

#### 4.3 Build Pipeline

**Build tooling:**
- `app.config.ts` reads environment variables to generate Expo config dynamically:
  - `STUDIO_ID`, `STUDIO_NAME`, `BUNDLE_ID`, `APP_NAME`
  - `PRIMARY_COLOR`, `SECONDARY_COLOR`
  - `STRIPE_PUBLISHABLE_KEY`
  - etc.
- `eas.json` contains build profiles per studio:
  ```json
  {
    "build": {
      "dibs-production": {
        "env": { "STUDIO_ID": "0", "APP_NAME": "Dibs", "BUNDLE_ID": "com.dibs.app" }
      },
      "pisterzi-production": {
        "env": { "STUDIO_ID": "123", "APP_NAME": "Pisterzi", "BUNDLE_ID": "com.pisterzi.app" }
      }
    }
  }
  ```
- CLI script: `bin/create-studio-build.ts`
  - Takes studio config as input
  - Downloads studio assets (icon, splash, logo) to `assets/studios/{studioId}/`
  - Generates EAS build profile entry
  - Triggers `eas build` with the studio profile
- **EAS Metadata** for automated App Store / Play Store submissions

**Asset generation per studio:**
- iOS: App icon set (all required sizes via `expo-asset` generation)
- Android: Adaptive icon, splash screen
- Both: Splash screen with studio logo

**Phase 4 Deliverable**: Any studio can get a branded app by providing: name, logo, colors, bundle ID. Build script handles the rest.

---

### Phase 5: Polish (Weeks 13-14)

> **Goal**: Production-ready quality. Performance, testing, accessibility, edge cases.

#### 5.1 E2E Testing with Maestro
- Critical user flows:
  - Sign up → subscribe to studio → view schedule
  - Login → book class → confirm → view in upcoming
  - Login → checkout with pass/credits → confirm
  - Login → add payment method → book class
- Run in CI via Maestro Cloud or GitHub Actions

#### 5.2 Unit & Component Tests
- **Business logic**: Pricing calculations, credit application, cart selectors
- **API layer**: Query hooks with mocked responses
- **Components**: Key UI flows (checkout, booking confirmation, credit display)
- **Target**: >70% coverage on business logic, >50% overall

#### 5.3 Performance Optimization
- App launch time: target < 2 seconds to schedule view
- Image optimization (expo-image with caching)
- List virtualization for schedule and booking history
- Bundle size analysis and tree-shaking
- Hermes engine enabled (default in Expo SDK 52)

#### 5.4 Accessibility
- Screen reader support (accessibilityLabel on all interactive elements)
- Minimum touch target sizes (44x44pt)
- Color contrast compliance (WCAG AA)
- Keyboard navigation support

#### 5.5 Edge Cases & Error Handling
- Network error recovery (retry banners, offline indicators)
- Payment failure handling (card declined, 3D Secure, expired card)
- Session expiry handling (token refresh failure → re-login)
- Deep link handling for invalid/expired links
- App update prompts (force update for breaking API changes)

**Phase 5 Deliverable**: Production-ready app, tested end-to-end, performant, accessible.

---

## Cross-Cutting Concerns

### Deep Linking & Universal Links

Deep links are critical for a booking app (studios share class links, push notifications open specific screens).

**Strategy:**
- Expo Router provides built-in deep linking via file-based routes
- URL scheme: `dibs://` (custom) and `https://ondibs.com/` (universal links)
- Configure universal links:
  - iOS: Associated Domains (apple-app-site-association)
  - Android: App Links (assetlinks.json)
- Route mapping examples:
  - `dibs://class/123` → `ClassDetailScreen`
  - `dibs://studio/456` → `StudioProfileScreen`
  - `dibs://referral/CODE` → `SignupScreen` with referral pre-filled
- Push notification deep links: notification payload includes route, Expo Router handles navigation

### Error Handling Strategy

**Layers:**
1. **API client** (`services/api/client.ts`):
   - Network errors → toast with retry option
   - 401 → attempt token refresh → if fails, redirect to login
   - 4xx → display user-friendly error message from API response
   - 5xx → generic error toast + Sentry capture
2. **Error boundaries** (`components/ui/ErrorBoundary.tsx`):
   - Catch React render errors
   - Show fallback UI with "Try Again" button
   - Report to Sentry
3. **TanStack Query**:
   - Automatic retries (3x with exponential backoff) for transient failures
   - `onError` callbacks for mutation-specific handling
   - Stale-while-revalidate for cached data

### Loading States

- **Skeleton screens** for initial data loads (not spinners)
- **Pull-to-refresh** on all list screens
- **Optimistic updates** for bookmark/subscribe actions
- **Loading indicators** on buttons during mutations (prevent double-tap)

### Existing User Migration

**Account continuity:**
- Existing dibs-api user accounts work unchanged (same auth, same endpoints)
- JWT tokens from the old app are compatible — but we'll prompt re-login for security
- Saved payment methods (Stripe customer IDs) persist — no re-entry needed
- Booking history available via same API endpoints

**App Store transition:**
- **Option A (recommended)**: Same bundle ID — new app replaces old via App Store update
  - Seamless for existing users
  - Requires using the same Apple Developer / Google Play account
- **Option B**: New bundle ID — separate listing
  - Old app shows "please download the new app" banner
  - More disruptive but avoids bundle ID conflicts with whitelabel apps

**Force-update mechanism:**
- Store minimum supported app version in Firebase Remote Config
- On app launch, check version → if below minimum, show blocking update screen
- Allows deprecating the old app once the new one is stable

---

## API Integration Layer

```typescript
// services/api/client.ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://ondibs.herokuapp.com';

// Typed endpoint definitions matching existing dibs-api routes
const endpoints = {
  // Auth
  login:          'POST /api/user/login',
  register:       'POST /api/user/register',
  resetPassword:  'POST /api/user/password/reset',
  refreshToken:   'POST /api/user/refresh-token',

  // Studios
  getStudio:      'POST /widget/get-basic-config',
  getSchedule:    'POST /widget/get-schedule',
  getPackages:    'POST /widget/get-packages',

  // User
  getUser:        'GET /api/user',
  updateUser:     'PUT /api/user',
  getUserPasses:  'POST /get-passes',
  getUserCredits: 'POST /get-credit',

  // Booking
  checkout:       'POST /checkout-with-pass-and-or-credit',
  dropEvent:      'POST /drop-event',
  joinWaitlist:   'POST /add-to-waitlist',
  verifyPromo:    'POST /verify-promo-code-exists',

  // Payments
  setupIntent:       'POST /stripe/create-setup-intent',
  getPaymentMethods: 'POST /stripe-get-payment-methods',
  removeCard:        'POST /stripe/remove-card',
  checkoutPackage:   'POST /checkout-package-cc',

  // Referrals
  getReferrals:    'POST /get-friend-referrals',
  createReferral:  'POST /create-friend-referral',
} as const;
```

---

## Timeline Summary

| Phase | Duration | Weeks | Deliverable |
|-------|----------|-------|-------------|
| Phase 0: Foundation | 1 week | Week 1 | Runnable app shell with auth, API client, design system, CI/CD |
| Phase 1: Browse & Discover | 4 weeks | Weeks 2-5 | Auth, studio discovery, schedule viewing, user profile |
| Phase 2: Transact | 3 weeks | Weeks 6-8 | Payments, checkout, booking, packages — full end-to-end |
| Phase 3: Engage | 2 weeks | Weeks 9-10 | Credits, flash credits, referrals |
| Phase 4: Whitelabel | 2 weeks | Weeks 11-12 | Theming system, build pipeline, aggregator/whitelabel modes |
| Phase 5: Polish | 2 weeks | Weeks 13-14 | E2E tests, performance, accessibility, edge cases |
| **Total** | **14 weeks** | | **Production-ready whitelabel booking app** |

---

## Success Metrics

### User Experience
- Time to book a class: < 30 seconds (returning user with saved payment)
- App launch to schedule view: < 2 seconds
- Crash-free rate: > 99.5%
- Biometric re-auth: < 3 seconds to schedule view

### Business
- Booking conversion rate improvement vs. old app
- User retention (7-day, 30-day)
- Flash credit redemption rate
- Referral program participation rate

### Technical
- Test coverage: > 70% business logic, > 50% overall
- E2E test pass rate: > 95% in CI
- App binary size: < 50MB
- Accessibility: WCAG AA compliant
- Zero known P0/P1 bugs at launch

---

## Appendix: Existing Code Reference

### Key Files from dibs-mobile-app (2022) — Port Business Logic From
- `app/actions/` — Redux actions (User, Studio, Events, Cart) → port to TanStack Query mutations
- `app/reducers/` — Redux reducers → port to Zustand stores
- `app/selectors/` — Reselect selectors (CartSelectors with PurchaseBreakdown, pricing logic) → port to derived Zustand state / query transforms
- `app/util/dibs-fetch.js` — API client with token refresh → port to `services/api/client.ts`
- `app/components/` — UI reference (don't port directly, rebuild with NativeWind)
- `app/router/index.js` — Route definitions → reference for Expo Router file structure

### Key API Routes from dibs-api
- `/routes/widget/index.js` — Customer-facing widget endpoints (primary API surface)
- `/routes/routers.js` — Main API router with all endpoints
- `/database/models/dibs_user.js` — User model with credits, passes
- `/database/models/flash_credit.js` — Flash credit loyalty system
- `/database/models/dibs_studio.js` — Studio configuration and branding

### Data Models to Understand
- `dibs_user` — User profile, payment info, credits
- `dibs_studio` — Studio configuration, branding, feature flags
- `dibs_transaction` — Booking and payment records
- `flash_credit` — Time-limited loyalty credits (amount, expiry, studio)
- `passes` — Pre-purchased class packages (remaining count, expiry)
- `credit` — Studio-specific wallet balance
