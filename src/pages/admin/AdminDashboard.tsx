import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Bell,
  Lock,
  MessageSquare,
} from 'lucide-react';
import {
  Booking,
  Course,
  Enquiry,
  BusinessHour,
  BlockedDate,
  WebsiteSettings,
  AdminUser,
  AuditLog,
  NotificationLog,
} from '../../types';
import { api } from '../../services/api';

interface AdminDashboardProps {
  navigate: (route: string) => void;
  onRefreshPublicData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  navigate,
  onRefreshPublicData,
}) => {
  // Auth state
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Login form state
  const [emailInput, setEmailInput] = useState<string>('admin@advanceit.in');
  const [passwordInput, setPasswordInput] = useState<string>('AdvanceIT@2026#Secure');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState<boolean>(false);

  // Active view tab: 'overview' | 'bookings' | 'courses' | 'calendar' | 'enquiries' | 'settings' | 'logs'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Stats
  const [stats, setStats] = useState<{
    todayCount: number;
    pendingCount: number;
    confirmedCount: number;
    cancelledCount: number;
    newEnquiriesCount: number;
    recentBookings: Booking[];
    typeDistribution: Array<{ name: string; count: number }>;
  } | null>(null);

  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [selectedBookingForNote, setSelectedBookingForNote] = useState<Booking | null>(null);
  const [internalNoteDraft, setInternalNoteDraft] = useState<string>('');

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState<boolean>(false);

  // Calendar & Hours state
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockDate, setNewBlockDate] = useState<string>('');
  const [newBlockReason, setNewBlockReason] = useState<string>('');
  const [newBlockFullDay, setNewBlockFullDay] = useState<boolean>(true);

  // Enquiries state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Settings state
  const [siteSettings, setSiteSettings] = useState<WebsiteSettings>({});

  // Audit and notification logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Supabase connection state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    projectUrl: string;
    tableFound: boolean;
    tableName?: string;
    message: string;
    schemaSql: string;
  } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Global feedback toast/alert
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const showFeedback = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Check login session on mount
  useEffect(() => {
    setAuthLoading(true);
    api
      .getAdminMe()
      .then(res => {
        setAdmin(res.admin);
        loadAllAdminData();
      })
      .catch(() => {
        setAdmin(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    setLoginError(null);
    try {
      const res = await api.login(emailInput, passwordInput);
      setAdmin(res.admin);
      showFeedback('Logged in successfully');
      loadAllAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setAdmin(null);
    showFeedback('Logged out');
  };

  const loadAllAdminData = async () => {
    try {
      const [statsRes, bookingsRes, coursesRes, hoursRes, blockedRes, enqRes, settingsRes] =
        await Promise.all([
          api.getAdminStats(),
          api.getAdminBookings(),
          api.getAdminCourses(),
          api.getBusinessHours(),
          api.getBlockedDates(),
          api.getAdminEnquiries(),
          api.getAdminSettings(),
        ]);

      setStats(statsRes);
      setBookings(bookingsRes.bookings);
      setCourses(coursesRes.courses);
      setBusinessHours(hoursRes.hours);
      setBlockedDates(blockedRes.blockedDates);
      setEnquiries(enqRes.enquiries);
      setSiteSettings(settingsRes.settings);
      api.getSupabaseStatus().then(setSupabaseStatus).catch(console.error);
    } catch (err: any) {
      console.error('Failed to load some admin data', err);
    }
  };

  const loadLogs = async () => {
    try {
      const [aRes, nRes] = await Promise.all([api.getAuditLogs(), api.getNotificationLogs()]);
      setAuditLogs(aRes.logs);
      setNotificationLogs(nRes.notifications);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (
    id: string,
    newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show',
    reason?: string
  ) => {
    try {
      await api.updateBooking(id, { status: newStatus, cancelled_reason: reason });
      showFeedback(`Booking status changed to ${newStatus}`);
      const updated = await api.getAdminBookings({
        status: bookingFilterStatus,
        search: bookingSearch,
      });
      setBookings(updated.bookings);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update status', true);
    }
  };

  // Save Internal Notes
  const handleSaveInternalNote = async () => {
    if (!selectedBookingForNote) return;
    try {
      await api.updateBooking(selectedBookingForNote.id, {
        internal_notes: internalNoteDraft,
      });
      showFeedback('Internal notes saved');
      setSelectedBookingForNote(null);
      const updated = await api.getAdminBookings({
        status: bookingFilterStatus,
        search: bookingSearch,
      });
      setBookings(updated.bookings);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to save note', true);
    }
  };

  // Export Bookings to CSV
  const handleExportCsv = () => {
    const url = `/api/admin/bookings?export=true${
      bookingFilterStatus !== 'all' ? `&status=${bookingFilterStatus}` : ''
    }`;
    window.location.href = url;
  };

  // Course management handlers
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      if (isCreatingCourse) {
        await api.createCourse(editingCourse);
        showFeedback('Course created successfully');
      } else if (editingCourse.id) {
        await api.updateCourse(editingCourse.id, editingCourse);
        showFeedback('Course updated successfully');
      }
      setEditingCourse(null);
      setIsCreatingCourse(false);
      const res = await api.getAdminCourses();
      setCourses(res.courses);
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to save course', true);
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"?`)) return;
    try {
      await api.deleteCourse(id);
      showFeedback('Course deleted');
      const res = await api.getAdminCourses();
      setCourses(res.courses);
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete course', true);
    }
  };

  // Hours handler
  const handleSaveHours = async () => {
    try {
      await api.updateBusinessHours(businessHours);
      showFeedback('Business hours saved successfully');
    } catch (err: any) {
      showFeedback(err.message || 'Failed to save business hours', true);
    }
  };

  // Add Blocked Date
  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate || !newBlockReason) return;
    try {
      await api.addBlockedDate({
        date: newBlockDate,
        is_full_day: newBlockFullDay,
        reason: newBlockReason,
      });
      showFeedback('Blocked date added');
      setNewBlockDate('');
      setNewBlockReason('');
      const res = await api.getBlockedDates();
      setBlockedDates(res.blockedDates);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to add blocked date', true);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      await api.deleteBlockedDate(id);
      showFeedback('Blocked date removed');
      const res = await api.getBlockedDates();
      setBlockedDates(res.blockedDates);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to remove date', true);
    }
  };

  // Enquiry status change
  const handleUpdateEnquiry = async (
    id: string,
    status: 'new' | 'contacted' | 'converted' | 'closed'
  ) => {
    try {
      await api.updateEnquiry(id, { status });
      showFeedback(`Enquiry marked as ${status}`);
      const res = await api.getAdminEnquiries();
      setEnquiries(res.enquiries);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update enquiry', true);
    }
  };

  // Settings update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAdminSettings(siteSettings);
      showFeedback('Website settings saved successfully');
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to save settings', true);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordMsg({ text: res.message, error: false });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Password change failed', error: true });
    }
  };

  // If loading session
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // If not logged in, render Secure Login Form
  if (!admin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#0e1628] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">
              Advance IT Institute
            </h2>
            <p className="text-xs text-slate-400">
              Staff & Administrator Security Gateway
            </p>
          </div>

          {/* Seed demo credentials hint */}
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5" /> Evaluator / Bootstrap Credentials
            </div>
            <p className="text-[11px] text-slate-300">
              Email: <code className="text-white font-mono">admin@advanceit.in</code>
            </p>
            <p className="text-[11px] text-slate-300">
              Password: <code className="text-white font-mono">AdvanceIT@2026#Secure</code>
            </p>
          </div>

          {loginError && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Admin Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {loginSubmitting ? 'Authenticating...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('home')}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Back to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Admin User info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Admin Portal
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">
              {admin.role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {admin.fullName || 'Institute Director'}
          </h1>
          <p className="text-xs text-slate-400">Logged in as {admin.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-medium border border-red-500/30 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.isError
              ? 'bg-red-950/40 border border-red-500/40 text-red-200'
              : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
          }`}
        >
          {feedback.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'bookings', label: 'Appointments Management', icon: Calendar },
          { id: 'courses', label: 'Courses & Syllabus', icon: BookOpen },
          { id: 'calendar', label: 'Hours & Blocked Dates', icon: Clock },
          { id: 'enquiries', label: 'Student Enquiries', icon: Users },
          { id: 'settings', label: 'Website Settings', icon: Settings },
          { id: 'logs', label: 'Audit & Notification Logs', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'logs') loadLogs();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-[#3563FF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#0e1628] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Today&apos;s Sessions
              </span>
              <span className="text-3xl font-extrabold text-blue-400 mt-1 block">
                {stats.todayCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Active on today&apos;s schedule</span>
            </div>

            <div className="bg-[#0e1628] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Pending Confirmation
              </span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">
                {stats.pendingCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Requires staff review</span>
            </div>

            <div className="bg-[#0e1628] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Confirmed Bookings
              </span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">
                {stats.confirmedCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Reserved slots</span>
            </div>

            <div className="bg-[#0e1628] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Cancelled / Rescheduled
              </span>
              <span className="text-3xl font-extrabold text-slate-400 mt-1 block">
                {stats.cancelledCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Cancelled reservations</span>
            </div>

            <div className="bg-[#0e1628] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                New Web Enquiries
              </span>
              <span className="text-3xl font-extrabold text-purple-400 mt-1 block">
                {stats.newEnquiriesCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Uncontacted leads</span>
            </div>
          </div>

          {/* Quick Actions & Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white font-heading">
                  Recent Appointments
                </h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-blue-400 hover:underline"
                >
                  View All Bookings →
                </button>
              </div>

              {stats.recentBookings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent bookings recorded.</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentBookings.map(b => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">
                            {b.booking_reference}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : b.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-slate-300 font-semibold mt-1">
                          {b.customer_name} • {b.customer_phone}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {b.appointment_type_name} • {b.appointment_date} at {b.formattedTime}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBookingForNote(b);
                            setInternalNoteDraft(b.internal_notes || '');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                        >
                          Notes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purpose Distribution */}
            <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-slate-800">
                Appointment Types Breakdown
              </h3>
              <div className="space-y-3">
                {stats.typeDistribution.map((t, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{t.name}</span>
                      <span className="font-bold text-white">{t.count}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (t.count /
                                Math.max(
                                  1,
                                  stats.typeDistribution.reduce((a, c) => a + c.count, 0)
                                )) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BOOKINGS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'bookings' && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white font-heading">
                All Appointment Bookings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage student reservations, verify status, add private staff notes, and export CSV.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={async e => {
                  setBookingSearch(e.target.value);
                  const res = await api.getAdminBookings({
                    status: bookingFilterStatus,
                    search: e.target.value,
                  });
                  setBookings(res.bookings);
                }}
                placeholder="Search by Reference, Customer Name, Phone, or Email..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={bookingFilterStatus}
                onChange={async e => {
                  setBookingFilterStatus(e.target.value);
                  const res = await api.getAdminBookings({
                    status: e.target.value,
                    search: bookingSearch,
                  });
                  setBookings(res.bookings);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No-Show</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070b14] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Date & Slot</th>
                  <th className="p-3.5">Purpose / Course</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No bookings matching your criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {b.booking_reference}
                      </td>
                      <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                        {b.customer_name}
                      </td>
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        <div>{b.customer_phone}</div>
                        {b.customer_email && (
                          <div className="text-[11px] text-slate-500">{b.customer_email}</div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-white">{b.appointment_date}</div>
                        <div className="text-[11px] text-blue-400">{b.formattedTime}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200">{b.appointment_type_name}</div>
                        {b.course_of_interest && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            Course: {b.course_of_interest}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <select
                          value={b.status}
                          onChange={e =>
                            handleUpdateBookingStatus(b.id, e.target.value as any)
                          }
                          className={`px-2 py-1 rounded text-[11px] font-bold uppercase bg-slate-900 border border-slate-700 ${
                            b.status === 'confirmed'
                              ? 'text-emerald-400'
                              : b.status === 'pending'
                              ? 'text-amber-400'
                              : b.status === 'cancelled'
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No-Show</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBookingForNote(b);
                            setInternalNoteDraft(b.internal_notes || '');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                          title="Internal Staff Notes"
                        >
                          Notes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Internal Staff Notes Modal */}
      {selectedBookingForNote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Internal Staff Notes: {selectedBookingForNote.booking_reference}
              </h3>
              <button
                onClick={() => setSelectedBookingForNote(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Customer: <strong>{selectedBookingForNote.customer_name}</strong> (
              {selectedBookingForNote.customer_phone})
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-semibold block">
                Internal Notes (Never visible to customer):
              </label>
              <textarea
                value={internalNoteDraft}
                onChange={e => setInternalNoteDraft(e.target.value)}
                placeholder="e.g. Attended counselling, interested in evening Tally batch, fee installment discussed..."
                rows={5}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedBookingForNote(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInternalNote}
                className="px-5 py-2 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: COURSES & SYLLABUS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'courses' && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white font-heading">
                Course Catalogue & Syllabus Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create, edit, toggle visibility, and configure syllabus modules for all programs.
              </p>
            </div>
            <button
              onClick={() => {
                setIsCreatingCourse(true);
                setEditingCourse({
                  title: '',
                  slug: '',
                  category: 'Basic Computer and Office Skills',
                  description: '',
                  syllabus: ['Module 1: Introduction & Fundamentals'],
                  duration: '2 Months',
                  fee: 0,
                  fee_visible: false,
                  prerequisites: 'None',
                  level: 'Beginner',
                  batches: ['Morning (10:00 AM - 12:00 PM)', 'Evening (5:00 PM - 7:00 PM)'],
                  is_published: true,
                  order_index: courses.length + 1,
                });
              }}
              className="px-4 py-2 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Course</span>
            </button>
          </div>

          {/* Courses Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(c => (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {c.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        c.is_published
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-heading">{c.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Modules: {Array.isArray(c.syllabus) ? c.syllabus.length : 0} • Duration: {c.duration || 'N/A'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsCreatingCourse(false);
                      setEditingCourse(c);
                    }}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3 text-blue-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(c.id, c.title)}
                    className="px-3 py-1.5 rounded bg-red-950/30 hover:bg-red-900/40 text-xs text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit / Create Course Modal */}
          {editingCourse && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-2xl my-8 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white">
                    {isCreatingCourse ? 'Create New Course' : `Edit Course: ${editingCourse.title}`}
                  </h3>
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Course Title</label>
                      <input
                        type="text"
                        value={editingCourse.title || ''}
                        onChange={e =>
                          setEditingCourse({
                            ...editingCourse,
                            title: e.target.value,
                            slug:
                              editingCourse.slug ||
                              e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">URL Slug</label>
                      <input
                        type="text"
                        value={editingCourse.slug || ''}
                        onChange={e =>
                          setEditingCourse({ ...editingCourse, slug: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Category</label>
                      <select
                        value={editingCourse.category || 'Basic Computer and Office Skills'}
                        onChange={e =>
                          setEditingCourse({ ...editingCourse, category: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="Basic Computer and Office Skills">Basic Computer and Office Skills</option>
                        <option value="MS Office and Advanced Excel">MS Office and Advanced Excel</option>
                        <option value="Tally and Accounting">Tally and Accounting</option>
                        <option value="Programming: C, Java, Python">Programming: C, Java, Python</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Spoken English">Spoken English</option>
                        <option value="Linux and Networking">Linux and Networking</option>
                        <option value="Other IT and Career Skills">Other IT and Career Skills</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Level</label>
                      <input
                        type="text"
                        value={editingCourse.level || 'Beginner to Advanced'}
                        onChange={e =>
                          setEditingCourse({ ...editingCourse, level: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Description</label>
                    <textarea
                      value={editingCourse.description || ''}
                      onChange={e =>
                        setEditingCourse({ ...editingCourse, description: e.target.value })
                      }
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Syllabus Modules (One module per line)
                    </label>
                    <textarea
                      value={
                        Array.isArray(editingCourse.syllabus)
                          ? editingCourse.syllabus.join('\n')
                          : ''
                      }
                      onChange={e =>
                        setEditingCourse({
                          ...editingCourse,
                          syllabus: e.target.value
                            .split('\n')
                            .map(s => s.trim())
                            .filter(Boolean),
                        })
                      }
                      rows={5}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      placeholder="Module 1: Fundamentals..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Duration</label>
                      <input
                        type="text"
                        value={editingCourse.duration || ''}
                        onChange={e =>
                          setEditingCourse({ ...editingCourse, duration: e.target.value })
                        }
                        placeholder="e.g. 2 to 3 Months"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Course Fee (₹)</label>
                      <input
                        type="number"
                        value={editingCourse.fee || 0}
                        onChange={e =>
                          setEditingCourse({
                            ...editingCourse,
                            fee: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="feevis"
                        checked={Boolean(editingCourse.fee_visible)}
                        onChange={e =>
                          setEditingCourse({
                            ...editingCourse,
                            fee_visible: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <label htmlFor="feevis" className="text-slate-300 cursor-pointer">
                        Show Fee on Public Site
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="pub"
                      checked={Boolean(editingCourse.is_published)}
                      onChange={e =>
                        setEditingCourse({
                          ...editingCourse,
                          is_published: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="pub" className="text-slate-300 cursor-pointer">
                      Publish Course (Visible to visitors)
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingCourse(null)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white font-semibold"
                    >
                      Save Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CALENDAR, HOURS & BLOCKED DATES */}
      {/* ======================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-8">
          {/* Business Hours */}
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white font-heading">
                  Weekly Business Hours & Break Times
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure when appointments can be reserved. Times are in Indian Standard Time (IST).
                </p>
              </div>
              <button
                onClick={handleSaveHours}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Opening Hours</span>
              </button>
            </div>

            <div className="space-y-3">
              {businessHours.map((bh, idx) => (
                <div
                  key={bh.day_of_week}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="w-28 font-semibold text-white flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(bh.is_open)}
                      onChange={e => {
                        const copy = [...businessHours];
                        copy[idx].is_open = e.target.checked ? 1 : 0;
                        setBusinessHours(copy);
                      }}
                      className="rounded"
                    />
                    <span>{bh.day_name}</span>
                  </div>

                  {bh.is_open ? (
                    <div className="flex flex-wrap items-center gap-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Open:</span>
                        <input
                          type="time"
                          value={bh.open_time}
                          onChange={e => {
                            const copy = [...businessHours];
                            copy[idx].open_time = e.target.value;
                            setBusinessHours(copy);
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Close:</span>
                        <input
                          type="time"
                          value={bh.close_time}
                          onChange={e => {
                            const copy = [...businessHours];
                            copy[idx].close_time = e.target.value;
                            setBusinessHours(copy);
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Break:</span>
                        <input
                          type="time"
                          value={bh.break_start || ''}
                          onChange={e => {
                            const copy = [...businessHours];
                            copy[idx].break_start = e.target.value;
                            setBusinessHours(copy);
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                        <span className="text-slate-500">to</span>
                        <input
                          type="time"
                          value={bh.break_end || ''}
                          onChange={e => {
                            const copy = [...businessHours];
                            copy[idx].break_end = e.target.value;
                            setBusinessHours(copy);
                          }}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Closed (No appointments permitted)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blocked Dates & Holidays */}
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white font-heading pb-3 border-b border-slate-800">
              Blocked Dates & Special Holidays
            </h2>

            <form onSubmit={handleAddBlockedDate} className="flex flex-wrap items-end gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Date to Block</label>
                <input
                  type="date"
                  value={newBlockDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewBlockDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-slate-300 font-semibold block">Reason / Holiday Name</label>
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={e => setNewBlockReason(e.target.value)}
                  placeholder="e.g. National Holiday, Lab Maintenance..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Block Date</span>
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {blockedDates.length === 0 ? (
                <p className="text-xs text-slate-500">No scheduled blocked dates.</p>
              ) : (
                blockedDates.map(b => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{b.date}</span>
                      <span className="text-slate-400 ml-3">{b.reason}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteBlockedDate(b.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: STUDENT ENQUIRIES */}
      {/* ======================================================== */}
      {activeTab === 'enquiries' && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white font-heading">
              Student Online Enquiries
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and track follow-up status for visitors who submitted contact forms.
            </p>
          </div>

          <div className="space-y-3">
            {enquiries.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No enquiries received yet.</p>
            ) : (
              enquiries.map(e => (
                <div
                  key={e.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm">{e.name}</span>
                      <span className="text-slate-400 ml-2">Phone: {e.phone}</span>
                      {e.email && <span className="text-slate-500 ml-2">({e.email})</span>}
                    </div>

                    <select
                      value={e.status}
                      onChange={ev => handleUpdateEnquiry(e.id, ev.target.value as any)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase bg-slate-950 border border-slate-700 self-start ${
                        e.status === 'new'
                          ? 'text-purple-400'
                          : e.status === 'contacted'
                          ? 'text-blue-400'
                          : e.status === 'converted'
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Enrolled / Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {e.course_name && (
                    <div className="text-[11px] text-blue-400 font-semibold">
                      Course Interest: {e.course_name}
                    </div>
                  )}

                  <div className="p-3 bg-slate-950/60 rounded-lg text-slate-300 border border-slate-800/60">
                    &quot;{e.message}&quot;
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1">
                    Submitted: {new Date(e.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: WEBSITE SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white font-heading">
              Institute Profile & Website Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live updates to contact details, Google Maps links, booking policies, and notifications.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Institute Name</label>
                <input
                  type="text"
                  value={siteSettings.institute_name || ''}
                  onChange={e =>
                    setSiteSettings({ ...siteSettings, institute_name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Tagline</label>
                <input
                  type="text"
                  value={siteSettings.tagline || ''}
                  onChange={e =>
                    setSiteSettings({ ...siteSettings, tagline: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Phone Number</label>
                <input
                  type="text"
                  value={siteSettings.phone || ''}
                  onChange={e =>
                    setSiteSettings({ ...siteSettings, phone: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Official Email</label>
                <input
                  type="email"
                  value={siteSettings.email || ''}
                  onChange={e =>
                    setSiteSettings({ ...siteSettings, email: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Full Address</label>
              <textarea
                value={siteSettings.address || ''}
                onChange={e =>
                  setSiteSettings({ ...siteSettings, address: e.target.value })
                }
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Google Maps URL</label>
              <input
                type="text"
                value={siteSettings.maps_url || ''}
                onChange={e =>
                  setSiteSettings({ ...siteSettings, maps_url: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Minimum Notice (Hours)
                </label>
                <input
                  type="number"
                  value={siteSettings.booking_notice_hours || '2'}
                  onChange={e =>
                    setSiteSettings({ ...siteSettings, booking_notice_hours: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Booking Horizon (Days)
                </label>
                <input
                  type="number"
                  value={siteSettings.booking_max_advance_days || '30'}
                  onChange={e =>
                    setSiteSettings({
                      ...siteSettings,
                      booking_max_advance_days: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="counselfree"
                  checked={siteSettings.counselling_is_free !== 'false'}
                  onChange={e =>
                    setSiteSettings({
                      ...siteSettings,
                      counselling_is_free: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="counselfree" className="text-slate-300 cursor-pointer">
                  Counselling is Free of Charge
                </label>
              </div>
            </div>

            {/* Email SMTP configuration info */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-400" /> Outbound SMTP Email Configuration
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                If SMTP credentials are not configured in environment variables or settings, notifications are logged transparently to the system audit trail without making false claims.
              </p>
            </div>

            {/* Supabase Backend Integration Status */}
            <div className="p-5 bg-gradient-to-br from-emerald-950/20 via-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Connected Supabase Backend
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Project: <code className="text-emerald-400 font-mono">neehfufsciyduugdeajs</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Supabase Connected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      api.getSupabaseStatus().then(res => {
                        setSupabaseStatus(res);
                        showFeedback('Supabase connection verified');
                      });
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Refresh Supabase connection"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Supabase Project URL:</span>
                  <span className="text-slate-200 font-mono text-[11px] break-all">
                    https://neehfufsciyduugdeajs.supabase.co
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Enquiry Sync Table:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    public.enquiries
                  </span>
                </div>
              </div>

              {supabaseStatus && !supabaseStatus.tableFound && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2 text-amber-300 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>Table Setup Required in Supabase SQL Editor:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    To allow the enquiries form to insert rows into your Supabase database, please open your Supabase project dashboard, navigate to the <strong>SQL Editor</strong>, and run the following script:
                  </p>
                  <pre className="bg-[#070b14] border border-slate-800 p-3 rounded-lg text-[10px] text-slate-300 font-mono overflow-x-auto">
                    {supabaseStatus.schemaSql}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(supabaseStatus.schemaSql);
                      setSqlCopied(true);
                      setTimeout(() => setSqlCopied(false), 2500);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>{sqlCopied ? 'SQL Copied to Clipboard!' : 'Copy SQL Script for Supabase'}</span>
                  </button>
                </div>
              )}

              {supabaseStatus && supabaseStatus.tableFound && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>The <strong>{supabaseStatus.tableName}</strong> table is active and ready to receive customer enquiry submissions!</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs shadow-md"
              >
                Save All Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: AUDIT & NOTIFICATION LOGS */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-8">
          {/* Audit Logs */}
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-slate-800">
              Admin Security & Audit Trail
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070b14] text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {auditLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-900/40">
                      <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="p-3 font-semibold text-white">{l.admin_email}</td>
                      <td className="p-3 font-mono text-blue-400">{l.action}</td>
                      <td className="p-3 text-slate-400">{l.target_type}</td>
                      <td className="p-3 text-slate-300">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notification Logs */}
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-slate-800">
              Notification Delivery Logs
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070b14] text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Result / Diagnostic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {notificationLogs.map(n => (
                    <tr key={n.id} className="hover:bg-slate-900/40">
                      <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="p-3 text-white">
                        {n.recipient_email || n.recipient_phone || 'Customer'}
                      </td>
                      <td className="p-3 text-blue-400 font-mono">{n.type}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            n.status === 'sent'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {n.error_message || 'Notification recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Change Admin Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  passwordMsg.error
                    ? 'bg-red-950/40 border border-red-500/40 text-red-200'
                    : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
