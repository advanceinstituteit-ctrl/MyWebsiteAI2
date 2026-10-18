import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_URL = process.env.DATABASE_URL || `file:${path.join(DATA_DIR, 'advance_it.db')}`;

export const db: Client = createClient({
  url: DB_URL,
});

export async function initDatabase() {
  // Execute schema definitions
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'super_admin',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      syllabus TEXT NOT NULL,
      duration TEXT,
      fee REAL DEFAULT 0,
      fee_visible INTEGER DEFAULT 0,
      prerequisites TEXT,
      level TEXT NOT NULL DEFAULT 'Beginner to Advanced',
      image_url TEXT,
      batches TEXT,
      is_published INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointment_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      buffer_minutes INTEGER NOT NULL DEFAULT 15,
      capacity_per_slot INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS business_hours (
      day_of_week INTEGER PRIMARY KEY,
      day_name TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      open_time TEXT NOT NULL DEFAULT '09:00',
      close_time TEXT NOT NULL DEFAULT '19:00',
      break_start TEXT DEFAULT '13:00',
      break_end TEXT DEFAULT '14:00'
    );

    CREATE TABLE IF NOT EXISTS blocked_dates_and_hours (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      is_full_day INTEGER DEFAULT 1,
      start_time TEXT,
      end_time TEXT,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      appointment_type_id TEXT NOT NULL REFERENCES appointment_types(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      course_of_interest TEXT,
      message TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'confirmed',
      internal_notes TEXT,
      cancelled_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_reference);

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      course_name TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      internal_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT,
      recipient_phone TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await seedInitialData();
}

async function seedInitialData() {
  const now = new Date().toISOString();

  // 1. Seed Super Admin if no profile exists
  const existingProfiles = await db.execute('SELECT COUNT(*) as count FROM profiles');
  const count = Number(existingProfiles.rows[0].count);
  if (count === 0) {
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdvanceIT@2026#Secure';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.execute({
      sql: `INSERT INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'prof_admin_1',
        'admin@advanceit.in',
        passwordHash,
        'Director / Administrator',
        'super_admin',
        now,
        now,
      ],
    });
    console.log('✅ Default super admin created: admin@advanceit.in');
  }

  // 2. Seed Business Hours (Monday - Saturday 09:00 - 19:00, Sunday closed)
  const existingHours = await db.execute('SELECT COUNT(*) as count FROM business_hours');
  if (Number(existingHours.rows[0].count) === 0) {
    const days = [
      { day: 0, name: 'Sunday', isOpen: 0, open: '10:00', close: '16:00', bStart: '', bEnd: '' },
      { day: 1, name: 'Monday', isOpen: 1, open: '09:00', close: '19:00', bStart: '13:30', bEnd: '14:00' },
      { day: 2, name: 'Tuesday', isOpen: 1, open: '09:00', close: '19:00', bStart: '13:30', bEnd: '14:00' },
      { day: 3, name: 'Wednesday', isOpen: 1, open: '09:00', close: '19:00', bStart: '13:30', bEnd: '14:00' },
      { day: 4, name: 'Thursday', isOpen: 1, open: '09:00', close: '19:00', bStart: '13:30', bEnd: '14:00' },
      { day: 5, name: 'Friday', isOpen: 1, open: '09:00', close: '19:00', bStart: '13:30', bEnd: '14:00' },
      { day: 6, name: 'Saturday', isOpen: 1, open: '09:00', close: '18:00', bStart: '13:30', bEnd: '14:00' },
    ];
    for (const d of days) {
      await db.execute({
        sql: `INSERT INTO business_hours (day_of_week, day_name, is_open, open_time, close_time, break_start, break_end)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [d.day, d.name, d.isOpen, d.open, d.close, d.bStart, d.bEnd],
      });
    }
  }

  // 3. Seed Appointment Types
  const existingTypes = await db.execute('SELECT COUNT(*) as count FROM appointment_types');
  if (Number(existingTypes.rows[0].count) === 0) {
    const types = [
      {
        id: 'apt_counselling',
        name: 'Course Counselling',
        desc: '1-on-1 personalized academic and career guidance to choose the right IT or software course based on your goals.',
        duration: 30,
        buffer: 15,
        capacity: 1,
      },
      {
        id: 'apt_visit',
        name: 'Institute Campus Visit',
        desc: 'Walk in to inspect computer labs, classroom setup, meet instructors, and see ongoing practical batches in person.',
        duration: 30,
        buffer: 15,
        capacity: 2,
      },
      {
        id: 'apt_admission',
        name: 'Course Admission Enquiry',
        desc: 'Review fee structures, batch schedules, enrollment procedures, and register your seat.',
        duration: 30,
        buffer: 15,
        capacity: 1,
      },
      {
        id: 'apt_consultation',
        name: 'Career & Skill Consultation',
        desc: 'Custom consultation for working professionals, job-seekers, and students seeking targeted software certification.',
        duration: 45,
        buffer: 15,
        capacity: 1,
      },
    ];
    for (const t of types) {
      await db.execute({
        sql: `INSERT INTO appointment_types (id, name, description, duration_minutes, buffer_minutes, capacity_per_slot, is_active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        args: [t.id, t.name, t.desc, t.duration, t.buffer, t.capacity, now],
      });
    }
  }

  // 4. Seed Verified Initial Suggested Courses
  const existingCourses = await db.execute('SELECT COUNT(*) as count FROM courses');
  if (Number(existingCourses.rows[0].count) === 0) {
    const initialCourses = [
      {
        id: 'crs_basic_computer',
        title: 'Basic Computer & Office Skills',
        slug: 'basic-computer-office-skills',
        category: 'Basic Computer and Office Skills',
        description: 'Comprehensive foundational computer literacy course covering Windows OS, file management, typing skills, internet safety, and essential office utilities.',
        syllabus: JSON.stringify([
          'Module 1: Computer Fundamentals & Hardware Basics',
          'Module 2: Windows Operating System & File Management',
          'Module 3: Professional English & Hindi Typing Speed',
          'Module 4: Internet Navigation, Safe Browsing & Email Etiquette',
          'Module 5: Digital Payments & Government Portal Utilities'
        ]),
        duration: '2 to 3 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'No prior computer experience required',
        level: 'Beginner',
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Morning (9:00 AM - 11:00 AM)', 'Afternoon (2:00 PM - 4:00 PM)', 'Evening (5:00 PM - 7:00 PM)']),
        is_published: 1,
        order_index: 1,
      },
      {
        id: 'crs_ms_office_excel',
        title: 'MS Office & Advanced Excel Mastery',
        slug: 'ms-office-advanced-excel',
        category: 'MS Office and Advanced Excel',
        description: 'Master Microsoft Word, PowerPoint, and deep dive into Advanced Excel including VLOOKUP, XLOOKUP, Pivot Tables, Macros, and Business Dashboard reporting.',
        syllabus: JSON.stringify([
          'Module 1: MS Word - Official Documentation & Formatting',
          'Module 2: MS PowerPoint - Corporate Presentations & Pitch Decks',
          'Module 3: Excel Essentials - Formulas, Tables & Data Entry',
          'Module 4: Advanced Formulas - XLOOKUP, INDEX/MATCH, Dynamic Arrays',
          'Module 5: Pivot Tables, Charts & Interactive Dashboards',
          'Module 6: Data Cleaning, Validation & Conditional Formatting'
        ]),
        duration: '2 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'Basic familiarity with computer operations',
        level: 'Beginner to Intermediate',
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Weekday Regular (11:00 AM - 1:00 PM)', 'Weekend Special (10:00 AM - 1:00 PM)']),
        is_published: 1,
        order_index: 2,
      },
      {
        id: 'crs_tally_prime',
        title: 'Tally Prime & Professional Accounting with GST',
        slug: 'tally-prime-accounting-gst',
        category: 'Tally and Accounting',
        description: 'Industry-standard computerized accounting with Tally Prime. Learn ledger accounts, inventory management, voucher entries, GST calculation, e-invoicing, and balance sheets.',
        syllabus: JSON.stringify([
          'Module 1: Core Accounting Principles & Debit/Credit Rules',
          'Module 2: Company Creation & Ledger Architecture in Tally Prime',
          'Module 3: Inventory Control, Stock Groups & Purchase/Sales Orders',
          'Module 4: GST Setup, SGST/CGST/IGST Entries & E-Way Bills',
          'Module 5: Bank Reconciliation Statements (BRS)',
          'Module 6: Profit & Loss, Trial Balance & Balance Sheet Finalization'
        ]),
        duration: '3 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: '10th or 12th pass (Commerce background is helpful but not mandatory)',
        level: 'All Levels',
        image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Morning Batch (9:30 AM - 11:30 AM)', 'Evening Batch (4:30 PM - 6:30 PM)']),
        is_published: 1,
        order_index: 3,
      },
      {
        id: 'crs_python_programming',
        title: 'Python Programming & Practical Logic',
        slug: 'python-programming-logic',
        category: 'Programming: C, Java, Python',
        description: 'Step into software development with Python. Learn problem solving, data structures, object-oriented programming, automation scripts, and database connectivity.',
        syllabus: JSON.stringify([
          'Module 1: Python Syntax, Variables & Control Structures',
          'Module 2: Lists, Dictionaries, Tuples & String Manipulation',
          'Module 3: Functions, Modules & Exception Handling',
          'Module 4: Object-Oriented Programming (Classes & Inheritance)',
          'Module 5: File I/O, JSON & SQLite Database Integration',
          'Module 6: Capstone Project: Real-World Management Application'
        ]),
        duration: '3 to 4 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'Basic logical thinking and computer literacy',
        level: 'Beginner to Intermediate',
        image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Weekday Regular (3:00 PM - 5:00 PM)', 'Weekend Intensive (2:00 PM - 5:30 PM)']),
        is_published: 1,
        order_index: 4,
      },
      {
        id: 'crs_c_cpp_java',
        title: 'C, C++ & Core Java Foundation',
        slug: 'c-cpp-core-java',
        category: 'Programming: C, Java, Python',
        description: 'Rigorous foundation in computer science programming languages designed for BCA, B.Tech, diploma students, and aspiring software engineers.',
        syllabus: JSON.stringify([
          'Module 1: C Programming - Pointers, Memory & Data Structures',
          'Module 2: C++ OOP Concepts - Classes, Polymorphism, Templates',
          'Module 3: Core Java Basics - JVM Architecture & Syntax',
          'Module 4: Java Collections Framework, Streams & Exceptions',
          'Module 5: JDBC & Relational Database Connectivity',
          'Module 6: University Syllabus Alignment & Lab Practicals'
        ]),
        duration: '4 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'High school mathematics or college coursework',
        level: 'Intermediate',
        image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Evening Batch (5:30 PM - 7:30 PM)']),
        is_published: 1,
        order_index: 5,
      },
      {
        id: 'crs_digital_marketing',
        title: 'Digital Marketing & Social Media Strategy',
        slug: 'digital-marketing-strategy',
        category: 'Digital Marketing',
        description: 'Practical digital marketing covering Search Engine Optimization (SEO), Google Search & Display Ads, Meta Ads (Facebook & Instagram), Content Creation, and Local Business Growth.',
        syllabus: JSON.stringify([
          'Module 1: Website Fundamentals & Keyword Research',
          'Module 2: On-Page & Off-Page Search Engine Optimization (SEO)',
          'Module 3: Google Business Profile & Local Map Pack Ranking',
          'Module 4: Meta Ads Manager - Lead Generation Campaigns',
          'Module 5: Canva Design Basics & Social Media Content Calendars',
          'Module 6: Google Analytics 4 & Performance Reporting'
        ]),
        duration: '2.5 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'Basic knowledge of the web and social media apps',
        level: 'Beginner',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Morning Batch (10:00 AM - 12:00 PM)', 'Weekend Batch (11:00 AM - 2:00 PM)']),
        is_published: 1,
        order_index: 6,
      },
      {
        id: 'crs_spoken_english',
        title: 'Spoken English & Professional Personality Development',
        slug: 'spoken-english-personality-development',
        category: 'Spoken English',
        description: 'Build confidence in everyday conversational English, professional interview readiness, group discussion mastery, and business communication skills.',
        syllabus: JSON.stringify([
          'Module 1: Grammar Foundations & Correct Sentence Structures',
          'Module 2: Daily Conversational Fluency & Vocabulary Drills',
          'Module 3: Accent Clarification & Pronunciation Practice',
          'Module 4: Mock Job Interviews & Self-Introduction Mastery',
          'Module 5: Resume Building & Email Etiquette',
          'Module 6: Overcoming Stage Fear & Public Speaking'
        ]),
        duration: '2 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'Open to all learners desiring spoken confidence',
        level: 'All Levels',
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Evening Batch (5:00 PM - 6:30 PM)', 'Special Batch (12:00 PM - 1:30 PM)']),
        is_published: 1,
        order_index: 7,
      },
      {
        id: 'crs_linux_networking',
        title: 'Hardware, Networking & Linux Administration',
        slug: 'hardware-networking-linux',
        category: 'Linux and Networking',
        description: 'Hands-on hardware troubleshooting, LAN setup, Wi-Fi router configuration, IP addressing, and Linux command-line system administration.',
        syllabus: JSON.stringify([
          'Module 1: PC Assembly, SMPS, RAM, Motherboard Diagnostics',
          'Module 2: Operating System Installation & Driver Configuration',
          'Module 3: IPv4 / IPv6 Subnetting, Routers, Switches & LAN Cabling',
          'Module 4: Linux Installation & Fundamental CLI Commands',
          'Module 5: User Permissions, SSH Remote Access & File Services',
          'Module 6: Network Security & Firewall Basics'
        ]),
        duration: '3 Months',
        fee: 0,
        fee_visible: 0,
        prerequisites: 'Basic computer understanding',
        level: 'Beginner to Intermediate',
        image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
        batches: JSON.stringify(['Weekday Afternoon (2:00 PM - 4:00 PM)']),
        is_published: 1,
        order_index: 8,
      }
    ];

    for (const c of initialCourses) {
      await db.execute({
        sql: `INSERT INTO courses (id, title, slug, category, description, syllabus, duration, fee, fee_visible, prerequisites, level, image_url, batches, is_published, order_index, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          c.id,
          c.title,
          c.slug,
          c.category,
          c.description,
          c.syllabus,
          c.duration,
          c.fee,
          c.fee_visible,
          c.prerequisites,
          c.level,
          c.image_url,
          c.batches,
          c.is_published,
          c.order_index,
          now,
          now,
        ],
      });
    }
  }

  // 5. Seed Website Settings
  const defaultSettings: Record<string, string> = {
    institute_name: 'Advance IT Institute',
    tagline: 'Build Practical Skills. Shape Your Future.',
    category: 'Software Training Institute / IT Education',
    phone: '+91 87005 73469',
    phone_raw: '918700573469',
    email: 'info@advanceit.in',
    address: 'First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi, Delhi 110043, India',
    maps_url: 'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    currency_symbol: '₹',
    counselling_is_free: 'true',
    booking_notice_hours: '2', // minimum notice before appointment
    booking_max_advance_days: '30', // booking horizon
    default_slot_interval_minutes: '30',
    whatsapp_enabled: 'true',
    smtp_enabled: 'false',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_from: 'Advance IT Institute <no-reply@advanceit.in>',
    hero_headline: 'Build Practical Skills. Shape Your Future.',
    hero_subheadline: 'Job-oriented software training, accounting, programming, and IT education in Najafgarh, New Delhi. Learn with hands-on computer lab sessions and personal faculty attention.',
    notice_banner: '', // empty or customizable announcement
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await db.execute({
      sql: 'SELECT key FROM website_settings WHERE key = ?',
      args: [key],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO website_settings (key, value) VALUES (?, ?)',
        args: [key, value],
      });
    }
  }

  // 6. Seed Demonstrative Sample Bookings (clearly marked as demonstration/sample)
  const existingBookings = await db.execute('SELECT COUNT(*) as count FROM bookings');
  if (Number(existingBookings.rows[0].count) === 0) {
    // Tomorrow in YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    await db.execute({
      sql: `INSERT INTO bookings (id, booking_reference, access_token, appointment_type_id, customer_name, customer_phone, customer_email, course_of_interest, message, appointment_date, appointment_time, duration_minutes, status, internal_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'bk_demo_1',
        'AIT-DEMO-9821',
        'tok_demo_a1b2c3d4e5',
        'apt_counselling',
        'Rohit Sharma (Sample Data)',
        '+91 98765 43210',
        'rohit.sample@example.com',
        'MS Office & Advanced Excel Mastery',
        'Demonstration booking for verification: Interested in weekend batch timing.',
        tomorrowStr,
        '11:00',
        30,
        'confirmed',
        'Demonstration record seeded on system setup.',
        now,
        now,
      ],
    });

    await db.execute({
      sql: `INSERT INTO bookings (id, booking_reference, access_token, appointment_type_id, customer_name, customer_phone, customer_email, course_of_interest, message, appointment_date, appointment_time, duration_minutes, status, internal_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'bk_demo_2',
        'AIT-DEMO-4412',
        'tok_demo_f6g7h8j9k0',
        'apt_visit',
        'Pooja Verma (Sample Data)',
        '+91 98111 22334',
        'pooja.sample@example.com',
        'Tally Prime & Professional Accounting with GST',
        'Demonstration booking for verification: Visiting institute lab with father.',
        dayAfterStr,
        '15:00',
        30,
        'pending',
        'Demonstration record for pending confirmation.',
        now,
        now,
      ],
    });
  }
}
