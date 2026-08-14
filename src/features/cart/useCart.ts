/**
 * The cart, resolved against the live schedule.
 *
 * One hook, used by the schedule's bar AND by the checkout screen, so the two can never quote
 * different totals for the same cart. `useSchedule` is a shared TanStack query — this adds no
 * request of its own.
 */
import { useMemo } from 'react';

import { studio } from '@/config/studio';
import { buildCart, type CartSummary } from '@/domain/cart/build-cart';
import { useSchedule } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

import { useCartStore } from './cartStore';

export interface CartState extends CartSummary {
  /**
   * True while the schedule has not arrived yet.
   *
   * It matters because before the schedule lands EVERY line resolves to `gone` — the id is in the
   * cart and the event is not in an empty array. Rendering that would tell a client their class was
   * cancelled because their connection was slow, which is the "empty list means you have none"
   * mistake in a new costume.
   */
  isResolving: boolean;
}

export function useCart(): CartState {
  const eventIds = useCartStore((state) => state.eventIds);
  const schedule = useSchedule();
  const { config } = useStudioConfig();

  const summary = useMemo(
    () =>
      buildCart(schedule.data ?? [], eventIds, {
        showInstructor: studio.display.showInstructor,
        currency: config?.currency,
      }),
    [schedule.data, eventIds, config?.currency],
  );

  return { ...summary, isResolving: !schedule.data && schedule.isPending };
}
