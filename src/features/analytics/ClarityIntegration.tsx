/**
 * Microsoft Clarity session recordings — the mobile counterpart of the widget's and
 * studio-admin's Clarity projects, so Alicia can watch how people actually use a studio's app
 * after release.
 *
 * ── Dormant without a project id ───────────────────────────────────────────────────────────────
 * Each studio app records into its OWN Clarity project, and the id lives in that studio's
 * `whitelabel/studios/<slug>/studio.json` under `analytics.clarityProjectId`. No id → this
 * component does nothing at all: no SDK init, no network, no data. That is the whole consent
 * model for shipping the dependency before every studio has a project.
 *
 * ── Analytics must never take the app down ─────────────────────────────────────────────────────
 * Every SDK touch is wrapped: the Clarity package is NATIVE code, so a JS bundle that carries
 * this component can find itself running inside an older binary that was built before the
 * module existed (a dev client that has not been rebuilt, or Expo Go, which ships no custom
 * native modules). There the calls throw — and a session-recording failure must cost nothing
 * but a console line. The require is lazy for the same reason.
 *
 * ── What gets attached to a session ────────────────────────────────────────────────────────────
 * The Dibs userid (never the email — recordings are watched by humans and the id is enough to
 * cross-reference the admin) and the screen name from the router, so recordings are filterable
 * by "everyone who reached checkout". Masking is configured in the Clarity project settings,
 * not here.
 */
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';

type ClaritySdk = {
  initialize: (projectId: string, config?: Record<string, unknown>) => void;
  setCustomUserId: (id: string) => Promise<unknown> | void;
  setCurrentScreenName: (name: string) => Promise<unknown> | void;
};

/** Resolved once, null when the native module is absent or the require itself throws. */
function loadSdk(): ClaritySdk | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@microsoft/react-native-clarity') as ClaritySdk;
  } catch {
    return null;
  }
}

export function ClarityIntegration() {
  const { account } = useAuth();
  const pathname = usePathname();
  const sdk = useRef<ClaritySdk | null>(null);
  const initialized = useRef(false);

  // Initialise exactly once, and only for a build whose studio carries a project id.
  useEffect(() => {
    if (initialized.current || !studio.clarityProjectId) return;
    sdk.current = loadSdk();
    if (!sdk.current) return;
    try {
      sdk.current.initialize(studio.clarityProjectId);
      initialized.current = true;
    } catch (error) {
      console.warn('[clarity] failed to initialise (recordings off):', error);
      sdk.current = null;
    }
  }, []);

  // The Dibs userid, once the session resolves — lets a recording be matched to the client a
  // studio is asking about. Re-runs on account change so a sign-out/sign-in re-labels.
  const userid = account?.userid ?? null;
  useEffect(() => {
    if (!initialized.current || !sdk.current || userid === null) return;
    try {
      void sdk.current.setCustomUserId(String(userid));
    } catch {
      // A labelling failure is not worth a log line per navigation.
    }
  }, [userid]);

  // Screen names from the router, so sessions are filterable by surface.
  useEffect(() => {
    if (!initialized.current || !sdk.current || !pathname) return;
    try {
      void sdk.current.setCurrentScreenName(pathname);
    } catch {
      // Same: never let telemetry noise a session.
    }
  }, [pathname]);

  return null;
}
