import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  phone?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone = '918700573469' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const cleanPhone = phone.replace(/\D/g, '');
  const defaultText = encodeURIComponent(
    'Hello Advance IT Institute! I would like to enquire about courses and book a counselling session.'
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${defaultText}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {showTooltip && (
        <div className="mb-2 bg-slate-900 border border-slate-700 text-white text-xs py-2 px-3.5 rounded-xl shadow-xl flex items-center gap-2 max-w-xs animate-fade-in">
          <span>Need quick course info? Chat directly with our Najafgarh counsellor.</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        aria-label="Chat with Advance IT Institute on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline-block">
          WhatsApp Enquiry
        </span>
      </a>
    </div>
  );
};
