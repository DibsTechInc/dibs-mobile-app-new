/**
 * Firebase, for client authentication only.
 *
 * ⚠️ THE PROJECT MATTERS MORE THAN ANYTHING ELSE IN THIS FILE. There are two Firebase projects
 * and they share nothing:
 *
 *   dibs-studio-clients  — the studios' CLIENTS. This app. The widget. `dibs_users.du_firebase_uid`.
 *   dibs-admin-users     — studio EMPLOYEES. The admin dashboard. Not us, ever.
 *
 * Pointing this at the admin project would not throw. Sign-up would succeed, return a uid, and
 * produce an account that cannot sign in to anything the client can see — the exact failure the
 * backend hit in 2026-07 (shared CLAUDE.md, "There are TWO Firebase projects and they share
 * nothing"). `EXPO_PUBLIC_FIREBASE_PROJECT_ID` must read `dibs-studio-clients`, and the guard
 * below fails the app loudly at startup rather than quietly writing to the wrong one.
 *
 * Sharing the widget's project is deliberate (§3.3): a mobile token is then indistinguishable
 * from a widget token to `middleware/widget-auth.js`, so there is zero backend auth work and a
 * client's password is the same one they already use on the studio's website.
 *
 * These values are not secrets — they identify a project, they do not grant access to it, and
 * they already ship inside the public widget bundle. They live in env vars so there is exactly
 * one place to change them, not to hide them.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

/** The one project this app is allowed to authenticate against. */
const CLIENT_PROJECT_ID = 'dibs-studio-clients';

/**
 * The dibs-studio-clients web-app config, baked in as defaults so no build can ship without
 * it. Same for every studio — the client Firebase project is shared. These were env-only
 * until 2026-08-17, and that is how the first TestFlight build (Carlsbad 2.0.0 (4)) crashed
 * at launch: `.env` is gitignored, EAS cloud uploads respect .gitignore, so every cloud
 * build inlined `undefined` here and readConfig() threw its fail-loudly error — which in a
 * release binary is a SIGABRT before the first frame. Dev builds never caught it because
 * the laptop has the .env. Env vars still OVERRIDE these, for pointing a dev build at a
 * different project; the project-id guard below still refuses anything that is not
 * dibs-studio-clients.
 */
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyAYkBJs7p1XlCC1xjFvQ5t2woRwElbhjA4',
  authDomain: 'dibs-studio-clients.firebaseapp.com',
  projectId: CLIENT_PROJECT_ID,
  appId: '1:1092882678128:web:14529f6e9b169f1ff04fb5',
  messagingSenderId: '1092882678128',
} as const;

function readConfig(): FirebaseOptions {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? DEFAULT_CONFIG.apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? DEFAULT_CONFIG.authDomain,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? DEFAULT_CONFIG.projectId,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? DEFAULT_CONFIG.appId,
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? DEFAULT_CONFIG.messagingSenderId,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => `EXPO_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missing.length > 0) {
    // An app that cannot authenticate is not "degraded", it is half a product. Fail at startup
    // where it is obvious, not at the first sign-in attempt in front of a client.
    throw new Error(
      `Firebase is not configured — missing ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the dibs-studio-clients values (docs/environments.md).',
    );
  }

  if (config.projectId !== CLIENT_PROJECT_ID) {
    throw new Error(
      `Firebase project is "${config.projectId}", expected "${CLIENT_PROJECT_ID}". ` +
        'This app authenticates STUDIO CLIENTS. dibs-admin-users is a different project for ' +
        'studio employees and using it silently creates accounts that can never sign in here.',
    );
  }

  return config as FirebaseOptions;
}

const app = getApps().length > 0 ? getApp() : initializeApp(readConfig());

/**
 * `initializeAuth` with AsyncStorage persistence, so a client stays signed in across launches.
 *
 * Plain `getAuth()` on React Native defaults to in-memory persistence and signs everybody out
 * every time the app is killed. The try/catch covers Fast Refresh, where the module re-evaluates
 * against an app whose auth is already initialized and `initializeAuth` throws.
 */
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();

/**
 * A fresh ID token for the CURRENT session, or null when signed out.
 *
 * Always asks Firebase rather than returning something we cached: the SDK already caches and
 * refreshes, and a token we held onto is a token that can be expired — or, on a shared device,
 * can belong to whoever was signed in before.
 */
export async function getCurrentIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
