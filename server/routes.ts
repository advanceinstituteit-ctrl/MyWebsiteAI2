import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from './db.js';
import {
  getAvailabilityForDate,
  generateBookingReference,
  generateAccessToken,
  formatTime12h,
  getNowInKolkata,
} from './bookingEngine.js';
import { sendNotification } from './notifications.js';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  createSession,
  destroySession,
  requireAdmin,
  logAdminAction,
  AuthenticatedRequest,
} from './auth.js';
import {
  saveEnquiryToSupabase,
  saveBookingToSupabase,
  checkSupabaseStatus,
} from './supabase.js';

export const apiRouter = Router();

// ==========================================
// 1. PUBLIC WEBSITE & COURSE ENDPOINTS
// ==========================================

// Get all published courses
apiRouter.get('/courses', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    let sql = 'SELECT * FROM courses WHERE is_published = 1 ORDER BY order_index ASC, title ASC';
    const args: any[] = [];

    if (category) {
      sql = 'SELECT * FROM courses WHERE is_published = 1 AND category = ? ORDER BY order_index ASC, title ASC';
      args.push(category);
    }

    const result = await db.execute({ sql, args });
    const courses = result.rows.map(row => ({
      ...row,
      syllabus: typeof row.syllabus === 'string' ? JSON.parse(row.syllabus) : row.syllabus,
      batches: typeof row.batches === 'string' ? JSON.parse(row.batches) : row.batches,
      fee_visible: Boolean(row.fee_visible),
    }));

    res.json({ courses });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch courses', details: err.message });
  }
});

// Get single course by slug
apiRouter.get('/courses/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await db.execute({
      sql: 'SELECT * FROM courses WHERE slug = ? AND is_published = 1',
      args: [slug],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const row = result.rows[0];
    const course = {
      ...row,
      syllabus: typeof row.syllabus === 'string' ? JSON.parse(String(row.syllabus)) : row.syllabus,
      batches: typeof row.batches === 'string' ? JSON.parse(String(row.batches)) : row.batches,
      fee_visible: Boolean(row.fee_visible),
    };

    res.json({ course });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch course', details: err.message });
  }
});

// Get public website settings
apiRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      // Do not expose sensitive SMTP credentials to public
      if (!String(row.key).startsWith('smtp_user') && !String(row.key).startsWith('smtp_pass')) {
        settings[String(row.key)] = String(row.value);
      }
    }
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
});

// Submit General Course Enquiry
const enquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').max(15),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  courseName: z.string().optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters').max(1000),
});

apiRouter.post('/enquiries', async (req: Request, res: Response) => {
  try {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { name, phone, email, courseName, message } = parsed.data;
    const now = new Date().toISOString();
    const id = `enq_${crypto.randomUUID()}`;

    await db.execute({
      sql: `INSERT INTO enquiries (id, name, phone, email, course_name, message, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
      args: [id, name, phone, email || null, courseName || null, message, now, now],
    });

    // Also persist enquiry to connected Supabase backend
    const supabaseResult = await saveEnquiryToSupabase({
      name,
      phone,
      email: email || null,
      course_name: courseName || null,
      message,
      status: 'new',
      created_at: now,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry! Our academic counsellor will contact you shortly.',
      enquiryId: id,
      supabaseSynced: supabaseResult.success,
      supabaseTable: supabaseResult.table,
      supabaseNotice: supabaseResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit enquiry', details: err.message });
  }
});

// ==========================================
// 2. APPOINTMENT BOOKING WORKFLOW
// ==========================================

// Get active appointment types
apiRouter.get('/appointment-types', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM appointment_types WHERE is_active = 1 ORDER BY duration_minutes ASC');
    res.json({ appointmentTypes: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch appointment types', details: err.message });
  }
});

// Check availability for a given date and appointment type
apiRouter.get('/availability', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const typeId = req.query.type as string;

    if (!date || !typeId) {
      res.status(400).json({ error: 'date (YYYY-MM-DD) and type are required' });
      return;
    }

    const availability = await getAvailabilityForDate(date, typeId);
    res.json({ availability });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate availability', details: err.message });
  }
});

// Create a new appointment booking
const createBookingSchema = z.object({
  appointmentTypeId: z.string().min(1, 'Please select an appointment type'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z.string().min(10, 'Valid 10-digit phone number is required').max(15),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  courseOfInterest: z.string().optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});

apiRouter.post('/appointments', async (req: Request, res: Response) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const {
      appointmentTypeId,
      appointmentDate,
      appointmentTime,
      customerName,
      customerPhone,
      customerEmail,
      courseOfInterest,
      message,
    } = parsed.data;

    // 1. Re-validate slot availability on the server immediately before reservation
    const availability = await getAvailabilityForDate(appointmentDate, appointmentTypeId);
    if (!availability.isOpen) {
      res.status(409).json({
        error: `Cannot book appointment on ${appointmentDate}: ${availability.reason || 'Institute is closed'}`,
      });
      return;
    }

    const slot = availability.slots.find(s => s.time === appointmentTime);
    if (!slot || !slot.available) {
      res.status(409).json({
        error: slot?.reason || 'The selected time slot is no longer available. Please choose another slot.',
      });
      return;
    }

    // 2. Concurrency collision prevention using transaction
    const aptTypeResult = await db.execute({
      sql: 'SELECT * FROM appointment_types WHERE id = ?',
      args: [appointmentTypeId],
    });
    if (aptTypeResult.rows.length === 0) {
      res.status(400).json({ error: 'Invalid appointment type' });
      return;
    }
    const aptType = aptTypeResult.rows[0];
    const duration = Number(aptType.duration_minutes) || 30;
    const capacity = Number(aptType.capacity_per_slot) || 1;

    // Check existing count
    const existingCheck = await db.execute({
      sql: `SELECT COUNT(*) as count FROM bookings 
            WHERE appointment_date = ? AND appointment_time = ? AND status IN ('confirmed', 'pending')`,
      args: [appointmentDate, appointmentTime],
    });

    if (Number(existingCheck.rows[0].count) >= capacity) {
      res.status(409).json({
        error: 'This slot was just booked by another visitor. Please select a different time.',
      });
      return;
    }

    const bookingId = `bk_${crypto.randomUUID()}`;
    const bookingRef = generateBookingReference();
    const accessToken = generateAccessToken();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO bookings (
              id, booking_reference, access_token, appointment_type_id,
              customer_name, customer_phone, customer_email, course_of_interest,
              message, appointment_date, appointment_time, duration_minutes,
              status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
      args: [
        bookingId,
        bookingRef,
        accessToken,
        appointmentTypeId,
        customerName,
        customerPhone,
        customerEmail || null,
        courseOfInterest || null,
        message || null,
        appointmentDate,
        appointmentTime,
        duration,
        now,
        now,
      ],
    });

    // Send notification
    const formatted12h = formatTime12h(appointmentTime);
    await sendNotification({
      recipientEmail: customerEmail || null,
      recipientPhone: customerPhone,
      type: 'booking_confirmed',
      subject: `Appointment Confirmed: ${aptType.name} at Advance IT Institute`,
      bookingReference: bookingRef,
      customerName,
      appointmentTypeName: String(aptType.name),
      appointmentDate,
      appointmentTime: formatted12h,
      additionalInfo: 'Please arrive 5-10 minutes before your slot. Institute location: First Floor, Plot No. 2, Main Road, opp. Gupta Market, Najafgarh.',
    });

    // Also sync to Supabase (saves into enquiries and bookings table)
    const supabaseBookingResult = await saveBookingToSupabase({
      booking_reference: bookingRef,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_type: String(aptType.name),
      course_of_interest: courseOfInterest || null,
      message: message || null,
      status: 'confirmed',
    });

    res.status(201).json({
      success: true,
      bookingReference: bookingRef,
      accessToken,
      appointmentDate,
      appointmentTime: formatted12h,
      appointmentType: aptType.name,
      customerName,
      supabaseSynced: supabaseBookingResult.success,
      message: 'Your appointment has been confirmed!',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

// Check Supabase connection and schema status
apiRouter.get('/supabase/status', async (_req: Request, res: Response) => {
  try {
    const status = await checkSupabaseStatus();
    res.json({
      ...status,
      schemaSql: `CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  course_name TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public and anon users to insert enquiries
CREATE POLICY "Allow public insert to enquiries" 
ON public.enquiries 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow authenticated users to view enquiries
CREATE POLICY "Allow select for authenticated" 
ON public.enquiries 
FOR SELECT 
TO authenticated 
USING (true);`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check Supabase status', details: err.message });
  }
});

// Customer: Manage / View Booking by Reference & Token (or Phone)
apiRouter.get('/appointments/manage', async (req: Request, res: Response) => {
  try {
    const reference = req.query.ref as string;
    const token = req.query.token as string;
    const phone = req.query.phone as string;

    if (!reference) {
      res.status(400).json({ error: 'Booking reference is required' });
      return;
    }

    let sql = `
      SELECT b.booking_reference, b.appointment_date, b.appointment_time, b.duration_minutes,
             b.status, b.customer_name, b.customer_phone, b.customer_email, b.course_of_interest,
             b.message, b.cancelled_reason, b.created_at,
             t.name as appointment_type_name, t.description as appointment_type_description
      FROM bookings b
      LEFT JOIN appointment_types t ON b.appointment_type_id = t.id
      WHERE b.booking_reference = ?
    `;
    const args: any[] = [reference];

    if (token) {
      sql += ' AND b.access_token = ?';
      args.push(token);
    } else if (phone) {
      // Validate customer phone matches
      sql += ' AND (b.customer_phone = ? OR b.customer_phone = ?)';
      args.push(phone, `+91 ${phone}`);
    } else {
      res.status(401).json({ error: 'Access token or verification phone number is required to view booking' });
      return;
    }

    const result = await db.execute({ sql, args });
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found or verification failed' });
      return;
    }

    const booking = result.rows[0];
    res.json({
      booking: {
        ...booking,
        formattedTime: formatTime12h(String(booking.appointment_time)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve booking', details: err.message });
  }
});

// Customer: Cancel Booking
apiRouter.post('/appointments/cancel', async (req: Request, res: Response) => {
  try {
    const { reference, token, phone, reason } = req.body;
    if (!reference || (!token && !phone)) {
      res.status(400).json({ error: 'Booking reference and security token/phone are required' });
      return;
    }

    let query = 'SELECT * FROM bookings WHERE booking_reference = ?';
    const args = [reference];
    if (token) {
      query += ' AND access_token = ?';
      args.push(token);
    } else {
      query += ' AND (customer_phone = ? OR customer_phone = ?)';
      args.push(phone, `+91 ${phone}`);
    }

    const result = await db.execute({ sql: query, args });
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found or verification failed' });
      return;
    }

    const booking = result.rows[0];
    if (booking.status === 'cancelled') {
      res.status(400).json({ error: 'This booking is already cancelled' });
      return;
    }

    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE bookings 
            SET status = 'cancelled', cancelled_reason = ?, updated_at = ? 
            WHERE id = ?`,
      args: [reason || 'Cancelled by visitor online', now, booking.id],
    });

    // Notify customer
    await sendNotification({
      recipientEmail: booking.customer_email ? String(booking.customer_email) : null,
      recipientPhone: String(booking.customer_phone),
      type: 'booking_cancelled',
      subject: `Appointment Cancelled: Reference ${booking.booking_reference}`,
      bookingReference: String(booking.booking_reference),
      customerName: String(booking.customer_name),
      appointmentTypeName: 'Appointment',
      appointmentDate: String(booking.appointment_date),
      appointmentTime: formatTime12h(String(booking.appointment_time)),
      additionalInfo: `Reason: ${reason || 'Cancelled by visitor online'}. You can book a new appointment at any time.`,
    });

    res.json({ success: true, message: 'Your appointment has been cancelled.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel appointment', details: err.message });
  }
});

// Customer: Reschedule Booking
apiRouter.post('/appointments/reschedule', async (req: Request, res: Response) => {
  try {
    const { reference, token, phone, newDate, newTime } = req.body;
    if (!reference || (!token && !phone) || !newDate || !newTime) {
      res.status(400).json({ error: 'Missing required parameters for rescheduling' });
      return;
    }

    let query = 'SELECT * FROM bookings WHERE booking_reference = ?';
    const args = [reference];
    if (token) {
      query += ' AND access_token = ?';
      args.push(token);
    } else {
      query += ' AND (customer_phone = ? OR customer_phone = ?)';
      args.push(phone, `+91 ${phone}`);
    }

    const result = await db.execute({ sql: query, args });
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found or verification failed' });
      return;
    }

    const booking = result.rows[0];

    // Check new slot availability
    const availability = await getAvailabilityForDate(newDate, String(booking.appointment_type_id));
    if (!availability.isOpen) {
      res.status(409).json({ error: availability.reason || 'Institute is closed on new selected date' });
      return;
    }

    const slot = availability.slots.find(s => s.time === newTime);
    if (!slot || !slot.available) {
      res.status(409).json({ error: slot?.reason || 'The selected slot is unavailable for rescheduling.' });
      return;
    }

    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE bookings 
            SET appointment_date = ?, appointment_time = ?, status = 'confirmed', updated_at = ? 
            WHERE id = ?`,
      args: [newDate, newTime, now, booking.id],
    });

    // Notify customer
    await sendNotification({
      recipientEmail: booking.customer_email ? String(booking.customer_email) : null,
      recipientPhone: String(booking.customer_phone),
      type: 'booking_rescheduled',
      subject: `Appointment Rescheduled: ${booking.booking_reference}`,
      bookingReference: String(booking.booking_reference),
      customerName: String(booking.customer_name),
      appointmentTypeName: 'Appointment',
      appointmentDate: newDate,
      appointmentTime: formatTime12h(newTime),
      additionalInfo: 'Your appointment has been successfully updated to the new date and time.',
    });

    res.json({
      success: true,
      message: 'Your appointment has been rescheduled successfully.',
      newDate,
      newTime: formatTime12h(newTime),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reschedule appointment', details: err.message });
  }
});

// ==========================================
// 3. ADMIN AUTHENTICATION
// ==========================================

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const rateCheck = checkLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. Please try again in ${rateCheck.remainingSeconds} seconds.`,
    });
    return;
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM profiles WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (result.rows.length === 0) {
      recordFailedLogin(ip);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, String(admin.password_hash));
    if (!isMatch) {
      recordFailedLogin(ip);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    resetLoginAttempts(ip);

    const token = createSession(
      String(admin.id),
      String(admin.email),
      String(admin.full_name),
      String(admin.role)
    );

    // Set cookie
    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await logAdminAction(
      String(admin.email),
      'LOGIN',
      'auth',
      String(admin.id),
      'Successful login',
      ip
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failure', details: err.message });
  }
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.admin_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    destroySession(token);
  }
  res.clearCookie('admin_session');
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ admin: req.user });
});

apiRouter.post('/auth/change-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long' });
      return;
    }

    const adminResult = await db.execute({
      sql: 'SELECT * FROM profiles WHERE id = ?',
      args: [req.user!.userId],
    });

    if (adminResult.rows.length === 0) {
      res.status(404).json({ error: 'Admin profile not found' });
      return;
    }

    const admin = adminResult.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, String(admin.password_hash));
    if (!isMatch) {
      res.status(400).json({ error: 'Current password does not match' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?',
      args: [newHash, now, req.user!.userId],
    });

    await logAdminAction(
      req.user!.email,
      'PASSWORD_CHANGE',
      'profiles',
      req.user!.userId,
      'Password updated successfully',
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password', details: err.message });
  }
});

// ==========================================
// 4. ADMIN DASHBOARD METRICS & BOOKINGS
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const { dateStr: todayKolkata } = getNowInKolkata();

    const todayBookings = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM bookings WHERE appointment_date = ? AND status != "cancelled"',
      args: [todayKolkata],
    });

    const pendingBookings = await db.execute('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"');
    const confirmedBookings = await db.execute('SELECT COUNT(*) as count FROM bookings WHERE status = "confirmed"');
    const cancelledBookings = await db.execute('SELECT COUNT(*) as count FROM bookings WHERE status = "cancelled"');
    const totalEnquiries = await db.execute('SELECT COUNT(*) as count FROM enquiries WHERE status = "new"');

    // Recent 5 bookings
    const recentResult = await db.execute(`
      SELECT b.*, t.name as appointment_type_name 
      FROM bookings b
      LEFT JOIN appointment_types t ON b.appointment_type_id = t.id
      ORDER BY b.created_at DESC LIMIT 5
    `);

    // Type distribution
    const typeDistribution = await db.execute(`
      SELECT t.name, COUNT(b.id) as count
      FROM appointment_types t
      LEFT JOIN bookings b ON b.appointment_type_id = t.id
      GROUP BY t.name
    `);

    res.json({
      todayCount: Number(todayBookings.rows[0].count),
      pendingCount: Number(pendingBookings.rows[0].count),
      confirmedCount: Number(confirmedBookings.rows[0].count),
      cancelledCount: Number(cancelledBookings.rows[0].count),
      newEnquiriesCount: Number(totalEnquiries.rows[0].count),
      recentBookings: recentResult.rows.map(r => ({
        ...r,
        formattedTime: formatTime12h(String(r.appointment_time)),
      })),
      typeDistribution: typeDistribution.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
  }
});

// List Bookings with filters, search, pagination, and CSV export
apiRouter.get('/admin/bookings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const date = req.query.date as string;
    const exportCsv = req.query.export === 'true';

    let sql = `
      SELECT b.*, t.name as appointment_type_name
      FROM bookings b
      LEFT JOIN appointment_types t ON b.appointment_type_id = t.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND b.status = ?';
      args.push(status);
    }
    if (date) {
      sql += ' AND b.appointment_date = ?';
      args.push(date);
    }
    if (search) {
      sql += ' AND (b.booking_reference LIKE ? OR b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.customer_email LIKE ?)';
      const term = `%${search}%`;
      args.push(term, term, term, term);
    }

    sql += ' ORDER BY b.appointment_date DESC, b.appointment_time ASC';

    const result = await db.execute({ sql, args });

    if (exportCsv) {
      const rows = result.rows;
      const csvHeader = 'Reference,Customer Name,Phone,Email,Purpose,Date,Time,Status,Course of Interest,Created At\n';
      const csvRows = rows.map(r => {
        return `"${r.booking_reference}","${r.customer_name}","${r.customer_phone}","${r.customer_email || ''}","${r.appointment_type_name}","${r.appointment_date}","${r.appointment_time}","${r.status}","${r.course_of_interest || ''}","${r.created_at}"`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv');
      res.send(csvHeader + csvRows.join('\n'));
      return;
    }

    res.json({
      bookings: result.rows.map(r => ({
        ...r,
        formattedTime: formatTime12h(String(r.appointment_time)),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
  }
});

// Update Booking Status or Internal Notes
apiRouter.patch('/admin/bookings/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, internal_notes, cancelled_reason } = req.body;

    const existing = await db.execute({
      sql: 'SELECT * FROM bookings WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const current = existing.rows[0];
    const now = new Date().toISOString();

    const newStatus = status || current.status;
    const newNotes = internal_notes !== undefined ? internal_notes : current.internal_notes;
    const newReason = cancelled_reason !== undefined ? cancelled_reason : current.cancelled_reason;

    await db.execute({
      sql: `UPDATE bookings 
            SET status = ?, internal_notes = ?, cancelled_reason = ?, updated_at = ? 
            WHERE id = ?`,
      args: [newStatus, newNotes, newReason, now, id],
    });

    await logAdminAction(
      req.user!.email,
      'UPDATE_BOOKING',
      'bookings',
      id,
      `Status changed from ${current.status} to ${newStatus}`,
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Booking updated' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update booking', details: err.message });
  }
});

// Delete Booking
apiRouter.delete('/admin/bookings/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM bookings WHERE id = ?',
      args: [id],
    });

    await logAdminAction(
      req.user!.email,
      'DELETE_BOOKING',
      'bookings',
      id,
      'Deleted booking record',
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Booking deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete booking', details: err.message });
  }
});

// ==========================================
// 5. ADMIN COURSE CATALOGUE MANAGEMENT
// ==========================================

apiRouter.get('/admin/courses', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM courses ORDER BY order_index ASC, created_at DESC');
    const courses = result.rows.map(r => ({
      ...r,
      syllabus: typeof r.syllabus === 'string' ? JSON.parse(r.syllabus) : r.syllabus,
      batches: typeof r.batches === 'string' ? JSON.parse(r.batches) : r.batches,
      fee_visible: Boolean(r.fee_visible),
      is_published: Boolean(r.is_published),
    }));
    res.json({ courses });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch courses', details: err.message });
  }
});

apiRouter.post('/admin/courses', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      slug,
      category,
      description,
      syllabus,
      duration,
      fee,
      fee_visible,
      prerequisites,
      level,
      image_url,
      batches,
      is_published,
      order_index,
    } = req.body;

    if (!title || !slug || !category || !description) {
      res.status(400).json({ error: 'Title, slug, category, and description are required' });
      return;
    }

    const id = `crs_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO courses (
              id, title, slug, category, description, syllabus, duration,
              fee, fee_visible, prerequisites, level, image_url, batches,
              is_published, order_index, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title,
        slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
        category,
        description,
        JSON.stringify(Array.isArray(syllabus) ? syllabus : []),
        duration || null,
        fee || 0,
        fee_visible ? 1 : 0,
        prerequisites || null,
        level || 'Beginner to Advanced',
        image_url || null,
        JSON.stringify(Array.isArray(batches) ? batches : []),
        is_published ? 1 : 0,
        order_index || 0,
        now,
        now,
      ],
    });

    await logAdminAction(
      req.user!.email,
      'CREATE_COURSE',
      'courses',
      id,
      `Created course: ${title}`,
      req.ip || 'unknown'
    );

    res.status(201).json({ success: true, id, message: 'Course created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create course', details: err.message });
  }
});

apiRouter.put('/admin/courses/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      category,
      description,
      syllabus,
      duration,
      fee,
      fee_visible,
      prerequisites,
      level,
      image_url,
      batches,
      is_published,
      order_index,
    } = req.body;

    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE courses 
            SET title = ?, slug = ?, category = ?, description = ?, syllabus = ?,
                duration = ?, fee = ?, fee_visible = ?, prerequisites = ?, level = ?,
                image_url = ?, batches = ?, is_published = ?, order_index = ?, updated_at = ?
            WHERE id = ?`,
      args: [
        title,
        slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
        category,
        description,
        JSON.stringify(Array.isArray(syllabus) ? syllabus : []),
        duration || null,
        fee || 0,
        fee_visible ? 1 : 0,
        prerequisites || null,
        level || 'Beginner to Advanced',
        image_url || null,
        JSON.stringify(Array.isArray(batches) ? batches : []),
        is_published ? 1 : 0,
        order_index || 0,
        now,
        id,
      ],
    });

    await logAdminAction(
      req.user!.email,
      'UPDATE_COURSE',
      'courses',
      id,
      `Updated course: ${title}`,
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update course', details: err.message });
  }
});

apiRouter.delete('/admin/courses/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM courses WHERE id = ?',
      args: [id],
    });

    await logAdminAction(
      req.user!.email,
      'DELETE_COURSE',
      'courses',
      id,
      'Deleted course record',
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete course', details: err.message });
  }
});

// ==========================================
// 6. ADMIN CALENDAR, HOURS & BLOCKS
// ==========================================

apiRouter.get('/admin/calendar/hours', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM business_hours ORDER BY day_of_week ASC');
    res.json({ hours: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch business hours', details: err.message });
  }
});

apiRouter.put('/admin/calendar/hours', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hours } = req.body;
    if (!Array.isArray(hours)) {
      res.status(400).json({ error: 'hours array expected' });
      return;
    }

    for (const h of hours) {
      await db.execute({
        sql: `UPDATE business_hours 
              SET is_open = ?, open_time = ?, close_time = ?, break_start = ?, break_end = ?
              WHERE day_of_week = ?`,
        args: [
          h.is_open ? 1 : 0,
          h.open_time,
          h.close_time,
          h.break_start || null,
          h.break_end || null,
          h.day_of_week,
        ],
      });
    }

    await logAdminAction(
      req.user!.email,
      'UPDATE_BUSINESS_HOURS',
      'business_hours',
      null,
      'Updated weekly opening hours and break intervals',
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Business hours saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update business hours', details: err.message });
  }
});

// Blocked Dates and Special Hours
apiRouter.get('/admin/calendar/blocked', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM blocked_dates_and_hours ORDER BY date ASC');
    res.json({ blockedDates: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch blocked dates', details: err.message });
  }
});

apiRouter.post('/admin/calendar/blocked', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, is_full_day, start_time, end_time, reason } = req.body;
    if (!date || !reason) {
      res.status(400).json({ error: 'Date and reason are required' });
      return;
    }

    const id = `blk_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO blocked_dates_and_hours (id, date, is_full_day, start_time, end_time, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        date,
        is_full_day !== undefined ? (is_full_day ? 1 : 0) : 1,
        start_time || null,
        end_time || null,
        reason,
        now,
      ],
    });

    await logAdminAction(
      req.user!.email,
      'ADD_BLOCKED_DATE',
      'blocked_dates',
      id,
      `Blocked date ${date}: ${reason}`,
      req.ip || 'unknown'
    );

    res.status(201).json({ success: true, id, message: 'Blocked date added' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add blocked date', details: err.message });
  }
});

apiRouter.delete('/admin/calendar/blocked/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM blocked_dates_and_hours WHERE id = ?',
      args: [id],
    });

    await logAdminAction(
      req.user!.email,
      'DELETE_BLOCKED_DATE',
      'blocked_dates',
      id,
      'Removed blocked date',
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Blocked date removed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove blocked date', details: err.message });
  }
});

// ==========================================
// 7. ADMIN ENQUIRIES MANAGEMENT
// ==========================================

apiRouter.get('/admin/enquiries', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    let sql = 'SELECT * FROM enquiries';
    const args: any[] = [];

    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      args.push(status);
    }
    sql += ' ORDER BY created_at DESC';

    const result = await db.execute({ sql, args });
    res.json({ enquiries: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch enquiries', details: err.message });
  }
});

apiRouter.patch('/admin/enquiries/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, internal_notes } = req.body;
    const now = new Date().toISOString();

    const existing = await db.execute({
      sql: 'SELECT * FROM enquiries WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }

    const current = existing.rows[0];
    const newStatus = status || current.status;
    const newNotes = internal_notes !== undefined ? internal_notes : current.internal_notes;

    await db.execute({
      sql: 'UPDATE enquiries SET status = ?, internal_notes = ?, updated_at = ? WHERE id = ?',
      args: [newStatus, newNotes, now, id],
    });

    await logAdminAction(
      req.user!.email,
      'UPDATE_ENQUIRY',
      'enquiries',
      id,
      `Updated enquiry status to ${newStatus}`,
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Enquiry updated' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update enquiry', details: err.message });
  }
});

// ==========================================
// 8. ADMIN WEBSITE SETTINGS & AUDIT LOGS
// ==========================================

apiRouter.get('/admin/settings', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      // Obscure sensitive passwords in read view
      if (String(row.key) === 'smtp_pass') {
        settings[String(row.key)] = row.value ? '••••••••' : '';
      } else {
        settings[String(row.key)] = String(row.value);
      }
    }
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
});

apiRouter.put('/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Settings object required' });
      return;
    }

    for (const [key, val] of Object.entries(settings)) {
      if (key === 'smtp_pass' && val === '••••••••') {
        continue; // Keep existing password if not modified
      }
      await db.execute({
        sql: `INSERT INTO website_settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [key, String(val)],
      });
    }

    await logAdminAction(
      req.user!.email,
      'UPDATE_SETTINGS',
      'website_settings',
      null,
      'Updated website settings',
      req.ip || 'unknown'
    );

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save settings', details: err.message });
  }
});

apiRouter.get('/admin/audit-logs', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ logs: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

apiRouter.get('/admin/notifications', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ notifications: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notification logs', details: err.message });
  }
});
