/**
 * Step 1 — pick the service (or, at a roomBooking studio, the room).
 *
 * ── Single-select, deliberately ──────────────────────────────────────────────────────────────
 * The design draws multi-select, and the backend cannot honour it: the paid booking endpoint
 * takes ONE appointmentTypeId and creates ONE event, so a two-service selection would charge for
 * two and book one (CHECKOUT.md's documented multi-service gap). One service per booking until
 * that gap closes. The checkbox visual stays — it is the selected-state language the handoff
 * specifies — but choosing a second row moves the selection rather than adding to it.
 *
 * At 263 the "services" are the two rooms, so single-select is also simply what the product is.
 */
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ApiError, describeApiError } from '@/api/errors';
import type { AppointmentType } from '@/api/schemas/appointments';
import { isAcceptingBookings } from '@/api/schemas/basic-config';
import {
  BookingUnavailableNotice,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
  Text,
} from '@/components';
import { selectAppointmentPass } from '@/domain/appointments/pass-coverage';
import { formatPrice } from '@/domain/money/format';
import { studio } from '@/config/studio';
import { useClientPasses } from '@/features/account/useClientPasses';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { useAppointmentDraft } from './appointmentDraft';
import { FlowFooter, FlowHeader } from './FlowChrome';
import { useAppointmentTypes } from './useAppointmentData';

/** Clearance for the sticky footer, matching the schedule's cart-bar rule. */
const FOOTER_CLEARANCE = 108;

interface ServiceGroup {
  category: string | null;
  services: AppointmentType[];
}

/**
 * Grouped by `service_category`, uncategorised rows last under no heading. A studio whose types
 * carry no categories at all (263's rooms) renders one flat list — a lone "OTHER" heading over
 * everything would be a label with no information in it.
 */
function groupServices(types: AppointmentType[]): ServiceGroup[] {
  const bookable = types.filter((type) => type.show_on_widget !== false);
  const byCategory = new Map<string, AppointmentType[]>();
  const uncategorised: AppointmentType[] = [];

  for (const type of bookable) {
    const category = type.service_category?.trim();
    if (category) {
      const bucket = byCategory.get(category);
      if (bucket) bucket.push(type);
      else byCategory.set(category, [type]);
    } else {
      uncategorised.push(type);
    }
  }

  const groups: ServiceGroup[] = [...byCategory.entries()].map(([category, services]) => ({
    category,
    services,
  }));
  if (uncategorised.length > 0) groups.push({ category: null, services: uncategorised });
  return groups;
}

function ServiceRow({
  service,
  selected,
  coveredLabel,
  onPress,
}: {
  service: AppointmentType;
  selected: boolean;
  /** "Included · 5-session recovery pack" when the client's pass covers appointments. */
  coveredLabel: string | null;
  onPress: () => void;
}) {
  const theme = useTheme();

  const duration =
    typeof service.length_minutes === 'number' && service.length_minutes > 0
      ? `${service.length_minutes} min`
      : null;
  const detail = [duration, service.description?.trim() || null].filter(Boolean).join(' · ');
  const price =
    typeof service.default_price === 'number' && service.default_price > 0
      ? formatPrice(service.default_price)
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={[service.appointment_type, detail, coveredLabel ?? price]
        .filter(Boolean)
        .join('. ')}
      onPress={onPress}
      style={({ pressed }) => [{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        backgroundColor: selected
          ? theme.colors.accentWash
          : pressed
            ? theme.colors.surface
            : theme.colors.background,
      }]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="heading">{service.appointment_type ?? 'Service'}</Text>
        {detail ? (
          <Text variant="caption" color="tertiary" numberOfLines={2} style={{ marginTop: 3 }}>
            {detail}
          </Text>
        ) : null}
        {coveredLabel ? (
          <Text variant="caption" color="accent" numberOfLines={2} style={{ marginTop: 3 }}>
            {coveredLabel}
          </Text>
        ) : null}
      </View>

      <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: theme.spacing.sm + 2 }}>
        {/* Price omitted when a pass covers it — the coverage line already answers the money. */}
        {price && !coveredLabel ? (
          <Text variant="numeral" style={{ fontSize: 17, lineHeight: 22 }}>
            {price}
          </Text>
        ) : null}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: theme.radii.input,
            borderWidth: selected ? 0 : 1,
            borderColor: theme.colors.border,
            backgroundColor: selected ? theme.colors.accentFill : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? <Icon name="check" size={15} color={theme.colors.onAccent} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function ServicesScreen() {
  const theme = useTheme();
  const { config } = useStudioConfig();
  const types = useAppointmentTypes();
  const { passes } = useClientPasses();
  const serviceId = useAppointmentDraft((state) => state.serviceId);
  const selectService = useAppointmentDraft((state) => state.selectService);
  const selectProvider = useAppointmentDraft((state) => state.selectProvider);

  const roomBooking = studio.features.roomBooking;
  const studioName = config?.studioName ?? studio.appName;
  // Offboarded / trial soft-lockout: browsing stays, the way IN comes down — mirroring the
  // backend's own semantics and the class schedule's gate. Missing config assumes live.
  const acceptingBookings = config ? isAcceptingBookings(config) : true;

  const groups = useMemo(() => groupServices(types.data ?? []), [types.data]);
  const selected = useMemo(
    () => (types.data ?? []).find((type) => type.id === serviceId) ?? null,
    [types.data, serviceId],
  );

  // One question, one answer: the same predicate checkout will use. Appointment passes are not
  // per-service, so coverage reads on every row.
  const coverage = useMemo(() => selectAppointmentPass(passes), [passes]);
  const coveredLabel = coverage ? `Included · ${coverage.passName}` : null;

  /**
   * At a roomBooking studio the booking must carry the config-mapped phantom provider — a room
   * whose mapping is missing cannot be booked safely (see whitelabel/schema.ts), so the footer
   * says so instead of offering a Continue that fails three screens later.
   */
  const missingRoomProvider =
    roomBooking &&
    selected !== null &&
    typeof studio.appointments.providerByServiceId[String(selected.id)] !== 'number';

  const onContinue = () => {
    if (!selected) return;
    if (roomBooking) {
      const providerId = studio.appointments.providerByServiceId[String(selected.id)];
      if (typeof providerId !== 'number') return;
      selectProvider(providerId);
      router.push('/book/slots');
      return;
    }
    router.push('/book/provider');
  };

  const footerDetail = selected
    ? [
        selected.appointment_type,
        typeof selected.length_minutes === 'number' ? `${selected.length_minutes} min` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlowHeader
        title={roomBooking ? 'Book studio time' : 'Book a session'}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: selected ? FOOTER_CLEARANCE : theme.spacing.xxl,
        }}
      >
        {types.isPending ? (
          <View style={{ padding: theme.spacing.lg }}>
            <SkeletonList count={4} />
          </View>
        ) : types.error ? (
          <ErrorState
            message={describeApiError(types.error)}
            retriable={!(types.error instanceof ApiError) || types.error.retriable}
            onRetry={() => void types.refetch()}
          />
        ) : groups.length === 0 ? (
          <EmptyState
            title="No services are bookable right now."
            body={`${studioName} has not published anything to book yet.`}
          />
        ) : (
          groups.map((group) => (
            <View key={group.category ?? 'uncategorised'}>
              {group.category ? (
                <View
                  style={{
                    paddingHorizontal: theme.spacing.lg,
                    paddingTop: theme.spacing.lg,
                    paddingBottom: theme.spacing.md,
                  }}
                >
                  <Text variant="label" color="tertiary" uppercase>
                    {group.category}
                  </Text>
                </View>
              ) : null}
              {group.services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  selected={service.id === serviceId}
                  coveredLabel={coveredLabel}
                  onPress={() => selectService(service.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {!acceptingBookings ? (
        <View style={{ padding: theme.spacing.lg }}>
          <BookingUnavailableNotice studioName={studioName} />
        </View>
      ) : selected ? (
        <FlowFooter
          leftLabel={missingRoomProvider ? null : footerDetail}
          rightLabel={
            missingRoomProvider || coveredLabel
              ? null
              : typeof selected.default_price === 'number' && selected.default_price > 0
                ? formatPrice(selected.default_price)
                : null
          }
        >
          {missingRoomProvider ? (
            <Text variant="secondary" color="secondary">
              This one can’t be booked from the app just yet — contact {studioName} at{' '}
              {studio.supportEmail} to reserve it.
            </Text>
          ) : (
            <Button
              label={roomBooking ? 'Choose a time' : 'Choose a provider'}
              variant="primary"
              onPress={onContinue}
            />
          )}
        </FlowFooter>
      ) : null}
    </View>
  );
}
