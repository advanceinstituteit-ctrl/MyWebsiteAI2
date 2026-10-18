import React from 'react';
import {
  GraduationCap,
  MapPin,
  CheckCircle2,
  Users,
  Laptop,
  Award,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';

interface AboutPageProps {
  navigate: (route: string, params?: any) => void;
  settings: Record<string, string>;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate, settings }) => {
  const mapsUrl =
    settings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero section */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          About Our Institute
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading leading-tight">
          Empowering Najafgarh Learners with Practical Tech Skills
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Advance IT Institute was founded to bridge the gap between academic theory and real workplace software requirements. Located in Saraswati Enclave, Najafgarh, we provide focused training in computer literacy, office productivity, accounting, programming, and IT networking.
        </p>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-heading">
            Our Mission
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To provide accessible, affordable, and rigorous computer education that equips local youth, students, and professionals with skills demanded by modern offices and businesses.
          </p>
        </div>

        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Laptop className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-heading">
            Hands-On Computer Labs
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We believe true software proficiency comes through fingers on keyboards. Every learner gets individual workstation time with guidance directly at their desk.
          </p>
        </div>

        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-heading">
            Honest Commitments
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No exaggerated placement promises or false claims. We commit to thorough syllabus coverage, real project work, doubt solving, and genuine career support.
          </p>
        </div>
      </div>

      {/* Campus & Infrastructure */}
      <div className="bg-[#070b14] border border-slate-800 rounded-3xl p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Campus Facilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              Dedicated Learning Environment in Saraswati Enclave
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Our institute on the First Floor of Plot No. 2 (opp. Gupta Market, near Anaj Mandi Road) provides a peaceful, well-ventilated, and air-conditioned learning space.
            </p>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Modern PCs with multi-core processors, SSDs, and dual-monitor faculty setups</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Licensed accounting software (Tally Prime), office tools, and coding IDEs</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Continuous power backup & high-speed optical fiber internet connection</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Convenient location with easy bus and e-rickshaw connectivity across Najafgarh</span>
              </li>
            </ul>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => navigate('book')}
                className="px-5 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs shadow-md"
              >
                Book a Free Campus Tour
              </button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80"
              alt="Computer lab workstations"
              className="rounded-2xl object-cover h-52 w-full border border-slate-800 shadow-md"
            />
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
              alt="Interactive coaching session"
              className="rounded-2xl object-cover h-52 w-full border border-slate-800 shadow-md mt-6"
            />
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-2xl font-bold text-white font-heading">
          Have Questions About Batches or Eligibility?
        </h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          Visit us in person or book a free 30-minute counselling session to discuss which course matches your background.
        </p>
        <button
          onClick={() => navigate('book')}
          className="px-6 py-3 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-semibold text-xs transition"
        >
          Schedule Your Free Counselling
        </button>
      </div>
    </div>
  );
};
