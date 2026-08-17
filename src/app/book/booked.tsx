import { canRenderAppointments } from '@/config/studio';
import { Redirect } from 'expo-router';

import { BookedScreen } from '@/features/appointments/BookedScreen';

export default function BookedRoute() {
  if (!canRenderAppointments()) return <Redirect href="/" />;
  return <BookedScreen />;
}
