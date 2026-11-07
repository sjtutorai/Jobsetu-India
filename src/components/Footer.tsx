import React from 'react';
import { Briefcase, MapPin, Mail, Phone, Heart, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenModal: (type: 'about' | 'contact' | 'privacy' | 'terms' | 'help') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                JOB<span className="text-[#2563EB]">SETU</span>
              </span>
            </div>
            <p className="text-sm font-semibold text-[#F59E0B]">
              Connecting People. Creating Opportunities.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              JOBSETU connects job seekers with verified employers across every state and union territory in India. Empowering Bharat's workforce through trusted, direct employment connectivity.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Employers & Zero Middlemen Commission</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => onOpenModal('about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('help')}
                  className="hover:text-white transition-colors"
                >
                  Help Centre
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <span className="text-gray-500 text-xs">Coverage: 28 States & 8 UTs</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-4">
              Legal & Safety
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => onOpenModal('privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('help')}
                  className="hover:text-white transition-colors"
                >
                  Worker Protection Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('help')}
                  className="hover:text-white transition-colors"
                >
                  Employer Verification Norms
                </button>
              </li>
            </ul>
          </div>

          {/* India Helpline */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-4">
              Pan-India Support
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">
                  Headquartered in New Delhi, operating across all Indian States & Union Territories.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="text-xs">support@jobsetu.in</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs">+91 (1800) 572-SETU</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} JOBSETU Technologies India. All rights reserved.</p>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for Bharat's aspiring job seekers and businesses</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
