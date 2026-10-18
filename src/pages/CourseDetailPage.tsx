import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Award,
  Layers,
  Users,
  BookOpen,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { Course } from '../types';
import { api } from '../services/api';

interface CourseDetailPageProps {
  slug: string;
  navigate: (route: string, params?: any) => void;
  settings?: Record<string, string>;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  slug,
  navigate,
  settings = {},
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getCourseBySlug(slug)
      .then(res => {
        if (mounted) {
          setCourse(res.course);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message || 'Course not found');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
        <p className="text-slate-400 text-sm mt-3">Loading course curriculum...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
        <p className="text-slate-400 text-sm">{error || 'This course is currently unavailable.'}</p>
        <button
          onClick={() => navigate('courses')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          Back to Courses Catalogue
        </button>
      </div>
    );
  }

  const phone = settings.phone || '+91 87005 73469';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <button
        onClick={() => navigate('courses')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Courses</span>
      </button>

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              {course.category}
            </span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
              {course.level}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading leading-tight">
            {course.title}
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            {course.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
            <div className="bg-[#0e1628] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Duration</span>
              <span className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {course.duration || '2 to 3 Months'}
              </span>
            </div>
            <div className="bg-[#0e1628] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Learning Mode</span>
              <span className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Lab Practical + Theory
              </span>
            </div>
            <div className="bg-[#0e1628] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Class Size</span>
              <span className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Small Focused Batches
              </span>
            </div>
          </div>
        </div>

        {/* Enrollment / Action Card */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
          <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
            <img
              src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Course Fee:</span>
              <span className="text-sm font-bold text-white">
                {course.fee_visible && course.fee > 0
                  ? `₹${course.fee.toLocaleString('en-IN')}`
                  : 'Fee Shared in Counselling'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Includes individual computer lab access, assignments, and faculty support.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('book', { courseInterest: course.title })}
              className="w-full py-3 rounded-xl bg-[#3563FF] hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
            >
              Book Free Counselling For This Course
            </button>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Call Helpline: {phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Detailed Syllabus & Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Curriculum & Syllabus Modules
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Step-by-step module breakdown designed to build practical proficiency.
            </p>
          </div>

          <div className="space-y-3">
            {Array.isArray(course.syllabus) && course.syllabus.length > 0 ? (
              course.syllabus.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e1628] border border-slate-800/80 rounded-xl p-4 flex items-start gap-3.5"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item}</h4>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">
                Detailed syllabus breakdown will be provided during your counselling session.
              </p>
            )}
          </div>

          {/* Prerequisites */}
          {course.prerequisites && (
            <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-5 space-y-2 mt-6">
              <h3 className="text-sm font-bold text-white font-heading">
                Eligibility & Prerequisites
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {course.prerequisites}
              </p>
            </div>
          )}
        </div>

        {/* Batches and Timings */}
        <div className="space-y-6">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Available Batch Timings
            </h3>
            {Array.isArray(course.batches) && course.batches.length > 0 ? (
              <ul className="space-y-2.5">
                {course.batches.map((b, i) => (
                  <li
                    key={i}
                    className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">
                Regular weekday and weekend batches available. Call institute to pick your preferred timing.
              </p>
            )}
          </div>

          {/* Institute Assurance */}
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white font-heading">
              Advance IT Institute Guarantee
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We focus strictly on verified learning. No fake placement claims — only honest hands-on instruction, real projects, and interview preparation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
