import { db } from './db.js';
import crypto from 'crypto';

export interface TimeSlot {
  time: string; // "09:00", "09:30"
  formattedTime: string; // "9:00 AM"
  available: boolean;
  remainingCapacity: number;
  reason?: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  reason?: string;
  slots: TimeSlot[];
}

// Convert 24h "HH:MM" to "h:MM AM/PM"
export function formatTime12h(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// Get current date and time in Asia/Kolkata
export function getNowInKolkata(): { dateStr: string; timeStr: string; now: Date } {
  const now = new Date();
  const kolkataDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  const kolkataTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }); // HH:MM:SS
  return { dateStr: kolkataDateStr, timeStr: kolkataTimeStr.slice(0, 5), now };
}

// Check if a time string "HH:MM" is between start and end
function isTimeBetween(target: string, start: string, end: string): boolean {
  if (!start || !end) return false;
  return target >= start && target < end;
}

// Add minutes to HH:MM
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Get availability for a specific date and appointment type
export async function getAvailabilityForDate(
  dateStr: string,
  appointmentTypeId: string
): Promise<DayAvailability> {
  const { dateStr: todayKolkata, timeStr: currentTimeKolkata } = getNowInKolkata();

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { date: dateStr, isOpen: false, reason: 'Invalid date format', slots: [] };
  }

  // 1. Check if date is in the past
  if (dateStr < todayKolkata) {
    return { date: dateStr, isOpen: false, reason: 'Past date cannot be booked', slots: [] };
  }

  // 2. Load website booking settings
  const settingsResult = await db.execute("SELECT key, value FROM website_settings");
  const settings: Record<string, string> = {};
  for (const row of settingsResult.rows) {
    settings[String(row.key)] = String(row.value);
  }

  const maxAdvanceDays = parseInt(settings.booking_max_advance_days || '30', 10);
  const noticeHours = parseInt(settings.booking_notice_hours || '2', 10);

  // Check advance horizon
  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  const todayDate = new Date(`${todayKolkata}T00:00:00Z`);
  const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > maxAdvanceDays) {
    return {
      date: dateStr,
      isOpen: false,
      reason: `Booking is only allowed up to ${maxAdvanceDays} days in advance`,
      slots: [],
    };
  }

  // 3. Get appointment type details
  const typeResult = await db.execute({
    sql: 'SELECT * FROM appointment_types WHERE id = ? AND is_active = 1',
    args: [appointmentTypeId],
  });

  if (typeResult.rows.length === 0) {
    return { date: dateStr, isOpen: false, reason: 'Invalid appointment type', slots: [] };
  }
  const aptType = typeResult.rows[0];
  const duration = Number(aptType.duration_minutes) || 30;
  const capacity = Number(aptType.capacity_per_slot) || 1;

  // 4. Check day of week in business_hours
  // targetDate day: 0 = Sun, 1 = Mon ...
  const [y, m, d] = dateStr.split('-').map(Number);
  const jsDate = new Date(y, m - 1, d);
  const dayOfWeek = jsDate.getDay();

  const hoursResult = await db.execute({
    sql: 'SELECT * FROM business_hours WHERE day_of_week = ?',
    args: [dayOfWeek],
  });

  if (hoursResult.rows.length === 0 || !Number(hoursResult.rows[0].is_open)) {
    return { date: dateStr, isOpen: false, reason: 'Institute is closed on this day', slots: [] };
  }

  const bHours = hoursResult.rows[0];
  const openTime = String(bHours.open_time);
  const closeTime = String(bHours.close_time);
  const breakStart = bHours.break_start ? String(bHours.break_start) : null;
  const breakEnd = bHours.break_end ? String(bHours.break_end) : null;

  // 5. Check blocked dates/holidays
  const blockedResult = await db.execute({
    sql: 'SELECT * FROM blocked_dates_and_hours WHERE date = ?',
    args: [dateStr],
  });

  for (const row of blockedResult.rows) {
    if (Number(row.is_full_day) === 1) {
      return {
        date: dateStr,
        isOpen: false,
        reason: `Closed: ${row.reason || 'Special holiday/closure'}`,
        slots: [],
      };
    }
  }

  // 6. Query existing bookings for this date (excluding cancelled)
  const bookingsResult = await db.execute({
    sql: `SELECT appointment_time, COUNT(*) as booked_count 
          FROM bookings 
          WHERE appointment_date = ? AND status IN ('confirmed', 'pending')
          GROUP BY appointment_time`,
    args: [dateStr],
  });

  const bookedMap = new Map<string, number>();
  for (const b of bookingsResult.rows) {
    bookedMap.set(String(b.appointment_time), Number(b.booked_count));
  }

  // 7. Generate slots from openTime to closeTime
  const slots: TimeSlot[] = [];
  let currentSlotTime = openTime;

  // Slot step is either duration or 30 min standard
  const step = Math.min(duration, 30);

  while (currentSlotTime < closeTime) {
    const slotEndTime = addMinutesToTime(currentSlotTime, duration);
    if (slotEndTime > closeTime) {
      break;
    }

    let isAvailable = true;
    let unavailableReason = '';

    // Check lunch / tea break
    if (breakStart && breakEnd) {
      // Overlap with break
      if (
        (currentSlotTime >= breakStart && currentSlotTime < breakEnd) ||
        (slotEndTime > breakStart && slotEndTime <= breakEnd)
      ) {
        isAvailable = false;
        unavailableReason = 'Break time';
      }
    }

    // Check partial day blocks
    for (const row of blockedResult.rows) {
      if (Number(row.is_full_day) === 0 && row.start_time && row.end_time) {
        if (
          isTimeBetween(currentSlotTime, String(row.start_time), String(row.end_time)) ||
          isTimeBetween(slotEndTime, String(row.start_time), String(row.end_time))
        ) {
          isAvailable = false;
          unavailableReason = String(row.reason);
        }
      }
    }

    // Check minimum notice if booking for today
    if (dateStr === todayKolkata) {
      const minNoticeTime = addMinutesToTime(currentTimeKolkata, noticeHours * 60);
      if (currentSlotTime <= minNoticeTime) {
        isAvailable = false;
        unavailableReason = `Requires ${noticeHours}h advance notice`;
      }
    }

    // Check capacity
    const currentBooked = bookedMap.get(currentSlotTime) || 0;
    const remaining = Math.max(0, capacity - currentBooked);
    if (remaining <= 0) {
      isAvailable = false;
      unavailableReason = 'Fully booked';
    }

    slots.push({
      time: currentSlotTime,
      formattedTime: formatTime12h(currentSlotTime),
      available: isAvailable,
      remainingCapacity: remaining,
      reason: unavailableReason || undefined,
    });

    currentSlotTime = addMinutesToTime(currentSlotTime, step);
  }

  return {
    date: dateStr,
    isOpen: slots.some(s => s.available),
    slots,
  };
}

// Generate unique, readable, unguessable booking reference
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `AIT-${year}-${rand}`;
}

export function generateAccessToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
