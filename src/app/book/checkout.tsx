import { Redirect } from 'expo-router';

import { canRenderAppointments } from '@/config/studio';
import { useAppointmentDraft } from '@/features/appointments/appointmentDraft';
import { AppointmentCheckoutScreen } from '@/features/appointments/AppointmentCheckoutScreen';

export default function AppointmentCheckoutRoute() {
  const slot = useAppointmentDraft((state) => state.slot);
  if (!canRenderAppointments()) return <Redirect href="/" />;
  if (slot === null) return <Redirect href="/book" />;
  return <AppointmentCheckoutScreen />;
}
