import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Calendar, Phone } from 'lucide-react';

interface FaqPageProps {
  navigate: (route: string, params?: any) => void;
  settings: Record<string, string>;
}

export const FaqPage: React.FC<FaqPageProps> = ({ navigate, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is the academic counselling session really free?',
      a: 'Yes! Our 1-on-1 course counselling sessions are completely free. You can meet our faculty, review detailed syllabus modules, discuss your career or educational goals, and inspect our computer labs with zero obligation to enroll.',
      category: 'Admissions & Counselling',
    },
    {
      q: 'Do I get dedicated computer practice during classes?',
      a: 'Absolutely. We enforce an individual workstation policy for all practical subjects. During your scheduled lab batch, you will have your own PC to write code, build Excel dashboards, or enter Tally transactions. Our instructors provide personalized assistance at your desk.',
      category: 'Labs & Practice',
    },
    {
      q: 'Why are some course fees not listed with an exact price on the website?',
      a: 'Course fees vary based on duration, module depth (for example, Basic Excel vs. Advanced Corporate Automation with Dashboards), and custom student packages. To prevent misunderstandings and ensure transparent pricing, exact fee structures and installment options are clearly explained during your in-person counselling session.',
      category: 'Fees & Payment',
    },
    {
      q: 'What batch timings are available for college students and working professionals?',
      a: 'We offer flexible shifts from 9:00 AM to 7:00 PM, Monday through Saturday. We run early morning batches, afternoon slots, evening batches (ideal for college commuters), and specialized weekend batches.',
      category: 'Batches & Timings',
    },
    {
      q: 'I am a complete beginner with no computer background. Can I join?',
      a: 'Yes, definitely. Our foundational courses—such as "Basic Computer & Office Skills"—start from the absolute basics, including typing skills, Windows file management, and internet navigation. Our trainers guide beginners with patience.',
      category: 'Eligibility',
    },
    {
      q: 'What certificate do I receive upon course completion?',
      a: 'Upon successfully completing all course modules, assignments, and the capstone practical project, you receive an authentic Course Completion Certificate from Advance IT Institute detailing your curriculum hours and practical competencies.',
      category: 'Certificates & Careers',
    },
    {
      q: 'Where is Advance IT Institute located and how do I reach there?',
      a: 'We are situated at First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi 110043. We are easily accessible by Delhi Metro, local DTC buses, and e-rickshaws throughout Najafgarh.',
      category: 'Location',
    },
    {
      q: 'Can I reschedule or cancel my counselling appointment if my schedule changes?',
      a: 'Yes. You can reschedule or cancel your appointment anytime using the "Manage Booking" link on our website with your unique Booking Reference number (e.g., AIT-2026-XXXX).',
      category: 'Admissions & Counselling',
    },
  ];

  const filteredFaqs = faqs.filter(
    f =>
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const phone = settings.phone || '+91 87005 73469';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Got Questions?
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Find answers about courses, batches, practical computer labs, counselling sessions, and institute policies.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-lg mx-auto">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search questions by topic (e.g. fees, Tally, labs, batches)..."
          className="w-full bg-[#0e1628] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
            No FAQs found matching &quot;{searchTerm}&quot;. Please feel free to call our counsellor directly.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#0e1628] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                      ?
                    </span>
                    <span className="text-sm font-bold text-white font-heading">
                      {faq.q}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-900/40">
                    <p>{faq.a}</p>
                    <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/40">
                      <span>Category: {faq.category}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still need help CTA */}
      <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-white font-heading">
          Still Have Unanswered Questions?
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Our faculty and counsellors are readily available at the Najafgarh campus to discuss any questions about your learning journey.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('book')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs transition"
          >
            Book Free Counselling
          </button>
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call: {phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
