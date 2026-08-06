/**
 * `getReactNativePersistence` exists at runtime but is missing from the types we resolve.
 *
 * The `firebase` umbrella package's `./auth` export map has `node`, `browser` and `default`
 * conditions but NO `react-native` one, and a single `types` entry pointing at the web build.
 * Metro applies the `react-native` condition one level down, when `firebase/auth` re-exports
 * `@firebase/auth`, so the RN bundle — which does export this function — is what actually loads.
 * TypeScript never follows that second hop, so it reads the web typings and sees nothing.
 *
 * Declaring it here rather than reaching into `@firebase/auth` directly keeps the app importing
 * the public entry point, and keeps the whole workaround in one file with its reason attached.
 * Delete it when the umbrella package ships a react-native condition.
 *
 * Signature copied verbatim from
 * `@firebase/auth/dist/rn/src/platform_react_native/persistence/react_native.d.ts`.
 */
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
