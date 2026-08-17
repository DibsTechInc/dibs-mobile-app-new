import { Redirect } from 'expo-router';

import { canRenderAppointments } from '@/config/studio';
import { useAppointmentDraft } from '@/features/appointments/appointmentDraft';
import { SlotsScreen } from '@/features/appointments/SlotsScreen';

export default function SlotsRoute() {
  const serviceId = useAppointmentDraft((state) => state.serviceId);
  if (!canRenderAppointments()) return <Redirect href="/" />;
  // Route params carry nothing by design, so a deep link straight here has no service to show
  // times for — the services list is the only honest place to send it.
  if (serviceId === null) return <Redirect href="/book" />;
  return <SlotsScreen />;
}
