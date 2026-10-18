import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { AppointmentType, TimeSlot, DayAvailability, Course } from '../types';
import { api } from '../services/api';

interface BookingPageProps {
  navigate: (route: string, params?: any) => void;
  courses: Course[];
  initialCourseInterest?: string;
  settings: Record<string, string>;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  navigate,
  courses,
  initialCourseInterest = '',
  settings,
}) => {
  // Steps: 1 = Type, 2 = Date & Slot, 3 = Visitor Details, 4 = Confirmation Review, 5 = Success
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data states
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);

  // Date selection (default to tomorrow in YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [courseInterest, setCourseInterest] = useState<string>(initialCourseInterest);
  const [message, setMessage] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState<boolean>(true);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    accessToken: string;
    date: string;
    time: string;
    type: string;
    name: string;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);

  // Load appointment types on mount
  useEffect(() => {
    api
      .getAppointmentTypes()
      .then(res => {
        setAppointmentTypes(res.appointmentTypes);
        if (res.appointmentTypes.length > 0) {
          setSelectedType(res.appointmentTypes[0]);
        }
      })
      .catch(err => {
        console.error('Failed to load appointment types', err);
      });
  }, []);

  // Fetch slots whenever selectedDate or selectedType changes
  useEffect(() => {
    if (!selectedDate || !selectedType) return;

    setLoadingSlots(true);
    setErrorMessage(null);
    setSelectedSlot(null);

    api
      .getAvailability(selectedDate, selectedType.id)
      .then(res => {
        setAvailability(res.availability);
        setLoadingSlots(false);
      })
      .catch(err => {
        setErrorMessage(err.message || 'Failed to check slot availability');
        setLoadingSlots(false);
      });
  }, [selectedDate, selectedType]);

  // Calendar helpers
  const handleDateChange = (daysOffset: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + daysOffset);
    // Don't allow before today
    const now = new Date();
    if (cur < new Date(now.toISOString().split('T')[0])) return;
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleCreateBooking = async () => {
    if (!selectedType || !selectedDate || !selectedSlot) {
      setErrorMessage('Please select an appointment type, date, and available time slot.');
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!consentChecked) {
      setErrorMessage('Please consent to store your contact details for appointment coordination.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.createBooking({
        appointmentTypeId: selectedType.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot.time,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        courseOfInterest: courseInterest || undefined,
        message: message.trim() || undefined,
      });

      setConfirmedBooking({
        reference: res.bookingReference,
        accessToken: res.accessToken,
        date: res.appointmentDate,
        time: res.appointmentTime,
        type: res.appointmentType,
        name: res.customerName,
      });

      setCurrentStep(5); // Success step
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm booking. Please choose another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = () => {
    if (confirmedBooking?.reference) {
      navigator.clipboard.writeText(confirmedBooking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const phone = settings.phone || '+91 87005 73469';
  const mapsUrl =
    settings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Advance IT Institute • Najafgarh
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
          Book Counselling or Campus Visit
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Choose a verified time slot for personalized career guidance, batch consultation, or to tour our computer labs.
        </p>
      </div>

      {/* Step Indicator (Steps 1 to 4) */}
      {currentStep < 5 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-0" />
            {[
              { step: 1, label: 'Purpose' },
              { step: 2, label: 'Date & Slot' },
              { step: 3, label: 'Your Details' },
              { step: 4, label: 'Review' },
            ].map(s => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;
              return (
                <div key={s.step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#3563FF] text-white ring-4 ring-blue-500/20'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 ${
                      isActive ? 'text-blue-400 font-bold' : isPast ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: APPOINTMENT TYPE */}
      {currentStep === 1 && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white font-heading">
              Step 1: Choose Appointment Purpose
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select how we can best assist you during your session.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointmentTypes.map(type => {
              const isSelected = selectedType?.id === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-white font-heading">
                      {type.name}
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {type.duration_minutes} mins
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {type.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-medium">Free of charge</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      Individual slot
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (selectedType) setCurrentStep(2);
              }}
              disabled={!selectedType}
              className="px-6 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <span>Continue to Date & Time</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME SLOT SELECTION */}
      {currentStep === 2 && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white font-heading">
                Step 2: Select Date & Available Time Slot
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Times are displayed in Indian Standard Time (IST - Asia/Kolkata).
              </p>
            </div>
            <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 self-start">
              {selectedType?.name} ({selectedType?.duration_minutes}m)
            </span>
          </div>

          {/* Date Picker Ribbon */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Appointment Date:
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleDateChange(1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Time Slots Area */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Available Time Slots on {selectedDate}:
              </span>
              <span className="text-[11px] text-slate-500">
                Opening Hours: 9:00 AM – 7:00 PM IST
              </span>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center space-y-2">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                <p className="text-xs text-slate-400">Verifying live schedule & availability...</p>
              </div>
            ) : !availability?.isOpen ? (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Institute Closed on this Date</h4>
                <p className="text-xs text-slate-400">
                  {availability?.reason || 'The institute is closed on Sundays and scheduled holidays.'}
                </p>
                <p className="text-xs text-blue-400 pt-2 font-medium">
                  Please pick another day from Monday to Saturday.
                </p>
              </div>
            ) : availability.slots.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-1">
                <p className="text-xs text-slate-400">No slots available on this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availability.slots.map(slot => {
                  const isSelected = selectedSlot?.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl text-center border transition-all ${
                        !slot.available
                          ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-[#3563FF] border-blue-500 text-white font-bold ring-2 ring-blue-400/40 shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">{slot.formattedTime}</div>
                      <div className="text-[10px] mt-1">
                        {slot.available ? (
                          <span className={isSelected ? 'text-blue-100' : 'text-emerald-400'}>
                            Available
                          </span>
                        ) : (
                          <span className="text-slate-600">{slot.reason || 'Booked'}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                if (selectedSlot) setCurrentStep(3);
              }}
              disabled={!selectedSlot}
              className="px-6 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VISITOR CONTACT DETAILS */}
      {currentStep === 3 && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white font-heading">
              Step 3: Enter Your Details
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              We need your contact information to send booking confirmation and coordinate your session.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Mobile / WhatsApp Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                Email Address <span className="text-slate-500 text-[11px]">(Optional for written confirmation)</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Course of Interest */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Course / Program of Interest
              </label>
              <select
                value={courseInterest}
                onChange={e => setCourseInterest(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select Course (Optional) --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
                <option value="Other / Need Guidance">Other / Need Guidance During Counselling</option>
              </select>
            </div>
          </div>

          {/* Specific queries or message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Any specific questions or preferred batch timing?
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Inquiring about weekend batch for college students, or fee payment options..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Privacy Consent */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consentChecked}
              onChange={e => setConsentChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="consent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
              I authorize Advance IT Institute to store and use my contact details exclusively for scheduling and confirming my counselling or campus visit appointment. No spam or third-party sharing.
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                if (customerName.trim().length >= 2 && customerPhone.replace(/\D/g, '').length >= 10 && consentChecked) {
                  setCurrentStep(4);
                } else {
                  setErrorMessage('Please fill in required fields (Name and 10-digit Phone) and check consent.');
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>Review Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {currentStep === 4 && (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white font-heading">
              Step 4: Review Booking Summary
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Please double check your appointment details before finalizing.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Appointment Purpose:</span>
                <span className="text-white font-bold text-sm">{selectedType?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date & Time (IST):</span>
                <span className="text-blue-400 font-bold text-sm">
                  {selectedDate} at {selectedSlot?.formattedTime}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Customer Name:</span>
                <span className="text-white font-semibold">{customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone Number:</span>
                <span className="text-white font-semibold">{customerPhone}</span>
              </div>
              {customerEmail && (
                <div>
                  <span className="text-slate-500 block">Email Address:</span>
                  <span className="text-white font-semibold">{customerEmail}</span>
                </div>
              )}
              {courseInterest && (
                <div>
                  <span className="text-slate-500 block">Course of Interest:</span>
                  <span className="text-white font-semibold">{courseInterest}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="text-slate-500 block">Campus Location:</span>
              <span className="text-slate-300">
                First Floor, Plot No. 2, Main Road, opp. Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi 110043
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit</span>
            </button>
            <button
              onClick={handleCreateBooking}
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Appointment Reservation</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS CONFIRMATION CARD */}
      {currentStep === 5 && confirmedBooking && (
        <div className="bg-[#0e1628] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 space-y-8 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Reservation Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              We Look Forward to Welcoming You!
            </h2>
            <p className="text-xs text-slate-300">
              Your appointment has been successfully recorded in our institute schedule.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-6 text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Booking Reference Number
                </span>
                <span className="text-xl font-mono font-bold text-[#3563FF]">
                  {confirmedBooking.reference}
                </span>
              </div>
              <button
                onClick={copyReference}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition self-start"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>{copied ? 'Copied!' : 'Copy Reference'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Date (IST):</span>
                <span className="text-white font-bold">{confirmedBooking.date}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Time (IST):</span>
                <span className="text-white font-bold">{confirmedBooking.time}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Purpose:</span>
                <span className="text-white font-semibold">{confirmedBooking.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Visitor Name:</span>
                <span className="text-white font-semibold">{confirmedBooking.name}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span className="text-slate-500 block">Institute Campus:</span>
              <span className="text-slate-300">
                First Floor, Plot No. 2, Main Road, opp. Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi 110043
              </span>
            </div>
          </div>

          {/* Management / Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>Get Google Maps Directions</span>
            </a>
            <button
              onClick={() =>
                navigate('manage-booking', {
                  ref: confirmedBooking.reference,
                  token: confirmedBooking.accessToken,
                })
              }
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Manage or Reschedule Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
