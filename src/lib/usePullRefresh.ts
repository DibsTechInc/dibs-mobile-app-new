/**
 * A pull-to-refresh spinner that answers only to the PULL.
 *
 * Binding a RefreshControl to a query's `isRefetching` shows the spinner on every BACKGROUND
 * refetch too — a booking invalidates the schedule, and a spinner nobody pulled for appears
 * frozen in the middle of the list over content that is perfectly fine, which reads as the app
 * being stuck (the 2026-08-16 "pinwheel is not moving" report; the same bug was fixed on
 * My Calendar earlier the same day, screen by screen, which is why it now has ONE owner).
 *
 * The gesture keeps its spinner: `isRefreshing` is true from the pull until the refresh the
 * caller returned settles. Background reconciliation happens with no theatre at all.
 */
import { useCallback, useRef, useState } from 'react';

export function usePullRefresh(refresh: () => Promise<unknown> | void): {
  isRefreshing: boolean;
  onRefresh: () => void;
} {
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** A second pull while one is in flight must not stack a second refresh. */
  const inFlight = useRef(false);

  const onRefresh = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsRefreshing(true);
    // `Promise.resolve` tolerates a void refresher, but a void refresher clears the spinner
    // immediately — return the real promise so the spinner tells the truth about the round trip.
    void Promise.resolve(refresh()).finally(() => {
      inFlight.current = false;
      setIsRefreshing(false);
    });
  }, [refresh]);

  return { isRefreshing, onRefresh };
}
