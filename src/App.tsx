/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { BookingPage } from './pages/BookingPage';
import { ManageBookingPage } from './pages/ManageBookingPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { LegalPage } from './pages/LegalPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Course, WebsiteSettings } from './types';
import { api } from './services/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParams, setRouteParams] = useState<any>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Parse path from window.location on mount
  useEffect(() => {
    const parsePath = () => {
      const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const searchParams = new URLSearchParams(window.location.search);

      if (!pathname || pathname === '') {
        setCurrentRoute('home');
      } else if (pathname.startsWith('courses/')) {
        const slug = pathname.replace('courses/', '');
        setCurrentRoute('course-detail');
        setRouteParams({ slug });
      } else if (pathname === 'courses') {
        const category = searchParams.get('category');
        setCurrentRoute('courses');
        setRouteParams({ initialCategory: category || undefined });
      } else if (pathname === 'book') {
        const course = searchParams.get('course');
        setCurrentRoute('book');
        setRouteParams({ courseInterest: course || undefined });
      } else if (pathname === 'manage-booking' || pathname.startsWith('booking/')) {
        const ref = searchParams.get('ref') || pathname.replace('booking/', '');
        const token = searchParams.get('token');
        setCurrentRoute('manage-booking');
        setRouteParams({ initialRef: ref, initialToken: token });
      } else if (pathname === 'about') {
        setCurrentRoute('about');
      } else if (pathname === 'gallery') {
        setCurrentRoute('gallery');
      } else if (pathname === 'contact') {
        setCurrentRoute('contact');
      } else if (pathname === 'faq') {
        setCurrentRoute('faq');
      } else if (pathname === 'privacy') {
        setCurrentRoute('privacy');
      } else if (pathname === 'terms') {
        setCurrentRoute('terms');
      } else if (pathname === 'admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('home');
      }
    };

    parsePath();
    window.addEventListener('popstate', parsePath);
    return () => window.removeEventListener('popstate', parsePath);
  }, []);

  const navigate = (route: string, params: any = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update history URL cleanly
    let path = '/';
    if (route === 'courses') {
      path = params.category ? `/courses?category=${encodeURIComponent(params.category)}` : '/courses';
    } else if (route === 'course-detail') {
      path = `/courses/${params.slug}`;
    } else if (route === 'book') {
      path = params.courseInterest ? `/book?course=${encodeURIComponent(params.courseInterest)}` : '/book';
    } else if (route === 'manage-booking') {
      path = params.ref ? `/manage-booking?ref=${encodeURIComponent(params.ref)}` : '/manage-booking';
      if (params.token) path += `&token=${encodeURIComponent(params.token)}`;
    } else if (route !== 'home') {
      path = `/${route}`;
    }

    window.history.pushState({}, '', path);
  };

  const loadData = () => {
    Promise.all([api.getCourses(), api.getSettings()])
      .then(([coursesRes, settingsRes]) => {
        setCourses(coursesRes.courses);
        setSettings(settingsRes.settings);
      })
      .catch(err => {
        console.error('Failed to load initial data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1220] text-slate-100 selection:bg-[#3563FF] selection:text-white">
      {/* Optional Admin Notice Announcement Bar */}
      {settings.notice_banner && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs py-2 px-4 text-center font-medium shadow-md">
          <span>{settings.notice_banner}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        institutePhone={settings.phone}
        instituteName={settings.institute_name}
      />

      {/* Page Body */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomePage navigate={navigate} courses={courses} settings={settings} />
        )}
        {currentRoute === 'about' && (
          <AboutPage navigate={navigate} settings={settings} />
        )}
        {currentRoute === 'courses' && (
          <CoursesPage
            courses={courses}
            navigate={navigate}
            initialCategory={routeParams.initialCategory || routeParams.category}
          />
        )}
        {currentRoute === 'course-detail' && (
          <CourseDetailPage
            slug={routeParams.slug}
            navigate={navigate}
            settings={settings}
          />
        )}
        {currentRoute === 'book' && (
          <BookingPage
            navigate={navigate}
            courses={courses}
            initialCourseInterest={routeParams.courseInterest}
            settings={settings}
          />
        )}
        {currentRoute === 'manage-booking' && (
          <ManageBookingPage
            navigate={navigate}
            initialRef={routeParams.initialRef || routeParams.ref}
            initialToken={routeParams.initialToken || routeParams.token}
            settings={settings}
          />
        )}
        {currentRoute === 'gallery' && (
          <GalleryPage navigate={navigate} settings={settings} />
        )}
        {currentRoute === 'contact' && (
          <ContactPage navigate={navigate} courses={courses} settings={settings} />
        )}
        {currentRoute === 'faq' && (
          <FaqPage navigate={navigate} settings={settings} />
        )}
        {currentRoute === 'privacy' && (
          <LegalPage initialTab="privacy" navigate={navigate} settings={settings} />
        )}
        {currentRoute === 'terms' && (
          <LegalPage initialTab="terms" navigate={navigate} settings={settings} />
        )}
        {currentRoute === 'admin' && (
          <AdminDashboard navigate={navigate} onRefreshPublicData={loadData} />
        )}
      </main>

      {/* Persistent WhatsApp Floating Contact */}
      {settings.whatsapp_enabled !== 'false' && (
        <WhatsAppButton phone={settings.phone_raw || settings.phone} />
      )}

      {/* Footer */}
      <Footer navigate={navigate} instituteSettings={settings} />
    </div>
  );
}
