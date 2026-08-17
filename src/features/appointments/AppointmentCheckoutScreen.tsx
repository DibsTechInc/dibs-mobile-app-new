/**
 * Review & pay — the appointment flow's commit point.
 *
 * One screen for both shapes of booking. A single session shows the summary, the money split
 * out (appointments show TAX AS A LINE ITEM — the class flow does not, and the difference is
 * deliberate), the cancellation deadline as a real date, the payment method, and one button.
 * A monthly commitment additionally lists every session being bought — conflicted dates struck
 * through and excluded from every figure — and states the subscription's terms in sentences
 * before the button, because "Reserve studio time · $262.19" is a commitment, not a line item.
 *
 * ── Which money moves is resolved ONCE ────────────────────────────────────────────────────────
 * `resolvePayment` below is the single place that decides pass / credit / card, and the label
 * above the button, the button's own figure, and the request body are all read from its answer.
 * Two computations of "what pays for this" is the widget's July-2026 card bug wearing a new hat.
 *
 * ── Nothing here is a dead end ────────────────────────────────────────────────────────────────
 * No saved card and a nonzero total → the primary CTA IS "Add a card" (the packages-page rule:
 * never offer a Confirm that cannot succeed). A slot taken mid-flow (`room_conflict`) → nothing
 * was charged, and the button becomes "Pick a new time" with the grid refreshed behind it.
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { isAcceptingBookings } from '@/api/schemas/basic-config';
import {
  BookingUnavailableNotice,
  Button,
  ErrorState,
  Icon,
  Sheet,
  SkeletonList,
  Text,
} from '@/components';
import type { AppointmentPaymentInput } from '@/domain/appointments/payload';
import { selectAppointmentPass } from '@/domain/appointments/pass-coverage';
import {
  priceMonthlyCommitment,
  priceNextMonthPreview,
  priceSingleSession,
} from '@/domain/appointments/pricing';
import {
  futureHoldSessions,
  nextMonthWeekdayCount,
  remainingWeeklyDatesInMonth,
} from '@/domain/appointments/recurring';
import {
  describeCancelWindow,
  resolveAppointmentNoticeHours,
} from '@/domain/cancellation/cancel-window';
import { formatBalance, formatPrice } from '@/domain/money/format';
import type { SavedCard } from '@/domain/payments/cards';
import { formatStoredTime } from '@/domain/time/studio-now';
import { studio } from '@/config/studio';
import { useClientPasses } from '@/features/account/useClientPasses';
import { useCreditBalance } from '@/features/account/useCreditBalance';
import { CardEntryCancelled, useCardActions } from '@/features/account/useCardActions';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSavedCards } from '@/features/payments/useSavedCards';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { useAppointmentDraft } from './appointmentDraft';
import { FlowFooter, FlowHeader } from './FlowChrome';
import { providerDisplayName } from './ProviderScreen';
import { useAppointmentTypes, useProviders } from './useAppointmentData';
import { useBookAppointment, useMonthlyConflicts } from './useBookAppointment';

const priceRow = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

/** The one resolution of "what pays for this". Everything money-shaped reads from it. */
interface ResolvedPayment {
  input: AppointmentPaymentInput;
  /** The sentence above the button. */
  label: string;
  /** What leaves the CARD. 0 under pass/credit. */
  cardDue: number;
  /** True when the client must add a card before Confirm can succeed. */
  needsCard: boolean;
  passCoveredSessions: number;
}

export function AppointmentCheckoutScreen() {
  const theme = useTheme();
  const { config, timeZone } = useStudioConfig();
  const { status: authStatus } = useAuth();
  const types = useAppointmentTypes();
  const draft = useAppointmentDraft();
  const { passes } = useClientPasses();
  const credit = useCreditBalance();
  const cards = useSavedCards();
  const cardActions = useCardActions();
  const booking = useBookAppointment();

  const [applyCredit, setApplyCredit] = useState(false);
  const [chosenCardId, setChosenCardId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const roomBooking = studio.features.roomBooking;
  const providers = useProviders(!roomBooking && draft.providerId !== null);

  const service = useMemo(
    () => (types.data ?? []).find((type) => type.id === draft.serviceId) ?? null,
    [types.data, draft.serviceId],
  );
  const slot = draft.slot;
  const isMonthly = draft.commitment === 'monthly';

  const providerName = useMemo(() => {
    if (roomBooking) return null;
    const provider = (providers.data ?? []).find((row) => row.id === draft.providerId);
    return provider ? providerDisplayName(provider) : null;
  }, [roomBooking, providers.data, draft.providerId]);

  const locationId = slot?.apptLocationId ?? config?.locationIdShowing ?? null;
  const taxRatePercent = config?.taxRate ?? config?.salesTaxRate ?? 0;
  const creditBalance = credit.data ?? 0;

  // ── Monthly: the sessions being bought, with the server's per-date verdicts ────────────────
  const monthlyIsos = useMemo(
    () => (slot && isMonthly ? remainingWeeklyDatesInMonth(slot.start_time) : []),
    [slot, isMonthly],
  );
  const conflicts = useMonthlyConflicts({
    sessionIsos: monthlyIsos,
    slot,
    instructorId: draft.providerId,
    locationId,
    enabled: isMonthly && slot !== null,
  });
  const conflictByIso = useMemo(
    () => new Map((conflicts.data ?? []).map((row) => [row.startIso, row])),
    [conflicts.data],
  );
  const payNowIsos = useMemo(
    () => monthlyIsos.filter((iso) => conflictByIso.get(iso)?.conflicted !== true),
    [monthlyIsos, conflictByIso],
  );
  const conflictedCount = monthlyIsos.length - payNowIsos.length;

  // ── Money ──────────────────────────────────────────────────────────────────────────────────
  const coverage = useMemo(() => selectAppointmentPass(passes), [passes]);
  const pricePerSession = slot?.priceAppt ?? null;

  const pricing = useMemo(() => {
    if (pricePerSession === null) return null;
    if (isMonthly) {
      return priceMonthlyCommitment({
        sessionCount: payNowIsos.length,
        pricePerSession,
        taxRatePercent,
        passRemainingUses: coverage?.remainingUses ?? 0,
        creditAvailable: creditBalance,
        applyCredit,
      });
    }
    const single = priceSingleSession({
      priceDollars: pricePerSession,
      taxRatePercent,
      creditAvailable: creditBalance,
      applyCredit,
    });
    return {
      sessionCount: 1,
      sessionsCoveredByPass: coverage ? 1 : 0,
      sessionsNeedingPayment: coverage ? 0 : 1,
      passCoversPartial: false,
      passCoversAll: coverage !== null,
      subtotal: coverage ? 0 : single.subtotal,
      tax: coverage ? 0 : single.tax,
      total: coverage ? 0 : single.total,
      creditApplied: coverage ? 0 : single.creditApplied,
      due: coverage ? 0 : single.due,
    };
  }, [
    pricePerSession,
    isMonthly,
    payNowIsos.length,
    taxRatePercent,
    coverage,
    creditBalance,
    applyCredit,
  ]);

  const selectedCard: SavedCard | null = useMemo(() => {
    if (chosenCardId) {
      return cards.cards.find((card) => card.id === chosenCardId) ?? cards.defaultCard;
    }
    return cards.defaultCard;
  }, [cards.cards, cards.defaultCard, chosenCardId]);

  const payment: ResolvedPayment | null = useMemo(() => {
    if (!pricing) return null;

    // A genuinely FREE service ($0 price) resolves before anything else: it must not demand a
    // card (the packages-page rule cuts both ways), and it must not burn a pass use either —
    // the widget's own gate (`actualRequiresPayment = cartTotal > 0`) never spends a pass on a
    // free booking. The credit path with 0 books it without touching Stripe.
    if ((pricePerSession ?? 0) <= 0 && pricing.sessionCount > 0) {
      return {
        input: { type: 'credit', useCredit: 0 },
        label: 'No charge',
        cardDue: 0,
        needsCard: false,
        passCoveredSessions: 0,
      };
    }

    if (pricing.passCoversAll && coverage) {
      return {
        input: {
          type: 'pass',
          passId: coverage.pass.id,
          passName: coverage.passName,
          useCredit: 0,
        },
        label: `Covered by ${coverage.passName}`,
        cardDue: 0,
        needsCard: false,
        passCoveredSessions: pricing.sessionsCoveredByPass,
      };
    }

    const partialPass = pricing.passCoversPartial && coverage ? coverage : null;

    if (pricing.due <= 0 && pricing.creditApplied > 0) {
      return {
        input: {
          type: 'credit',
          useCredit: pricing.creditApplied,
          ...(partialPass ? { passId: partialPass.pass.id, passName: partialPass.passName } : {}),
        },
        label: 'Paying with studio credit',
        cardDue: 0,
        needsCard: false,
        passCoveredSessions: pricing.sessionsCoveredByPass,
      };
    }

    return {
      input: {
        type: 'card',
        paymentMethodId: selectedCard?.id ?? null,
        useCredit: pricing.creditApplied,
        ...(partialPass ? { passId: partialPass.pass.id, passName: partialPass.passName } : {}),
      },
      label: selectedCard ? `Paying with ${selectedCard.label}` : 'Add a card to book',
      cardDue: pricing.due,
      needsCard: selectedCard === null,
      passCoveredSessions: pricing.sessionsCoveredByPass,
    };
  }, [pricing, coverage, selectedCard, pricePerSession]);

  // Navigation is an EFFECT of the booked state, never a render side effect. `replace`, so the
  // checkout screen is not behind the success screen for a back-swipe to re-submit.
  const bookedNow = booking.phase.kind === 'booked';
  useEffect(() => {
    if (bookedNow) router.replace('/book/booked');
  }, [bookedNow]);

  // ── Guards, AFTER every hook so hook order stays fixed ─────────────────────────────────────
  if (authStatus !== 'signedIn') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <FlowHeader title="Review" onBack={() => router.back()} />
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.base }}>
          <Text variant="title">Sign in to book</Text>
          <Text variant="body" color="secondary">
            Your booking is saved — sign in and it will be right here.
          </Text>
          <Button
            label="Sign in"
            variant="primary"
            // The gate hands them straight back to this review — returnPath.ts whitelists it.
            onPress={() => router.push('/sign-in?returnTo=/book/checkout')}
          />
        </View>
      </View>
    );
  }

  if (!service || !slot || !pricing || !payment || draft.providerId === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <FlowHeader title="Review" onBack={() => router.back()} />
        <ErrorState
          message="This booking is missing a piece — start again from the services list."
          retriable={false}
        />
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <Button label="Back to services" variant="secondary" onPress={() => router.replace('/book')} />
        </View>
      </View>
    );
  }

  const cancelWindow = describeCancelWindow(
    slot.start_time,
    timeZone,
    resolveAppointmentNoticeHours(config),
  );
  const cancelSentence = cancelWindow
    ? cancelWindow.isStillFree
      ? `Free to cancel until ${cancelWindow.deadlineLabel} — ${cancelWindow.noticeHours} hours before. After that the session is charged in full.`
      : 'The free-cancellation window for this time has already passed — cancelling later means the session is still charged.'
    : null;

  const nextMonthCount = nextMonthWeekdayCount(slot.start_time);
  const nextPreview = priceNextMonthPreview({
    sessionCount: nextMonthCount,
    pricePerSession: pricePerSession ?? 0,
    taxRatePercent,
  });
  const weekdayLong = formatStoredTime(slot.start_time, { weekday: 'long' });
  const monthOfFirst = formatStoredTime(slot.start_time, { month: 'long' });
  const nextMonthLabel = formatStoredTime(
    new Date(Date.UTC(
      new Date(slot.start_time).getUTCFullYear(),
      new Date(slot.start_time).getUTCMonth() + 1,
      1,
    )).toISOString(),
    { month: 'long' },
  );

  const conflictsResolving = isMonthly && conflicts.isPending;
  const failed = booking.phase.kind === 'failed' ? booking.phase : null;
  const working = booking.phase.kind === 'working';

  const confirm = () => {
    if (working || conflictsResolving || payment.needsCard) return;
    if (isMonthly && payNowIsos.length === 0) return;

    // "What left their account today", for the success card: the card charge, or the credit
    // spent — a free booking leaves this 0 and the Booked screen says nothing about money.
    const paidToday =
      payment.input.type === 'credit' ? pricing.creditApplied : payment.cardDue;

    if (isMonthly) {
      void booking.book({
        kind: 'monthly',
        serviceId: service.id,
        serviceName: service.appointment_type ?? 'Studio time',
        slot,
        instructorId: draft.providerId!,
        providerName,
        payment: payment.input,
        pricing: { subtotal: pricing.subtotal, tax: pricing.tax, total: pricing.total },
        paidTotal: paidToday,
        payNowIsos,
        holdIsos: futureHoldSessions(payNowIsos),
        passCoveredSessions: payment.passCoveredSessions,
      });
    } else {
      void booking.book({
        kind: 'single',
        serviceId: service.id,
        serviceName: service.appointment_type ?? 'Your session',
        slot,
        instructorId: draft.providerId!,
        providerName,
        locationId,
        payment: payment.input,
        pricing: { subtotal: pricing.subtotal, tax: pricing.tax, total: pricing.total },
        paidTotal: paidToday,
      });
    }
  };

  const ctaFigure = payment.cardDue > 0 ? ` · ${formatPrice(payment.cardDue)}` : '';
  const ctaLabel = isMonthly ? `Reserve studio time${ctaFigure}` : `Confirm booking${ctaFigure}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlowHeader
        title={isMonthly ? 'Reserve studio time' : 'Review your booking'}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 200 }}>
        {/* ── The session ── */}
        <Text variant="title">
          {formatStoredTime(slot.start_time, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text
          variant="numeral"
          style={{ color: theme.colors.accentInk, marginTop: theme.spacing.xs }}
        >
          {formatStoredTime(slot.start_time)}
          {slot.end_time ? ` – ${formatStoredTime(slot.end_time)}` : ''}
        </Text>
        <Text variant="body" style={{ marginTop: theme.spacing.sm }}>
          {service.appointment_type}
          {typeof service.length_minutes === 'number' ? ` · ${service.length_minutes} min` : ''}
        </Text>
        {providerName ? (
          <Text variant="secondary" color="secondary" style={{ marginTop: 2 }}>
            with {providerName}
          </Text>
        ) : null}

        {/* ── Monthly: every date being bought ── */}
        {isMonthly ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.sm }}>
              {`${monthOfFirst}’s sessions`}
            </Text>
            {conflictsResolving ? (
              <SkeletonList count={2} />
            ) : (
              monthlyIsos.map((iso) => {
                const conflicted = conflictByIso.get(iso)?.conflicted === true;
                return (
                  <View
                    key={iso}
                    style={[priceRow, {
                      paddingVertical: theme.spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.divider,
                    }]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        variant="body"
                        style={
                          conflicted
                            ? { textDecorationLine: 'line-through', color: theme.colors.textTertiary }
                            : undefined
                        }
                      >
                        {formatStoredTime(iso, { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' · '}
                        {formatStoredTime(iso)}
                      </Text>
                      {conflicted ? (
                        <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
                          Not available on this date. You will not be charged.
                        </Text>
                      ) : null}
                    </View>
                    {!conflicted && typeof pricePerSession === 'number' ? (
                      <Text variant="numeral" style={{ fontSize: 17, lineHeight: 22 }}>
                        {formatPrice(pricePerSession)}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
            {conflictedCount > 0 && !conflictsResolving ? (
              <Text variant="caption" color="secondary" style={{ marginTop: theme.spacing.sm }}>
                {conflictedCount} of these {monthlyIsos.length} times{' '}
                {conflictedCount === 1 ? 'is' : 'are'} already taken — only the available ones are
                booked and charged.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ── The money, tax on its own line ── */}
        <View
          style={{
            marginTop: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: theme.spacing.base,
            gap: theme.spacing.sm,
          }}
        >
          {pricing.passCoversAll && coverage ? (
            <View style={priceRow}>
              <Text variant="body">Session{isMonthly && pricing.sessionCount > 1 ? 's' : ''}</Text>
              <Text variant="secondary" color="accent">
                Included · {coverage.passName}
              </Text>
            </View>
          ) : (
            <>
              {pricing.passCoversPartial && coverage ? (
                <View style={priceRow}>
                  <Text variant="secondary" color="accent">
                    {coverage.passName} covers {pricing.sessionsCoveredByPass} of{' '}
                    {pricing.sessionCount} sessions
                  </Text>
                </View>
              ) : null}
              <View style={priceRow}>
                <Text variant="body">
                  {isMonthly
                    ? `${pricing.sessionsNeedingPayment} session${pricing.sessionsNeedingPayment === 1 ? '' : 's'}`
                    : 'Session'}
                </Text>
                <Text variant="body">{formatPrice(pricing.subtotal)}</Text>
              </View>
              <View style={priceRow}>
                <Text variant="secondary" color="secondary">
                  Tax ({taxRatePercent.toFixed(3).replace(/\.?0+$/, '')}%)
                </Text>
                <Text variant="secondary" color="secondary">
                  {formatPrice(pricing.tax)}
                </Text>
              </View>
              {pricing.creditApplied > 0 ? (
                <View style={priceRow}>
                  <Text variant="secondary" color="secondary">
                    Studio credit
                  </Text>
                  <Text variant="secondary" color="secondary">
                    −{formatBalance(pricing.creditApplied)}
                  </Text>
                </View>
              ) : null}
              <View style={[priceRow, { marginTop: theme.spacing.xs }]}>
                <Text variant="bodyMedium">{isMonthly ? 'Due today' : 'Total'}</Text>
                <Text variant="title">{formatPrice(pricing.due)}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Credit toggle: only when they hold some and nothing covers the booking already ── */}
        {!pricing.passCoversAll && creditBalance > 0 ? (
          <View style={[priceRow, { marginTop: theme.spacing.base }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="body">Apply studio credit</Text>
              <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
                You have {formatBalance(creditBalance)}
              </Text>
            </View>
            <Switch
              value={applyCredit}
              onValueChange={setApplyCredit}
              trackColor={{ true: theme.colors.accentFill }}
            />
          </View>
        ) : null}

        {/* ── Payment method ── */}
        {!pricing.passCoversAll && pricing.due > 0 ? (
          <View
            style={{
              marginTop: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
              padding: theme.spacing.base,
            }}
          >
            {cards.status === 'loading' || cards.status === 'idle' ? (
              <Text variant="secondary" color="secondary">
                Checking your saved cards…
              </Text>
            ) : selectedCard ? (
              <View style={priceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Icon name="paymentMethods" size={18} color={theme.colors.textSecondary} />
                  <View>
                    <Text variant="body">{selectedCard.label}</Text>
                    <Text variant="caption" color="tertiary">
                      {selectedCard.expiryLabel}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change card"
                  onPress={() => setPickerOpen(true)}
                  hitSlop={8}
                >
                  <Text variant="secondary" color="accent">
                    Change
                  </Text>
                </Pressable>
              </View>
            ) : cards.status === 'error' ? (
              <View style={{ gap: theme.spacing.sm }}>
                <Text variant="secondary" color="secondary">
                  We could not reach your saved cards.
                </Text>
                <Button
                  label="Try again"
                  variant="secondary"
                  onPress={() => void cards.refresh()}
                />
              </View>
            ) : (
              <Text variant="secondary" color="secondary">
                No card on file yet — add one below to book.
              </Text>
            )}
          </View>
        ) : null}

        {/* ── The consequences, in words ── */}
        {cancelSentence && !isMonthly ? (
          <Text variant="caption" color="secondary" style={{ marginTop: theme.spacing.base }}>
            {cancelSentence}
          </Text>
        ) : null}

        {isMonthly ? (
          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            <Text variant="secondary" color="secondary">
              Your spot renews automatically — the same hour, every month, until you say otherwise.
            </Text>
            {nextMonthCount > 0 && typeof pricePerSession === 'number' ? (
              <Text variant="secondary" color="secondary">
                {`On ${monthOfFirst} 25 we charge ${formatPrice(nextPreview.total)} for ${nextMonthLabel}’s ${nextMonthCount} ${weekdayLong}s.`}
              </Text>
            ) : null}
            <Text variant="secondary" color="secondary">
              {'Cancel with 30 days’ notice by contacting the studio.'}
            </Text>
          </View>
        ) : null}

        {/* Dismissing the card sheet is a decision, not a failure; anything else is said plainly. */}
        {cardActions.addCard.isError &&
        !(cardActions.addCard.error instanceof CardEntryCancelled) ? (
          <Text
            variant="caption"
            style={{ color: theme.colors.danger, marginTop: theme.spacing.sm }}
          >
            {cardActions.addCard.error instanceof Error && cardActions.addCard.error.message
              ? cardActions.addCard.error.message
              : 'That card could not be saved. Please try another.'}
          </Text>
        ) : null}

        {failed ? (
          <View
            style={{
              marginTop: theme.spacing.base,
              borderRadius: theme.radii.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              padding: theme.spacing.base,
              gap: theme.spacing.xs,
            }}
          >
            <Text variant="secondary" style={{ color: theme.colors.danger }}>
              {failed.message}
            </Text>
            {failed.nothingCharged ? (
              <Text variant="caption" color="tertiary">
                Nothing was charged.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <FlowFooter>
        {config && !isAcceptingBookings(config) ? (
          // Soft lockout: the CTA comes down entirely — a Confirm the server will refuse is not
          // an offer. Browsing brought them here; the notice says why it stops here.
          <BookingUnavailableNotice studioName={config.studioName ?? studio.appName} />
        ) : isMonthly && !conflictsResolving && monthlyIsos.length > 0 && payNowIsos.length === 0 ? (
          // Every date this month is already taken. A disabled Confirm under a struck-through
          // list is a wall; the way forward is a different hour.
          <Button
            label="Pick another time"
            variant="primary"
            onPress={() => {
              booking.reset();
              draft.selectSlot(null);
              router.back();
            }}
          />
        ) : failed?.refusalCode === 'room_conflict' ? (
          <Button
            label="Pick a new time"
            variant="primary"
            onPress={() => {
              booking.reset();
              draft.selectSlot(null);
              router.back();
            }}
          />
        ) : payment.needsCard ? (
          <Button
            label="Add a card"
            variant="primary"
            loading={cardActions.addCard.isPending}
            onPress={() => {
              cardActions.addCard.mutate();
            }}
          />
        ) : (
          <Button
            label={failed ? `Try again${ctaFigure}` : ctaLabel}
            variant="primary"
            loading={working || conflictsResolving}
            disabled={isMonthly && !conflictsResolving && payNowIsos.length === 0}
            onPress={confirm}
          />
        )}
      </FlowFooter>

      {/* ── Card picker ── */}
      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Pay with">
        {cards.cards.map((card) => (
          <Pressable
            key={card.id}
            accessibilityRole="button"
            accessibilityLabel={card.label}
            onPress={() => {
              setChosenCardId(card.id);
              setPickerOpen(false);
            }}
            style={({ pressed }) => [priceRow, {
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.divider,
              opacity: pressed ? 0.6 : 1,
              backgroundColor:
                card.id === selectedCard?.id ? theme.colors.accentWash : 'transparent',
              borderRadius: theme.radii.input,
              paddingHorizontal: theme.spacing.sm,
            }]}
          >
            <View>
              <Text variant="body">{card.label}</Text>
              <Text variant="caption" color="tertiary">
                {card.expiryLabel}
              </Text>
            </View>
            {card.id === selectedCard?.id ? (
              <Icon name="check" size={18} color={theme.colors.accentInk} />
            ) : null}
          </Pressable>
        ))}
        <Button
          label="Add a new card"
          variant="secondary"
          loading={cardActions.addCard.isPending}
          onPress={() => {
            setPickerOpen(false);
            cardActions.addCard.mutate();
          }}
        />
      </Sheet>
    </View>
  );
}
