import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { useAttendance } from '../../context/AttendanceContext';
import { JobDiscovery } from '../jobs/JobDiscovery';
import { WorkerApplications } from '../applications/WorkerApplications';
import { SavedJobs } from '../jobs/SavedJobs';
import { ChatCenter } from '../messaging/ChatCenter';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { JobCard } from '../jobs/JobCard';
import { JobDetailModal } from '../jobs/JobDetailModal';
import { ResumeUploadModal } from '../common/ResumeUploadModal';
import { SlideSidebar } from '../navigation/SlideSidebar';
import { SettingsView } from '../common/SettingsView';
import { Job, UserRole } from '../../types';
import { calculateDistance } from '../../lib/geo';
import { calculateJobMatch } from '../../lib/smartMatch';
import {
  Briefcase,
  Search,
  FileCheck2,
  Bookmark,
  MessageSquare,
  User,
  Bell,
  Settings,
  Users,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Navigation,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Edit3,
  Menu,
  Lock,
  PhoneCall
} from 'lucide-react';

import { JobsNearMeView } from '../location/JobsNearMeView';
import { WorkerAttendanceView } from '../attendance/WorkerAttendanceView';
import { HiringRequestsView } from '../hiring/HiringRequestsView';
import { TopCompaniesSection } from '../companies/TopCompaniesSection';
import { TrustVerificationCentre } from '../trust/TrustVerificationCentre';
import {
  AnimatedImage,
  AnimatedProgressBar,
  NumberCounter,
  StaggeredCardContainer,
  StaggeredCardItem,
  HoverSpotlightCard,
  TiltCard3D,
  ParticleBackground,
  MorphingAccentOrb,
  RippleContainer,
  MagneticButton
} from '../animations';

interface WorkerDashboardProps {
  onEditProfile: () => void;
  onActivateEmployer: () => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenAIAssistant?: () => void;
}

export type WorkerTab =
  | 'overview'
  | 'jobs_near_me'
  | 'find_jobs'
  | 'trust_centre'
  | 'attendance'
  | 'hiring_requests'
  | 'top_companies'
  | 'my_applications'
  | 'saved_jobs'
  | 'messages'
  | 'profile'
  | 'notifications'
  | 'settings';

const WORKER_TAB_TO_SLUG: Record<WorkerTab, string> = {
  overview: '/jobfinder',
  jobs_near_me: '/jobfinder/50km-radius',
  find_jobs: '/jobfinder/find-jobs',
  trust_centre: '/jobfinder/trust-centre',
  attendance: '/jobfinder/attendance',
  hiring_requests: '/jobfinder/hiring-requests',
  top_companies: '/jobfinder/top-companies',
  my_applications: '/jobfinder/my-applications',
  saved_jobs: '/jobfinder/saved-jobs',
  messages: '/jobfinder/messages',
  profile: '/jobfinder/profile',
  notifications: '/jobfinder/notifications',
  settings: '/jobfinder/settings'
};

const parseWorkerTabFromPath = (pathname: string): WorkerTab => {
  const clean = pathname.replace(/\/+$/, '');
  if (clean === '/50km-radius' || clean === '/jobfinder/50km-radius' || clean === '/jobfinder/jobs-near-me') {
    return 'jobs_near_me';
  }
  if (clean === '/jobfinder/find-jobs') return 'find_jobs';
  if (clean === '/jobfinder/trust-centre') return 'trust_centre';
  if (clean === '/jobfinder/attendance') return 'attendance';
  if (clean === '/jobfinder/hiring-requests') return 'hiring_requests';
  if (clean === '/jobfinder/top-companies') return 'top_companies';
  if (clean === '/jobfinder/my-applications') return 'my_applications';
  if (clean === '/jobfinder/saved-jobs') return 'saved_jobs';
  if (clean === '/jobfinder/messages') return 'messages';
  if (clean === '/jobfinder/profile') return 'profile';
  if (clean === '/jobfinder/notifications') return 'notifications';
  if (clean === '/jobfinder/settings') return 'settings';
  return 'overview';
};

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  onEditProfile,
  onActivateEmployer,
  onSwitchRole,
  onOpenAIAssistant
}) => {
  const { currentUser, userProfile, workerProfile, logout } = useAuth();
  const { myEmploymentRecords } = useAttendance();
  const {
    jobs,
    myApplications,
    hiringRequests,
    savedJobIds,
    conversations,
    unreadNotificationsCount,
    activeConversationId,
    setActiveConversationId,
    applyToJob,
    toggleSaveJob,
    reportItem,
    uploadWorkerResume
  } = useJobs();

  const [activeTab, setActiveTabState] = useState<WorkerTab>(() =>
    parseWorkerTabFromPath(window.location.pathname)
  );
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  const setActiveTab = (tab: WorkerTab) => {
    setActiveTabState(tab);
    const targetPath = WORKER_TAB_TO_SLUG[tab] || '/jobfinder';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const syncFromUrl = () => {
      setActiveTabState(parseWorkerTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const enabledRoles = userProfile?.enabledRoles || ['worker'];
  const hasEmployerRole = enabledRoles.includes('employer');

  // Check if worker has joined any company (Active employment record, Selected application, or Accepted hiring request)
  const hasJoinedCompany =
    myEmploymentRecords.some((r) => r.status === 'Active') ||
    myApplications.some((a) => a.status === 'Selected') ||
    hiringRequests.some((h) => h.workerId === currentUser?.uid && h.status === 'Accepted');

  // Worker coordinates for 50km radius
  const workerLat = workerProfile?.lat || 28.6139;
  const workerLng = workerProfile?.lng || 77.2090;

  // Real statistics
  const availableJobsCount = jobs.filter((j) => j.status === 'active').length;
  const applicationsSentCount = myApplications.length;
  const shortlistedCount = myApplications.filter(
    (a) => a.status === 'Shortlisted' || a.status === 'Interview Scheduled' || a.status === 'Selected'
  ).length;

  // Inquiries / Contacts from employers
  const employersContactedCount = conversations.length + shortlistedCount;

  // Basic details resolved from workerProfile + userProfile + currentUser
  const displayFullName = workerProfile?.fullName || userProfile?.name || currentUser?.displayName || 'Job Seeker';
  const displayEmail = workerProfile?.email || userProfile?.email || currentUser?.email || 'Not added yet';
  const displayPhone =
    (workerProfile?.phone && workerProfile.phone.trim() !== '+91' ? workerProfile.phone : '') ||
    (userProfile?.phone && userProfile.phone.trim() !== '+91' ? userProfile.phone : '') ||
    currentUser?.phoneNumber ||
    'Not added yet';

  // Profile completion calculation (100% requires full onboarding details)
  const calculateProfileCompletion = (): number => {
    let score = 0;
    if (displayFullName && displayFullName !== 'Job Seeker') score += 10;
    if (displayEmail && displayEmail !== 'Not added yet') score += 10;
    if (displayPhone && displayPhone !== 'Not added yet' && displayPhone.replace(/\D/g, '').length >= 10) score += 10;
    if (workerProfile?.profilePhoto) score += 15;
    if (workerProfile?.state && workerProfile?.pincode) score += 15;
    if (((workerProfile?.skills?.length || 0) + (workerProfile?.customSkills?.length || 0)) > 0) score += 20;
    if (workerProfile?.education && workerProfile?.experience) score += 10;
    if (userProfile?.onboardingCompleted && workerProfile?.jobPreferences?.jobTypes?.length) score += 10;
    return Math.min(score, 100);
  };

  const profileCompletionPercent = calculateProfileCompletion();

  const missingProfileFields: string[] = [];
  if (!displayPhone || displayPhone === 'Not added yet' || displayPhone.replace(/\D/g, '').length < 10) {
    missingProfileFields.push('Phone Number');
  }
  if (!workerProfile?.profilePhoto) {
    missingProfileFields.push('Real Profile Photo');
  }
  if (!workerProfile?.state || !workerProfile?.pincode) {
    missingProfileFields.push('City, State & PIN Code');
  }
  if (((workerProfile?.skills?.length || 0) + (workerProfile?.customSkills?.length || 0)) === 0) {
    missingProfileFields.push('Vocational Skills');
  }
  if (!userProfile?.onboardingCompleted) {
    missingProfileFields.push('Complete 7-Step Profile');
  }

  // Jobs under 50km
  const jobsNearYou = jobs
    .filter((j) => {
      if (j.status !== 'active') return false;
      if (!j.lat || !j.lng) return false;
      const dist = calculateDistance(workerLat, workerLng, j.lat, j.lng);
      return dist !== null && dist <= 50;
    })
    .slice(0, 4);

  // Recommended jobs based on smart matching algorithm (skills, experience, category, proximity)
  const recommendedJobs = workerProfile
    ? [...jobs]
        .filter((j) => j.status === 'active')
        .map((j) => ({ job: j, match: calculateJobMatch(workerProfile, j) }))
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 4)
        .map((item) => item.job)
    : jobs.filter((j) => j.status === 'active').slice(0, 4);

  // Recently posted jobs
  const recentJobs = [...jobs]
    .filter((j) => j.status === 'active')
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  // Application updates
  const recentApplications = [...myApplications].slice(0, 3);

  // Saved jobs preview
  const savedJobsPreview = jobs
    .filter((j) => savedJobIds.includes(j.id))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col lg:flex-row">
      {/* Left Slide Navigation Sidebar */}
      <SlideSidebar
        role="worker"
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as WorkerTab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
        profileCompletion={profileCompletionPercent}
        onOpenProfile={() => setActiveTab('profile')}
        onSwitchRole={onSwitchRole}
        onOpenAIAssistant={onOpenAIAssistant || (() => {})}
        onLogout={logout}
        userName={workerProfile?.fullName || userProfile?.name}
        userPhoto={workerProfile?.profilePhoto || userProfile?.profilePhoto}
        contactedCount={employersContactedCount}
        applicationsCount={applicationsSentCount}
        unreadMessagesCount={0}
        unreadNotificationsCount={unreadNotificationsCount}
        activeJobsCount={availableJobsCount}
        savedCount={savedJobIds.length}
        hasJoinedCompany={hasJoinedCompany}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-gray-900">
                  {activeTab === 'overview' && 'Job Finder Dashboard'}
                  {activeTab === 'jobs_near_me' && 'Jobs Near Me (5 KM - 50 KM Radar & Map)'}
                  {activeTab === 'find_jobs' && 'Find Jobs (Category & Discovery)'}
                  {activeTab === 'trust_centre' && 'JOBSETU Trust & Verification Centre'}
                  {activeTab === 'attendance' && 'My Attendance & Shifts (GPS / QR Punch)'}
                  {activeTab === 'hiring_requests' && 'Direct Employer Hiring Offers'}
                  {activeTab === 'top_companies' && 'Top Companies in India (Official Careers)'}
                  {activeTab === 'my_applications' && 'My Applications'}
                  {activeTab === 'saved_jobs' && 'Saved Jobs'}
                  {activeTab === 'messages' && 'Employer Messages & Inquiries'}
                  {activeTab === 'profile' && 'My Profile & Account Details'}
                  {activeTab === 'settings' && 'Platform Settings'}
                  {activeTab === 'notifications' && 'Notifications'}
                </h1>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB]">
                  Job Finder
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Discover local shops, neighborhood commercial opportunities, and employer inquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RippleContainer className="rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('jobs_near_me')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-extrabold shadow-xs transition-colors cursor-pointer jobsetu-liquid-btn"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>50 KM Radius</span>
              </button>
            </RippleContainer>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2" />
              )}
            </button>
          </div>
        </header>

        {/* Tab Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 jobsetu-animated-gradient p-8 sm:p-10 text-white shadow-xl shadow-blue-600/10 overflow-hidden">
              <ParticleBackground count={8} dotColor="bg-white/20" />
              <MorphingAccentOrb className="w-72 h-72 -bottom-24 -left-16 bg-white/10 blur-2xl" />
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {workerProfile?.profilePhoto || userProfile?.profilePhoto ? (
                    <AnimatedImage
                      variant="circular"
                      src={workerProfile?.profilePhoto || userProfile?.profilePhoto || ''}
                      alt={displayFullName}
                      wrapperClassName="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-3 border-white/60 shadow-md"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30">
                      {displayFullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                        Finding Jobs &bull; Job Seeker Hub
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> {profileCompletionPercent === 100 ? '100% Profile Complete' : `${profileCompletionPercent}% Profile Saved`}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                      Welcome, {displayFullName}!
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm mt-0.5 flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        {workerProfile?.city ? `${workerProfile.city}, ` : ''}{workerProfile?.state || 'India'}
                        {workerProfile?.pincode ? ` (${workerProfile.pincode})` : ''}
                      </span>
                      <span>&bull;</span>
                      <span>{displayEmail}</span>
                      {displayPhone !== 'Not added yet' && (
                        <>
                          <span>&bull;</span>
                          <span>{displayPhone}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <MagneticButton>
                    <RippleContainer className="rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setActiveTab('jobs_near_me')}
                        className="py-2.5 px-5 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer jobsetu-liquid-btn"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>50 KM Radius Radar</span>
                      </button>
                    </RippleContainer>
                  </MagneticButton>
                  <RippleContainer className="rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('find_jobs')}
                      className="py-2.5 px-5 rounded-2xl bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search Vacancies</span>
                    </button>
                  </RippleContainer>
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="py-2.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{profileCompletionPercent < 100 ? 'Complete 100% Profile' : 'Edit Profile'}</span>
                  </button>
                </div>
              </div>

              {/* Profile Completion Bar inside banner */}
              <div className="relative mt-8 pt-6 border-t border-white/15">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Complete your 100% Profile to find the Best Jobs in India
                  </span>
                  <span>{profileCompletionPercent}% Completed</span>
                </div>
                <AnimatedProgressBar
                  percent={profileCompletionPercent}
                  trackClassName="w-full bg-white/20 h-2.5 rounded-full overflow-hidden"
                  barClassName="bg-emerald-400 h-full rounded-full"
                />
              </div>
            </div>

            {/* BASIC DETAILS & 100% PROFILE COMPLETION CARD */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-blue-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-black uppercase tracking-wider">
                      Your Saved Account & Basic Details
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                      Role: Finding Jobs (Job Seeker)
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900 mt-1">
                    Basic Profile Information &bull; {profileCompletionPercent}% Profile Completed
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {profileCompletionPercent < 100
                      ? 'Complete Your 100% Profile Now'
                      : 'Update Profile Details'}
                  </span>
                </button>
              </div>

              {/* Basic Details Grid (Name, Email, Phone Number, Location & Skills) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Full Name
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                    {displayFullName}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Email Address
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                    {displayEmail}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Phone Number
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                    {displayPhone}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Location & Skills
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                    {workerProfile?.city || workerProfile?.state
                      ? `${workerProfile?.city ? `${workerProfile.city}, ` : ''}${workerProfile?.state || ''}`
                      : 'Location pending'}{' '}
                    &bull; {(workerProfile?.skills?.length || 0) + (workerProfile?.customSkills?.length || 0)} Skills
                  </span>
                </div>
              </div>

              {/* 100% Profile Completion Callout */}
              {profileCompletionPercent < 100 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-amber-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Complete your 100% Profile to find the Best Jobs in India!</span>
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your basic details are saved across all devices. Complete your remaining steps ({missingProfileFields.join(', ')}) so top verified employers in India can shortlist and hire you faster.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start md:self-center"
                  >
                    <span>Complete 100% Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Primary Spotlight Card: Employers Who Contacted You */}
            <HoverSpotlightCard spotlightColor="rgba(255, 255, 255, 0.12)" className="rounded-3xl jobsetu-neon-glow">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-600/15 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 jobsetu-float-3d">
                    <PhoneCall className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 text-emerald-100 px-2 py-0.5 rounded-full">
                        Direct Recruiter Connections
                      </span>
                      {employersContactedCount > 0 && (
                        <span className="text-[10px] font-black bg-white text-emerald-900 px-2 py-0.5 rounded-full">
                          Active Inquiries
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black mt-1 text-white">
                      <NumberCounter value={employersContactedCount} /> {employersContactedCount === 1 ? 'Employer' : 'Employers'} Contacted You
                    </h2>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      {conversations.length} direct recruitment chat inquiries &bull; {shortlistedCount} callback & interview invitations received.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <RippleContainer className="rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('messages')}
                      className="py-2.5 px-4 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-700" />
                      <span>View Contact Inquiries</span>
                    </button>
                  </RippleContainer>
                </div>
              </div>
            </HoverSpotlightCard>

            {/* Metrics Cards */}
            <StaggeredCardContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4" staggerDelay={0.07}>
              <StaggeredCardItem>
                <TiltCard3D maxTilt={4} className="h-full">
                  <HoverSpotlightCard className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                    <span className="text-2xl font-black text-gray-900 block">
                      <NumberCounter value={availableJobsCount} />
                    </span>
                    <span className="text-xs font-semibold text-gray-500 mt-1 block">Live Available Jobs</span>
                  </HoverSpotlightCard>
                </TiltCard3D>
              </StaggeredCardItem>

              <StaggeredCardItem>
                <TiltCard3D maxTilt={4} className="h-full">
                  <HoverSpotlightCard
                    onClick={() => setActiveTab('jobs_near_me')}
                    className="bg-blue-50/70 hover:bg-blue-100/80 rounded-3xl p-5 shadow-xs border-2 border-blue-200 cursor-pointer transition-all h-full"
                  >
                    <span className="text-2xl font-black text-[#2563EB] block">
                      <NumberCounter value={jobsNearYou.length} />
                    </span>
                    <span className="text-xs font-extrabold text-blue-900 mt-1 flex items-center gap-1">
                      <span>In 50 KM Radius</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </HoverSpotlightCard>
                </TiltCard3D>
              </StaggeredCardItem>

              <StaggeredCardItem>
                <TiltCard3D maxTilt={4} className="h-full">
                  <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.1)" className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                    <span className="text-2xl font-black text-amber-600 block">
                      <NumberCounter value={applicationsSentCount} />
                    </span>
                    <span className="text-xs font-semibold text-gray-500 mt-1 block">Applications Sent</span>
                  </HoverSpotlightCard>
                </TiltCard3D>
              </StaggeredCardItem>

              <StaggeredCardItem>
                <TiltCard3D maxTilt={4} className="h-full">
                  <HoverSpotlightCard spotlightColor="rgba(16, 185, 129, 0.1)" className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                    <span className="text-2xl font-black text-emerald-600 block">
                      <NumberCounter value={shortlistedCount} />
                    </span>
                    <span className="text-xs font-semibold text-gray-500 mt-1 block">Shortlisted / Calls</span>
                  </HoverSpotlightCard>
                </TiltCard3D>
              </StaggeredCardItem>
            </StaggeredCardContainer>

            {/* SECTION 1: Jobs Near You (<50 km radius) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#2563EB]" />
                    <span>Jobs Near You (50 KM Radius Radar)</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vacancies within a 50 KM commuting distance from {workerProfile?.city || workerProfile?.state || 'your location'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('jobs_near_me')}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-extrabold text-[#2563EB] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open 50 KM Radius Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {jobsNearYou.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 space-y-3">
                  <MapPin className="w-10 h-10 text-blue-500 mx-auto" />
                  <div>
                    <p className="text-xs text-gray-800 font-bold">Open the Interactive 50 KM Radius Map to Pin Your Exact Area</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Use GPS or tap anywhere on the Indian Map to see jobs within 5 KM to 50 KM of your location.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('jobs_near_me')}
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Launch 50 KM Radius Radar</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobsNearYou.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      workerLat={workerLat}
                      workerLng={workerLng}
                      isSaved={savedJobIds.includes(job.id)}
                      hasApplied={myApplications.some((a) => a.jobId === job.id)}
                      onApplyClick={(j) => setSelectedJob(j)}
                      onSaveToggle={(id) => toggleSaveJob(id)}
                      onViewDetails={(j) => setSelectedJob(j)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: Recommended Jobs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Recommended for Your Skills</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Jobs matching your vocational qualifications and experience level.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('find_jobs')}
                  className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    workerLat={workerLat}
                    workerLng={workerLng}
                    isSaved={savedJobIds.includes(job.id)}
                    hasApplied={myApplications.some((a) => a.jobId === job.id)}
                    onApplyClick={(j) => setSelectedJob(j)}
                    onSaveToggle={(id) => toggleSaveJob(id)}
                    onViewDetails={(j) => setSelectedJob(j)}
                  />
                ))}
              </div>
            </div>

            {/* SECTION 3: Application Updates & Saved Jobs Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Application Updates */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
                    <span>Recent Application Statuses</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('my_applications')}
                    className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All ({myApplications.length})
                  </button>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-xs">You have not submitted any applications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{app.jobTitle}</h4>
                          <p className="text-[11px] text-gray-500">{app.employerName}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-[#2563EB]">
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Jobs Preview */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span>Saved Jobs</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('saved_jobs')}
                    className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All ({savedJobIds.length})
                  </button>
                </div>

                {savedJobsPreview.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-xs">No saved jobs. Bookmark jobs while browsing to review later.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedJobsPreview.map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{job.title}</h4>
                          <p className="text-[11px] text-gray-500">
                            {job.employerName} • {job.city}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="px-3 py-1.5 rounded-xl bg-white text-[#2563EB] text-xs font-bold border border-blue-200 hover:bg-blue-50 cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: JOBS NEAR ME (5 KM - 50 KM Radar & Map) */}
        {activeTab === 'jobs_near_me' && (
          <div className="animate-in fade-in">
            <JobsNearMeView
              onApplyJob={(job) => setSelectedJob(job)}
              onSaveJob={toggleSaveJob}
              savedJobIds={savedJobIds}
            />
          </div>
        )}

        {/* TAB: TRUST & VERIFICATION CENTRE */}
        {activeTab === 'trust_centre' && (
          <div className="animate-in fade-in">
            <TrustVerificationCentre role="worker" />
          </div>
        )}

        {/* TAB: ATTENDANCE & SHIFTS */}
        {activeTab === 'attendance' && (
          <div className="animate-in fade-in">
            <WorkerAttendanceView />
          </div>
        )}

        {/* TAB: HIRING OFFERS */}
        {activeTab === 'hiring_requests' && (
          <div className="animate-in fade-in">
            <HiringRequestsView
              role="worker"
              onOpenChat={(convId) => {
                setActiveConversationId(convId);
                setActiveTab('messages');
              }}
            />
          </div>
        )}

        {/* TAB: TOP COMPANIES IN INDIA */}
        {activeTab === 'top_companies' && (
          <div className="animate-in fade-in">
            <TopCompaniesSection
              onOpenAIAssistant={onOpenAIAssistant}
              isStandalonePage={true}
            />
          </div>
        )}

        {/* TAB 2: FIND JOBS */}
        {activeTab === 'find_jobs' && (
          <div className="animate-in fade-in">
            <JobDiscovery
              onOpenAuth={() => {}}
              profileCompletion={profileCompletionPercent}
              onCompleteProfile={() => setActiveTab('profile')}
            />
          </div>
        )}

        {/* TAB 3: MY APPLICATIONS */}
        {activeTab === 'my_applications' && (
          <div className="animate-in fade-in">
            <WorkerApplications />
          </div>
        )}

        {/* TAB 4: SAVED JOBS */}
        {activeTab === 'saved_jobs' && (
          <div className="animate-in fade-in">
            <SavedJobs onDiscoverJobs={() => setActiveTab('find_jobs')} />
          </div>
        )}

        {/* TAB 5: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="animate-in fade-in">
            <ChatCenter initialConversationId={activeConversationId || undefined} />
          </div>
        )}

        {/* TAB 6: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-200 animate-in fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-5">
                {workerProfile?.profilePhoto ? (
                  <img
                    src={workerProfile.profilePhoto}
                    alt={displayFullName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#2563EB] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 text-[#2563EB] font-bold text-2xl flex items-center justify-center">
                    {displayFullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{displayFullName}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {workerProfile?.city ? `${workerProfile.city}, ` : ''}{workerProfile?.state || 'India'}{' '}
                      {workerProfile?.pincode ? `(${workerProfile.pincode})` : ''}
                    </span>
                    <span>&bull;</span>
                    <span>{displayEmail}</span>
                    <span>&bull;</span>
                    <span>{displayPhone}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onEditProfile}
                className="px-5 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>{profileCompletionPercent < 100 ? 'Complete 100% Profile' : 'Edit Full Profile'}</span>
              </button>
            </div>

            {/* Verification Status Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
                  workerProfile?.mobileOtpVerified
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {workerProfile?.mobileOtpVerified ? '✓ Mobile OTP Verified' : 'Mobile Unverified'}
              </span>
              <span
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
                  workerProfile?.emailVerified
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {workerProfile?.emailVerified ? '✓ Email Verified' : 'Email Unverified'}
              </span>
              <span
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
                  workerProfile?.identityVerificationStatus === 'Verified'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                {workerProfile?.identityVerificationStatus === 'Verified'
                  ? `✓ ID Verified (${workerProfile?.identityVerificationProvider || 'Authorized'})`
                  : 'ID Verification Pending'}
              </span>
              {workerProfile?.digilockerLinked && (
                <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                  ✓ DigiLocker Linked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block truncate">
                  {displayEmail}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Phone Number</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {displayPhone}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Profile Completion</span>
                <span className="text-sm font-bold text-[#2563EB] mt-1 block">
                  {profileCompletionPercent}% Completed
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Gender & Language</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block capitalize">
                  {workerProfile?.gender || 'Not specified'} &bull; {workerProfile?.preferredLanguage || 'Hindi'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Experience & Previous Role</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {workerProfile?.experience || 'Fresher'}
                  {workerProfile?.previousJobRole ? ` (${workerProfile.previousJobRole})` : ''}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Highest Education</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {workerProfile?.education || 'Secondary'}
                  {workerProfile?.schoolOrCollegeName ? ` — ${workerProfile.schoolOrCollegeName}` : ''}
                  {workerProfile?.passingYear ? ` (${workerProfile.passingYear})` : ''}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Preferred Location & Radius</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {(workerProfile?.jobPreferences?.preferredLocations || []).join(', ') || workerProfile?.city || 'India'} ({workerProfile?.jobPreferences?.preferredSearchRadiusKm || 50} km)
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Expected Compensation</span>
                <span className="text-sm font-bold text-emerald-700 mt-1 block">
                  {workerProfile?.jobPreferences?.expectedSalary || '₹18,000/mo'}
                  {workerProfile?.jobPreferences?.expectedDailyWage ? ` • ${workerProfile.jobPreferences.expectedDailyWage}` : ''}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Joining & Relocation</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {workerProfile?.jobPreferences?.availability || 'Immediate'}
                  {workerProfile?.jobPreferences?.willingToRelocate ? ' • Open to Relocate' : ''}
                  {workerProfile?.jobPreferences?.accommodationRequired ? ' • Needs Stay' : ''}
                </span>
              </div>
            </div>

            {(workerProfile?.selectedProfessions || []).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Selected Professions
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(workerProfile?.selectedProfessions || []).map((prof) => (
                    <span
                      key={prof}
                      className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200"
                    >
                      {prof}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Registered Vocational & Professional Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(workerProfile?.skills || []).map((sk) => (
                  <span
                    key={sk}
                    className="px-3 py-1 rounded-xl bg-blue-50 text-[#2563EB] text-xs font-bold border border-blue-200"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Resume / CV Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Verified Resume / CV</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setResumeModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold transition-colors cursor-pointer"
                >
                  {workerProfile?.resumeUrl ? 'Update Resume' : '+ Upload Resume'}
                </button>
              </div>

              {workerProfile?.resumeUrl ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-950">{workerProfile.resumeName || 'Verified Resume.pdf'}</p>
                      <p className="text-[10px] text-emerald-700">Uploaded and attached to all future applications</p>
                    </div>
                  </div>
                  <a
                    href={workerProfile.resumeUrl}
                    download={workerProfile.resumeName || 'Resume.pdf'}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Download
                  </a>
                </div>
              ) : (
                <div
                  onClick={() => setResumeModalOpen(true)}
                  className="p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 bg-slate-50 text-center cursor-pointer transition-colors"
                >
                  <p className="text-xs font-bold text-gray-700">No Resume Attached Yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Upload a PDF or Word document to boost employer call-backs by 3x.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in">
            <NotificationCenter
              onNavigateToView={(view) => {
                if (view === 'applications') setActiveTab('my_applications');
                else if (view === 'messages') setActiveTab('messages');
                else if (view === 'jobs') setActiveTab('find_jobs');
              }}
            />
          </div>
        )}

        {/* TAB 8: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in">
            <SettingsView
              role="worker"
              userName={workerProfile?.fullName || userProfile?.name}
              userEmail={userProfile?.email}
              isVerified={Boolean(workerProfile?.ageEligibilityConfirmed)}
            />
          </div>
        )}

        {/* Modal for viewing detailed job info */}
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            workerProfile={workerProfile}
            workerLat={workerLat}
            workerLng={workerLng}
            isSaved={savedJobIds.includes(selectedJob.id)}
            hasApplied={myApplications.some((a) => a.jobId === selectedJob.id)}
            onApply={applyToJob}
            onToggleSave={toggleSaveJob}
            onReport={(jobId, reason) => reportItem('job', jobId, reason)}
          />
        )}

        {/* Modal for uploading resume */}
        <ResumeUploadModal
          isOpen={resumeModalOpen}
          onClose={() => setResumeModalOpen(false)}
          currentResumeUrl={workerProfile?.resumeUrl}
          currentResumeName={workerProfile?.resumeName}
          onSave={async (url, name) => {
            await uploadWorkerResume(url, name);
          }}
        />
        </div>
      </div>
    </div>
  );
};
