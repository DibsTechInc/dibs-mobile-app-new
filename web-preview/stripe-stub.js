/**
 * Stripe, stubbed for the WEB PREVIEW only.
 *
 * `@stripe/stripe-react-native` imports `codegenNativeComponent`, which is native-only, so the web
 * bundle cannot build with it. That is not a problem worth solving properly — web is not a target
 * platform (§0.1-C: v1 is iOS-only). It is a problem worth solving cheaply, because the web build
 * is the only way to SEE a screen without a device, and on 2026-08-07 two builds shipped with
 * every row stacked vertically precisely because nobody could look at them.
 *
 * So: web renders the layout, and anything that would touch Stripe throws if called. Nothing here
 * is reachable on iOS or Android — see the platform guard in `metro.config.js`.
 */
const notAvailable = () => {
  throw new Error('Stripe is not available in the web preview. Use a device build.');
};

export const StripeProvider = ({ children }) => children;

export const useStripe = () => ({
  initPaymentSheet: notAvailable,
  presentPaymentSheet: notAvailable,
  confirmSetupIntent: notAvailable,
  confirmPayment: notAvailable,
});

export const usePaymentSheet = useStripe;
export const CardField = () => null;
export default { StripeProvider, useStripe };
