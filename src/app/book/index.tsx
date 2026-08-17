/**
 * /book — the appointment flow's first step. Which studio surface Home routes here is decided by
 * `resolveBookingSurface`; the screens themselves are gated only by the build flag, so a deep
 * link into a classes-only build lands on Home rather than a surface with no code behind it.
 */
import { Redirect } from 'expo-router';

import { canRenderAppointments } from '@/config/studio';
import { ServicesScreen } from '@/features/appointments/ServicesScreen';

export default function BookRoute() {
  if (!canRenderAppointments()) return <Redirect href="/" />;
  return <ServicesScreen />;
}
