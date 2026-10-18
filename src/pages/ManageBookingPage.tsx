import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Booking, TimeSlot, DayAvailability } from '../types';
import { api } from '../services/api';

interface ManageBookingPageProps {
  navigate: (route: string, params?: any) => void;
  initialRef?: string;
  initialToken?: string;
  settings: Record<string, string>;
}

export const ManageBookingPage: React.FC<ManageBookingPageProps> = ({
  navigate,
  initialRef = '',
  initialToken = '',
  settings,
}) => {
  const [reference, setReference] = useState<string>(initialRef);
  const [phone, setPhone] = useState<string>('');
  const [token, setToken] = useState<string>(initialToken);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<DayAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [rescheduleActionLoading, setRescheduleActionLoading] = useState<boolean>(false);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Auto fetch if ref and token provided
  useEffect(() => {
    if (initialRef && initialToken) {
      handleSearch(initialRef, initialToken, '');
    }
  }, [initialRef, initialToken]);

  const handleSearch = async (
    targetRef: string,
    targetToken?: string,
    targetPhone?: string
  ) => {
    if (!targetRef.trim()) {
      setError('Please provide your booking reference number.');
      return;
    }

    if (!targetToken && !targetPhone) {
      setError('Please provide either your security link token or registered phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await api.getBookingDetails(targetRef.trim(), targetToken, targetPhone?.trim());
      setBooking(res.booking);
      setIsRescheduling(false);
      setIsCancelling(false);
    } catch (err: any) {
      setError(err.message || 'Could not locate booking with these verification details.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  // Reschedule flow
  const handleOpenReschedule = () => {
    if (!booking) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setRescheduleDate(dateStr);
    setIsRescheduling(true);
    setIsCancelling(false);
    loadRescheduleSlots(dateStr);
  };

  const loadRescheduleSlots = (dateStr: string) => {
    if (!booking) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api
      .getAvailability(dateStr, booking.appointment_type_id || 'apt_counselling')
      .then(res => {
        setRescheduleSlots(res.availability);
        setLoadingSlots(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to check slot availability');
        setLoadingSlots(false);
      });
  };

  const handleDateChange = (offset: number) => {
    const cur = new Date(rescheduleDate);
    cur.setDate(cur.getDate() + offset);
    const today = new Date().toISOString().split('T')[0];
    if (cur.toISOString().split('T')[0] < today) return;
    const newDateStr = cur.toISOString().split('T')[0];
    setRescheduleDate(newDateStr);
    loadRescheduleSlots(newDateStr);
  };

  const handleConfirmReschedule = async () => {
    if (!booking || !selectedSlot || !rescheduleDate) return;
    setRescheduleActionLoading(true);
    setError(null);

    try {
      const res = await api.rescheduleBooking({
        reference: booking.booking_reference,
        token: token || undefined,
        phone: phone || undefined,
        newDate: rescheduleDate,
        newTime: selectedSlot.time,
      });

      setActionSuccess(res.message);
      setIsRescheduling(false);
      // Refresh details
      handleSearch(booking.booking_reference, token, phone);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule appointment.');
    } finally {
      setRescheduleActionLoading(false);
    }
  };

  // Cancellation flow
  const handleConfirmCancel = async () => {
    if (!booking) return;
    setCancelLoading(true);
    setError(null);

    try {
      const res = await api.cancelBooking({
        reference: booking.booking_reference,
        token: token || undefined,
        phone: phone || undefined,
        reason: cancelReason || 'Cancelled by visitor online',
      });

      setActionSuccess(res.message);
      setIsCancelling(false);
      handleSearch(booking.booking_reference, token, phone);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  const mapsUrl =
    settings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Booking Management
        </span>
        <h1 className="text-3xl font-extrabold text-white font-heading">
          Find or Manage Your Appointment
        </h1>
        <p className="text-xs text-slate-300">
          Verify your reservation with your Reference ID and phone number to review details, reschedule, or cancel.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Booking Reference:
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. AIT-2026-X8K9L"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Registered Phone Number:
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="10-digit number used during booking"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleSearch(reference, token, phone)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>Locating Booking...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Find Booking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-start gap-3 text-emerald-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>{actionSuccess}</p>
        </div>
      )}

      {/* Booking Details Display */}
      {booking && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Reference:
                </span>
                <span className="text-lg font-mono font-bold text-blue-400">
                  {booking.booking_reference}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Purpose: {booking.appointment_type_name || 'Institute Appointment'}
              </p>
            </div>

            {/* Status Pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start ${
                booking.status === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : booking.status === 'pending'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : booking.status === 'cancelled'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Appointment Date (IST)</span>
              <span className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                {booking.appointment_date}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Appointment Time (IST)</span>
              <span className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                {booking.formattedTime || booking.appointment_time}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Customer Name</span>
              <span className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-400" />
                {booking.customer_name}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Phone</span>
              <span className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                {booking.customer_phone}
              </span>
            </div>

            {booking.customer_email && (
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Email</span>
                <span className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  {booking.customer_email}
                </span>
              </div>
            )}

            {booking.course_of_interest && (
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Course of Interest</span>
                <span className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  {booking.course_of_interest}
                </span>
              </div>
            )}
          </div>

          {booking.cancelled_reason && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 text-xs text-red-300 space-y-1">
              <span className="font-semibold block">Cancellation Reason:</span>
              <p>{booking.cancelled_reason}</p>
            </div>
          )}

          {/* Action Buttons if not cancelled */}
          {booking.status !== 'cancelled' && (
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenReschedule}
                  className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reschedule Slot</span>
                </button>
                <button
                  onClick={() => {
                    setIsCancelling(true);
                    setIsRescheduling(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Reservation</span>
                </button>
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Directions to Najafgarh Campus</span>
              </a>
            </div>
          )}

          {/* Reschedule Interactive View */}
          {isRescheduling && (
            <div className="bg-[#070b14] border border-blue-500/30 rounded-2xl p-5 space-y-4 pt-5 mt-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  Select New Date & Time Slot
                </h4>
                <button
                  onClick={() => setIsRescheduling(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDateChange(-1)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setRescheduleDate(e.target.value);
                    loadRescheduleSlots(e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                />
                <button
                  onClick={() => handleDateChange(1)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Checking slot availability...
                </div>
              ) : !rescheduleSlots?.isOpen ? (
                <div className="bg-slate-900 p-4 rounded-xl text-center text-xs text-amber-400">
                  Institute is closed on this date ({rescheduleSlots?.reason || 'Closed'}).
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {rescheduleSlots.slots.map(s => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setSelectedSlot(s)}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition ${
                        !s.available
                          ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 opacity-50 cursor-not-allowed'
                          : selectedSlot?.time === s.time
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {s.formattedTime}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsRescheduling(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReschedule}
                  disabled={!selectedSlot || rescheduleActionLoading}
                  className="px-5 py-2 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {rescheduleActionLoading ? 'Saving...' : 'Confirm New Slot'}
                </button>
              </div>
            </div>
          )}

          {/* Cancellation Interactive View */}
          {isCancelling && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 space-y-4 pt-5 mt-4">
              <div className="flex items-center justify-between pb-2 border-b border-red-900/40">
                <h4 className="text-sm font-bold text-red-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Confirm Cancellation
                </h4>
                <button
                  onClick={() => setIsCancelling(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 block">
                  Please let us know why you need to cancel:
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, enrolled elsewhere, feeling unwell..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsCancelling(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Nevermind
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
