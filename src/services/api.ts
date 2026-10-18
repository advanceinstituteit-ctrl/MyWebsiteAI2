import {
  Course,
  AppointmentType,
  DayAvailability,
  Booking,
  Enquiry,
  BusinessHour,
  BlockedDate,
  WebsiteSettings,
  AdminUser,
  AuditLog,
  NotificationLog,
} from '../types';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Read cached token from localStorage if available
    this.token = typeof window !== 'undefined' ? localStorage.getItem('ait_admin_token') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ait_admin_token', token);
    } else {
      localStorage.removeItem('ait_admin_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // --- PUBLIC ENDPOINTS ---

  async getCourses(category?: string): Promise<{ courses: Course[] }> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<{ courses: Course[] }>(`/courses${query}`);
  }

  async getCourseBySlug(slug: string): Promise<{ course: Course }> {
    return this.request<{ course: Course }>(`/courses/${slug}`);
  }

  async getSettings(): Promise<{ settings: WebsiteSettings }> {
    return this.request<{ settings: WebsiteSettings }>('/settings');
  }

  async submitEnquiry(payload: {
    name: string;
    phone: string;
    email?: string;
    courseName?: string;
    message: string;
  }): Promise<{ success: boolean; message: string; enquiryId: string }> {
    return this.request('/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAppointmentTypes(): Promise<{ appointmentTypes: AppointmentType[] }> {
    return this.request<{ appointmentTypes: AppointmentType[] }>('/appointment-types');
  }

  async getAvailability(date: string, typeId: string): Promise<{ availability: DayAvailability }> {
    return this.request<{ availability: DayAvailability }>(
      `/availability?date=${encodeURIComponent(date)}&type=${encodeURIComponent(typeId)}`
    );
  }

  async createBooking(payload: {
    appointmentTypeId: string;
    appointmentDate: string;
    appointmentTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    courseOfInterest?: string;
    message?: string;
  }): Promise<{
    success: boolean;
    bookingReference: string;
    accessToken: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    customerName: string;
    message: string;
  }> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getBookingDetails(reference: string, token?: string, phone?: string): Promise<{ booking: Booking }> {
    let url = `/appointments/manage?ref=${encodeURIComponent(reference)}`;
    if (token) url += `&token=${encodeURIComponent(token)}`;
    if (phone) url += `&phone=${encodeURIComponent(phone)}`;
    return this.request<{ booking: Booking }>(url);
  }

  async cancelBooking(payload: {
    reference: string;
    token?: string;
    phone?: string;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/appointments/cancel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async rescheduleBooking(payload: {
    reference: string;
    token?: string;
    phone?: string;
    newDate: string;
    newTime: string;
  }): Promise<{ success: boolean; message: string; newDate: string; newTime: string }> {
    return this.request('/appointments/reschedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- ADMIN AUTH & MANAGEMENT ---

  async login(email: string, password: string): Promise<{ success: boolean; token: string; admin: AdminUser }> {
    const res = await this.request<{ success: boolean; token: string; admin: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getAdminMe(): Promise<{ admin: AdminUser }> {
    return this.request<{ admin: AdminUser }>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getAdminStats(): Promise<{
    todayCount: number;
    pendingCount: number;
    confirmedCount: number;
    cancelledCount: number;
    newEnquiriesCount: number;
    recentBookings: Booking[];
    typeDistribution: Array<{ name: string; count: number }>;
  }> {
    return this.request('/admin/stats');
  }

  async getAdminBookings(params?: {
    status?: string;
    search?: string;
    date?: string;
  }): Promise<{ bookings: Booking[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.date) query.set('date', params.date);
    return this.request(`/admin/bookings?${query.toString()}`);
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<{ success: boolean }> {
    return this.request(`/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteBooking(id: string): Promise<{ success: boolean }> {
    return this.request(`/admin/bookings/${id}`, { method: 'DELETE' });
  }

  async getAdminCourses(): Promise<{ courses: Course[] }> {
    return this.request('/admin/courses');
  }

  async createCourse(course: Partial<Course>): Promise<{ success: boolean; id: string }> {
    return this.request('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    });
  }

  async updateCourse(id: string, course: Partial<Course>): Promise<{ success: boolean }> {
    return this.request(`/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(course),
    });
  }

  async deleteCourse(id: string): Promise<{ success: boolean }> {
    return this.request(`/admin/courses/${id}`, { method: 'DELETE' });
  }

  async getAdminEnquiries(status?: string): Promise<{ enquiries: Enquiry[] }> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/admin/enquiries${q}`);
  }

  async updateEnquiry(id: string, updates: Partial<Enquiry>): Promise<{ success: boolean }> {
    return this.request(`/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getBusinessHours(): Promise<{ hours: BusinessHour[] }> {
    return this.request('/admin/calendar/hours');
  }

  async updateBusinessHours(hours: BusinessHour[]): Promise<{ success: boolean }> {
    return this.request('/admin/calendar/hours', {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    });
  }

  async getBlockedDates(): Promise<{ blockedDates: BlockedDate[] }> {
    return this.request('/admin/calendar/blocked');
  }

  async addBlockedDate(payload: {
    date: string;
    is_full_day: boolean;
    start_time?: string;
    end_time?: string;
    reason: string;
  }): Promise<{ success: boolean; id: string }> {
    return this.request('/admin/calendar/blocked', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteBlockedDate(id: string): Promise<{ success: boolean }> {
    return this.request(`/admin/calendar/blocked/${id}`, { method: 'DELETE' });
  }

  async getAdminSettings(): Promise<{ settings: WebsiteSettings }> {
    return this.request('/admin/settings');
  }

  async updateAdminSettings(settings: WebsiteSettings): Promise<{ success: boolean }> {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request('/admin/audit-logs');
  }

  async getNotificationLogs(): Promise<{ notifications: NotificationLog[] }> {
    return this.request('/admin/notifications');
  }

  async getSupabaseStatus(): Promise<{
    connected: boolean;
    projectUrl: string;
    tableFound: boolean;
    tableName?: string;
    message: string;
    schemaSql: string;
  }> {
    return this.request('/supabase/status');
  }
}

export const api = new ApiService();
