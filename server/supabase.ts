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
 * Uses smart schema compatibility:
 * - Tries inserting into 'enquiries'
 * - If table or column differs, tries 'inquiries' or alternative field names
 */
export async function saveEnquiryToSupabase(payload: SupabaseEnquiryPayload): Promise<{
  success: boolean;
  table?: string;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const now = payload.created_at || new Date().toISOString();

    // Primary attempt: standard 'enquiries' table
    const primaryRecord = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      course_name: payload.course_name || null,
      message: payload.message,
      status: payload.status || 'new',
      created_at: now,
    };

    const { data, error } = await supabase.from('enquiries').insert([primaryRecord]).select();

    if (!error) {
      console.log('✅ Enquiry saved to Supabase (enquiries table):', data);
      return { success: true, table: 'enquiries', data };
    }

    console.warn('⚠️ Supabase insert to "enquiries" table notice:', error.message);

    // If 'enquiries' table doesn't exist (e.g. error code 42P01) or column mismatch, try 'inquiries'
    const fallbackRecord = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      course: payload.course_name || null,
      message: payload.message,
      status: payload.status || 'new',
      created_at: now,
    };

    const tryInquiries = await supabase.from('inquiries').insert([fallbackRecord]).select();
    if (!tryInquiries.error) {
      console.log('✅ Enquiry saved to Supabase (inquiries table):', tryInquiries.data);
      return { success: true, table: 'inquiries', data: tryInquiries.data };
    }

    // Try without optional columns (minimal payload: name, phone, message) in 'enquiries'
    const minimalRecord = {
      name: payload.name,
      phone: payload.phone,
      message: payload.message,
    };
    const tryMinimal = await supabase.from('enquiries').insert([minimalRecord]).select();
    if (!tryMinimal.error) {
      console.log('✅ Enquiry saved to Supabase (enquiries minimal schema):', tryMinimal.data);
      return { success: true, table: 'enquiries', data: tryMinimal.data };
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
 * Saves appointment booking details to Supabase if an appointments/bookings table exists.
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
    const { error } = await supabase.from('bookings').insert([payload]);
    if (!error) {
      console.log('✅ Booking synced to Supabase (bookings table)');
      return { success: true };
    }
    return { success: false, error: error.message };
  } catch (err: any) {
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
    
    // Check 'enquiries' table
    const { data: enqData, error: enqError } = await supabase
      .from('enquiries')
      .select('id')
      .limit(1);

    if (!enqError) {
      return {
        connected: true,
        projectUrl: SUPABASE_URL,
        tableFound: true,
        tableName: 'enquiries',
        message: 'Successfully connected to Supabase backend and "enquiries" table is active.',
      };
    }

    // Check 'inquiries' table
    const { data: inqData, error: inqError } = await supabase
      .from('inquiries')
      .select('id')
      .limit(1);

    if (!inqError) {
      return {
        connected: true,
        projectUrl: SUPABASE_URL,
        tableFound: true,
        tableName: 'inquiries',
        message: 'Successfully connected to Supabase backend and "inquiries" table is active.',
      };
    }

    return {
      connected: true,
      projectUrl: SUPABASE_URL,
      tableFound: false,
      message: `Connected to Supabase project, but table "enquiries" or "inquiries" needs to be created or RLS policy enabled: ${enqError.message}`,
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
