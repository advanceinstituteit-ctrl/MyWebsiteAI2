# Advance IT Institute — Official Web & Appointment Booking Platform

Production-ready web platform and appointment-booking system built for **Advance IT Institute**, a software training and IT education center located in Najafgarh, New Delhi, India.

---

## 🏛️ Business Profile
- **Institute Name:** Advance IT Institute
- **Category:** Software Training Institute / IT Education
- **Campus Location:** First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi, Delhi 110043, India.
- **Helpline / Phone:** `+91 87005 73469`
- **Google Maps Listing:** [View Verified Campus Location](https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu)
- **Timezone:** Asia/Kolkata (IST)
- **Currency:** INR (₹)
- **Language / Locale:** English first, with clear local navigation and Hindi/English bilingual context.

---

## 🚀 Key Features

### 1. Public Portal & Course Catalogue
- **Hero & Trust Section:** Features "Build Practical Skills. Shape Your Future." with direct counselling CTAs, campus location shortcuts, and real facility highlights.
- **Course Catalogue:** Categorized programs across 8 core disciplines:
  1. *Basic Computer and Office Skills*
  2. *MS Office and Advanced Excel*
  3. *Tally Prime and GST Accounting*
  4. *Programming: C, Java, Python*
  5. *Digital Marketing & Social Media*
  6. *Hardware, Networking & Linux*
  7. *Spoken English & Personality Development*
  8. *Other IT and Career Skills*
- **Course Detail Pages:** Deep curriculum breakdown with module-by-module syllabus, batch timings, prerequisites, and direct counselling enrollment.
- **Campus Gallery:** Workstation, lab setup, and classroom previews with honest disclaimers.
- **FAQs & Interactive Enquiry:** Searchable question-and-answer library and enquiry form saving directly to the database.
- **Legal & Privacy Readiness:** Transparent Privacy Policy and Terms and Conditions.

### 2. End-to-End Appointment Booking System
- **Asia/Kolkata (IST) Engine:** Evaluates day-of-week operating hours, lunch breaks (1:30 PM - 2:00 PM), holidays, and blocked dates.
- **Concurrency Collision Prevention:** Guaranteed zero double-booking through relational database transactions and immediate pre-reservation availability re-verification.
- **Unique Booking Reference:** Human-readable reference codes (e.g., `AIT-2026-X8K9L`) and unguessable cryptographic access tokens.
- **Self-Service Customer Management:** Visitors can view their reservation, reschedule to any available slot, or cancel online with a reason using their Reference and security token or phone verification.

### 3. Secure Administrative Portal (`/admin`)
- **Protected Auth:** Admin login protected against brute-force attacks with IP rate-limiting lockout after 5 consecutive failures.
- **Dashboard Metrics:** Real-time counters for Today's sessions, Pending requests, Confirmed bookings, Cancelled slots, and New enquiries.
- **Bookings Management:** Filter by status, search by Reference/Name/Phone, change statuses, manage private staff notes, and export to CSV.
- **Course Editor:** Full CRUD for courses, syllabus modules, fee visibility toggles, and publication status.
- **Operating Hours & Calendar:** Configure weekly opening/closing times, break intervals, and schedule full-day or partial-day closures.
- **Student Leads Tracker:** Track enquiry status (New, Contacted, Converted, Closed) with internal notes.
- **Website Settings:** Live editor for institute name, phone, address, Google Maps link, hero copy, and booking notice rules.
- **Audit & Notification Logs:** Timestamped security logs for every administrative operation and email dispatch status.

---

## 🔐 Initial Administrator Setup & Credentials

On initial database setup, a Super Admin account is bootstrapped automatically:
- **Admin Email:** `admin@advanceit.in`
- **Initial Password:** `AdvanceIT@2026#Secure`
- **Portal URL:** `/admin`

*Administrators can update this password at any time from the Admin Portal using the "Change Password" modal.*

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons | Responsive SPA, Manrope & Inter typography |
| **Backend** | Node.js, Express 4, TypeScript (`tsx`) | RESTful API routes under `/api/*` |
| **Database** | LibSQL / SQLite + Supabase PostgreSQL | Embedded relational DB + Live sync to user's Supabase backend (`neehfufsciyduugdeajs`) |
| **Security** | `bcryptjs`, Secure Cookie / Bearer tokens | Rate-limited login, cryptographic references, sanitized SQL |
| **Notifications** | `nodemailer` | Outbound transactional emails with delivery audit logging |

---

## ⚡ Supabase Backend Connection

The application is connected to your Supabase project:
- **Project ID:** `neehfufsciyduugdeajs`
- **Project URL:** `https://neehfufsciyduugdeajs.supabase.co`
- **API Key:** `sb_publishable_04lOUfbVpO4wQxuaiFy--Q_6FPsTY6s`

### To ensure enquiries save directly to your Supabase project:
Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/neehfufsciyduugdeajs), click **SQL Editor**, and run this SQL:

```sql
CREATE TABLE IF NOT EXISTS public.enquiries (
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
USING (true);
```

Whenever anyone fills out the enquiry form, the details are immediately inserted into this `public.enquiries` table in your Supabase backend.

---

## 📦 Local Installation & Setup

1. **Clone repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

4. **Run automated test suite:**
   ```bash
   npm run test
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Required? | Default |
|---|---|---|---|
| `PORT` | Web server port | No | `3000` |
| `DATABASE_URL` | SQLite / LibSQL connection string | No | `file:data/advance_it.db` |
| `ADMIN_DEFAULT_PASSWORD` | Password used during initial admin bootstrap | No | `AdvanceIT@2026#Secure` |
| `SMTP_HOST` | Outbound SMTP host (e.g. `smtp.gmail.com`) | Optional | Empty |
| `SMTP_PORT` | Outbound SMTP port | Optional | `587` |
| `SMTP_USER` | Outbound SMTP username | Optional | Empty |
| `SMTP_PASS` | Outbound SMTP password | Optional | Empty |
| `SMTP_FROM` | Outbound email sender header | Optional | `Advance IT Institute <info@advanceit.in>` |

*Note on Email Deliverability: If SMTP credentials are not configured, the notification engine logs notifications safely to the database `notification_logs` table with status `unconfigured`. It never makes false delivery claims.*

---

## 🧪 Testing & Verification

The project includes an end-to-end automated test runner (`tests/systemTest.ts`):
```bash
npm run test
```

### Verified Test Cases:
- ✅ Database relational tables & seed initialization
- ✅ IST (Asia/Kolkata) timezone and slot calculations
- ✅ Sunday & holiday closure enforcement
- ✅ Slot availability calculation within opening hours (9:00 AM - 7:00 PM)
- ✅ Minimum notice enforcement (2 hours in advance)
- ✅ Booking creation and unguessable reference generation
- ✅ Concurrent collision prevention (double-booking protection)
- ✅ Customer access token verification
- ✅ Online appointment rescheduling with slot validation
- ✅ Online appointment cancellation with reason recording
- ✅ Slot liberation following cancellation
- ✅ Password hashing with bcrypt
- ✅ Brute-force protection: IP lockout after 5 consecutive failed logins
- ✅ Administrative audit trail recording
- ✅ Course creation and publishing
- ✅ Honest notification status reporting

---

## 🛡️ Database Schema & Backups

The relational database is stored at `data/advance_it.db`.

### Tables Created:
1. `profiles` — Administrator accounts, bcrypt password hashes, and roles.
2. `courses` — Job-oriented courses, slugs, syllabus JSON, durations, and fees.
3. `appointment_types` — Types (Counselling, Campus Visit, Admission, Consultation).
4. `business_hours` — Day-by-day weekly schedule and lunch break intervals.
5. `blocked_dates_and_hours` — Special holiday blocks and full/partial day closures.
6. `bookings` — Customer reservations, unguessable references, security tokens, and statuses.
7. `enquiries` — Public contact form submissions.
8. `website_settings` — Key-value pairs for address, phone, maps link, policies.
9. `notification_logs` — Transactional email delivery logs.
10. `admin_audit_logs` — Tamper-evident admin action log.

### Backup Command:
```bash
# Simple SQLite backup
sqlite3 data/advance_it.db ".backup 'data/backup_advance_it.db'"
```
