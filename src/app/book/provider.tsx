import { Redirect } from 'expo-router';

import { canRenderAppointments, studio } from '@/config/studio';
import { ProviderScreen } from '@/features/appointments/ProviderScreen';

export default function ProviderRoute() {
  if (!canRenderAppointments()) return <Redirect href="/" />;
  // A roomBooking studio has no provider step at all — never render it, even to a deep link.
  if (studio.features.roomBooking) return <Redirect href="/book" />;
  return <ProviderScreen />;
}
