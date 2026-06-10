# Dibs Mobile App Modernization Plan

## Overview

This document outlines the plan to modernize the Dibs mobile app from a 2022 React Native/Expo SDK 36 codebase to a modern, whitelabel-capable booking application for end customers of appointment-based service businesses (fitness studios, salons, spas, etc.).

---

## Project Context

### What We're Building
- **Primary User**: End customer (studio's client, not the studio owner)
- **Core Purpose**: Make booking appointments/classes as convenient as possible
- **Branding Strategy**: Light Dibs branding; studio branding takes center stage
- **Distribution**:
  - Single Dibs app (multi-studio aggregator)
  - Whitelabeled apps per studio (App Store ready with studio branding)

### Existing Assets
| Asset | Path | Status | Notes |
|-------|------|--------|-------|
| dibs-mobile-app | `/code/dibs-mobile-app` | Outdated (2022) | React Native + Expo SDK 36, Redux |
| dibs_mobile_app_new | `/code/dibs_mobile_app_new` | Incomplete | Partial rewrite attempt |
| dibs-api | `/code/dibs-api` | Active | Node.js/Express, Firebase Auth, Stripe |

### Key Backend Capabilities Already Available
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

## Questions for Decision Making

### Critical Decisions Needed

1. **Framework Choice**
   - [ ] Continue with React Native + Expo (recommended for faster development)
   - [ ] Switch to Flutter (better cross-platform consistency)
   - [ ] Native development (Swift/Kotlin - maximum performance, higher cost)

2. **State Management**
   - [ ] Continue with Redux (existing pattern)
   - [ ] Switch to Zustand (simpler, less boilerplate)
   - [ ] Use React Query/TanStack Query for server state + Context for UI state

3. **Multi-Studio vs Whitelabel Architecture**
   - **Option A**: Single codebase with runtime configuration (env vars/config files)
   - **Option B**: Monorepo with shared components and studio-specific apps
   - **Option C**: Configuration-driven theming with build-time branding injection

4. **Offline Capability**
   - [ ] Full offline mode (cached schedules, queued bookings)
   - [ ] Minimal offline (show last-viewed schedule, require network for booking)
   - [ ] Online only

5. **Push Notifications**
   - [ ] Firebase Cloud Messaging (FCM)
   - [ ] Expo Push Notifications
   - [ ] Both with abstraction layer

---

## Proposed Feature Set

### Phase 1: Core MVP (Weeks 1-4)

#### 1.1 Authentication & Onboarding
```
FEATURES:
- Email/password login (Firebase Auth)
- Social login (Google, Apple Sign-In)
- Account creation with minimal friction
- Password reset flow
- Terms of service acceptance
- Onboarding tutorial (first-time users)

SCREENS:
- WelcomeScreen (app intro, sign in/up options)
- LoginScreen
- SignupScreen
- PasswordResetScreen
- OnboardingCarousel (3-4 slides explaining value prop)
```

#### 1.2 Studio Discovery & Subscription
```
FEATURES:
- Search studios by name
- Browse nearby studios (location-based)
- View studio profile (logo, description, location, contact)
- "Subscribe" to follow a studio
- Manage subscriptions (add/remove studios)
- Quick-switch between subscribed studios

SCREENS:
- StudioSearchScreen
- StudioProfileScreen
- MyStudiosScreen (list of subscribed studios)

API ENDPOINTS NEEDED:
- GET /api/studios/search?query=X
- GET /api/studios/nearby?lat=X&lng=X
- POST /api/user/subscriptions/:studioId
- DELETE /api/user/subscriptions/:studioId
- GET /api/user/subscriptions
```

#### 1.3 Schedule & Booking
```
FEATURES:
- View class/appointment schedule by day
- Filter by instructor, class type, time
- Book a class/appointment
- Join waitlist if class is full
- View booking confirmation
- Cancel booking (within studio's cancel policy)
- Add to device calendar

SCREENS:
- ScheduleScreen (day view with time slots)
- ClassDetailScreen (instructor, description, spots remaining)
- BookingConfirmationScreen
- WaitlistConfirmationScreen

EXISTING API ENDPOINTS:
- POST /widget/get-schedule
- POST /add-to-waitlist
- POST /drop-event
- POST /checkout-with-pass-and-or-credit
```

#### 1.4 User Profile
```
FEATURES:
- View/edit profile information
- Manage emergency contacts
- View upcoming bookings
- View booking history
- Notification preferences

SCREENS:
- ProfileScreen
- EditProfileScreen
- UpcomingBookingsScreen
- BookingHistoryScreen
- SettingsScreen
```

### Phase 2: Payments & Credits (Weeks 5-6)

#### 2.1 Payment Methods
```
FEATURES:
- Add credit/debit card (Stripe)
- View saved payment methods
- Set default payment method
- Remove payment method
- Apple Pay / Google Pay integration

SCREENS:
- PaymentMethodsScreen
- AddPaymentMethodScreen

EXISTING API ENDPOINTS:
- POST /stripe/create-setup-intent
- POST /stripe-get-payment-methods
- POST /stripe/remove-card
```

#### 2.2 Checkout Flow
```
FEATURES:
- Apply available credits automatically
- Apply promo codes
- Use passes if available
- Clear price breakdown
- One-tap booking with saved payment

SCREENS:
- CheckoutScreen (reusable component)

EXISTING API ENDPOINTS:
- POST /checkout-with-pass-and-or-credit
- POST /verify-promo-code-exists
- POST /get-credit
```

#### 2.3 Packages & Memberships
```
FEATURES:
- View available packages/memberships
- Purchase packages
- View active packages with remaining credits
- View membership status and next billing date

SCREENS:
- PackagesScreen
- PackageDetailScreen
- MyPackagesScreen

EXISTING API ENDPOINTS:
- POST /widget/get-packages
- POST /get-passes
- POST /checkout-package-cc
```

### Phase 3: Rewards & Engagement (Weeks 7-8)

#### 3.1 Credits & Flash Credits Display
```
FEATURES:
- Dashboard showing all credits across studios
- Flash credits with expiration countdown
- Credit history/transactions
- Visual progress toward rewards

SCREENS:
- RewardsScreen (dashboard)
- CreditDetailScreen (per studio)

DATA MODEL (from existing):
- credits: studio-specific credit balance
- flash_credits: time-limited bonus credits (loyalty rewards)
- raf_credits: refer-a-friend credits
```

#### 3.2 Flash Credits System
```
EXISTING BEHAVIOR:
- Users earn flash credits for frequent attendance
- Credits have short expiration (encourages quick return)
- Applied automatically at checkout

DISPLAY REQUIREMENTS:
- Prominent notification when new flash credit earned
- Countdown to expiration
- Amount and applicable studio
```

#### 3.3 Friend Referrals
```
FEATURES:
- Share referral code/link
- Track referral status
- View earned referral credits

SCREENS:
- ReferFriendScreen
- ReferralHistoryScreen

EXISTING API ENDPOINTS:
- POST /get-friend-referrals
- POST /create-friend-referral
```

### Phase 4: Whitelabel Infrastructure (Weeks 9-10)

#### 4.1 Theming System
```
CONFIGURATION:
- Primary color (studio's brand color)
- Secondary color
- Logo (multiple sizes)
- App icon
- Splash screen
- Font family (if custom)
- Studio-specific copy/messaging

IMPLEMENTATION:
- Theme context provider
- Dynamic style generation
- Config-driven component styling
```

#### 4.2 Build Configuration
```
WHITELABEL BUILD PROCESS:
1. Studio provides: logo, colors, app name, bundle ID
2. Build script generates:
   - iOS: Info.plist, Assets.xcassets
   - Android: colors.xml, strings.xml, mipmap resources
3. EAS Build with studio-specific profile

FILES TO GENERATE:
- app.json / app.config.js (dynamic)
- eas.json (build profiles per studio)
- /assets/studios/{studioId}/ (branding assets)
```

#### 4.3 Multi-Studio Aggregator Mode
```
WHEN RUNNING AS "DIBS" APP:
- Studio search and subscription enabled
- User can switch between studios
- Credits shown aggregated and per-studio
- Dibs minimal branding in footer

WHEN RUNNING AS WHITELABEL:
- Single studio experience
- No search/discovery (already "subscribed")
- Studio branding throughout
- No Dibs branding visible to user
```

---

## Technical Architecture

### Recommended Stack

```yaml
Framework: React Native 0.73+ with Expo SDK 51
Language: TypeScript
State Management: Zustand (global) + TanStack Query (server state)
Navigation: React Navigation 6
Styling: NativeWind (Tailwind for RN) or styled-components
Auth: Firebase Auth
Payments: Stripe React Native SDK
Push Notifications: Expo Notifications + FCM
Testing: Jest + React Native Testing Library
CI/CD: EAS Build + EAS Submit
```

### Project Structure

```
/dibs-mobile-app/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Auth flow screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
│   ├── (main)/                   # Main app screens (after auth)
│   │   ├── (tabs)/               # Tab navigator
│   │   │   ├── schedule.tsx
│   │   │   ├── bookings.tsx
│   │   │   ├── rewards.tsx
│   │   │   └── profile.tsx
│   │   ├── studio/[id].tsx       # Studio detail
│   │   ├── class/[id].tsx        # Class detail
│   │   └── checkout.tsx
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── schedule/                 # Schedule-related components
│   ├── booking/                  # Booking flow components
│   └── rewards/                  # Credits/rewards components
├── hooks/
│   ├── useAuth.ts
│   ├── useStudio.ts
│   ├── useBooking.ts
│   └── useCredits.ts
├── services/
│   ├── api/                      # API client and endpoints
│   ├── auth/                     # Firebase auth wrapper
│   └── payments/                 # Stripe integration
├── store/
│   ├── auth.ts                   # Auth state
│   ├── studio.ts                 # Active studio state
│   └── cart.ts                   # Cart/checkout state
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── ThemeProvider.tsx
├── config/
│   ├── studio.config.ts          # Studio-specific config
│   └── app.config.ts             # Expo config
├── assets/
│   ├── images/
│   ├── fonts/
│   └── studios/                  # Whitelabel assets per studio
└── types/
    └── index.ts                  # TypeScript types
```

### API Integration Layer

```typescript
// services/api/client.ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

// Key endpoints mapping to existing dibs-api routes
const endpoints = {
  // Auth
  login: 'POST /api/user/login',
  register: 'POST /api/user/register',
  resetPassword: 'POST /api/user/password/reset',

  // Studios
  getStudio: 'POST /widget/get-basic-config',
  getSchedule: 'POST /widget/get-schedule',
  getPackages: 'POST /widget/get-packages',

  // User
  getUser: 'GET /api/user',
  updateUser: 'PUT /api/user',
  getUserPasses: 'POST /get-passes',
  getUserCredits: 'POST /get-credit',

  // Booking
  checkout: 'POST /checkout-with-pass-and-or-credit',
  dropEvent: 'POST /drop-event',
  joinWaitlist: 'POST /add-to-waitlist',

  // Payments
  setupIntent: 'POST /stripe/create-setup-intent',
  getPaymentMethods: 'POST /stripe-get-payment-methods',
  removeCard: 'POST /stripe/remove-card',
};
```

---

## Whitelabel Configuration Schema

```typescript
interface StudioConfig {
  // Identity
  studioId: number;
  studioName: string;
  bundleId: string;          // com.studioname.app
  appName: string;           // Display name on home screen

  // Branding
  primaryColor: string;      // Hex color
  secondaryColor: string;
  logoUrl: string;
  iconUrl: string;           // App icon (1024x1024)
  splashUrl: string;         // Splash screen

  // Features
  features: {
    spotBooking: boolean;    // Room/spot selection
    packages: boolean;       // Sell packages
    memberships: boolean;    // Subscription memberships
    referrals: boolean;      // Refer-a-friend
    flashCredits: boolean;   // Dynamic loyalty credits
  };

  // Config
  timezone: string;
  currency: string;
  cancelPolicy: {
    hoursBeforeClass: number;
    penaltyAmount?: number;
  };
}
```

---

## Migration Strategy

### Option A: Fresh Start (Recommended)
1. Create new Expo project with modern tooling
2. Port business logic from existing app (actions, helpers)
3. Build new UI from scratch with modern components
4. Integrate with existing dibs-api (no backend changes needed)
5. Parallel development - old app stays live until new is ready

### Option B: Incremental Upgrade
1. Upgrade Expo SDK incrementally (36 → 45 → 51)
2. Migrate to TypeScript file by file
3. Replace Redux with modern state management
4. Update UI components gradually
5. Risk: Compatibility issues, longer timeline

**Recommendation**: Option A (Fresh Start) because:
- Expo SDK 36 is significantly outdated (3+ years)
- Cleaner codebase without legacy patterns
- Modern patterns from day one
- Faster overall development time

---

## Development Phases Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 0: Setup | 1 week | Project scaffolding, CI/CD, design system |
| Phase 1: Core MVP | 4 weeks | Auth, Studio discovery, Schedule, Booking |
| Phase 2: Payments | 2 weeks | Payment methods, Checkout, Packages |
| Phase 3: Rewards | 2 weeks | Credits display, Flash credits, Referrals |
| Phase 4: Whitelabel | 2 weeks | Theming system, Build configuration |
| Phase 5: Polish | 2 weeks | Testing, bug fixes, performance optimization |
| **Total** | **13 weeks** | Production-ready app |

---

## Success Metrics

1. **User Experience**
   - Time to book a class: < 30 seconds (returning user)
   - App launch to schedule view: < 2 seconds
   - Crash-free rate: > 99.5%

2. **Business**
   - Booking conversion rate improvement
   - User retention (7-day, 30-day)
   - Flash credit redemption rate

3. **Technical**
   - Test coverage: > 70%
   - Lighthouse accessibility score: > 90
   - App size: < 50MB

---

## Open Questions

1. **Should we support tablet layouts?**
   - More relevant for studio staff than customers

2. **What analytics platform to use?**
   - Options: Mixpanel, Amplitude, Firebase Analytics

3. **Should we add biometric login?**
   - Face ID / Touch ID for faster re-authentication

4. **Apple Watch / Wear OS support?**
   - Quick view of upcoming classes

5. **Dark mode support?**
   - Follow system setting or allow manual toggle

---

## Next Steps

1. **Review this plan** and provide feedback
2. **Make decisions** on the questions above
3. **Finalize Phase 1 scope** and begin development
4. **Set up project infrastructure** (repo, CI/CD, design files)

---

## Appendix: Existing Code Reference

### Key Files from dibs-mobile-app (2022)
- `App.js` - Main app entry with Redux Provider
- `app/actions/` - Redux actions (User, Studio, Events, Cart, etc.)
- `app/reducers/` - Redux reducers matching actions
- `app/components/` - React components organized by feature
- `config.json` - Studio-specific configuration (not in repo, generated per build)

### Key API Routes from dibs-api
- `/routes/widget/index.js` - Customer-facing widget endpoints
- `/routes/routers.js` - Main API router with all endpoints
- `/database/models/dibs_user.js` - User model with credits, passes
- `/database/models/flash_credit.js` - Flash credit loyalty system

### Data Models to Understand
- `dibs_user` - User profile, payment info, credits
- `dibs_studio` - Studio configuration and branding
- `dibs_transaction` - Booking and payment records
- `flash_credit` - Time-limited loyalty credits
- `passes` - Pre-purchased class packages
- `credit` - Studio-specific wallet balance
