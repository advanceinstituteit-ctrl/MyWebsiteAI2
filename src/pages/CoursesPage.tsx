import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  Search,
  Filter,
  CheckCircle,
  Calendar,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Course } from '../types';

interface CoursesPageProps {
  courses: Course[];
  navigate: (route: string, params?: any) => void;
  initialCategory?: string;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  courses,
  navigate,
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Basic Computer and Office Skills',
    'MS Office and Advanced Excel',
    'Tally and Accounting',
    'Programming: C, Java, Python',
    'Digital Marketing',
    'Spoken English',
    'Linux and Networking',
  ];

  const filteredCourses = courses.filter(c => {
    const matchesCategory =
      selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Job-Oriented Training
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading mt-1">
          Explore Our Courses & Programs
        </h1>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          All courses at Advance IT Institute emphasize hands-on computer lab work, individualized faculty mentorship, and real-world practical assignments.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by course title, topic, or keyword..."
            className="w-full bg-[#0e1628] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden md:block" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#3563FF] text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat === 'All' ? 'All Courses' : cat.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No courses match your filter</h3>
          <p className="text-xs text-slate-400">
            Try resetting your search query or choosing another category.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-[#0e1628] border border-slate-800 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Course Image */}
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-[#0B1220]/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                    {course.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-medium text-slate-300">
                    {course.level}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white font-heading group-hover:text-blue-300 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Highlights */}
                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                    {course.duration && (
                      <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                        <Clock className="w-3 h-3 text-blue-400" />
                        {course.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                      <Award className="w-3 h-3 text-emerald-400" />
                      Lab Practice
                    </span>
                  </div>

                  {/* Syllabus Modules Preview */}
                  {Array.isArray(course.syllabus) && course.syllabus.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Key Syllabus Topics:
                      </p>
                      <ul className="space-y-1">
                        {course.syllabus.slice(0, 3).map((mod, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5 truncate">
                            <span className="text-blue-500 font-bold shrink-0">✓</span>
                            <span className="truncate">{mod}</span>
                          </li>
                        ))}
                      </ul>
                      {course.syllabus.length > 3 && (
                        <p className="text-[11px] text-slate-400">
                          + {course.syllabus.length - 3} more modules in detailed syllabus
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fee Disclaimer */}
                  <div className="pt-2 text-[11px] text-slate-400 italic">
                    {course.fee_visible && course.fee > 0 ? (
                      <span className="text-emerald-400 font-bold not-italic">
                        Course Fee: ₹{course.fee.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span>Fee structure & scholarship details explained during counselling</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 border-t border-slate-800/60 mt-3 flex items-center justify-between gap-3">
                <button
                  onClick={() => navigate('course-detail', { slug: course.slug })}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition"
                >
                  View Full Syllabus
                </button>
                <button
                  onClick={() => navigate('book', { courseInterest: course.title })}
                  className="flex-1 py-2 rounded-lg bg-[#3563FF] hover:bg-blue-600 text-white text-xs font-semibold text-center transition shadow-sm"
                >
                  Book Counselling
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
