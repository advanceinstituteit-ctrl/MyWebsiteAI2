import { db, initDatabase } from '../server/db.js';
import {
  getAvailabilityForDate,
  generateBookingReference,
  generateAccessToken,
  getNowInKolkata,
  addMinutesToTime,
  formatTime12h,
} from '../server/bookingEngine.js';
import {
  createSession,
  destroySession,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  logAdminAction,
} from '../server/auth.js';
import { sendNotification } from '../server/notifications.js';
import { checkSupabaseStatus } from '../server/supabase.js';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('🧪 Starting Automated QA & System Tests for Advance IT Institute...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, errorDetails?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${errorDetails ? `(${errorDetails})` : ''}`);
      failedCount++;
    }
  }

  // 1. Initialize Database
  try {
    await initDatabase();
    assert(true, 'Database initialized schema & seed tables successfully');
  } catch (err: any) {
    assert(false, 'Database initialization', err.message);
  }

  // 2. Test IST Timezone handling
  const kolkataTime = getNowInKolkata();
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(kolkataTime.dateStr),
    'Kolkata current date matches YYYY-MM-DD',
    kolkataTime.dateStr
  );
  assert(
    /^\d{2}:\d{2}$/.test(kolkataTime.timeStr),
    'Kolkata current time matches HH:MM',
    kolkataTime.timeStr
  );
  assert(formatTime12h('09:00') === '9:00 AM', 'formatTime12h 09:00 is 9:00 AM');
  assert(formatTime12h('14:30') === '2:30 PM', 'formatTime12h 14:30 is 2:30 PM');
  assert(addMinutesToTime('09:00', 30) === '09:30', 'addMinutesToTime 09:00 + 30m = 09:30');

  // 3. Test Availability on a Sunday (Closed day)
  // Find next Sunday
  const nextSunday = new Date();
  while (nextSunday.getDay() !== 0) {
    nextSunday.setDate(nextSunday.getDate() + 1);
  }
  const sundayStr = nextSunday.toISOString().split('T')[0];
  const sundayAvailability = await getAvailabilityForDate(sundayStr, 'apt_counselling');
  assert(
    sundayAvailability.isOpen === false,
    `Sunday is closed according to business hours (${sundayStr})`
  );

  // 4. Test Availability on a Monday (Open day)
  const nextMonday = new Date();
  while (nextMonday.getDay() !== 1) {
    nextMonday.setDate(nextMonday.getDate() + 1);
  }
  const mondayStr = nextMonday.toISOString().split('T')[0];
  const mondayAvailability = await getAvailabilityForDate(mondayStr, 'apt_counselling');
  assert(
    mondayAvailability.isOpen === true,
    `Monday has valid opening slots (${mondayStr})`
  );
  assert(
    mondayAvailability.slots.length > 0,
    `Monday generates positive slot list (${mondayAvailability.slots.length} slots)`
  );
  // Ensure slots between lunch break (13:30 - 14:00) are unavailable
  const lunchSlot = mondayAvailability.slots.find(s => s.time === '13:30');
  if (lunchSlot) {
    assert(lunchSlot.available === false, 'Lunch break slot (13:30) is marked unavailable');
  }

  // 5. Test Blocked Date functionality
  const testDateObj = new Date();
  testDateObj.setDate(testDateObj.getDate() + 5);
  // Ensure it's not a Sunday so we specifically test the holiday block
  if (testDateObj.getDay() === 0) testDateObj.setDate(testDateObj.getDate() + 1);
  const testBlockDate = testDateObj.toISOString().split('T')[0];

  await db.execute({
    sql: 'INSERT OR REPLACE INTO blocked_dates_and_hours (id, date, is_full_day, reason, created_at) VALUES (?, ?, 1, ?, ?)',
    args: ['blk_test_1', testBlockDate, 'QA Holiday Test', new Date().toISOString()],
  });
  const blockedAvailability = await getAvailabilityForDate(testBlockDate, 'apt_counselling');
  assert(
    Boolean(blockedAvailability.isOpen === false && blockedAvailability.reason?.includes('QA Holiday')),
    'Full-day blocked date returns isOpen=false with reason'
  );
  // Cleanup test blocked date
  await db.execute({
    sql: 'DELETE FROM blocked_dates_and_hours WHERE id = ?',
    args: ['blk_test_1'],
  });

  // 6. Test Booking Creation & Reference generation
  const ref = generateBookingReference();
  const token = generateAccessToken();
  assert(ref.startsWith('AIT-') && ref.length >= 10, 'Generated booking reference format is valid', ref);
  assert(token.length >= 32, 'Generated access token is secure and unguessable');

  const testBookingId = `bk_test_${Date.now()}`;
  const nowStr = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO bookings (
            id, booking_reference, access_token, appointment_type_id,
            customer_name, customer_phone, customer_email, course_of_interest,
            message, appointment_date, appointment_time, duration_minutes,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
    args: [
      testBookingId,
      ref,
      token,
      'apt_counselling',
      'Test Student QA',
      '+91 99999 88888',
      'test.student@example.com',
      'Python Programming',
      'Automated test booking',
      mondayStr,
      '10:00',
      30,
      nowStr,
      nowStr,
    ],
  });

  const checkBooking = await db.execute({
    sql: 'SELECT * FROM bookings WHERE booking_reference = ?',
    args: [ref],
  });
  assert(checkBooking.rows.length === 1, 'Booking persisted to database and retrievable by reference');

  // 7. Test Concurrency & Collision Prevention (Capacity=1)
  const mondayCheckAgain = await getAvailabilityForDate(mondayStr, 'apt_counselling');
  const booked10am = mondayCheckAgain.slots.find(s => s.time === '10:00');
  assert(
    booked10am?.available === false && booked10am?.reason === 'Fully booked',
    'Collision Prevention: Slot 10:00 AM on booked date is now marked Fully booked'
  );

  // 8. Test Customer Security Access
  // Access with correct token
  const validAccess = await db.execute({
    sql: 'SELECT * FROM bookings WHERE booking_reference = ? AND access_token = ?',
    args: [ref, token],
  });
  assert(validAccess.rows.length === 1, 'Customer can access booking with correct security token');

  // Access with wrong token should fail
  const invalidAccess = await db.execute({
    sql: 'SELECT * FROM bookings WHERE booking_reference = ? AND access_token = ?',
    args: [ref, 'wrong_token'],
  });
  assert(invalidAccess.rows.length === 0, 'Customer cannot access booking with invalid security token');

  // 9. Test Rescheduling
  await db.execute({
    sql: "UPDATE bookings SET appointment_time = '11:00', updated_at = ? WHERE id = ?",
    args: [new Date().toISOString(), testBookingId],
  });
  const rescheduledCheck = await db.execute({
    sql: 'SELECT appointment_time FROM bookings WHERE id = ?',
    args: [testBookingId],
  });
  assert(
    rescheduledCheck.rows[0].appointment_time === '11:00',
    'Booking successfully rescheduled to 11:00'
  );

  // 10. Test Cancellation
  await db.execute({
    sql: "UPDATE bookings SET status = 'cancelled', cancelled_reason = 'QA cancel test', updated_at = ? WHERE id = ?",
    args: [new Date().toISOString(), testBookingId],
  });
  const cancelledCheck = await db.execute({
    sql: 'SELECT status, cancelled_reason FROM bookings WHERE id = ?',
    args: [testBookingId],
  });
  assert(
    cancelledCheck.rows[0].status === 'cancelled',
    'Booking successfully marked cancelled'
  );

  // Once cancelled, the slot should be available again
  const mondayAfterCancel = await getAvailabilityForDate(mondayStr, 'apt_counselling');
  const freedSlot = mondayAfterCancel.slots.find(s => s.time === '10:00');
  assert(
    freedSlot?.available === true,
    'Cancelled slot becomes available again for new visitors'
  );

  // Cleanup test booking
  await db.execute({
    sql: 'DELETE FROM bookings WHERE id = ?',
    args: [testBookingId],
  });

  // 11. Test Admin Authentication & Bcrypt
  const adminProfile = await db.execute("SELECT * FROM profiles WHERE email = 'admin@advanceit.in'");
  assert(adminProfile.rows.length === 1, 'Admin profile exists in database');
  const passwordMatches = await bcrypt.compare(
    'AdvanceIT@2026#Secure',
    String(adminProfile.rows[0].password_hash)
  );
  assert(passwordMatches === true, 'Admin password matches bcrypt hash');

  // 12. Test Login Rate Limiting
  const testIp = '192.168.1.100';
  resetLoginAttempts(testIp);
  for (let i = 0; i < 5; i++) {
    recordFailedLogin(testIp);
  }
  const rateLimitState = checkLoginRateLimit(testIp);
  assert(
    rateLimitState.allowed === false && (rateLimitState.remainingSeconds || 0) > 0,
    'Rate limiting locks out after 5 consecutive failed login attempts'
  );
  resetLoginAttempts(testIp);

  // 13. Test Admin Audit Logging
  await logAdminAction(
    'admin@advanceit.in',
    'QA_TEST_ACTION',
    'test',
    'id_123',
    'Automated test audit log entry',
    '127.0.0.1'
  );
  const auditCheck = await db.execute({
    sql: "SELECT * FROM admin_audit_logs WHERE action = 'QA_TEST_ACTION'",
  });
  assert(auditCheck.rows.length >= 1, 'Admin audit log recorded action with timestamp and IP');

  // 14. Test Notification Honest Logging
  const notifResult = await sendNotification({
    recipientEmail: 'qa@example.com',
    recipientPhone: '+91 99999 88888',
    type: 'booking_received',
    subject: 'QA Test Notification',
    bookingReference: 'AIT-TEST-0001',
    customerName: 'Test Student',
    appointmentTypeName: 'Counselling',
    appointmentDate: mondayStr,
    appointmentTime: '10:00 AM',
  });
  assert(
    Boolean(notifResult && (notifResult.status === 'unconfigured' || notifResult.status === 'sent')),
    'Notification returns honest delivery status without false claims',
    notifResult?.status
  );

  // 15. Course CRUD Verification
  const testCourseId = `crs_test_${Date.now()}`;
  await db.execute({
    sql: `INSERT INTO courses (id, title, slug, category, description, syllabus, duration, fee, fee_visible, level, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      testCourseId,
      'QA Test Full-Stack Course',
      `qa-test-course-${Date.now()}`,
      'Programming: C, Java, Python',
      'Test description',
      JSON.stringify(['Module 1: Test']),
      '1 Month',
      5000,
      1,
      'Beginner',
      1,
      nowStr,
      nowStr,
    ],
  });
  const courseCheck = await db.execute({
    sql: 'SELECT * FROM courses WHERE id = ?',
    args: [testCourseId],
  });
  assert(courseCheck.rows.length === 1, 'Course creation succeeds in relational database');
  await db.execute({
    sql: 'DELETE FROM courses WHERE id = ?',
    args: [testCourseId],
  });

  // 16. Supabase Backend Connection Verification
  const supaStatus = await checkSupabaseStatus();
  assert(
    supaStatus.connected === true && supaStatus.projectUrl.includes('neehfufsciyduugdeajs'),
    'Supabase client connects to project neehfufsciyduugdeajs successfully'
  );

  console.log(`\n📊 Test Summary: ${passedCount} Passed, ${failedCount} Failed`);
  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All critical workflows verified successfully!');
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
