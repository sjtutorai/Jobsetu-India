import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { JobPostForm } from '../jobs/JobPostForm';
import { ManageJobs } from '../jobs/ManageJobs';
import { CandidateDirectory } from '../candidates/CandidateDirectory';
import { EmployerApplications } from '../applications/EmployerApplications';
import { SavedCandidates } from '../candidates/SavedCandidates';
import { ChatCenter } from '../messaging/ChatCenter';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { SlideSidebar } from '../navigation/SlideSidebar';
import { SettingsView } from '../common/SettingsView';
import { WorkersNearMeView } from '../location/WorkersNearMeView';
import { EmployerAttendanceView } from '../attendance/EmployerAttendanceView';
import { HiringRequestsView } from '../hiring/HiringRequestsView';
import { SendHiringRequestModal } from '../hiring/SendHiringRequestModal';
import { TopCompaniesSection } from '../companies/TopCompaniesSection';
import { TrustVerificationCentre } from '../trust/TrustVerificationCentre';
import { Job, UserRole, WorkerProfile } from '../../types';
import {
  Building2,
  PlusCircle,
  Briefcase,
  Users,
  FileCheck2,
  MessageSquare,
  Bookmark,
  Bell,
  Settings,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Eye,
  Edit3,
  Menu,
  PhoneCall,
  UserCheck,
  Navigation
} from 'lucide-react';

interface EmployerDashboardProps {
  onEditProfile: () => void;
  onActivateWorker: () => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenAIAssistant?: () => void;
}

export type EmployerTab =
  | 'overview'
  | 'workers_near_me'
  | 'post_job'
  | 'manage_jobs'
  | 'find_workers'
  | 'trust_centre'
  | 'attendance'
  | 'hiring_requests'
  | 'top_companies'
  | 'applications'
  | 'saved_candidates'
  | 'messages'
  | 'profile'
  | 'notifications'
  | 'settings';

const EMPLOYER_TAB_TO_SLUG: Record<EmployerTab, string> = {
  overview: '/findemployee',
  workers_near_me: '/findemployee/50km-radius',
  post_job: '/findemployee/post-job',
  manage_jobs: '/findemployee/manage-jobs',
  find_workers: '/findemployee/find-workers',
  trust_centre: '/findemployee/trust-centre',
  attendance: '/findemployee/attendance',
  hiring_requests: '/findemployee/hiring-requests',
  top_companies: '/findemployee/top-companies',
  applications: '/findemployee/applications',
  saved_candidates: '/findemployee/saved-candidates',
  messages: '/findemployee/messages',
  profile: '/findemployee/profile',
  notifications: '/findemployee/notifications',
  settings: '/findemployee/settings'
};

const parseEmployerTabFromPath = (pathname: string): EmployerTab => {
  const clean = pathname.replace(/\/+$/, '');
  if (
    clean === '/50km-radius' ||
    clean === '/findemployee/50km-radius' ||
    clean === '/findemployee/workers-near-me'
  ) {
    return 'workers_near_me';
  }
  if (clean === '/findemployee/post-job') return 'post_job';
  if (clean === '/findemployee/manage-jobs') return 'manage_jobs';
  if (clean === '/findemployee/find-workers') return 'find_workers';
  if (clean === '/findemployee/trust-centre') return 'trust_centre';
  if (clean === '/findemployee/attendance') return 'attendance';
  if (clean === '/findemployee/hiring-requests') return 'hiring_requests';
  if (clean === '/findemployee/top-companies') return 'top_companies';
  if (clean === '/findemployee/applications') return 'applications';
  if (clean === '/findemployee/saved-candidates') return 'saved_candidates';
  if (clean === '/findemployee/messages') return 'messages';
  if (clean === '/findemployee/profile') return 'profile';
  if (clean === '/findemployee/notifications') return 'notifications';
  if (clean === '/findemployee/settings') return 'settings';
  return 'overview';
};

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  onEditProfile,
  onActivateWorker,
  onSwitchRole,
  onOpenAIAssistant
}) => {
  const { currentUser, userProfile, employerProfile, logout } = useAuth();
  const {
    myJobs,
    employerApplications,
    savedCandidateIds,
    conversations,
    unreadNotificationsCount,
    activeConversationId,
    setActiveConversationId
  } = useJobs();

  const [activeTab, setActiveTabState] = useState<EmployerTab>(() =>
    parseEmployerTabFromPath(window.location.pathname)
  );
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [hiringTargetWorker, setHiringTargetWorker] = useState<WorkerProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  const setActiveTab = (tab: EmployerTab) => {
    setActiveTabState(tab);
    const targetPath = EMPLOYER_TAB_TO_SLUG[tab] || '/findemployee';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const syncFromUrl = () => {
      setActiveTabState(parseEmployerTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const enabledRoles = userProfile?.enabledRoles || ['employer'];
  const hasWorkerRole = enabledRoles.includes('worker');

  // Real Metrics from Firestore
  const activeJobListings = myJobs.filter((j) => j.status === 'active').length;
  const totalApplications = employerApplications.length;
  const newApplications = employerApplications.filter((a) => a.status === 'Applied').length;
  const shortlistedCandidates = employerApplications.filter(
    (a) => a.status === 'Shortlisted' || a.status === 'Interview Scheduled'
  ).length;
  const filledPositions = myJobs.filter((j) => j.status === 'closed').length;

  // Basic details resolved from employerProfile + userProfile + currentUser
  const displayOwnerName =
    employerProfile?.ownerName || userProfile?.name || currentUser?.displayName || 'Business Owner';
  const displayEmail =
    employerProfile?.ownerEmail || userProfile?.email || currentUser?.email || 'Not added yet';
  const displayPhone =
    (employerProfile?.ownerPhone && employerProfile.ownerPhone.trim() !== '+91' ? employerProfile.ownerPhone : '') ||
    (userProfile?.phone && userProfile.phone.trim() !== '+91' ? userProfile.phone : '') ||
    currentUser?.phoneNumber ||
    'Not added yet';
  const displayBusinessName = employerProfile?.businessName || '';

  // Business Profile Completion Calculation (100% requires full onboarding details)
  const calculateEmployerCompletion = (): number => {
    let score = 0;
    if (displayOwnerName && displayOwnerName !== 'Business Owner') score += 10;
    if (displayEmail && displayEmail !== 'Not added yet') score += 10;
    if (displayPhone && displayPhone !== 'Not added yet' && displayPhone.replace(/\D/g, '').length >= 10) score += 10;
    if (displayBusinessName.trim()) score += 20;
    if ((employerProfile?.businessImages?.length || 0) > 0 || employerProfile?.businessLogo) score += 20;
    if (employerProfile?.state && employerProfile?.pincode) score += 15;
    if (employerProfile?.documentNumber && (employerProfile?.boardGstinVerifiedByAI || userProfile?.onboardingCompleted)) score += 15;
    return Math.min(score, 100);
  };

  const employerCompletionPercent = calculateEmployerCompletion();

  const missingEmployerFields: string[] = [];
  if (!displayPhone || displayPhone === 'Not added yet' || displayPhone.replace(/\D/g, '').length < 10) {
    missingEmployerFields.push('Phone Number');
  }
  if (!displayBusinessName.trim()) {
    missingEmployerFields.push('Business / Coaching Classes Name');
  }
  if ((employerProfile?.businessImages?.length || 0) === 0) {
    missingEmployerFields.push('Sign Board Photo with GSTIN');
  }
  if (!employerProfile?.state || !employerProfile?.pincode) {
    missingEmployerFields.push('Workplace Location & PIN Code');
  }
  if (!employerProfile?.documentNumber) {
    missingEmployerFields.push('15-Digit GSTIN Verification');
  }

  // Recent applications preview
  const recentApplicants = [...employerApplications].slice(0, 4);

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setActiveTab('post_job');
  };

  const handleJobCreatedOrUpdated = () => {
    setEditingJob(null);
    setActiveTab('manage_jobs');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col lg:flex-row">
      {/* Left Slide Navigation Sidebar */}
      <SlideSidebar
        role="employer"
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as EmployerTab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
        profileCompletion={employerCompletionPercent}
        onOpenProfile={() => setActiveTab('profile')}
        onSwitchRole={onSwitchRole}
        onOpenAIAssistant={onOpenAIAssistant || (() => {})}
        onLogout={logout}
        userName={employerProfile?.businessName || userProfile?.name}
        userPhoto={employerProfile?.businessLogo}
        applicationsCount={totalApplications}
        unreadMessagesCount={0}
        unreadNotificationsCount={unreadNotificationsCount}
        activeJobsCount={activeJobListings}
        savedCount={savedCandidateIds.length}
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
                  {activeTab === 'overview' && 'Recruiter Dashboard'}
                  {activeTab === 'workers_near_me' && 'Workers Near Me (5 KM - 50 KM Radar & Map)'}
                  {activeTab === 'find_workers' && 'Find Employees (100% Verified & 50 km First)'}
                  {activeTab === 'trust_centre' && 'JOBSETU Trust & Verification Centre'}
                  {activeTab === 'attendance' && 'Workforce Attendance, Geofences & Shifts'}
                  {activeTab === 'hiring_requests' && 'Sent Hiring Offers & Candidate Responses'}
                  {activeTab === 'top_companies' && 'Top Companies in India (Industry Ecosystem)'}
                  {activeTab === 'post_job' && 'Post a New Opening'}
                  {activeTab === 'manage_jobs' && 'Manage Posted Jobs'}
                  {activeTab === 'applications' && 'Candidate Applications'}
                  {activeTab === 'saved_candidates' && 'Saved Candidates'}
                  {activeTab === 'messages' && 'Candidate Messages'}
                  {activeTab === 'profile' && 'Business Profile & Verification'}
                  {activeTab === 'settings' && 'Platform Settings'}
                  {activeTab === 'notifications' && 'Notifications'}
                </h1>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
                  Employee Finder
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Recruit verified local employees and discover skilled candidates within 50 km.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('workers_near_me')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>50 KM Radius</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingJob(null);
                setActiveTab('post_job');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Post Opening</span>
            </button>

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
            {/* Employer Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 p-8 sm:p-10 text-white shadow-xl shadow-amber-500/10 overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {employerProfile?.businessLogo ? (
                    <img
                      src={employerProfile.businessLogo}
                      alt={displayBusinessName || displayOwnerName}
                      className="w-20 h-20 rounded-2xl object-cover border-3 border-white/60 shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30">
                      {(displayBusinessName || displayOwnerName || 'E').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                        Finding Labours / Staff &bull; Employer Portal
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-100 flex items-center gap-1 bg-black/15 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                        {employerCompletionPercent === 100 ? '100% Profile Complete' : `${employerCompletionPercent}% Profile Saved`}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                      {displayBusinessName || `Welcome, ${displayOwnerName}!`}
                    </h1>

                    <p className="text-amber-100 text-xs sm:text-sm mt-0.5 flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                        {employerProfile?.city ? `${employerProfile.city}, ` : ''}{employerProfile?.state || 'India'}
                        {employerProfile?.pincode ? ` (${employerProfile.pincode})` : ''}
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
                  <button
                    type="button"
                    onClick={() => setActiveTab('workers_near_me')}
                    className="py-2.5 px-5 rounded-2xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>50 KM Radius Radar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingJob(null);
                      setActiveTab('post_job');
                    }}
                    className="py-2.5 px-5 rounded-2xl bg-white text-amber-800 hover:bg-amber-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-600" />
                    <span>Post New Opening</span>
                  </button>

                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="py-2.5 px-4 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{employerCompletionPercent < 100 ? 'Complete 100% Profile' : 'Edit Profile'}</span>
                  </button>
                </div>
              </div>

              {/* Profile Completion Bar inside banner */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    Complete your 100% Business Profile to hire the Best Labours & Staff in India
                  </span>
                  <span>{employerCompletionPercent}% Completed</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-300 h-full rounded-full transition-all duration-500"
                    style={{ width: `${employerCompletionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* BASIC DETAILS & 100% BUSINESS PROFILE COMPLETION CARD */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-amber-200/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      Your Saved Account & Basic Details
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                      Role: Finding Labours / Employees (Employer)
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900 mt-1">
                    Basic Account & Business Information &bull; {employerCompletionPercent}% Completed
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {employerCompletionPercent < 100
                      ? 'Complete Your 100% Business Profile'
                      : 'Update Business Details'}
                  </span>
                </button>
              </div>

              {/* Basic Details Grid (Owner Name, Email, Phone Number, Business Name) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Owner / Representative Name
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                    {displayOwnerName}
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
                    Business / Coaching Name
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                    {displayBusinessName || 'Not added yet'}
                  </span>
                </div>
              </div>

              {/* 100% Profile Completion Callout */}
              {employerCompletionPercent < 100 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-amber-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Complete your 100% Profile to hire the Best Labours & Staff in India!</span>
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your account role (Finding Labours / Employees) and basic details are saved across all devices. Complete your remaining steps ({missingEmployerFields.join(', ')}) to unlock full verified hiring across India.
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

            {/* Spotlight Banner: People Who Want to Join You */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-blue-500/30">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Live Hiring Demand
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>People Who Want to Join You:</span>
                  <span className="text-amber-400 font-extrabold text-2xl sm:text-3xl">
                    {totalApplications}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                  {newApplications > 0 ? (
                    <span>
                      <strong className="text-emerald-300 font-bold">{newApplications} new candidate{newApplications === 1 ? '' : 's'}</strong> waiting for your interview screening and review.
                    </span>
                  ) : totalApplications > 0 ? (
                    <span>All {totalApplications} applications have been reviewed. Check your shortlisted pool.</span>
                  ) : (
                    <span>No applications received yet. Discover 100% verified candidates within 50 km in the talent directory!</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('applications')}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-950" />
                  <span>Review Applicants ({totalApplications})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('find_workers')}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Find Employees</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-gray-900 block">{activeJobListings}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Active Job Listings</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-[#2563EB] block">{totalApplications}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Want to Join You</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-emerald-600 block">{newApplications}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">New Unreviewed</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-purple-600 block">{shortlistedCandidates}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Shortlisted / Interviews</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-slate-700 block">{filledPositions}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Filled Positions</span>
              </div>
            </div>

            {/* Quick Actions & Recent Applicants */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Applicants */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#2563EB]" />
                      <span>Recent Applicants Who Want to Join</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Candidates awaiting review across your active job postings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('applications')}
                    className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All ({totalApplications})
                  </button>
                </div>

                {recentApplicants.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-gray-700">No applicants yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Publish a job opening or search the talent directory to invite candidates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplicants.map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          {app.workerPhoto ? (
                            <img
                              src={app.workerPhoto}
                              alt={app.workerName}
                              className="w-10 h-10 rounded-xl object-cover border border-blue-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] font-bold text-sm flex items-center justify-center">
                              {app.workerName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{app.workerName}</h4>
                            <p className="text-[11px] text-gray-500">
                              Applied for: <span className="font-semibold text-gray-800">{app.jobTitle}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-[#2563EB]">
                            {app.status.replace('_', ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('applications')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Job Management Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-amber-500" />
                    <span>Your Active Postings</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage vacancies, edit requirements, or pause applications anytime.
                  </p>

                  <div className="mt-4 space-y-2.5">
                    {myJobs.slice(0, 3).map((j) => (
                      <div
                        key={j.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <span className="text-bold text-gray-800 truncate max-w-[150px]">{j.title}</span>
                        <span className="text-[11px] text-gray-500 font-semibold">
                          {j.applicationsCount || 0} applicants
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingJob(null);
                      setActiveTab('post_job');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post a Job Vacancy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('manage_jobs')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    View All Postings ({myJobs.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POST / EDIT JOB */}
        {activeTab === 'post_job' && (
          <div className="animate-in fade-in">
            <JobPostForm
              initialJob={editingJob}
              onSuccess={handleJobCreatedOrUpdated}
              onCancel={() => {
                setEditingJob(null);
                setActiveTab('manage_jobs');
              }}
            />
          </div>
        )}

        {/* TAB 3: MANAGE JOBS */}
        {activeTab === 'manage_jobs' && (
          <div className="animate-in fade-in">
            <ManageJobs
              onPostNewJob={() => {
                setEditingJob(null);
                setActiveTab('post_job');
              }}
              onEditJob={handleEditJob}
              onViewApplicants={() => {
                setActiveTab('applications');
              }}
            />
          </div>
        )}

        {/* TAB 4: FIND WORKERS */}
        {activeTab === 'find_workers' && (
          <div className="animate-in fade-in">
            <CandidateDirectory
              employerProfileCompletion={employerCompletionPercent}
              onCompleteEmployerProfile={() => setActiveTab('profile')}
              onOpenChat={(convId) => {
                setActiveConversationId(convId);
                setActiveTab('messages');
              }}
            />
          </div>
        )}

        {/* TAB 5: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="animate-in fade-in">
            <EmployerApplications
              onOpenChat={(convId) => {
                setActiveConversationId(convId);
                setActiveTab('messages');
              }}
            />
          </div>
        )}

        {/* TAB 6: SAVED CANDIDATES */}
        {activeTab === 'saved_candidates' && (
          <div className="animate-in fade-in">
            <SavedCandidates
              onDiscoverCandidates={() => setActiveTab('find_workers')}
              onOpenChat={(convId) => {
                setActiveConversationId(convId);
                setActiveTab('messages');
              }}
            />
          </div>
        )}

        {/* TAB 7: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="animate-in fade-in">
            <ChatCenter initialConversationId={activeConversationId || undefined} />
          </div>
        )}

        {/* TAB 8: BUSINESS PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-200 animate-in fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-5">
                {employerProfile?.businessLogo ? (
                  <img
                    src={employerProfile.businessLogo}
                    alt={displayBusinessName || displayOwnerName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-700 font-bold text-2xl flex items-center justify-center">
                    {(displayBusinessName || displayOwnerName || 'E').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {displayBusinessName || displayOwnerName}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {employerProfile?.city ? `${employerProfile.city}, ` : ''}{employerProfile?.state || 'India'}{' '}
                      {employerProfile?.pincode ? `(${employerProfile.pincode})` : ''}
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
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>{employerCompletionPercent < 100 ? 'Complete 100% Profile' : 'Edit Enterprise Profile'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Contact Person</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {displayOwnerName}
                </span>
              </div>
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
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Business Name</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {displayBusinessName || 'Not added yet'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Category</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {employerProfile?.businessCategory || 'Coaching Classes / Education Institute'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Profile Completion</span>
                <span className="text-sm font-bold text-amber-700 mt-1 block">
                  {employerCompletionPercent}% Completed
                </span>
              </div>
            </div>

            {employerProfile?.businessDescription && (
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  About Business & Operations
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {employerProfile.businessDescription}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: WORKERS NEAR ME (5 KM - 50 KM Radar & Map) */}
        {activeTab === 'workers_near_me' && (
          <div className="animate-in fade-in">
            <WorkersNearMeView
              onOpenChat={(convId) => {
                setActiveConversationId(convId);
                setActiveTab('messages');
              }}
              onSendHiringRequest={(worker) => setHiringTargetWorker(worker)}
            />
          </div>
        )}

        {/* TAB: TRUST & VERIFICATION CENTRE */}
        {activeTab === 'trust_centre' && (
          <div className="animate-in fade-in">
            <TrustVerificationCentre role="employer" />
          </div>
        )}

        {/* TAB: ATTENDANCE & STAFF */}
        {activeTab === 'attendance' && (
          <div className="animate-in fade-in">
            <EmployerAttendanceView />
          </div>
        )}

        {/* TAB: SENT HIRING OFFERS */}
        {activeTab === 'hiring_requests' && (
          <div className="animate-in fade-in">
            <HiringRequestsView
              role="employer"
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

        {/* TAB 9: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in">
            <SettingsView
              role="employer"
              userName={employerProfile?.businessName || userProfile?.name}
              userEmail={employerProfile?.ownerEmail || userProfile?.email}
              isVerified={employerProfile?.verificationStatus === 'Verified'}
            />
          </div>
        )}

        {/* TAB 10: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in">
            <NotificationCenter
              onNavigateToView={(view) => {
                if (view === 'applications') setActiveTab('applications');
                else if (view === 'messages') setActiveTab('messages');
                else if (view === 'jobs') setActiveTab('manage_jobs');
              }}
            />
          </div>
        )}

        {/* Direct Hiring Request Modal */}
        <SendHiringRequestModal
          worker={hiringTargetWorker}
          isOpen={Boolean(hiringTargetWorker)}
          onClose={() => setHiringTargetWorker(null)}
        />
        </div>
      </div>
    </div>
  );
};
