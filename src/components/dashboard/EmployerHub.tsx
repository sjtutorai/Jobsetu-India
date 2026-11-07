import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Users,
  Briefcase,
  Edit3,
  PlusCircle,
  FileText,
  Sparkles,
  ExternalLink,
  Mail,
  Phone
} from 'lucide-react';
import { UserRole } from '../../types';

interface EmployerHubProps {
  onEditProfile: () => void;
  onActivateWorker: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const EmployerHub: React.FC<EmployerHubProps> = ({
  onEditProfile,
  onActivateWorker,
  onSwitchRole
}) => {
  const { userProfile, employerProfile } = useAuth();

  const enabledRoles = userProfile?.enabledRoles || ['employer'];
  const hasWorkerRole = enabledRoles.includes('worker');
  const isVerified = employerProfile?.verificationStatus === 'Verified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-8 sm:p-10 text-white shadow-xl shadow-amber-500/15 overflow-hidden mb-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {employerProfile?.businessLogo || userProfile?.profilePhoto ? (
              <img
                src={employerProfile?.businessLogo || userProfile?.profilePhoto}
                alt={employerProfile?.businessName || userProfile?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/50 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30">
                {(employerProfile?.businessName || userProfile?.name || 'E').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  {employerProfile?.businessCategory || 'Enterprise'}
                </span>
                {/* Strict Verification Badge Rule: Never unearned */}
                {isVerified ? (
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Business
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-amber-900/40 text-amber-100 border border-amber-300/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />
                    Audit Pending
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                {employerProfile?.businessName || 'Business Enterprise'}
              </h1>
              <p className="text-amber-100 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-white" />
                <span>
                  {employerProfile?.city ? `${employerProfile.city}, ` : ''}{employerProfile?.state || 'India'}
                  {employerProfile?.pincode ? ` (${employerProfile.pincode})` : ''}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onEditProfile}
              className="py-2.5 px-4 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Business Info</span>
            </button>

            {hasWorkerRole ? (
              <button
                onClick={() => onSwitchRole('worker')}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Switch to Job Seeker Mode</span>
              </button>
            ) : (
              <button
                onClick={onActivateWorker}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Activate Job Seeker Role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Business & Verification Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Verification Status Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Compliance & Verification</h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {employerProfile?.verificationStatus || 'Pending'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed mb-4">
              <p className="font-bold mb-1">
                Transparency Rule: Never an unearned verification badge
              </p>
              <p className="text-amber-800">
                Our verification team audits business registration identifiers (GSTIN / PAN / MSME Udyam) within 24-48 business hours to ensure only legitimate employers can hire job seekers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-gray-400 font-bold uppercase block">Business Identifier</span>
                <span className="text-gray-900 font-mono font-bold text-sm block mt-0.5">
                  {employerProfile?.documentNumber || 'Pending submission'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-gray-400 font-bold uppercase block">Owner Contact</span>
                <span className="text-gray-900 font-bold block mt-0.5">
                  {employerProfile?.ownerName} ({employerProfile?.designation})
                </span>
                <span className="text-gray-500 block">{employerProfile?.ownerEmail}</span>
              </div>
            </div>
          </div>

          {/* Business Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Building2 className="w-5 h-5 text-amber-600" />
              <span>Business Profile & Workplace</span>
            </h2>

            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block">About Business</span>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                {employerProfile?.businessDescription || 'No description added yet. Add a short summary to give job seekers confidence in your enterprise.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase block">Official Address</span>
                <p className="text-gray-800 font-semibold mt-0.5">
                  {employerProfile?.businessAddress ? `${employerProfile.businessAddress}, ` : ''}
                  {employerProfile?.area ? `${employerProfile.area}, ` : ''}
                  {employerProfile?.city ? `${employerProfile.city}, ` : ''}
                  {employerProfile?.state} - {employerProfile?.pincode}
                </p>
              </div>

              {employerProfile?.website && (
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Website</span>
                  <a
                    href={employerProfile.website.startsWith('http') ? employerProfile.website : `https://${employerProfile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563EB] hover:underline font-semibold mt-0.5 inline-flex items-center gap-1"
                  >
                    <span>{employerProfile.website}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Part 2 Architecture & Dual Role */}
        <div className="space-y-6">
          {/* Dual-role Card */}
          {!hasWorkerRole ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Looking for employment too?</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                JOBSETU lets you build a worker profile with your vocational skills using this same account.
              </p>
              <button
                onClick={onActivateWorker}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Activate Job Seeker Role →
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Dual Role Active</span>
              </div>
              <h3 className="text-base font-bold text-gray-900">Unified Seeker & Employer Account</h3>
              <p className="text-xs text-gray-600 mt-1">
                Switch to your Job Seeker profile anytime to showcase your personal vocational skills.
              </p>
              <button
                onClick={() => onSwitchRole('worker')}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#F59E0B] text-white font-bold text-xs cursor-pointer"
              >
                Switch to Job Seeker Hub
              </button>
            </div>
          )}

          {/* Part 2 Architectural Readiness Cards */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Next Up: Part 2 Architecture
            </h3>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-800">Post Vacancies & Shifts</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Part 2</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Publish roles across 8 sectors with salary benchmarks and required PIN codes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-800">Recruit & Direct Messaging</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Part 2</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Review verified worker applicants, shortlists, and interview scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
