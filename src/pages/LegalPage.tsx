import React, { useState } from 'react';
import { Shield, FileText, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  initialTab?: 'privacy' | 'terms';
  navigate: (route: string) => void;
  settings: Record<string, string>;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  initialTab = 'privacy',
  navigate,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);
  const instituteName = settings.institute_name || 'Advance IT Institute';
  const phone = settings.phone || '+91 87005 73469';
  const email = settings.email || 'info@advanceit.in';
  const address =
    settings.address ||
    'First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi, Delhi 110043, India';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'privacy'
              ? 'bg-[#3563FF] text-white'
              : 'text-slate-400 hover:text-white bg-slate-800/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'terms'
              ? 'bg-[#3563FF] text-white'
              : 'text-slate-400 hover:text-white bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms & Conditions</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-10 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-6">
        {activeTab === 'privacy' ? (
          <>
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: October 2026 • Advance IT Institute, Najafgarh
              </p>
            </div>

            <p>
              At <strong>{instituteName}</strong>, we respect the privacy of every student, visitor, and parent who interacts with our website or attends counselling at our Najafgarh campus. This Privacy Notice describes the personal information we collect and how we safeguard it.
            </p>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                1. Information We Collect
              </h2>
              <p>
                When you schedule a counselling session, book an institute visit, or submit an enquiry through our portal, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Your full name</li>
                <li>Contact telephone or WhatsApp number</li>
                <li>Email address (if provided optionally)</li>
                <li>Your course or skill of interest</li>
                <li>Any specific queries or batch timing preferences you mention</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                2. How We Use Your Information
              </h2>
              <p>Your details are used strictly to:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Confirm, reschedule, or communicate regarding your appointment reservation</li>
                <li>Answer your queries regarding syllabus, course batches, and curriculum</li>
                <li>Send transactional reminders prior to your scheduled session</li>
              </ul>
              <p className="font-semibold text-emerald-400">
                We never sell, rent, trade, or distribute your contact information to third-party telemarketers or advertisers.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                3. Data Security & Storage
              </h2>
              <p>
                Appointment reservations and enquiries are stored securely in our encrypted relational database. Administrative access is restricted to authorized institute coordinators with authenticated sessions and audit logs.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                4. Your Rights to Access & Deletion
              </h2>
              <p>
                You may request access to, correction of, or complete deletion of your contact records at any time by contacting our institute coordinator at <a href={`mailto:${email}`} className="text-blue-400 underline">{email}</a> or calling <a href={`tel:${phone}`} className="text-emerald-400 underline">{phone}</a>.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <p><strong>Campus Address:</strong> {address}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">
                Terms and Conditions
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: October 2026 • Advance IT Institute, Najafgarh
              </p>
            </div>

            <p>
              By utilizing the <strong>{instituteName}</strong> website, exploring our course curriculum, or booking an appointment reservation, you agree to the following terms and guidelines.
            </p>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                1. Free Counselling & Campus Visits
              </h2>
              <p>
                Academic counselling sessions and campus visits are offered free of charge. Booking a slot does not obligate you to enroll in any course. However, we request visitors to notify us or cancel their slot via the online portal if they cannot attend.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                2. Accurate Visitor Information
              </h2>
              <p>
                You agree to provide true and accurate contact information when booking appointments. Fictitious bookings or automated spam submissions will be removed by institute administrators.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                3. Course Information & Curriculum
              </h2>
              <p>
                Course descriptions, suggested syllabus modules, and batch timings displayed on this portal represent educational training programs offered at Advance IT Institute. Course syllabi may be updated periodically to reflect current industry standards. Exact fee schedules and batch allotments are confirmed upon registration.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-white font-heading">
                4. Lab Decorum & Conduct
              </h2>
              <p>
                Students and visitors are expected to maintain respect for fellow learners, instructional staff, and institute computer hardware while present on campus.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <p>
                For any questions regarding these terms, reach our office at <a href={`mailto:${email}`} className="text-blue-400 underline">{email}</a> or call {phone}.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
