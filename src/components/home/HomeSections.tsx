import React from 'react';
import {
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  Building2,
  GraduationCap,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { SKILL_CATEGORIES_DATA } from '../../types';

export const StatsSection: React.FC = () => {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tight">36</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">States & Union Territories</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Pan-India coverage</p>
          </div>
          <div className="p-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#F59E0B] tracking-tight">8+</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Vocational Sectors</p>
            <p className="text-[11px] text-gray-500 mt-0.5">From Retail to Technical & Digital</p>
          </div>
          <div className="p-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tight">100%</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Verified Employers</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Strict compliance checks</p>
          </div>
          <div className="p-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">₹0</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Worker Placement Fee</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Free for all job seekers</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const HowItWorksSection: React.FC<{ onSelectRole: (role: 'worker' | 'employer') => void }> = ({ onSelectRole }) => {
  return (
    <section className="py-20 bg-slate-50/70" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Simple & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mt-3 tracking-tight">
            How JOBSETU Connects India
          </h2>
          <p className="text-gray-600 text-base mt-3">
            Designed for speed, clarity, and trust. Get started in minutes whether you are looking for your next job or hiring talented employees.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Job Seekers */}
          <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-lg shadow-blue-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">For Job Seekers</h3>
                <p className="text-xs text-gray-500">Your pathway to steady livelihood</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Create Unified Profile</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Enter basic details, state, district, and PIN code. 18+ eligibility verified.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  B
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Select Vocational & Digital Skills</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Choose from Retail, Hospitality, Technical, Transport, Office, Digital, or custom skills.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  C
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Connect with Verified Employers</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Employers can view your profile and reach out directly with job opportunities.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectRole('worker')}
              className="mt-8 w-full py-3 px-4 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white font-bold text-sm transition-all"
            >
              Start as Job Seeker →
            </button>
          </div>

          {/* For Employers */}
          <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">For Employers</h3>
                <p className="text-xs text-gray-500">Hire certified and motivated staff</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Register Your Business</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Add owner details, company category, location address, and trade information.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  B
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Submit Verification Info</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Provide GST/PAN/Shop registration info. Transparent audit protects job seekers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  C
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Recruit Suitable Candidates</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Find skilled candidates matching your business category and exact pin code.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectRole('employer')}
              className="mt-8 w-full py-3 px-4 rounded-xl bg-amber-50 text-amber-700 hover:bg-[#F59E0B] hover:text-white font-bold text-sm transition-all"
            >
              Start as Employer →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export const SkillCategoriesShowcase: React.FC = () => {
  const categories = Object.keys(SKILL_CATEGORIES_DATA);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Vocational & Professional Diversity
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mt-3 tracking-tight">
            Popular Skill Categories
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Tailored for grassroots workers, technical technicians, administrative staff, and creative specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const skills = SKILL_CATEGORIES_DATA[cat] || [];
            return (
              <div
                key={cat}
                className="p-6 rounded-2xl bg-slate-50 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-[#2563EB] transition-colors">
                    {cat}
                  </h3>
                  <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border">
                    {skills.length} skills
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700"
                    >
                      {s}
                    </span>
                  ))}
                  {skills.length > 4 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB]">
                      +{skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
