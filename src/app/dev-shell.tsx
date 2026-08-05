/**
 * Development shell — the component gallery, reachable at /dev-shell. Not a product screen.
 *
 * It exists so a dev build has something real to look at: it proves the white-label config
 * reached the runtime, the fonts loaded, and the accent derivation produced a legible palette
 * from THIS studio's colour. Run it for each studio and the two apps should look like different
 * products built by the same studio:
 *
 *   STUDIO_SLUG=everyday-ballet npx expo run:ios
 *   STUDIO_SLUG=carlsbad-village-yoga npx expo run:ios
 *
 * Home now lives at `/` (src/app/index.tsx). This stays as the place to eyeball every
 * component in one scroll when the theme changes.
 */
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BookingUnavailableNotice,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  Sheet,
  SkeletonList,
  StatusTag,
  Text,
} from '@/components';
import { studio } from '@/config/studio';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Defined at module scope, not inside the screen: a component created during render is a new
 * type on every pass, so React unmounts and remounts its whole subtree each time — which would
 * restart the skeleton animations here and, on a real screen, throw away input state.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text variant="label" color="tertiary" uppercase>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function DevShellScreen() {
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.xl,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">{studio.appName}</Text>
          <Text variant="secondary" color="secondary">
            Studio {studio.dibsStudioId} · {studio.timezone} · accent {studio.accentColor}
          </Text>
        </View>

        <Section title="Typography">
          <Text variant="hero">25</Text>
          <Text variant="title">Your 25th class</Text>
          <Text variant="numeral">6:00 PM</Text>
          <Text variant="body">
            The serif and sans together are the identity. A screen with no Fraunces has lost it.
          </Text>
          <Text variant="secondary" color="secondary">
            Secondary text, for supporting detail beneath a heading.
          </Text>
          <Text variant="caption" color="tertiary">
            Powered by Dibs
          </Text>
        </Section>

        <Section title="Accent derivation">
          <Card emphasis="accent">
            <Text variant="heading">Accent wash field</Text>
            <Text variant="secondary" color="secondary">
              Raw {theme.colors.accent} · fill {theme.colors.accentFill} · text on it{' '}
              {theme.colors.onAccent}
            </Text>
            <Text variant="caption" color="tertiary">
              White contrast {theme.accentMeta.rawContrastWithWhite}:1 · after guard{' '}
              {theme.accentMeta.fillContrast}:1
              {theme.accentMeta.fillAdjusted ? ' (fill darkened to pass AA)' : ''}
            </Text>
          </Card>
        </Section>

        <Section title="Buttons">
          <Button label="Book this class" onPress={() => setSheetOpen(true)} />
          <Button label="Change payment method" variant="secondary" onPress={() => {}} />
          <Button label="Add a promo code" variant="ghost" fullWidth={false} onPress={() => {}} />
          <Button label="Cancel membership" variant="destructive" onPress={() => {}} />
          <Button label="Booking…" loading onPress={() => {}} />
        </Section>

        <Section title="Cards and status">
          <Card onPress={() => {}} accessibilityLabel="6:00 PM Vinyasa Flow">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ gap: theme.spacing.xs }}>
                <Text variant="numeral">{formatStoredTime('2026-08-05T18:00:00.000Z')}</Text>
                <Text variant="heading">Vinyasa Flow</Text>
                {studio.display.showInstructor ? (
                  <Text variant="secondary" color="secondary">
                    with Elan
                  </Text>
                ) : null}
              </View>
              <StatusTag label="3 spots left" tone="accent" />
            </View>
          </Card>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            {['All', 'Morning', 'Evening'].map((label) => (
              <Chip
                key={label}
                label={label}
                selected={filter === label}
                onPress={() => setFilter(label)}
              />
            ))}
          </View>
        </Section>

        <Section title="Input">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            hint="We use this to send your booking confirmation."
          />
        </Section>

        <Section title="Loading, empty, error">
          <SkeletonList count={2} />
          <EmptyState
            title="No classes Thursday."
            body="The 6am Flow has space Friday."
            action={{ label: 'See Friday', onPress: () => {} }}
          />
          <ErrorState message="No connection. Check your internet and try again." onRetry={() => {}} />
          <BookingUnavailableNotice studioName={studio.appName} />
        </Section>
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="How would you like to pay?">
        <Card emphasis="accent">
          <Text variant="heading">10-Class Pass</Text>
          <Text variant="secondary" color="secondary">
            7 classes remaining
          </Text>
        </Card>
        <Card>
          <Text variant="heading">Visa ending 4242</Text>
          <Text variant="secondary" color="secondary">
            $28.00
          </Text>
        </Card>
        <Button label="Confirm booking · $0.00" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </SafeAreaView>
  );
}
