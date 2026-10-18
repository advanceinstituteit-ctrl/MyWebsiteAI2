import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Building,
} from 'lucide-react';
import { api } from '../services/api';
import { Course } from '../types';

interface ContactPageProps {
  navigate: (route: string, params?: any) => void;
  courses: Course[];
  settings: Record<string, string>;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  navigate,
  courses,
  settings,
}) => {
  const phone = settings.phone || '+91 87005 73469';
  const email = settings.email || 'info@advanceit.in';
  const address =
    settings.address ||
    'First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi, Delhi 110043, India';
  const mapsUrl =
    settings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  // Enquiry form state
  const [name, setName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [courseName, setCourseName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }
    const clean = userPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please provide a valid 10-digit phone number.');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setError('Please write a brief message or question (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.submitEnquiry({
        name: name.trim(),
        phone: userPhone.trim(),
        email: userEmail.trim() || undefined,
        courseName: courseName || undefined,
        message: message.trim(),
      });

      setSuccess(res.message);
      setName('');
      setUserPhone('');
      setUserEmail('');
      setCourseName('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry. Please try calling directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Contact & Location
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
          Get in Touch with Advance IT Institute
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Have questions regarding course fees, upcoming batches, syllabus details, or wish to visit our Najafgarh campus? We are here to guide you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Info & Hours */}
        <div className="space-y-6">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Campus Information
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-1">Campus Address:</strong>
                  <p className="text-slate-300 leading-relaxed">{address}</p>
                  <p className="text-slate-500 mt-1">
                    Landmark: Opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-1">Phone & WhatsApp:</strong>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="text-emerald-400 hover:underline font-semibold block"
                  >
                    {phone}
                  </a>
                  <span className="text-slate-500 text-[11px]">
                    Available for admission enquiries & counselling support
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                <Mail className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-1">Email:</strong>
                  <a href={`mailto:${email}`} className="text-slate-300 hover:text-white">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm mb-1">Operating Hours (IST):</strong>
                  <table className="w-full text-slate-300 text-xs">
                    <tbody>
                      <tr>
                        <td className="py-0.5 pr-4 text-slate-400">Monday – Saturday:</td>
                        <td className="py-0.5 font-medium text-white">9:00 AM – 7:00 PM</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 pr-4 text-slate-400">Sunday:</td>
                        <td className="py-0.5 text-slate-500">Closed (Lab Maintenance)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </a>
              <button
                onClick={() => navigate('book')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                Book Appointment Slot
              </button>
            </div>
          </div>
        </div>

        {/* Live Enquiry Form */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white font-heading">
              Send an Online Enquiry
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Leave your contact info and our counsellor will reach back out to you.
            </p>
          </div>

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-start gap-3 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmitEnquiry} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Your Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ankit Sharma"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Mobile / Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Course You Are Interested In
              </label>
              <select
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select Course (Optional) --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
                <option value="General Guidance">General Guidance / Not Sure Yet</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Your Message or Questions <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ask about batch timings, fees, beginner eligibility, or anything else..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Submitting Enquiry...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Message to Institute</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
