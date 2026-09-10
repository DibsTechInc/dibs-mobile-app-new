/**
 * "Just signed up" — the one fact the post-sign-up sheet needs (2026-09-10).
 *
 * Set by the sign-in route the moment `signUp` succeeds, consumed once by `FirstClassWelcomeSheet`
 * when the offer endpoint has RESOLVED eligible. Session-only: a sheet that survived a relaunch
 * would greet somebody who signed up last week.
 */
import { create } from 'zustand';

interface FirstClassWelcomeState {
  pendingSignUp: boolean;
  markSignedUp: () => void;
  consume: () => void;
}

export const useFirstClassWelcomeStore = create<FirstClassWelcomeState>((set) => ({
  pendingSignUp: false,
  markSignedUp: () => set({ pendingSignUp: true }),
  consume: () => set({ pendingSignUp: false }),
}));
