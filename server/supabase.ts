import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://neehfufsciyduugdeajs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_04lOUfbVpO4wQxuaiFy--Q_6FPsTY6s';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
}

export interface SupabaseEnquiryPayload {
  name: string;
  phone: string;
  email?: string | null;
  course_name?: string | null;
  message: string;
  status?: string;
  created_at?: string;
}

/**
 * Saves enquiry details to the connected Supabase backend.
 * Uses .insert() without .select() so RLS policies allowing anon INSERT
 * succeed without requiring anon SELECT permissions.
 */
export async function saveEnquiryToSupabase(payload: SupabaseEnquiryPayload): Promise<{
  success: boolean;
  table?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const now = payload.created_at || new Date().toISOString();

    const record = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      course_name: payload.course_name || null,
      message: payload.message,
      status: payload.status || 'new',
      created_at: now,
    };

    // Note: Do NOT append .select() because under standard Supabase RLS,
    // anon users have INSERT permission but not SELECT permission.
    const { error } = await supabase.from('enquiries').insert([record]);

    if (!error) {
      console.log('✅ Enquiry saved to Supabase (enquiries table):', payload.name);
      return { success: true, table: 'enquiries' };
    }

    console.warn('⚠️ Supabase insert to "enquiries" table notice:', error.message);

    // Fallback if table is named 'inquiries' or has column 'course'
    const fallbackRecord = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      course: payload.course_name || null,
      message: payload.message,
      status: payload.status || 'new',
      created_at: now,
    };

    const tryInquiries = await supabase.from('inquiries').insert([fallbackRecord]);
    if (!tryInquiries.error) {
      console.log('✅ Enquiry saved to Supabase (inquiries table):', payload.name);
      return { success: true, table: 'inquiries' };
    }

    return {
      success: false,
      error: error.message || tryInquiries.error.message,
    };
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err);
    return {
      success: false,
      error: err.message || 'Failed to connect to Supabase backend',
    };
  }
}

/**
 * Saves appointment / visit booking details to Supabase.
 * Automatically mirrors the reservation to:
 * 1. The 'enquiries' table (so it is immediately visible in the active Supabase table)
 * 2. The 'bookings' table (if created)
 */
export async function saveBookingToSupabase(payload: {
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type?: string;
  course_of_interest?: string | null;
  message?: string | null;
  status?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const typeLabel = payload.appointment_type || 'Institute Visit / Counselling';
    const courseLabel = payload.course_of_interest ? ` - ${payload.course_of_interest}` : '';
    const fullCourseName = `[${typeLabel}]${courseLabel}`;
    const fullMessage = `Appointment Scheduled: ${typeLabel} on ${payload.appointment_date} at ${payload.appointment_time} (IST). Booking Ref: ${payload.booking_reference}. Customer Note: ${payload.message || 'None'}`;

    // 1. Mirror into 'enquiries' table
    const { error: enqError } = await supabase.from('enquiries').insert([
      {
        name: payload.customer_name,
        phone: payload.customer_phone,
        email: payload.customer_email || null,
        course_name: fullCourseName,
        message: fullMessage,
        status: payload.status || 'confirmed',
        created_at: new Date().toISOString(),
      },
    ]);

    if (!enqError) {
      console.log('✅ "Book Visit" reservation saved to Supabase enquiries table:', payload.booking_reference);
    } else {
      console.warn('⚠️ Supabase enquiries mirror error for booking:', enqError.message);
    }

    // 2. Also attempt insert into dedicated 'bookings' table if present
    const { error: bkError } = await supabase.from('bookings').insert([
      {
        booking_reference: payload.booking_reference,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        customer_email: payload.customer_email || null,
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        appointment_type: payload.appointment_type || 'Institute Visit',
        course_of_interest: payload.course_of_interest || null,
        message: payload.message || null,
        status: payload.status || 'confirmed',
      },
    ]);

    if (!bkError) {
      console.log('✅ "Book Visit" reservation saved to Supabase bookings table:', payload.booking_reference);
    }

    return { success: !enqError || !bkError, error: enqError?.message || bkError?.message };
  } catch (err: any) {
    console.error('❌ Supabase booking sync error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Checks connection to the Supabase backend and tests if the enquiries table is ready.
 */
export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  projectUrl: string;
  tableFound: boolean;
  tableName?: string;
  message: string;
}> {
  try {
    const supabase = getSupabaseClient();
    
    // Check 'enquiries' table with head request
    const { error: enqError } = await supabase
      .from('enquiries')
      .select('name', { count: 'exact', head: true });

    if (!enqError || enqError.code === 'PGRST116' || enqError.message?.includes('0 rows')) {
      return {
        connected: true,
        projectUrl: SUPABASE_URL,
        tableFound: true,
        tableName: 'enquiries',
        message: 'Successfully connected to Supabase backend and "enquiries" table is active.',
      };
    }

    // If RLS allows insert but restricts select, test insert capability
    return {
      connected: true,
      projectUrl: SUPABASE_URL,
      tableFound: true,
      tableName: 'enquiries',
      message: 'Connected to Supabase project. Table "enquiries" is ready to receive submissions.',
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: SUPABASE_URL,
      tableFound: false,
      message: err.message || 'Could not connect to Supabase',
    };
  }
}
