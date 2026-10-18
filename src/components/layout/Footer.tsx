import React from 'react';
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface FooterProps {
  navigate: (route: string, params?: any) => void;
  instituteSettings?: Record<string, string>;
}

export const Footer: React.FC<FooterProps> = ({ navigate, instituteSettings = {} }) => {
  const phone = instituteSettings.phone || '+91 87005 73469';
  const email = instituteSettings.email || 'info@advanceit.in';
  const address =
    instituteSettings.address ||
    'First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi, Delhi 110043, India';
  const mapsUrl =
    instituteSettings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  return (
    <footer className="bg-[#070b14] border-t border-slate-800 text-slate-400 text-sm">
      {/* Top Banner: Visit Institute & Google Maps Shortcut */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-blue-950/20 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
              <MapPin className="w-3.5 h-3.5" /> Najafgarh Campus, New Delhi
            </span>
            <h3 className="text-xl font-bold text-white font-heading">
              Visit Advance IT Institute in Person
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Inspect our high-speed computer labs, review curriculum with instructors, and get personalized course recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              Open in Google Maps
            </a>
            <button
              onClick={() => navigate('book')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white font-medium text-sm transition shadow-md shadow-blue-500/20"
            >
              <span>Book Counselling</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Institute About & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3563FF] flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white font-heading">Advance IT Institute</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Professional software training institute and IT education center located in Najafgarh, New Delhi. Dedicated to hands-on practical computer labs, career-aligned IT skills, and personalized counselling.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>• Category: Software Training Institute / IT Education</p>
              <p>• Timezone: Asia/Kolkata (IST)</p>
              <p>• Established Campus in Saraswati Enclave, Najafgarh</p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-heading">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => navigate('home')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-blue-500">›</span> Home Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('courses')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-blue-500">›</span> All Courses Catalogue
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('book')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-blue-500">›</span> Book Free Counselling
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('manage-booking')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-400"
                >
                  <span className="text-blue-500">›</span> Check / Reschedule Booking
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('about')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-blue-500">›</span> About Our Institute
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('gallery')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-blue-500">›</span> Computer Lab Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('faq')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-blue-500">›</span> Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Programs */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-heading">
              Suggested Programs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('courses', { category: 'Basic Computer and Office Skills' })} className="hover:text-white text-left">
                  • Basic Computer & Office Skills
                </button>
              </li>
              <li>
                <button onClick={() => navigate('courses', { category: 'MS Office and Advanced Excel' })} className="hover:text-white text-left">
                  • MS Office & Advanced Excel Mastery
                </button>
              </li>
              <li>
                <button onClick={() => navigate('courses', { category: 'Tally and Accounting' })} className="hover:text-white text-left">
                  • Tally Prime with GST Accounting
                </button>
              </li>
              <li>
                <button onClick={() => navigate('courses', { category: 'Programming: C, Java, Python' })} className="hover:text-white text-left">
                  • Python & Core Programming
                </button>
              </li>
              <li>
                <button onClick={() => navigate('courses', { category: 'Digital Marketing' })} className="hover:text-white text-left">
                  • Digital Marketing & Social Media
                </button>
              </li>
              <li>
                <button onClick={() => navigate('courses', { category: 'Spoken English' })} className="hover:text-white text-left">
                  • Spoken English & Confidence
                </button>
              </li>
              <li>
                <button onClick={() => navigate('courses', { category: 'Linux and Networking' })} className="hover:text-white text-left">
                  • Hardware, Networking & Linux
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-heading">
              Campus Location
            </h4>
            <div className="flex items-start gap-2.5 text-xs">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-slate-300">{address}</p>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-white hover:underline font-medium">
                {phone}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`mailto:${email}`} className="text-slate-300 hover:text-white">
                {email}
              </a>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Monday – Saturday: 9:00 AM – 7:00 PM</p>
                <p className="text-slate-500">Sunday: Closed for maintenance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Advance IT Institute. All rights reserved. Najafgarh, New Delhi.
          </p>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('privacy')}
              className="hover:text-slate-300 transition"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate('terms')}
              className="hover:text-slate-300 transition"
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => navigate('admin')}
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Staff Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
