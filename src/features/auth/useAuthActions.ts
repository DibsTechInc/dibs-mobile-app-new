/**
 * Sign in, sign up, reset. The three things a client can do to their session.
 *
 * Each returns `{ ok }` or `{ ok: false, message }` with client-safe copy rather than throwing,
 * because every caller is a form that needs to show the message and re-enable its button. A
 * thrown Firebase error carries a code, a stack, and sometimes the whole request — none of which
 * belongs on screen.
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useCallback, useState } from 'react';

import { apiClient, createDibsUser, describeApiError } from '@/api';
import { studio } from '@/config/studio';
import { describeAuthError } from '@/domain/auth/describe-auth-error';
import { auth } from '@/lib/firebase';

export interface AuthActionResult {
  ok: boolean;
  message?: string;
}

export interface SignUpArgs {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export function useAuthActions() {
  const queryClient = useQueryClient();
  const [isBusy, setIsBusy] = useState(false);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      setIsBusy(true);
      try {
        // Trimmed, not lowercased. A trailing space from an autofill or a keyboard is a typo;
        // the capitalisation the client chose is part of their address, and the Dibs lookup
        // behind this is case sensitive.
        await signInWithEmailAndPassword(auth, email.trim(), password);
        return { ok: true };
      } catch (error) {
        return { ok: false, message: describeAuthError(error) };
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const signUp = useCallback(
    async ({ email, password, firstName, lastName, phone }: SignUpArgs): Promise<AuthActionResult> => {
      setIsBusy(true);
      const cleanEmail = email.trim();
      try {
        // ⚠️ ORDER IS LOAD-BEARING: the Dibs row first, the Firebase credential second.
        //
        // Creating the credential flips the auth session, and everything that reacts to that
        // flip is keyed on the Dibs userid. If the row does not exist yet, those first
        // authenticated reads go out with the new user's token and no id, and the backend's
        // ownership check rejects them — which the widget experienced as a brand-new client
        // being bounced straight back to the login screen.
        await createDibsUser(apiClient, {
          email: cleanEmail,
          firstName,
          lastName,
          phone,
          dibsStudioId: studio.dibsStudioId,
        });

        // If THIS fails, a Dibs row exists with no credential behind it. That is deliberate and
        // harmless: the row is inert until someone signs in, and a retry finds it again (the
        // backend answers code 18 and returns the same id) rather than creating a second one.
        await createUserWithEmailAndPassword(auth, cleanEmail, password);

        // The account query is keyed on the email, so it may hold a "no account" answer from a
        // sign-in attempt made moments ago. Drop it rather than making the new client wait out
        // a stale cache entry that says they do not exist.
        queryClient.removeQueries({ queryKey: ['account'] });
        return { ok: true };
      } catch (error) {
        // Firebase errors carry a `code`; ours are ApiErrors. Ask the right describer for each
        // so an API failure does not come out as "something went wrong signing you in."
        const message =
          error && typeof error === 'object' && 'code' in error
            ? describeAuthError(error)
            : describeApiError(error);
        return { ok: false, message };
      } finally {
        setIsBusy(false);
      }
    },
    [queryClient],
  );

  /**
   * Always reports success.
   *
   * Firebase distinguishes "sent" from `auth/user-not-found`, and passing that through would
   * turn this form into a way to test whether a given person is a client of this studio. The
   * client is told an email is on its way either way — which is also the more useful answer,
   * because the common case is a typo'd address rather than a missing account.
   */
  const resetPassword = useCallback(async (email: string): Promise<AuthActionResult> => {
    setIsBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      // A real outage still deserves an honest answer — otherwise the client waits for an email
      // that was never sent. Only the one code that reveals existence is absorbed; a malformed
      // address is a typo the client needs told about, and saying so leaks nothing.
      const code = error && typeof error === 'object' ? (error as { code?: string }).code : null;
      if (code !== 'auth/user-not-found') {
        setIsBusy(false);
        return { ok: false, message: describeAuthError(error) };
      }
    }
    setIsBusy(false);
    return { ok: true };
  }, []);

  /**
   * Create the missing Dibs record for an email that already has a Firebase credential.
   *
   * The repair for "signed in, but no Dibs account". Sending that client back through sign-up
   * would fail on `auth/email-already-in-use`, so the only correct move is to make the half that
   * is actually missing. `create-new-dibs-user` is idempotent for our purposes: an email that
   * already has a record comes back as code 11 or 18 with that record's id.
   */
  const completeAccountSetup = useCallback(
    async (email: string, firstName: string, lastName: string): Promise<AuthActionResult> => {
      setIsBusy(true);
      try {
        await createDibsUser(apiClient, {
          email,
          firstName,
          lastName,
          dibsStudioId: studio.dibsStudioId,
        });
        // Drop the cached "no account" answer so the next read sees the row we just made.
        queryClient.removeQueries({ queryKey: ['account'] });
        return { ok: true };
      } catch (error) {
        return { ok: false, message: describeApiError(error) };
      } finally {
        setIsBusy(false);
      }
    },
    [queryClient],
  );

  return { signIn, signUp, resetPassword, completeAccountSetup, isBusy };
}
