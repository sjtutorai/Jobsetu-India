import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
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

interface WorkerDashboardProps {
  onEditProfile: () => void;
  onActivateEmployer: () => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenAIAssistant?: () => void;
}

type WorkerTab =
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

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  onEditProfile,
  onActivateEmployer,
  onSwitchRole,
  onOpenAIAssistant
}) => {
  const { userProfile, workerProfile, logout } = useAuth();
  const {
    jobs,
    myApplications,
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

  const [activeTab, setActiveTab] = useState<WorkerTab>('overview');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  const enabledRoles = userProfile?.enabledRoles || ['worker'];
  const hasEmployerRole = enabledRoles.includes('employer');

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

  // Profile completion calculation
  const calculateProfileCompletion = (): number => {
    if (!workerProfile) return 20;
    let score = 25; // Basic registration
    if (workerProfile.fullName) score += 10;
    if (workerProfile.profilePhoto) score += 15;
    if (workerProfile.skills && workerProfile.skills.length > 0) score += 20;
    if (workerProfile.experience) score += 10;
    if (workerProfile.education) score += 10;
    if (workerProfile.city && workerProfile.pincode) score += 10;
    return Math.min(score, 100);
  };

  const profileCompletionPercent = calculateProfileCompletion();

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
            <button
              type="button"
              onClick={() => setActiveTab('jobs_near_me')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>50 km Radar</span>
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
            {/* Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 sm:p-10 text-white shadow-xl shadow-blue-600/10 overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {workerProfile?.profilePhoto || userProfile?.profilePhoto ? (
                    <img
                      src={workerProfile?.profilePhoto || userProfile?.profilePhoto}
                      alt={workerProfile?.fullName || userProfile?.name}
                      className="w-20 h-20 rounded-2xl object-cover border-3 border-white/60 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30">
                      {(workerProfile?.fullName || userProfile?.name || 'W').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                        Job Seeker Hub
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Real Photo & 18+ Verified
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                      Welcome, {workerProfile?.fullName || userProfile?.name}!
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>
                        {workerProfile?.city ? `${workerProfile.city}, ` : ''}{workerProfile?.state || 'India'}
                        {workerProfile?.pincode ? ` (${workerProfile.pincode})` : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('find_jobs')}
                    className="py-2.5 px-5 rounded-2xl bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Vacancies</span>
                  </button>
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="py-2.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* Profile Completion Bar inside banner */}
              <div className="mt-8 pt-6 border-t border-white/15">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Profile Completeness
                  </span>
                  <span>{profileCompletionPercent}%</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletionPercent}%` }}
                  />
                </div>
                {profileCompletionPercent < 100 && (
                  <p className="text-[11px] text-blue-100 mt-2">
                    Tip: Complete your preferred locations and vocational certificates to rank higher in employer searches.
                  </p>
                )}
              </div>
            </div>

            {/* Primary Spotlight Card: Employers Who Contacted You */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-600/15 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
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
                    {employersContactedCount} {employersContactedCount === 1 ? 'Employer' : 'Employers'} Contacted You
                  </h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {conversations.length} direct recruitment chat inquiries &bull; {shortlistedCount} callback & interview invitations received.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="py-2.5 px-4 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>View Contact Inquiries</span>
                </button>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-gray-900 block">{availableJobsCount}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Live Available Jobs</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-[#2563EB] block">{jobsNearYou.length}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">In 50 km Radius</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-amber-600 block">{applicationsSentCount}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Applications Sent</span>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200">
                <span className="text-2xl font-black text-emerald-600 block">{shortlistedCount}</span>
                <span className="text-xs font-semibold text-gray-500 mt-1 block">Shortlisted / Calls</span>
              </div>
            </div>

            {/* SECTION 1: Jobs Near You (<50 km radius) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#2563EB]" />
                    <span>Jobs Near You (Under 50 km Radius)</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vacancies within easy commuting distance from {workerProfile?.city || workerProfile?.state || 'your location'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('find_jobs')}
                  className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Near Me</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {jobsNearYou.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-semibold">No job vacancies currently active within 50 km</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Explore open positions across your state or nationwide.</p>
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
                    alt={workerProfile.fullName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#2563EB] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 text-[#2563EB] font-bold text-2xl flex items-center justify-center">
                    {(workerProfile?.fullName || 'W').charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{workerProfile?.fullName}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {workerProfile?.city ? `${workerProfile.city}, ` : ''}{workerProfile?.state} ({workerProfile?.pincode})
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onEditProfile}
                className="px-5 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Full Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Gender</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block capitalize">
                  {workerProfile?.gender || 'Not specified'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Experience Level</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {workerProfile?.experience || 'Fresher'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Highest Education</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  {workerProfile?.education || 'Secondary'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Registered Vocational Skills
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
