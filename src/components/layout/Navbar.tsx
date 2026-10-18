import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Menu,
  X,
  BookOpen,
  Info,
  Images,
  HelpCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string, params?: any) => void;
  institutePhone?: string;
  instituteName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  institutePhone = '+91 87005 73469',
  instituteName = 'Advance IT Institute',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
    { id: 'book', label: 'Book Counselling', icon: Calendar },
    { id: 'gallery', label: 'Gallery', icon: Images },
    { id: 'contact', label: 'Contact', icon: MapPin },
    { id: 'faq', label: 'FAQs', icon: HelpCircle },
  ];

  const handleNav = (id: string, params?: any) => {
    navigate(id, params);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-800/80 transition-all">
      {/* Top micro-bar for address and phone */}
      <div className="bg-[#070b14] border-b border-slate-800/50 px-4 py-1.5 text-xs text-slate-400 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3563FF]" />
              First Floor, Plot 2, Main Road, opp. Gupta Market, Najafgarh, New Delhi 110043
            </span>
          </div>
          <div className="flex items-center space-x-5">
            <a
              href={`tel:${institutePhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call: {institutePhone}</span>
            </a>
            <button
              onClick={() => handleNav('manage-booking')}
              className="hover:text-blue-400 transition-colors flex items-center gap-1 text-slate-300"
            >
              <Search className="w-3 h-3 text-blue-400" />
              <span>Manage Booking</span>
            </button>
            <button
              onClick={() => handleNav('admin')}
              className="hover:text-slate-200 transition-colors flex items-center gap-1 text-slate-400 hover:underline"
            >
              <ShieldCheck className="w-3 h-3 text-slate-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#3563FF] rounded-lg p-1 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3563FF] to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-lg font-extrabold text-white tracking-tight font-heading leading-tight">
                {instituteName}
              </span>
              <span className="block text-xs text-blue-400 font-medium">
                Software Training & IT Education • Najafgarh
              </span>
            </div>
          </button>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => {
              const active = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => handleNav('manage-booking')}
              className="lg:hidden px-3 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Find Booking
            </button>
            <button
              onClick={() => handleNav('book')}
              className="relative group overflow-hidden px-5 py-2.5 rounded-lg bg-[#3563FF] text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-600 transition-all active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Book Free Counselling
              </span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => handleNav('book')}
              className="sm:hidden px-3 py-1.5 rounded-lg bg-[#3563FF] text-white text-xs font-semibold"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1220] border-b border-slate-800 px-4 pt-3 pb-6 space-y-2">
          {navItems.map(item => {
            const active = currentRoute === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <button
              onClick={() => handleNav('manage-booking')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800"
            >
              <Search className="w-4 h-4 text-blue-400" />
              Manage / Reschedule Booking
            </button>

            <a
              href={`tel:${institutePhone.replace(/\s+/g, '')}`}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-900/40"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              Direct Call: {institutePhone}
            </a>

            <button
              onClick={() => handleNav('admin')}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Administrator Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
