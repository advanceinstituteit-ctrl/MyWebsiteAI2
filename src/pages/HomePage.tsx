import React from 'react';
import {
  Calendar,
  BookOpen,
  MapPin,
  Phone,
  ShieldCheck,
  Laptop,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Award,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Calculator,
  Code2,
  Globe2,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import { Course } from '../types';

interface HomePageProps {
  navigate: (route: string, params?: any) => void;
  courses: Course[];
  settings: Record<string, string>;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate, courses, settings }) => {
  const phone = settings.phone || '+91 87005 73469';
  const mapsUrl =
    settings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  const isCounsellingFree = settings.counselling_is_free !== 'false';

  const categoryIcons: Record<string, any> = {
    'Basic Computer and Office Skills': Laptop,
    'MS Office and Advanced Excel': FileSpreadsheet,
    'Tally and Accounting': Calculator,
    'Programming: C, Java, Python': Code2,
    'Linux and Networking': Cpu,
    'Digital Marketing': Globe2,
    'Spoken English': MessageSquare,
  };

  const categories = [
    {
      title: 'Basic Computer & Office Skills',
      desc: 'Foundational computer literacy, Windows OS, typing, and official internet productivity.',
      icon: Laptop,
      categoryKey: 'Basic Computer and Office Skills',
      highlight: 'For Beginners & School/College Students',
    },
    {
      title: 'MS Office & Advanced Excel',
      desc: 'Pivot Tables, VLOOKUP/XLOOKUP, formulas, corporate documentation & dashboard reporting.',
      icon: FileSpreadsheet,
      categoryKey: 'MS Office and Advanced Excel',
      highlight: 'Essential Corporate Skill',
    },
    {
      title: 'Tally Prime & GST Accounting',
      desc: 'Computerized book-keeping, inventory vouchers, GST calculations, balance sheets, and e-way bills.',
      icon: Calculator,
      categoryKey: 'Tally and Accounting',
      highlight: 'High Demand Accounting',
    },
    {
      title: 'Programming: Python, C, Java',
      desc: 'Coding fundamentals, object-oriented concepts, algorithms, projects, and university syllabus support.',
      icon: Code2,
      categoryKey: 'Programming: C, Java, Python',
      highlight: 'Software Engineering Foundation',
    },
    {
      title: 'Digital Marketing & Social Media',
      desc: 'SEO, Google Ads, Meta campaign management, Canva design, and local business digital promotion.',
      icon: Globe2,
      categoryKey: 'Digital Marketing',
      highlight: 'Online Growth & Freelancing',
    },
    {
      title: 'Hardware & Linux Networking',
      desc: 'PC assembly, troubleshooting, LAN networks, Wi-Fi router setup, and Linux CLI administration.',
      icon: Cpu,
      categoryKey: 'Linux and Networking',
      highlight: 'IT Infrastructure & Support',
    },
    {
      title: 'Spoken English & Personality',
      desc: 'English conversational confidence, accent clarity, public speaking, and job interview readiness.',
      icon: MessageSquare,
      categoryKey: 'Spoken English',
      highlight: 'Professional Communication',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Location pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Najafgarh, New Delhi • Saraswati Enclave Campus</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-heading">
              Build Practical Skills. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
                Shape Your Future.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Job-oriented software training, accounting, programming, and IT education in Najafgarh.
              Learn with hands-on computer lab sessions, practical assignments, and personalized faculty guidance.
            </p>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('book')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
              >
                <Calendar className="w-5 h-5" />
                <span>{isCounsellingFree ? 'Book a Free Counselling Session' : 'Book Counselling Session'}</span>
              </button>

              <button
                onClick={() => navigate('courses')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-semibold text-base border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>Explore All Courses</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-slate-800/80">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <Laptop className="w-4 h-4" /> Lab-First
                </div>
                <p className="text-xs text-slate-400 mt-1">Dedicated PC for practical practice</p>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Clock className="w-4 h-4" /> Flexible Hours
                </div>
                <p className="text-xs text-slate-400 mt-1">Morning, evening & weekend slots</p>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Users className="w-4 h-4" /> 1-on-1 Help
                </div>
                <p className="text-xs text-slate-400 mt-1">Individual doubt-clearing attention</p>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Award className="w-4 h-4" /> Real Projects
                </div>
                <p className="text-xs text-slate-400 mt-1">Practical job & office scenarios</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COURSE CATALOGUE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Job-Oriented Curriculum</span>
            </div>
            <h2 className="text-3xl font-bold text-white font-heading mt-1">
              Explore Our Training Programs
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Curriculum designed to take you from foundational basics to workplace proficiency in modern office tools and software engineering.
            </p>
          </div>
          <button
            onClick={() => navigate('courses')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            <span>View Full Catalogue ({courses.length} courses)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-[#0e1628] hover:bg-[#121c33] border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-[#3563FF] group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
                      {cat.highlight}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading group-hover:text-blue-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => navigate('courses', { category: cat.categoryKey })}
                    className="text-xs font-semibold text-slate-300 group-hover:text-white flex items-center gap-1.5"
                  >
                    <span>View Courses</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => navigate('book', { courseInterest: cat.title })}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Enquire / Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PRACTICAL LEARNING ADVANTAGES */}
      <section className="bg-[#070b14] py-16 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Why Choose Advance IT Institute
            </span>
            <h2 className="text-3xl font-bold text-white font-heading mt-1">
              Practical Training Focused On Real Skills
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              We focus on hands-on application rather than just rote theory, preparing students for real office and tech assignments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0B1220] p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Individual Computer Practice
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Every student gets an individual workstation during practical lab sessions. No sharing screens — you learn by typing code, creating spreadsheets, and doing voucher entries yourself.
              </p>
            </div>

            <div className="bg-[#0B1220] p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Step-by-Step Doubt Clearing
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Faculty is present inside the lab while you practice. Whenever you encounter a syntax error, formula mistake, or tally imbalance, an instructor is there to explain and guide you.
              </p>
            </div>

            <div className="bg-[#0B1220] p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Real-World Scenarios
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                From GST invoice creation in Tally Prime to building web automation in Python and handling office files, assignments mimic real job requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INSTITUTE LAB PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Campus & Facilities
            </span>
            <h2 className="text-3xl font-bold text-white font-heading">
              Comfortable, Air-Conditioned Computer Labs in Najafgarh
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Located on the First Floor, Plot No. 2, Main Road (opposite Gupta Market, near Anaj Mandi Road), Advance IT Institute offers a structured environment equipped with modern systems, high-speed internet, and regular power backup.
            </p>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dedicated desktop systems configured for programming and office software</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Small batch sizes to ensure personal instructor attention</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Easily accessible from Najafgarh metro and nearby bus stands</span>
              </li>
            </ul>
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => navigate('gallery')}
                className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
              >
                View Institute Gallery
              </button>
              <button
                onClick={() => navigate('book')}
                className="px-5 py-2.5 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold transition"
              >
                Book a Campus Visit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80"
              alt="Students in modern computer lab"
              className="rounded-2xl object-cover h-48 w-full border border-slate-800 shadow-md"
            />
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
              alt="Instructor guiding student on software"
              className="rounded-2xl object-cover h-48 w-full border border-slate-800 shadow-md mt-6"
            />
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80"
              alt="Practical keyboard and monitor setup"
              className="rounded-2xl object-cover h-48 w-full border border-slate-800 shadow-md -mt-6"
            />
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80"
              alt="Data and excel dashboards"
              className="rounded-2xl object-cover h-48 w-full border border-slate-800 shadow-md"
            />
          </div>
        </div>
      </section>

      {/* 5. LOCATION & DIRECTIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Location & Accessibility
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
                Conveniently Located in Najafgarh
              </h2>
              <div className="space-y-2 text-xs text-slate-300">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    First Floor, Plot No. 2, Main Road, opposite Gupta Market, near Anaj Mandi Road, Saraswati Enclave, Najafgarh, New Delhi, Delhi 110043, India.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Helpline: {phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Open: Monday to Saturday (9:00 AM – 7:00 PM)</span>
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Get Driving / Walking Directions</span>
                </a>
                <button
                  onClick={() => navigate('contact')}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  View Contact Details & Hours
                </button>
              </div>
            </div>

            {/* Google Maps link preview box */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Google Maps Verified Listing</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Check our official location, directions, and public reviews directly on Google Maps.
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <span>Open Advance IT Institute on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900/40 via-[#0e172a] to-blue-950/30 border border-blue-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Ready to Upgrade Your Skills?
            </h2>
            <p className="text-slate-300 text-sm">
              Schedule a counselling session with our academic advisor. Discuss course syllabi, fee structures, batch timings, and select the best career pathway for you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('book')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              Book a Free Counselling Session
            </button>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call Helpline: {phone}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
