import React from 'react';
import { RoleCards } from './RoleCards';
import { UserRole } from '../../types';
import { ShieldCheck, MapPin, Zap } from 'lucide-react';

interface HeroProps {
  onSelectRole: (role: UserRole) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectRole }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/60 via-white to-gray-50/50">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-blue-200/30 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Top Bharat connectivity pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-200 shadow-xs mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="text-xs sm:text-sm font-bold text-[#111827]">
            Empowering All 28 States & 8 Union Territories
          </span>
          <span className="text-xs text-[#F59E0B] font-semibold">🇮🇳 Pan-India</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#111827] tracking-tight uppercase max-w-4xl leading-[1.1] mb-6">
          WELCOME TO <span className="text-[#2563EB]">JOBSETU</span>
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] mb-5 tracking-tight">
          Find Opportunities. <span className="text-[#F59E0B]">Hire the Right People.</span>
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl text-[#6B7280] max-w-3xl leading-relaxed mb-12 sm:mb-16">
          JOBSETU connects job seekers with employers across India. Discover opportunities or find suitable employees for your business.
        </p>

        {/* The Two Large Prominent Cards */}
        <RoleCards onSelectRole={onSelectRole} />

        {/* Trust Badges */}
        <div className="mt-14 pt-8 border-t border-gray-200/80 w-full max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#2563EB] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Direct Connection</p>
              <p className="text-[11px] text-gray-500">No middle agents or placement cuts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#F59E0B] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Hyperlocal & National</p>
              <p className="text-[11px] text-gray-500">By district, city, pin code & state</p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Unified Account</p>
              <p className="text-[11px] text-gray-500">Switch between Seeker & Employer</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
