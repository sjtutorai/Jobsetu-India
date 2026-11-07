import React from 'react';
import {
  TrendingUp,
  Search,
  FileCheck2,
  Bookmark,
  MessageSquare,
  User,
  Settings,
  Bell,
  Users,
  PlusCircle,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Clock,
  Send
} from 'lucide-react';
import { UserRole } from '../../types';

export interface SidebarItem {
  id: string;
  label: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
}

interface SlideSidebarProps {
  role: 'worker' | 'employer';
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  profileCompletion: number;
  onOpenProfile: () => void;
  onSwitchRole: (targetRole: UserRole) => void;
  onOpenAIAssistant: () => void;
  onLogout: () => void;
  userName?: string;
  userPhoto?: string;
  contactedCount?: number;
  applicationsCount?: number;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  activeJobsCount?: number;
  savedCount?: number;
}

export const SlideSidebar: React.FC<SlideSidebarProps> = ({
  role,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  profileCompletion,
  onOpenProfile,
  onSwitchRole,
  onOpenAIAssistant,
  onLogout,
  userName = 'User',
  userPhoto,
  contactedCount = 0,
  applicationsCount = 0,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
  activeJobsCount = 0,
  savedCount = 0
}) => {
  const isWorker = role === 'worker';
  const accentColor = isWorker ? '#2563EB' : '#D97706';
  const accentBg = isWorker ? 'bg-blue-600' : 'bg-amber-600';
  const activeBg = isWorker ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-amber-50 text-amber-800 font-bold';
  const activeBorder = isWorker ? 'border-l-4 border-blue-600' : 'border-l-4 border-amber-600';

  // Navigation Items for Job Finder (Worker)
  const workerItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      subtext: 'Overview & Contacts',
      icon: TrendingUp,
      badge: contactedCount > 0 ? `${contactedCount} Inquiries` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'jobs_near_me',
      label: 'Jobs Near Me',
      subtext: '5 KM - 50 KM Radar & Map',
      icon: Search,
      badge: 'Radar',
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'find_jobs',
      label: 'Find Jobs',
      subtext: 'Category & Search',
      icon: Briefcase,
      badge: profileCompletion < 100 ? 'Lock Tier' : 'All',
      badgeColor: profileCompletion < 100 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
    },
    {
      id: 'trust_centre',
      label: 'Trust & Verification',
      subtext: 'Aadhaar & DigiLocker',
      icon: ShieldCheck,
      badge: 'e-KYC',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'attendance',
      label: 'My Attendance',
      subtext: 'GPS / QR Check-in',
      icon: Clock,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'hiring_requests',
      label: 'Hiring Offers',
      subtext: 'Direct Employer Offers',
      icon: Send
    },
    {
      id: 'top_companies',
      label: 'Top Companies',
      subtext: 'Official Careers India',
      icon: Building2
    },
    {
      id: 'my_applications',
      label: 'My Applications',
      subtext: 'Track Progress',
      icon: FileCheck2,
      badge: applicationsCount > 0 ? applicationsCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'saved_jobs',
      label: 'Saved Jobs',
      subtext: 'Bookmarked',
      icon: Bookmark,
      badge: savedCount > 0 ? savedCount : undefined,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'messages',
      label: 'Messages',
      subtext: 'Employer Chat',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'profile',
      label: 'Profile',
      subtext: 'Account Details & CV',
      icon: User
    },
    {
      id: 'settings',
      label: 'Settings',
      subtext: 'Language & App Info',
      icon: Settings
    },
    {
      id: 'notifications',
      label: 'Notifications',
      subtext: 'Alerts & Updates',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      badgeColor: 'bg-red-500 text-white'
    }
  ];

  // Navigation Items for Employee Finder (Employer)
  const employerItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      subtext: 'Recruiter Hub',
      icon: TrendingUp,
      badge: applicationsCount > 0 ? `${applicationsCount} Want to Join` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'workers_near_me',
      label: 'Workers Near Me',
      subtext: '5 KM - 50 KM Radar & Map',
      icon: Users,
      badge: 'Live Radar',
      badgeColor: 'bg-amber-500 text-slate-950'
    },
    {
      id: 'find_workers',
      label: 'Find Employees',
      subtext: '100% Verified First',
      icon: Briefcase,
      badge: 'Priority',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'trust_centre',
      label: 'Trust & Verification',
      subtext: 'Aadhaar, DigiLocker & Ratings',
      icon: ShieldCheck,
      badge: 'e-KYC',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'attendance',
      label: 'Attendance & Staff',
      subtext: 'Geofence, QR, Shifts',
      icon: Clock,
      badge: 'Operations',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'hiring_requests',
      label: 'Sent Hiring Offers',
      subtext: 'Direct Outreach',
      icon: Send
    },
    {
      id: 'post_job',
      label: 'Post New Job',
      subtext: 'Create Vacancy',
      icon: PlusCircle
    },
    {
      id: 'manage_jobs',
      label: 'Manage Jobs',
      subtext: 'Active Openings',
      icon: Briefcase,
      badge: activeJobsCount > 0 ? activeJobsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'applications',
      label: 'Applications',
      subtext: 'Applicant Pipeline',
      icon: FileCheck2,
      badge: applicationsCount > 0 ? applicationsCount : undefined,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'top_companies',
      label: 'Top Companies',
      subtext: 'Industry Ecosystem',
      icon: Building2
    },
    {
      id: 'saved_candidates',
      label: 'Saved Candidates',
      subtext: 'Bookmarked Roster',
      icon: Bookmark
    },
    {
      id: 'messages',
      label: 'Messages',
      subtext: 'Candidate Chat',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-amber-600 text-white'
    },
    {
      id: 'profile',
      label: 'Business Profile',
      subtext: 'Verification Details',
      icon: Building2
    },
    {
      id: 'settings',
      label: 'Settings',
      subtext: 'Language & App Info',
      icon: Settings
    },
    {
      id: 'notifications',
      label: 'Notifications',
      subtext: 'Recruitment Alerts',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      badgeColor: 'bg-red-500 text-white'
    }
  ];

  const currentItems = isWorker ? workerItems : employerItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 select-none">
      {/* Sidebar Header / Brand */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="https://i.ibb.co/jv67DNGx/Jobsetulogo.png"
            alt="JOBSETU"
            className="w-10 h-10 object-contain shrink-0"
          />
          {!isCollapsedDesktop && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-gray-900">
                  JOB<span className={isWorker ? 'text-[#2563EB]' : 'text-amber-600'}>SETU</span>
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                    isWorker ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isWorker ? 'Job Finder' : 'Employee Finder'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {isWorker ? 'Connecting to Opportunities' : 'Recruiting Skilled Talent'}
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 lg:hidden cursor-pointer"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapseDesktop}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          title={isCollapsedDesktop ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsedDesktop ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Profile Completion Unlock Gauge */}
      {!isCollapsedDesktop && (
        <div className="p-4 mx-3 my-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-gray-800 flex items-center gap-1">
              {profileCompletion === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Profile Completion</span>
            </span>
            <span
              className={`font-black ${
                profileCompletion === 100 ? 'text-emerald-700' : 'text-blue-700'
              }`}
            >
              {profileCompletion}%
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                profileCompletion === 100
                  ? 'bg-emerald-500'
                  : isWorker
                  ? 'bg-[#2563EB]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.max(profileCompletion, 10)}%` }}
            />
          </div>

          <p className="text-[11px] text-gray-600 leading-snug">
            {profileCompletion === 100 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>100% Complete: All 50km shops & jobs unlocked!</span>
              </span>
            ) : isWorker ? (
              <span>Complete to 100% to unlock 3x more local shops & direct employer contact.</span>
            ) : (
              <span>Complete to 100% to unlock all verified candidate CVs within 50km.</span>
            )}
          </p>

          {profileCompletion < 100 && (
            <button
              type="button"
              onClick={onOpenProfile}
              className={`mt-2 w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer ${
                isWorker ? 'bg-[#2563EB] hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <span>Complete Profile (+{100 - profileCompletion}%)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {currentItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all cursor-pointer text-left ${
                isActive
                  ? `${activeBg} ${activeBorder} shadow-xs`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              } ${isCollapsedDesktop ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? (isWorker ? 'text-[#2563EB]' : 'text-amber-600') : 'text-gray-400'
                }`}
              />

              {!isCollapsedDesktop && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate">
                    <p className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</p>
                    {item.subtext && <p className="text-[10px] text-gray-400 truncate">{item.subtext}</p>}
                  </div>

                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.badgeColor || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        {/* User Mini Card */}
        <div className={`flex items-center justify-between ${isCollapsedDesktop ? 'flex-col gap-2' : ''}`}>
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-8 h-8 rounded-xl object-cover border border-gray-200 shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-xl ${
                  isWorker ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                } font-bold text-xs flex items-center justify-center shrink-0`}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}

            {!isCollapsedDesktop && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{userName}</p>
                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{isWorker ? 'Job Seeker' : 'Verified Recruiter'}</span>
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 h-screen sticky top-0 z-30 ${
          isCollapsedDesktop ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
