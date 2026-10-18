export interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  syllabus: string[];
  duration?: string;
  fee: number;
  fee_visible: boolean;
  prerequisites?: string;
  level: string;
  image_url?: string;
  batches?: string[];
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  capacity_per_slot: number;
  is_active: number;
}

export interface TimeSlot {
  time: string;
  formattedTime: string;
  available: boolean;
  remainingCapacity: number;
  reason?: string;
}

export interface DayAvailability {
  date: string;
  isOpen: boolean;
  reason?: string;
  slots: TimeSlot[];
}

export interface Booking {
  id: string;
  booking_reference: string;
  access_token?: string;
  appointment_type_id: string;
  appointment_type_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  course_of_interest?: string | null;
  message?: string | null;
  appointment_date: string;
  appointment_time: string;
  formattedTime?: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  internal_notes?: string | null;
  cancelled_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  course_name?: string | null;
  message: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessHour {
  day_of_week: number;
  day_name: string;
  is_open: number;
  open_time: string;
  close_time: string;
  break_start?: string | null;
  break_end?: string | null;
}

export interface BlockedDate {
  id: string;
  date: string;
  is_full_day: number;
  start_time?: string | null;
  end_time?: string | null;
  reason: string;
  created_at: string;
}

export interface WebsiteSettings {
  [key: string]: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  type: string;
  status: string;
  payload?: string | null;
  error_message?: string | null;
  created_at: string;
}
