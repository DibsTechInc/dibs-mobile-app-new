/**
 * Step 2 — choose a provider. Staffed studios only; a roomBooking studio never routes here
 * (its "provider" is the config-mapped phantom, assigned at the services step).
 *
 * One tap selects AND advances — there is no footer, because there is no second decision to
 * hold. Avatars are initials on the accent wash: the API has no provider photos today, and a
 * grey silhouette placeholder would read as a broken image rather than a design.
 *
 * There is deliberately NO "First available" row. The server can only auto-assign AFTER an event
 * exists (a separate random-assign endpoint), and a booking written with the any-instructor
 * sentinel produces an event whose trainerid resolves to nobody — which hangs the client's own
 * upcoming-bookings request server-side. Until the backend has a safe assign-then-book path, an
 * explicit choice is the only honest offer.
 */
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ApiError, describeApiError } from '@/api/errors';
import type { Provider } from '@/api/schemas/appointments';
import { Button, EmptyState, ErrorState, Icon, SkeletonList, Text } from '@/components';
import { formatPrice } from '@/domain/money/format';
import { studio } from '@/config/studio';
import { useTheme } from '@/theme/ThemeProvider';

import { useAppointmentDraft } from './appointmentDraft';
import { FlowHeader, SummaryBand } from './FlowChrome';
import { useAppointmentTypes, useProviders } from './useAppointmentData';

export function providerDisplayName(provider: Provider): string {
  return [provider.firstname?.trim(), provider.lastname?.trim()].filter(Boolean).join(' ') || 'Staff';
}

function initialsFor(provider: Provider): string {
  const first = provider.firstname?.trim()?.[0] ?? '';
  const last = provider.lastname?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '·';
}

function ProviderRow({ provider, onPress }: { provider: Provider; onPress: () => void }) {
  const theme = useTheme();
  const name = providerDisplayName(provider);
  const bio = provider.staff_title?.trim() || provider.staff_description?.trim() || null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[name, bio].filter(Boolean).join('. ')}
      onPress={onPress}
      style={({ pressed }) => [{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base - 2,
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
      }]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.accentWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="heading" style={{ fontSize: 15, color: theme.colors.accentInk }}>
          {initialsFor(provider)}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="heading">{name}</Text>
        {bio ? (
          // One line. It exists to tell two people apart, not to sell.
          <Text variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
            {bio}
          </Text>
        ) : null}
      </View>

      <Icon name="forward" size={16} color={theme.colors.textTertiary} />
    </Pressable>
  );
}

export function ProviderScreen() {
  const theme = useTheme();
  const types = useAppointmentTypes();
  const providers = useProviders(true);
  const serviceId = useAppointmentDraft((state) => state.serviceId);
  const selectProvider = useAppointmentDraft((state) => state.selectProvider);

  const service = useMemo(
    () => (types.data ?? []).find((type) => type.id === serviceId) ?? null,
    [types.data, serviceId],
  );

  const summarySecondary = service
    ? [
        typeof service.length_minutes === 'number' ? `${service.length_minutes} min` : null,
        typeof service.default_price === 'number' && service.default_price > 0
          ? formatPrice(service.default_price)
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlowHeader
        title="Choose a provider"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/book'))}
      />

      {service ? (
        <SummaryBand
          label="YOUR SESSION"
          primary={service.appointment_type ?? 'Your session'}
          secondary={summarySecondary}
          onEdit={() => router.replace('/book')}
        />
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        {providers.isPending ? (
          <View style={{ padding: theme.spacing.lg }}>
            <SkeletonList count={4} />
          </View>
        ) : providers.error ? (
          <ErrorState
            message={describeApiError(providers.error)}
            retriable={!(providers.error instanceof ApiError) || providers.error.retriable}
            onRetry={() => void providers.refetch()}
          />
        ) : (providers.data ?? []).length === 0 ? (
          <View>
            <EmptyState
              title="No one is taking this session yet."
              body={`${studio.appName} has not opened this up for booking.`}
            />
            <View style={{ paddingHorizontal: theme.spacing.lg }}>
              <Button label="Back to services" variant="secondary" onPress={() => router.replace('/book')} />
            </View>
          </View>
        ) : (
          <>
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
              }}
            >
              <Text variant="label" color="tertiary" uppercase>
                Providers
              </Text>
            </View>
            {(providers.data ?? []).map((provider) => (
              <ProviderRow
                key={provider.id}
                provider={provider}
                onPress={() => {
                  selectProvider(provider.id);
                  router.push('/book/slots');
                }}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
