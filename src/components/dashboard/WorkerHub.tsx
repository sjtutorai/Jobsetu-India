import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  MapPin,
  GraduationCap,
  Wrench,
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Edit3,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { UserRole } from '../../types';

interface WorkerHubProps {
  onEditProfile: () => void;
  onActivateEmployer: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const WorkerHub: React.FC<WorkerHubProps> = ({
  onEditProfile,
  onActivateEmployer,
  onSwitchRole
}) => {
  const { userProfile, workerProfile } = useAuth();

  const enabledRoles = userProfile?.enabledRoles || ['worker'];
  const hasEmployerRole = enabledRoles.includes('employer');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 sm:p-10 text-white shadow-xl shadow-blue-600/15 overflow-hidden mb-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {workerProfile?.profilePhoto || userProfile?.profilePhoto ? (
              <img
                src={workerProfile?.profilePhoto || userProfile?.profilePhoto}
                alt={workerProfile?.fullName || userProfile?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/50 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30">
                {(workerProfile?.fullName || userProfile?.name || 'W').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Job Seeker Profile
                </span>
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 18+ Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                {workerProfile?.fullName || userProfile?.name}
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {workerProfile?.city ? `${workerProfile.city}, ` : ''}{workerProfile?.state || 'India'}
                  {workerProfile?.pincode ? ` (${workerProfile.pincode})` : ''}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onEditProfile}
              className="py-2.5 px-4 rounded-xl bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            {hasEmployerRole ? (
              <button
                onClick={() => onSwitchRole('employer')}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Switch to Employer Mode</span>
              </button>
            ) : (
              <button
                onClick={onActivateEmployer}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Activate Employer Role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Skills Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-lg font-bold text-gray-900">My Vocational & Professional Skills</h2>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {(workerProfile?.skills?.length || 0) + (workerProfile?.customSkills?.length || 0)} Skills
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {workerProfile?.skills?.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{skill}</span>
                </span>
              ))}
              {workerProfile?.customSkills?.map((cs) => (
                <span
                  key={cs}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold"
                >
                  ★ {cs}
                </span>
              ))}
              {(!workerProfile?.skills || workerProfile.skills.length === 0) && (
                <p className="text-xs text-gray-500 py-2">No skills selected yet. Click Edit Profile to add skills.</p>
              )}
            </div>
          </div>

          {/* Education & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3 text-[#2563EB]">
                <GraduationCap className="w-5 h-5" />
                <h3 className="text-sm font-bold text-gray-900">Highest Education</h3>
              </div>
              <p className="text-base font-extrabold text-gray-800">
                {workerProfile?.education || 'Not specified'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Verified qualification level</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3 text-[#2563EB]">
                <Clock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-gray-900">Experience Level</h3>
              </div>
              <p className="text-base font-extrabold text-gray-800">
                {workerProfile?.experience || 'Fresher'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Track record in chosen trade</p>
            </div>
          </div>

          {/* Job Preferences Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Briefcase className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-lg font-bold text-gray-900">Work Preferences & Salary</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Job Types</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {workerProfile?.jobPreferences?.jobTypes?.map((jt) => (
                    <span key={jt} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-semibold">
                      {jt}
                    </span>
                  )) || <span className="text-gray-500">Full-time</span>}
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Expected Salary</p>
                <p className="font-bold text-sm text-gray-900 mt-1">
                  {workerProfile?.jobPreferences?.expectedSalary || '₹15,000 - ₹25,000 / month'}
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Availability</p>
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold mt-1">
                  {workerProfile?.jobPreferences?.availability || 'Immediate'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Part 2 Preparation & Dual Role Callout */}
        <div className="space-y-6">
          {/* Dual-role Card */}
          {!hasEmployerRole ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Do you also run a business?</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                JOBSETU lets you recruit staff with the same account. Activate your employer profile now without logging out.
              </p>
              <button
                onClick={onActivateEmployer}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Activate Employer Role →
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Dual Role Active</span>
              </div>
              <h3 className="text-base font-bold text-gray-900">You are both a Seeker & Employer</h3>
              <p className="text-xs text-gray-600 mt-1">
                You can switch between searching for jobs and recruiting staff using the menu above.
              </p>
              <button
                onClick={() => onSwitchRole('employer')}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#2563EB] text-white font-bold text-xs"
              >
                Switch to Employer Hub
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
                <span className="text-xs font-bold text-gray-800">Browse Jobs Across India</span>
                <span className="text-[10px] font-bold bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded">Part 2</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Filter by verified employer, district, salary, and your matching skills.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-800">Job Applications & Chat</span>
                <span className="text-[10px] font-bold bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded">Part 2</span>
              </div>
              <p className="text-[11px] text-gray-500">
                One-click applications with direct messaging between seeker and employer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
