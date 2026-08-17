/**
 * The appointment flow's endpoints. Legacy widget-shared routes — every request shape here is
 * widget parity (traced 2026-08-16), because these services read exact field names and some of
 * them compare exact TYPES (`dibsId !== '263'` is a STRING comparison in the 263 availability
 * controller; a number is rejected).
 *
 * Auth: none of these routes mount middleware today. The READS (types, providers, availability,
 * conflict check) stay unauthenticated — a guest browsing openings is the product, same as the
 * widget. The two BOOKING writes send the token (`authenticated: true`) and their `userid`
 * always comes from the signed-in account, so the day the backend's auth-hardening mount lands,
 * the app already complies (`isRequestingOwnData` compares the body's userid to the token's).
 */
import { z } from 'zod';

import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  appointmentRefusalSchema,
  appointmentTypesResponseSchema,
  availabilitySlotSchema,
  completeAppointmentResponseSchema,
  conflictCheckResponseSchema,
  providersResponseSchema,
  recurringAppointmentResponseSchema,
  type AppointmentType,
  type AvailabilitySlot,
  type CompleteAppointmentResponse,
  type Provider,
  type RecurringAppointmentResponse,
} from '../schemas/appointments';

/**
 * A booking the server DECLINED — a decision with a sentence, not a fault. `code` says which
 * decision: `'room_conflict'` (the slot was taken mid-flow; nothing charged) is the one the UI
 * routes on; anything else renders the server's own message.
 */
export class AppointmentRefusedError extends ApiError {
  readonly refusalCode: string | null;

  constructor(args: { status: number; message: string; refusalCode: string | null; body: unknown }) {
    super({
      status: args.status,
      // 'bad_request' so describeApiError never overwrites the server's sentence with generic
      // "having trouble" copy — same rule as PurchaseRefusedError.
      code: 'bad_request',
      message: args.message,
      retriable: false,
      body: args.body,
    });
    this.name = 'AppointmentRefusedError';
    this.refusalCode = args.refusalCode;
  }
}

function asRefusal(error: unknown): never {
  if (error instanceof ApiError && error.status !== null) {
    const parsed = appointmentRefusalSchema.safeParse(error.body);
    if (parsed.success) {
      throw new AppointmentRefusedError({
        status: error.status,
        message: parsed.data.error,
        refusalCode: parsed.data.code ?? null,
        body: error.body,
      });
    }
  }
  throw error;
}

export async function fetchAppointmentTypes(
  client: ApiClient,
  { dibsStudioId }: { dibsStudioId: number },
  signal?: AbortSignal,
): Promise<AppointmentType[]> {
  const types = await client.post(
    'get-appt-types',
    // eventType 'appt' is what the widget sends. The server narrows by it ONLY when a studio
    // runs both surfaces — appointments-only studios whose legacy rows carry 'class' (226) still
    // get their full list.
    { dibsStudioId, eventType: 'appt' },
    appointmentTypesResponseSchema,
    { signal },
  );

  if (!Array.isArray(types)) {
    // The service's catch returns the error object and the controller 200s it.
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'The service list came back in a shape we could not read.',
      retriable: true,
      body: types,
    });
  }
  return types;
}

export async function fetchProviders(
  client: ApiClient,
  { dibsStudioId }: { dibsStudioId: number },
  signal?: AbortSignal,
): Promise<Provider[]> {
  const providers = await client.post(
    'appts/get-service-providers',
    { dibsId: dibsStudioId },
    providersResponseSchema,
    { signal },
  );

  if (!Array.isArray(providers)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'The provider list came back in a shape we could not read.',
      retriable: true,
      body: providers,
    });
  }
  return providers;
}

export interface FetchAvailabilityArgs {
  dibsStudioId: number;
  /** `YYYY-MM-DD`, the studio's calendar. */
  date: string;
  serviceId: number;
  /**
   * The provider whose openings to ask about, or null for "any" (the server's 1000 sentinel).
   * Sent as `{ id }` — the service destructures exactly that off the object.
   */
  providerId: number | null;
  /** The studio's IANA zone — the server's past-slot filter needs it. */
  timeZone: string;
  /** Which server variant this studio uses. From the build's `appointments` config. */
  variant: 'standard' | 'custom-263';
}

const availabilityResponseSchema = z.array(z.unknown());

export async function fetchAvailability(
  client: ApiClient,
  { dibsStudioId, date, serviceId, providerId, timeZone, variant }: FetchAvailabilityArgs,
  signal?: AbortSignal,
): Promise<AvailabilitySlot[]> {
  const path =
    variant === 'custom-263' ? 'appts/get-availability-custom-263' : 'appts/get-availability';

  const raw = await client.post(
    path,
    {
      // STRING, deliberately: the custom-263 controller gates on `dibsId !== '263'`.
      dibsId: String(dibsStudioId),
      // The widget's own format for this field.
      date: `${date} 00:00:00+00:00`,
      provider: { id: providerId ?? 1000 },
      apptType: serviceId,
      tz: timeZone,
      minuteIncrement: 30,
      multiIds: [serviceId],
      // Widget parity: the literal 1 means "the studio's first location" server-side.
      locationid: 1,
    },
    availabilityResponseSchema,
    { signal },
  );

  if (!Array.isArray(raw)) {
    // The standard service returns the raw Error object with HTTP 200 on failure.
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'Availability came back in a shape we could not read.',
      retriable: true,
      body: raw,
    });
  }

  // Slots are validated individually and bad rows dropped: one malformed slot must not blank the
  // whole day (these are legacy services assembling objects by hand).
  const slots: AvailabilitySlot[] = [];
  for (const row of raw) {
    const parsed = availabilitySlotSchema.safeParse(row);
    if (parsed.success) slots.push(parsed.data);
  }
  return slots;
}

export interface CheckSlotConflictArgs {
  dibsStudioId: number;
  startTimeIso: string;
  endTimeIso: string | null;
  instructorId: number | null;
  locationId: number | null;
}

/**
 * "Is this session still bookable?" — the widget's per-session pre-check for the monthly list.
 * `conflicted: true` renders the session struck-through and keeps it out of every money list.
 * A failed CHECK is treated as conflicted too — over-flagging costs a session from the list;
 * under-flagging books a slot the server will refuse.
 */
export async function checkSlotConflict(
  client: ApiClient,
  { dibsStudioId, startTimeIso, endTimeIso, instructorId, locationId }: CheckSlotConflictArgs,
  signal?: AbortSignal,
): Promise<{ conflicted: boolean; reason: string | null }> {
  try {
    const response = await client.post(
      'appts/confirm-no-conflict',
      {
        dibsId: String(dibsStudioId),
        locationid: locationId,
        appt: { start_time: startTimeIso, end_time: endTimeIso, instructorid: instructorId },
      },
      conflictCheckResponseSchema,
      { signal },
    );
    const conflicted = response.msg !== 'success' || response.preventBooking === true;
    return { conflicted, reason: response.reasonForPreventing ?? null };
  } catch {
    return { conflicted: true, reason: null };
  }
}

export async function completeAppointmentBooking(
  client: ApiClient,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<CompleteAppointmentResponse> {
  try {
    const response = await client.post(
      'checkout/complete-appointment-booking',
      body,
      completeAppointmentResponseSchema,
      { authenticated: true, signal },
    );
    if (response.success !== true) {
      // Belt and braces: failures normally arrive as 4xx, but a 200 body saying `success: false`
      // must not read as a booking.
      throw new AppointmentRefusedError({
        status: 200,
        message: response.error ?? 'The booking could not be completed. Please try again.',
        refusalCode: null,
        body: response,
      });
    }
    return response;
  } catch (error) {
    return asRefusal(error);
  }
}

export async function createRecurringAppointment(
  client: ApiClient,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<RecurringAppointmentResponse> {
  try {
    const response = await client.post(
      'appointments/recurring/enhanced',
      body,
      recurringAppointmentResponseSchema,
      { authenticated: true, signal },
    );
    if (response.success !== true) {
      throw new AppointmentRefusedError({
        status: 200,
        message: response.error ?? 'The booking could not be completed. Please try again.',
        refusalCode: null,
        body: response,
      });
    }
    return response;
  } catch (error) {
    return asRefusal(error);
  }
}
