import React, { useState } from 'react';
import { Images, Info, MapPin, Calendar, ExternalLink } from 'lucide-react';

interface GalleryPageProps {
  navigate: (route: string, params?: any) => void;
  settings: Record<string, string>;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ navigate, settings }) => {
  const [filter, setFilter] = useState<'all' | 'labs' | 'classes' | 'coding'>('all');

  const galleryItems = [
    {
      title: 'Practical Workstation Lab',
      category: 'labs',
      categoryLabel: 'Computer Lab',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      description: 'Dedicated desktop workstations configured with office, accounting, and development environments.',
    },
    {
      title: '1-on-1 Faculty Mentorship',
      category: 'classes',
      categoryLabel: 'Classroom Instruction',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      description: 'Faculty reviewing student spreadsheets, code syntax, and accounting entries at student desks.',
    },
    {
      title: 'Programming & Logic Sessions',
      category: 'coding',
      categoryLabel: 'Programming Lab',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      description: 'Students writing Python scripts, C++ classes, and testing algorithms hands-on.',
    },
    {
      title: 'Office Documentation & Advanced Excel',
      category: 'labs',
      categoryLabel: 'Computer Lab',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      description: 'Practical data analysis, formula calculations, and business dashboards practice.',
    },
    {
      title: 'Tally Prime & Accounting Practice',
      category: 'labs',
      categoryLabel: 'Computer Lab',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      description: 'Creating vouchers, ledger groups, GST entries, and balancing accounts.',
    },
    {
      title: 'Interactive Group Discussions',
      category: 'classes',
      categoryLabel: 'Classroom Instruction',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
      description: 'Spoken English practice, mock interviews, and presentation confidence drills.',
    },
  ];

  const filteredItems = galleryItems.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const mapsUrl =
    settings.maps_url ||
    'https://www.google.com/maps/place/Advance+IT+Institute/@28.6232487,76.9812508,13z/data=!4m10!1m2!2m1!1sadvance+future+it+institute!3m6!1s0x390d0fc892aca545:0xccffc080c7bd9bce!8m2!3d28.6193831!4d76.9744007!15sChthZHZhbmNlIGZ1dHVyZSBpdCBpbnN0aXR1dGXgAQA!16s%2Fg%2F11kk1dsw84?entry=ttu';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Campus & Labs
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
          Institute Environment & Lab Facilities
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Take a look at the workstations, classroom spaces, and practical learning setups at Advance IT Institute in Najafgarh.
        </p>
      </div>

      {/* Honest Photo Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Notice on Institute Photographs:</strong> The images below illustrate our educational setup and workstation facilities. Authentic physical campus photos can be uploaded by the administrator through the management portal. To inspect our physical campus in person, please{' '}
          <button
            onClick={() => navigate('book')}
            className="text-blue-400 underline font-semibold"
          >
            book an institute visit
          </button>{' '}
          or view our verified listing on Google Maps.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'all', label: 'All Photos' },
          { id: 'labs', label: 'Computer Labs' },
          { id: 'classes', label: 'Classrooms & Guidance' },
          { id: 'coding', label: 'Programming & Logic' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === tab.id
                ? 'bg-[#3563FF] text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0e1628] border border-slate-800 rounded-2xl overflow-hidden group hover:border-blue-500/40 transition flex flex-col justify-between"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-900">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 bg-[#0B1220]/90 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                {item.categoryLabel}
              </span>
            </div>
            <div className="p-4 space-y-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Visit Campus CTA */}
      <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white font-heading">
            Want to See Ongoing Classes in Person?
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Book a 30-minute campus tour to inspect the labs, meet faculty, and choose your batch timing.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Maps</span>
          </a>
          <button
            onClick={() => navigate('book')}
            className="px-5 py-2.5 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold transition"
          >
            Schedule Campus Visit
          </button>
        </div>
      </div>
    </div>
  );
};
