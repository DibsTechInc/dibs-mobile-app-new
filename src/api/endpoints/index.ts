/**
 * One function per dibs-api call the app makes.
 *
 * PURE TypeScript — each takes an `ApiClient` rather than importing a singleton, so every one is
 * testable against a stub. Hooks live next to their screens and do nothing but call these.
 *
 * This is also where the "HTTP 200 with an error body" defence lives. Several dibs-api routes
 * answer 200 with `apiFailureWrapper(...)` — or, worse, with a serialized `Error` (`{}`) — when
 * the service throws. A caller that trusts the status code renders "no classes today" for what
 * is actually an outage. Each function below states what a *valid* response looks like and
 * raises a real error otherwise.
 */
export { fetchBasicConfig } from './basic-config';
export {
  BookingRefusedError,
  confirmClassBooking,
  createClassPaymentIntent,
  type CreateClassPaymentIntentArgs,
} from './class-booking';
export {
  createSetupIntent,
  ensureConnectedCustomer,
  fetchPublishableKey,
  removeCard,
  setDefaultCard,
  type CreateSetupIntentArgs,
} from './cards';
export { fetchSchedule } from './schedule';
export { fetchClientBookings, type ClientBookings } from './upcoming';
export { updateProfile, type UpdateProfileArgs } from './profile';
export { createDibsUser, fetchUserAccount } from './user-account';
export {
  fetchCredit,
  fetchPasses,
  fetchPaymentMethods,
  type PaymentMethodsResult,
  type WalletReadArgs,
} from './wallet';
