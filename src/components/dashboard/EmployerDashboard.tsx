import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
import { ChangeLocationModal } from '../common/ChangeLocationModal';
import { WorkersNearMeView } from '../location/WorkersNearMeView';
import { EmployerAttendanceView } from '../attendance/EmployerAttendanceView';
import { HiringRequestsView } from '../hiring/HiringRequestsView';
import { SendHiringRequestModal } from '../hiring/SendHiringRequestModal';
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
import {
  Job,
  UserRole,
  WorkerProfile,
  SearchRadiusKm,
  BUSINESS_CATEGORIES,
  EMPLOYER_DESIGNATIONS,
  COMPANY_SIZES,
  COMPANY_REGISTRATION_TYPES,
  WORKFORCE_TYPES_OPTIONS,
  INDIAN_STATES_AND_UTS,
  INDIAN_LANGUAGES
} from '../../types';
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
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Edit3,
  Menu,
  UserCheck,
  Navigation,
  Send,
  Globe,
  Phone,
  Mail,
  Award,
  IndianRupee,
  HardHat,
  Save,
  X,
  AlertTriangle,
  Compass
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
  | 'bulk_hiring'
  | 'trust_centre'
  | 'attendance'
  | 'hiring_requests'
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
  bulk_hiring: '/findemployee/bulk-hiring',
  trust_centre: '/findemployee/trust-centre',
  attendance: '/findemployee/attendance',
  hiring_requests: '/findemployee/hiring-requests',
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
  if (clean === '/findemployee/bulk-hiring') return 'bulk_hiring';
  if (clean === '/findemployee/trust-centre') return 'trust_centre';
  if (clean === '/findemployee/attendance') return 'attendance';
  if (clean === '/findemployee/hiring-requests') return 'hiring_requests';
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
  onSwitchRole,
  onOpenAIAssistant
}) => {
  const { currentUser, userProfile, employerProfile, saveDraftEmployerProfile, logout } = useAuth();
  const {
    myJobs,
    employerApplications,
    savedCandidateIds,
    unreadNotificationsCount,
    activeConversationId,
    setActiveConversationId,
    sendHiringRequest,
    createJob
  } = useJobs();

  const [activeTab, setActiveTabState] = useState<EmployerTab>(() =>
    parseEmployerTabFromPath(window.location.pathname)
  );
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [hiringTargetWorker, setHiringTargetWorker] = useState<WorkerProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [changeLocationOpen, setChangeLocationOpen] = useState(false);
  const [locationUpdateNotice, setLocationUpdateNotice] = useState('');

  // Quick Inline Profile Editor state inside Company Profile Settings
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [isSavingQuickProfile, setIsSavingQuickProfile] = useState(false);
  const [quickSaveNotice, setQuickSaveNotice] = useState('');
  const [quickForm, setQuickForm] = useState({
    ownerName: '',
    designation: 'Owner',
    ownerPhone: '',
    ownerEmail: '',
    preferredLanguage: 'English',
    ownerContactAddress: '',
    businessName: '',
    businessCategory: 'Construction',
    yearOfEstablishment: '',
    companySize: '1–10 Employees',
    companyRegistrationType: 'Sole Proprietorship',
    documentNumber: '',
    website: '',
    businessDescription: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
    worksiteLocation: '',
    businessAddress: '',
    discoveryRadiusKm: 50 as SearchRadiusKm,
    workforceTypesNeeded: [] as string[]
  });

  // Bulk Hiring State
  const [availableWorkers, setAvailableWorkers] = useState<WorkerProfile[]>([]);
  const [selectedBulkWorkerIds, setSelectedBulkWorkerIds] = useState<string[]>([]);
  const [bulkSkillFilter, setBulkSkillFilter] = useState('');
  const [bulkJobTitle, setBulkJobTitle] = useState('');
  const [bulkWorkersCount, setBulkWorkersCount] = useState(10);
  const [bulkSalaryOffered, setBulkSalaryOffered] = useState('₹18,000 - ₹25,000 / Month');
  const [bulkWorkLocation, setBulkWorkLocation] = useState('');
  const [bulkShiftTiming, setBulkShiftTiming] = useState('Day Shift (9:00 AM - 6:00 PM)');
  const [bulkNote, setBulkNote] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

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

  // Sync quickForm whenever employerProfile or userProfile updates
  useEffect(() => {
    setQuickForm({
      ownerName: employerProfile?.ownerName || userProfile?.name || currentUser?.displayName || '',
      designation: employerProfile?.designation || 'Owner',
      ownerPhone: employerProfile?.ownerPhone || userProfile?.phone || currentUser?.phoneNumber || '',
      ownerEmail: employerProfile?.ownerEmail || userProfile?.email || currentUser?.email || '',
      preferredLanguage: employerProfile?.preferredLanguage || 'English',
      ownerContactAddress: employerProfile?.ownerContactAddress || employerProfile?.businessAddress || '',
      businessName: employerProfile?.businessName || '',
      businessCategory: employerProfile?.businessCategory || 'Construction',
      yearOfEstablishment: employerProfile?.yearOfEstablishment || '',
      companySize: employerProfile?.companySize || '1–10 Employees',
      companyRegistrationType: employerProfile?.companyRegistrationType || 'Sole Proprietorship',
      documentNumber: employerProfile?.documentNumber || '',
      website: employerProfile?.website || '',
      businessDescription: employerProfile?.businessDescription || '',
      state: employerProfile?.state || '',
      district: employerProfile?.district || '',
      city: employerProfile?.city || '',
      pincode: employerProfile?.pincode || '',
      worksiteLocation: employerProfile?.worksiteLocation || '',
      businessAddress: employerProfile?.businessAddress || '',
      discoveryRadiusKm: (employerProfile?.discoveryRadiusKm || 50) as SearchRadiusKm,
      workforceTypesNeeded:
        employerProfile?.workforceTypesNeeded && employerProfile.workforceTypesNeeded.length > 0
          ? employerProfile.workforceTypesNeeded
          : []
    });
    if (!bulkWorkLocation && (employerProfile?.city || employerProfile?.state)) {
      setBulkWorkLocation(
        [employerProfile?.worksiteLocation, employerProfile?.city, employerProfile?.state]
          .filter(Boolean)
          .join(', ')
      );
    }
    if (!bulkJobTitle && employerProfile?.labourRequirementDetails?.jobTitle) {
      setBulkJobTitle(employerProfile.labourRequirementDetails.jobTitle);
    }
  }, [employerProfile, userProfile, currentUser]);

  // Load verified workers when Bulk Hiring tab is opened
  useEffect(() => {
    if (activeTab !== 'bulk_hiring') return;
    let isMounted = true;
    const loadWorkers = async () => {
      try {
        const snap = await getDocs(collection(db, 'workerProfiles'));
        const list: WorkerProfile[] = [];
        snap.forEach((d) => {
          const data = d.data() as WorkerProfile;
          if (data && data.fullName) {
            list.push({ ...data, uid: data.uid || d.id });
          }
        });
        if (isMounted) setAvailableWorkers(list);
      } catch {
        // ignore
      }
    };
    loadWorkers();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

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

  // Truthful Verification Status
  const resolvedVerificationStatus: 'Verified' | 'Pending Verification' | 'Verification Required' =
    employerProfile?.verificationStatus === 'Verified'
      ? 'Verified'
      : employerProfile?.verificationStatus === 'Pending Verification' ||
        Boolean(employerProfile?.documentNumber || (employerProfile?.businessImages?.length || 0) > 0)
      ? 'Pending Verification'
      : 'Verification Required';

  // Comprehensive Business Profile Completion Calculation
  const calculateEmployerCompletion = (): number => {
    if (typeof employerProfile?.profileCompletionPercentage === 'number' && employerProfile.profileCompletionPercentage > 0) {
      return employerProfile.profileCompletionPercentage;
    }
    let score = 0;
    if (displayOwnerName && displayOwnerName !== 'Business Owner') score += 10;
    if (displayEmail && displayEmail !== 'Not added yet') score += 10;
    if (displayPhone && displayPhone !== 'Not added yet' && displayPhone.replace(/\D/g, '').length >= 10) score += 10;
    if (displayBusinessName.trim()) score += 20;
    if ((employerProfile?.businessImages?.length || 0) > 0 || employerProfile?.businessLogo) score += 15;
    if (employerProfile?.state && (employerProfile?.pincode || employerProfile?.city)) score += 15;
    if ((employerProfile?.workforceTypesNeeded?.length || 0) > 0 || employerProfile?.labourRequirementDetails?.jobTitle) score += 10;
    if (employerProfile?.documentNumber || employerProfile?.mobileOtpVerified) score += 10;
    return Math.min(score, 100);
  };

  const employerCompletionPercent = calculateEmployerCompletion();

  const missingEmployerFields: string[] = [];
  if (!displayPhone || displayPhone === 'Not added yet' || displayPhone.replace(/\D/g, '').length < 10) {
    missingEmployerFields.push('Mobile Number');
  }
  if (!displayBusinessName.trim()) {
    missingEmployerFields.push('Company / Business Name');
  }
  if ((employerProfile?.businessImages?.length || 0) === 0 && !employerProfile?.businessLogo) {
    missingEmployerFields.push('Company Logo / Sign Board Photo');
  }
  if (!employerProfile?.state || !employerProfile?.pincode) {
    missingEmployerFields.push('Company Location & PIN Code');
  }
  if (!employerProfile?.documentNumber) {
    missingEmployerFields.push('GSTIN / Registration Verification');
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

  const handleSaveQuickProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuickProfile(true);
    setQuickSaveNotice('');
    try {
      await saveDraftEmployerProfile({
        ownerName: quickForm.ownerName.trim(),
        designation: quickForm.designation,
        ownerPhone: quickForm.ownerPhone.trim(),
        ownerEmail: quickForm.ownerEmail.trim(),
        preferredLanguage: quickForm.preferredLanguage,
        ownerContactAddress: quickForm.ownerContactAddress.trim(),
        businessName: quickForm.businessName.trim(),
        businessCategory: quickForm.businessCategory,
        yearOfEstablishment: quickForm.yearOfEstablishment.trim(),
        companySize: quickForm.companySize,
        companyRegistrationType: quickForm.companyRegistrationType,
        documentNumber: quickForm.documentNumber.trim().toUpperCase(),
        website: quickForm.website.trim(),
        businessDescription: quickForm.businessDescription.trim(),
        state: quickForm.state,
        district: quickForm.district.trim(),
        city: quickForm.city.trim(),
        pincode: quickForm.pincode.trim(),
        worksiteLocation: quickForm.worksiteLocation.trim(),
        businessAddress: quickForm.businessAddress.trim() || quickForm.ownerContactAddress.trim(),
        discoveryRadiusKm: quickForm.discoveryRadiusKm,
        workforceTypesNeeded: quickForm.workforceTypesNeeded
      });
      setIsQuickEditing(false);
      setQuickSaveNotice('Company profile saved and synced across all devices!');
      setTimeout(() => setQuickSaveNotice(''), 4000);
    } finally {
      setIsSavingQuickProfile(false);
    }
  };

  const handleToggleBulkWorker = (uid: string) => {
    setSelectedBulkWorkerIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleDispatchBulkHiring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJobTitle.trim()) return;
    setIsSendingBulk(true);
    setBulkSuccessMsg('');
    try {
      const targetWorkers = availableWorkers.filter((w) => selectedBulkWorkerIds.includes(w.uid));
      for (const worker of targetWorkers) {
        const primaryProfession =
          worker.selectedProfessions?.[0] || worker.skills?.[0] || 'Skilled Worker';
        await sendHiringRequest({
          workerId: worker.uid,
          workerName: worker.fullName,
          workerProfession: primaryProfession,
          jobTitle: bulkJobTitle.trim(),
          offeredSalary: bulkSalaryOffered.trim() || 'Competitive Wage',
          workplaceLocation:
            bulkWorkLocation.trim() ||
            [employerProfile?.city, employerProfile?.state].filter(Boolean).join(', ') ||
            'India',
          workTimings: bulkShiftTiming.trim(),
          joiningDate: 'Immediate',
          message:
            bulkNote.trim() ||
            `Bulk hiring invitation from ${displayBusinessName || displayOwnerName} for ${bulkJobTitle.trim()} (${bulkWorkersCount} openings).`
        });
      }

      // Also create a job listing if no workers were selected
      if (targetWorkers.length === 0) {
        await createJob({
          title: `${bulkJobTitle.trim()} (Bulk Hiring - ${bulkWorkersCount} Openings)`,
          category: employerProfile?.businessCategory || 'Construction',
          description:
            bulkNote.trim() ||
            `Bulk Hiring Requisition for ${bulkWorkersCount} ${bulkJobTitle.trim()} workers at ${displayBusinessName || displayOwnerName}.`,
          requiredSkills: [bulkJobTitle.trim()],
          education: 'Secondary',
          experience: 'Fresher',
          minSalary: 15000,
          maxSalary: 30000,
          paymentFrequency: 'Per month',
          employmentType: 'Full-time',
          vacancies: bulkWorkersCount,
          state: employerProfile?.state || 'Maharashtra',
          district: employerProfile?.district || employerProfile?.city || 'Mumbai',
          city: employerProfile?.city || 'Mumbai',
          area: bulkWorkLocation.trim() || employerProfile?.businessAddress || 'Worksite Location',
          pincode: employerProfile?.pincode || '400001',
          status: 'active'
        });
      }

      setBulkSuccessMsg(
        targetWorkers.length > 0
          ? `Successfully sent Bulk Hiring Offers to ${targetWorkers.length} verified workers!`
          : `Successfully published Bulk Hiring Requisition for ${bulkWorkersCount} workers!`
      );
      setSelectedBulkWorkerIds([]);
    } finally {
      setIsSendingBulk(false);
    }
  };

  const filteredBulkWorkers = availableWorkers.filter((w) => {
    if (!bulkSkillFilter.trim()) return true;
    const q = bulkSkillFilter.toLowerCase();
    return (
      w.fullName?.toLowerCase().includes(q) ||
      w.selectedProfessions?.some((p) => p.toLowerCase().includes(q)) ||
      w.city?.toLowerCase().includes(q) ||
      w.state?.toLowerCase().includes(q) ||
      w.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  // 10 Advanced Employer Dashboard Modules
  const advancedDashboardModules: {
    id: EmployerTab;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'workers_near_me',
      title: 'Find Nearby Workers',
      subtitle: '5, 10, 25, 50 & 100 km Radar',
      icon: Navigation,
      badge: `${employerProfile?.discoveryRadiusKm || 50} KM`
    },
    {
      id: 'post_job',
      title: 'Post New Job',
      subtitle: 'Publish labour & staff openings',
      icon: PlusCircle
    },
    {
      id: 'manage_jobs',
      title: 'Manage Job Posts',
      subtitle: `${activeJobListings} active openings`,
      icon: Briefcase
    },
    {
      id: 'applications',
      title: 'View Applications',
      subtitle: `${totalApplications} candidate applications`,
      icon: FileCheck2,
      badge: newApplications > 0 ? `${newApplications} New` : undefined
    },
    {
      id: 'saved_candidates',
      title: 'Shortlist Candidates',
      subtitle: `${savedCandidateIds.length} saved profiles`,
      icon: Bookmark
    },
    {
      id: 'messages',
      title: 'Contact Workers',
      subtitle: 'Direct chat & call coordination',
      icon: MessageSquare
    },
    {
      id: 'bulk_hiring',
      title: 'Bulk Hiring',
      subtitle: 'Multi-worker site requisitions',
      icon: Users,
      badge: 'Bulk'
    },
    {
      id: 'attendance',
      title: 'Attendance Management',
      subtitle: 'GPS geofence & shift check-ins',
      icon: Clock
    },
    {
      id: 'hiring_requests',
      title: 'Hiring History',
      subtitle: 'Track sent offers & responses',
      icon: Send
    },
    {
      id: 'profile',
      title: 'Company Profile Settings',
      subtitle: `${employerCompletionPercent}% profile saved`,
      icon: Building2
    }
  ];

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
        userName={employerProfile?.businessName || employerProfile?.ownerName || userProfile?.name}
        userPhoto={employerProfile?.businessLogo || employerProfile?.ownerProfilePhoto}
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
                  {activeTab === 'overview' && 'Advanced Employer & Company Owner Dashboard'}
                  {activeTab === 'workers_near_me' && 'Find Nearby Workers (5 KM - 100 KM Radar & Map)'}
                  {activeTab === 'find_workers' && 'Find Employees (Verified Skilled & Unskilled Workforce)'}
                  {activeTab === 'bulk_hiring' && 'Bulk Hiring & Multi-Worker Workforce Requisition'}
                  {activeTab === 'trust_centre' && 'JOBSETU Employer Trust & Verification Centre'}
                  {activeTab === 'attendance' && 'Attendance Management, Geofences & Shifts'}
                  {activeTab === 'hiring_requests' && 'Hiring History & Sent Offers'}
                  {activeTab === 'post_job' && 'Post New Job'}
                  {activeTab === 'manage_jobs' && 'Manage Job Posts'}
                  {activeTab === 'applications' && 'View Candidate Applications'}
                  {activeTab === 'saved_candidates' && 'Shortlisted & Saved Candidates'}
                  {activeTab === 'messages' && 'Contact Workers & Messages'}
                  {activeTab === 'profile' && 'Company Profile Settings & Saved Details'}
                  {activeTab === 'settings' && 'Platform Settings'}
                  {activeTab === 'notifications' && 'Notifications'}
                </h1>
                <span
                  className={`hidden sm:inline-flex text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                    resolvedVerificationStatus === 'Verified'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : resolvedVerificationStatus === 'Pending Verification'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {resolvedVerificationStatus}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Build your workforce with JOBSETU INDIA — hire skilled workers within 5 to 100 km.
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
              <span>Nearby Workers</span>
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
              <span>Post New Job</span>
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
              <div className="relative rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 jobsetu-animated-gradient p-8 sm:p-10 text-white shadow-xl shadow-amber-500/10 overflow-hidden">
                <ParticleBackground count={8} dotColor="bg-white/20" />
                <MorphingAccentOrb className="w-72 h-72 -bottom-24 -left-16 bg-white/10 blur-2xl" />
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {employerProfile?.businessLogo || employerProfile?.ownerProfilePhoto ? (
                      <AnimatedImage
                        variant="circular"
                        src={employerProfile.businessLogo || employerProfile.ownerProfilePhoto || ''}
                        alt={displayBusinessName || displayOwnerName}
                        wrapperClassName="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-3 border-white/60 shadow-md bg-white"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30">
                        {(displayBusinessName || displayOwnerName || 'E').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                          {employerProfile?.designation || 'Employer'} &bull; {employerProfile?.businessCategory || 'Business Portal'}
                        </span>
                        <span className="text-[11px] font-semibold text-white flex items-center gap-1 bg-black/25 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                          {resolvedVerificationStatus}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-100 flex items-center gap-1 bg-black/15 px-2 py-0.5 rounded-full">
                          {employerCompletionPercent}% Profile Saved
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                        {displayBusinessName || `Welcome, ${displayOwnerName}!`}
                      </h1>

                      <p className="text-amber-100 text-xs sm:text-sm mt-0.5 flex flex-wrap items-center gap-2.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                          {employerProfile?.city ? `${employerProfile.city}, ` : ''}
                          {employerProfile?.state || 'India'}
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
                    <MagneticButton>
                      <RippleContainer className="rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setActiveTab('workers_near_me')}
                          className="py-2.5 px-5 rounded-2xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer jobsetu-liquid-btn"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Explore Nearby Workers</span>
                        </button>
                      </RippleContainer>
                    </MagneticButton>

                    <RippleContainer className="rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="py-2.5 px-5 rounded-2xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>View Full Profile</span>
                      </button>
                    </RippleContainer>

                    <button
                      type="button"
                      onClick={() => setChangeLocationOpen(true)}
                      className="py-2.5 px-4 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-200" />
                      <span>Change City</span>
                    </button>

                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="py-2.5 px-4 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{employerCompletionPercent < 100 ? 'Complete 11-Step Wizard' : 'Edit in Wizard'}</span>
                    </button>
                  </div>
                </div>

                {/* Profile Completion Bar inside banner */}
                <div className="relative mt-8 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      Employer Registration & Company Profile Progress
                    </span>
                    <span>{employerCompletionPercent}% Completed</span>
                  </div>
                  <AnimatedProgressBar
                    percent={employerCompletionPercent}
                    trackClassName="w-full bg-white/20 h-2.5 rounded-full overflow-hidden"
                    barClassName="bg-emerald-300 h-full rounded-full"
                  />
                </div>
              </div>

              {/* 10-MODULE ADVANCED EMPLOYER COMMAND SUITE */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900">
                      Advanced Employer Recruitment & Workforce Command Suite
                    </h2>
                    <p className="text-xs text-gray-500">
                      Instant access to all 10 employer hiring, bulk recruitment, attendance, and company profile tools.
                    </p>
                  </div>
                </div>
                <StaggeredCardContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" staggerDelay={0.05}>
                  {advancedDashboardModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <StaggeredCardItem key={mod.id}>
                        <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.1)" className="rounded-2xl h-full">
                          <button
                            type="button"
                            onClick={() => setActiveTab(mod.id)}
                            className="w-full h-full p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-amber-50/70 hover:border-amber-300 transition-all text-left group cursor-pointer flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              {mod.badge && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
                                  {mod.badge}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-gray-900 group-hover:text-amber-900">
                                {mod.title}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{mod.subtitle}</p>
                            </div>
                          </button>
                        </HoverSpotlightCard>
                      </StaggeredCardItem>
                    );
                  })}
                </StaggeredCardContainer>
              </div>

              {/* BASIC DETAILS & 100% BUSINESS PROFILE COMPLETION CARD */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-amber-200/80 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                        Saved Employer Profile Summary
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                        Status: {resolvedVerificationStatus}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-gray-900 mt-1">
                      Saved Owner & Company Details &bull; {employerCompletionPercent}% Completed
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChangeLocationOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      <span>Relocate / Change City</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open Full Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {employerCompletionPercent < 100
                          ? 'Resume 11-Step Registration'
                          : 'Update in Registration Wizard'}
                      </span>
                    </button>
                  </div>
                </div>

                {locationUpdateNotice && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      {locationUpdateNotice}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLocationUpdateNotice('')}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Basic Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Owner / Employer Name
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                      {displayOwnerName} ({employerProfile?.designation || 'Owner'})
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Company / Business Name
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                      {displayBusinessName || 'Not added yet'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Category & Size
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                      {employerProfile?.businessCategory || 'Not set'} &bull;{' '}
                      {employerProfile?.companySize || '1–10 Employees'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Mobile & Email
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block truncate">
                      {displayPhone} &bull; {displayEmail}
                    </span>
                  </div>
                </div>

                {missingEmployerFields.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-950 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Complete your remaining employer details to reach 100%!</span>
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Everything you entered before clicking Save & Exit is safely stored. Remaining items:{' '}
                        <strong>{missingEmployerFields.join(', ')}</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start md:self-center"
                    >
                      <span>Continue Registration</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Spotlight Banner: People Who Want to Join You */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-blue-500/30 jobsetu-neon-glow">
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
                      <NumberCounter value={totalApplications} />
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                    {newApplications > 0 ? (
                      <span>
                        <strong className="text-emerald-300 font-bold">
                          {newApplications} new candidate{newApplications === 1 ? '' : 's'}
                        </strong>{' '}
                        waiting for your interview screening and review.
                      </span>
                    ) : totalApplications > 0 ? (
                      <span>All {totalApplications} applications have been reviewed. Check your shortlisted pool.</span>
                    ) : (
                      <span>
                        No applications received yet. Discover verified candidates within 50 km or launch a Bulk Hiring requisition!
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <RippleContainer className="rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('applications')}
                      className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer jobsetu-liquid-btn"
                    >
                      <UserCheck className="w-4 h-4 text-slate-950" />
                      <span>View Applications ({totalApplications})</span>
                    </button>
                  </RippleContainer>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bulk_hiring')}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Bulk Hiring</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <StaggeredCardContainer className="grid grid-cols-2 sm:grid-cols-5 gap-4" staggerDelay={0.06}>
                <StaggeredCardItem>
                  <TiltCard3D maxTilt={4} className="h-full">
                    <HoverSpotlightCard className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                      <span className="text-2xl font-black text-gray-900 block">
                        <NumberCounter value={activeJobListings} />
                      </span>
                      <span className="text-xs font-semibold text-gray-500 mt-1 block">Active Job Listings</span>
                    </HoverSpotlightCard>
                  </TiltCard3D>
                </StaggeredCardItem>

                <StaggeredCardItem>
                  <TiltCard3D maxTilt={4} className="h-full">
                    <HoverSpotlightCard className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                      <span className="text-2xl font-black text-[#2563EB] block">
                        <NumberCounter value={totalApplications} />
                      </span>
                      <span className="text-xs font-semibold text-gray-500 mt-1 block">Total Applications</span>
                    </HoverSpotlightCard>
                  </TiltCard3D>
                </StaggeredCardItem>

                <StaggeredCardItem>
                  <TiltCard3D maxTilt={4} className="h-full">
                    <HoverSpotlightCard spotlightColor="rgba(16, 185, 129, 0.1)" className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                      <span className="text-2xl font-black text-emerald-600 block">
                        <NumberCounter value={newApplications} />
                      </span>
                      <span className="text-xs font-semibold text-gray-500 mt-1 block">New Unreviewed</span>
                    </HoverSpotlightCard>
                  </TiltCard3D>
                </StaggeredCardItem>

                <StaggeredCardItem>
                  <TiltCard3D maxTilt={4} className="h-full">
                    <HoverSpotlightCard spotlightColor="rgba(147, 51, 234, 0.1)" className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                      <span className="text-2xl font-black text-purple-600 block">
                        <NumberCounter value={shortlistedCandidates} />
                      </span>
                      <span className="text-xs font-semibold text-gray-500 mt-1 block">Shortlisted / Interviews</span>
                    </HoverSpotlightCard>
                  </TiltCard3D>
                </StaggeredCardItem>

                <StaggeredCardItem>
                  <TiltCard3D maxTilt={4} className="h-full">
                    <HoverSpotlightCard className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 h-full">
                      <span className="text-2xl font-black text-slate-700 block">
                        <NumberCounter value={filledPositions} />
                      </span>
                      <span className="text-xs font-semibold text-gray-500 mt-1 block">Filled Positions</span>
                    </HoverSpotlightCard>
                  </TiltCard3D>
                </StaggeredCardItem>
              </StaggeredCardContainer>

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
                          <span className="font-bold text-gray-800 truncate max-w-[150px]">{j.title}</span>
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
                      <span>Post New Job</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('manage_jobs')}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Manage Job Posts ({myJobs.length})
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

          {/* TAB: BULK HIRING */}
          {activeTab === 'bulk_hiring' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      Enterprise & Contractor Bulk Recruitment
                    </span>
                    <h2 className="text-2xl font-black mt-2">
                      Bulk Hiring & Multi-Worker Workforce Requisition
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                      Select multiple verified workers from the directory below to dispatch simultaneous hiring offers, or publish a high-volume workforce requisition for your factory, construction site, or enterprise.
                    </p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Selected Workers</span>
                    <span className="text-2xl font-black text-amber-400">{selectedBulkWorkerIds.length}</span>
                  </div>
                </div>
              </div>

              {bulkSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {bulkSuccessMsg}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkSuccessMsg('')}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bulk Requisition Form */}
                <form
                  onSubmit={handleDispatchBulkHiring}
                  className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4 h-fit"
                >
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    <span>Bulk Hiring Offer Configuration</span>
                  </h3>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Job Title / Trade Role *
                    </label>
                    <input
                      type="text"
                      required
                      value={bulkJobTitle}
                      onChange={(e) => setBulkJobTitle(e.target.value)}
                      placeholder="e.g., Construction Mason, Electrician, Factory Helper"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Number of Workers Required *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      required
                      value={bulkWorkersCount}
                      onChange={(e) => setBulkWorkersCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Wage / Salary Package Offered *
                    </label>
                    <input
                      type="text"
                      required
                      value={bulkSalaryOffered}
                      onChange={(e) => setBulkSalaryOffered(e.target.value)}
                      placeholder="e.g., ₹800/Day or ₹22,000/Month + Overtime"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Worksite Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={bulkWorkLocation}
                      onChange={(e) => setBulkWorkLocation(e.target.value)}
                      placeholder="City, Industrial Area, State"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Shift Timings & Facilities
                    </label>
                    <input
                      type="text"
                      value={bulkShiftTiming}
                      onChange={(e) => setBulkShiftTiming(e.target.value)}
                      placeholder="e.g., 9 AM - 6 PM • Food & Accommodation Provided"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Additional Bulk Hiring Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={bulkNote}
                      onChange={(e) => setBulkNote(e.target.value)}
                      placeholder="Describe immediate joining dates, accommodation/food arrangements, safety gear, or contractor contact details..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingBulk}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSendingBulk
                        ? 'Dispatching Bulk Offers...'
                        : selectedBulkWorkerIds.length > 0
                        ? `Send Bulk Offer to ${selectedBulkWorkerIds.length} Workers`
                        : `Publish Bulk Requisition (${bulkWorkersCount} Workers)`}
                    </span>
                  </button>
                </form>

                {/* Multi-Select Worker Roster for Bulk Hiring */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">
                        Select Workers for Direct Bulk Outreach ({filteredBulkWorkers.length} Available)
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Check multiple workers to invite them simultaneously, or click "Select All Visible".
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={bulkSkillFilter}
                        onChange={(e) => setBulkSkillFilter(e.target.value)}
                        placeholder="Filter by skill or city..."
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBulkWorkerIds.length === filteredBulkWorkers.length) {
                            setSelectedBulkWorkerIds([]);
                          } else {
                            setSelectedBulkWorkerIds(filteredBulkWorkers.map((w) => w.uid));
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer shrink-0"
                      >
                        {selectedBulkWorkerIds.length === filteredBulkWorkers.length && filteredBulkWorkers.length > 0
                          ? 'Clear Selection'
                          : 'Select All'}
                      </button>
                    </div>
                  </div>

                  {filteredBulkWorkers.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold text-gray-600">No matching workers found</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        You can still submit the Bulk Hiring form on the left to publish a bulk job opening!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                      {filteredBulkWorkers.map((worker) => {
                        const isSelected = selectedBulkWorkerIds.includes(worker.uid);
                        const primaryRole =
                          worker.selectedProfessions?.[0] || worker.skills?.[0] || 'Skilled Worker';
                        return (
                          <div
                            key={worker.uid}
                            onClick={() => handleToggleBulkWorker(worker.uid)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                                : 'bg-slate-50/70 border-slate-200/80 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-gray-900 truncate">
                                  {worker.fullName}
                                </p>
                                <p className="text-[11px] font-bold text-amber-700 truncate">
                                  {primaryRole} &bull; {worker.experience || 'Experienced'}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                  {worker.city ? `${worker.city}, ` : ''}
                                  {worker.state || 'India'} &bull;{' '}
                                  {worker.jobPreferences?.expectedSalary || 'Negotiable'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                worker.jobPreferences?.availability === 'Immediate'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {worker.jobPreferences?.availability || 'Immediate'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
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

          {/* TAB 8: COMPANY PROFILE SETTINGS & COMPLETE SAVED EMPLOYER PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              {quickSaveNotice && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {quickSaveNotice}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuickSaveNotice('')}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-5">
                    {employerProfile?.businessLogo || employerProfile?.ownerProfilePhoto ? (
                      <img
                        src={employerProfile.businessLogo || employerProfile.ownerProfilePhoto}
                        alt={displayBusinessName || displayOwnerName}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-white"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-800 font-black text-2xl flex items-center justify-center border border-amber-200">
                        {(displayBusinessName || displayOwnerName || 'E').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            resolvedVerificationStatus === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : resolvedVerificationStatus === 'Pending Verification'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {resolvedVerificationStatus}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {employerCompletionPercent}% Profile Completed
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900">
                        {displayBusinessName || displayOwnerName}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-700">
                          {displayOwnerName} ({employerProfile?.designation || 'Owner'})
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {employerProfile?.city ? `${employerProfile.city}, ` : ''}
                          {employerProfile?.state || 'India'}{' '}
                          {employerProfile?.pincode ? `(${employerProfile.pincode})` : ''}
                        </span>
                        <span>&bull;</span>
                        <span>{displayEmail}</span>
                        <span>&bull;</span>
                        <span>{displayPhone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setChangeLocationOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-amber-600" />
                      <span>Change City</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsQuickEditing(!isQuickEditing)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isQuickEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-amber-400" />}
                      <span>{isQuickEditing ? 'Close Quick Edit' : 'Quick Edit Here'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {employerCompletionPercent < 100
                          ? 'Open 11-Step Registration Wizard'
                          : 'Edit Full 11-Step Wizard'}
                      </span>
                    </button>
                  </div>
                </div>

                {locationUpdateNotice && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      {locationUpdateNotice}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLocationUpdateNotice('')}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* INLINE QUICK EDIT FORM (Immediately saves to Firestore & localStorage) */}
                {isQuickEditing && (
                  <form
                    onSubmit={handleSaveQuickProfile}
                    className="p-6 rounded-2xl bg-amber-50/60 border-2 border-amber-200 space-y-5 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-gray-900">
                          Instant Company & Owner Profile Editor
                        </h3>
                        <p className="text-[11px] text-gray-600">
                          Changes made here are saved immediately to your JOBSETU Employer account across all devices.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingQuickProfile}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingQuickProfile ? 'Saving...' : 'Save Changes Now'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Owner Full Name</label>
                        <input
                          type="text"
                          value={quickForm.ownerName}
                          onChange={(e) => setQuickForm({ ...quickForm, ownerName: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Designation</label>
                        <select
                          value={quickForm.designation}
                          onChange={(e) => setQuickForm({ ...quickForm, designation: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        >
                          {EMPLOYER_DESIGNATIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Mobile Number</label>
                        <input
                          type="text"
                          value={quickForm.ownerPhone}
                          onChange={(e) => setQuickForm({ ...quickForm, ownerPhone: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={quickForm.ownerEmail}
                          onChange={(e) => setQuickForm({ ...quickForm, ownerEmail: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Preferred Language</label>
                        <select
                          value={quickForm.preferredLanguage}
                          onChange={(e) => setQuickForm({ ...quickForm, preferredLanguage: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        >
                          {INDIAN_LANGUAGES.map((lang: string) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Company / Business Name
                        </label>
                        <input
                          type="text"
                          value={quickForm.businessName}
                          onChange={(e) => setQuickForm({ ...quickForm, businessName: e.target.value })}
                          placeholder="Enter Company or Business Name"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Business Category</label>
                        <select
                          value={quickForm.businessCategory}
                          onChange={(e) => setQuickForm({ ...quickForm, businessCategory: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        >
                          {BUSINESS_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Company Size</label>
                        <select
                          value={quickForm.companySize}
                          onChange={(e) => setQuickForm({ ...quickForm, companySize: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        >
                          {COMPANY_SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Registration Type</label>
                        <select
                          value={quickForm.companyRegistrationType}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, companyRegistrationType: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        >
                          {COMPANY_REGISTRATION_TYPES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          GSTIN (If applicable)
                        </label>
                        <input
                          type="text"
                          value={quickForm.documentNumber}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, documentNumber: e.target.value.toUpperCase() })
                          }
                          placeholder="15-Digit GSTIN"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">State</label>
                        <select
                          value={quickForm.state}
                          onChange={(e) => setQuickForm({ ...quickForm, state: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES_AND_UTS.map((st: string) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">City / Village</label>
                        <input
                          type="text"
                          value={quickForm.city}
                          onChange={(e) => setQuickForm({ ...quickForm, city: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">PIN Code</label>
                        <input
                          type="text"
                          value={quickForm.pincode}
                          onChange={(e) => setQuickForm({ ...quickForm, pincode: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Complete Business / Worksite Address
                        </label>
                        <input
                          type="text"
                          value={quickForm.businessAddress}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              businessAddress: e.target.value,
                              ownerContactAddress: e.target.value
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Business Description
                        </label>
                        <textarea
                          rows={2}
                          value={quickForm.businessDescription}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, businessDescription: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsQuickEditing(false)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingQuickProfile}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        {isSavingQuickProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>
                )}

                {/* SECTION 1: OWNER INFORMATION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>1. Owner & Authorized Representative Information</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Full Name</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {displayOwnerName}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Designation</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.designation || 'Owner'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Mobile Number</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        {displayPhone}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{displayEmail}</span>
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Preferred Language</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.preferredLanguage || 'English'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Contact Address</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.ownerContactAddress || employerProfile?.businessAddress || 'Not added yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: COMPANY INFORMATION */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>2. Company & Enterprise Information</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Company / Business Name
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {displayBusinessName || 'Not added yet'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Business Category</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.businessCategory || 'Construction'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Year of Establishment & Size
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.yearOfEstablishment || 'Est. N/A'} &bull;{' '}
                        {employerProfile?.companySize || '1–10 Employees'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Company Registration Type
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.companyRegistrationType || 'Sole Proprietorship'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        GSTIN / Document Number
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block font-mono">
                        {employerProfile?.documentNumber || 'Not added yet'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Company Website</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
                        <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{employerProfile?.website || 'Not provided'}</span>
                      </span>
                    </div>
                  </div>

                  {employerProfile?.businessDescription && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Business Description & Operations
                      </span>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {employerProfile.businessDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* SECTION 3: COMPANY LOCATION & DISCOVERY RADIUS */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>3. Company Location, Worksite & Discovery Radius</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Country & State</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.country || 'India'} &bull; {employerProfile?.state || 'Not set'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        District & City / Village
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {[employerProfile?.district, employerProfile?.city].filter(Boolean).join(', ') || 'Not set'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">PIN Code</span>
                      <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                        {employerProfile?.pincode || 'Not set'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Worker Discovery Radius
                      </span>
                      <span className="text-sm font-extrabold text-amber-700 mt-1 block">
                        {employerProfile?.discoveryRadiusKm || 50} KM Radius
                      </span>
                    </div>
                  </div>

                  {employerProfile?.multipleWorkLocations && employerProfile.multipleWorkLocations.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Additional Work Locations / Branches ({employerProfile.multipleWorkLocations.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {employerProfile.multipleWorkLocations.map((b) => (
                          <span
                            key={b.id}
                            className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-gray-800"
                          >
                            {b.name}: {b.address}, {b.city} {b.pincode && `(${b.pincode})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: WORKFORCE REQUIREMENTS & LABOUR DETAILS */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    <span>4. Workforce Requirements & Labour Details</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                      Workforce Types Looking For
                    </span>
                    {employerProfile?.workforceTypesNeeded && employerProfile.workforceTypesNeeded.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {employerProfile.workforceTypesNeeded.map((wt) => (
                          <span
                            key={wt}
                            className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold"
                          >
                            {wt}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {WORKFORCE_TYPES_OPTIONS.slice(0, 3).join(', ')} (Default)
                      </span>
                    )}
                  </div>

                  {employerProfile?.labourRequirementDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          Primary Job Title & Category
                        </span>
                        <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                          {employerProfile.labourRequirementDetails.jobTitle || 'Not specified'} (
                          {employerProfile.labourRequirementDetails.workerCategory || 'Skilled'})
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          Workers Required
                        </span>
                        <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                          {employerProfile.labourRequirementDetails.workersRequiredCount || 1} Workers
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          Experience & Education
                        </span>
                        <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                          {employerProfile.labourRequirementDetails.minimumExperience || 'Any'} &bull;{' '}
                          {employerProfile.labourRequirementDetails.educationQualification || 'Any'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          Joining & Duration
                        </span>
                        <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                          {employerProfile.labourRequirementDetails.preferredJoiningDate || 'Immediate'} &bull;{' '}
                          {employerProfile.labourRequirementDetails.jobDuration || 'Permanent'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 5: SALARY, BENEFITS, WORKING CONDITIONS & HIRING PREFERENCES */}
                {(employerProfile?.salaryAndBenefits ||
                  employerProfile?.workingConditions ||
                  employerProfile?.hiringPreferences) && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-amber-600" />
                      <span>5. Salary, Benefits, Working Conditions & Hiring Preferences</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {employerProfile.salaryAndBenefits && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Compensation & Benefits
                          </span>
                          <p className="text-sm font-extrabold text-gray-900">
                            ₹{employerProfile.salaryAndBenefits.minSalary?.toLocaleString('en-IN')} - ₹
                            {employerProfile.salaryAndBenefits.maxSalary?.toLocaleString('en-IN')} (
                            {employerProfile.salaryAndBenefits.paymentMode})
                          </p>
                          <p className="text-[11px] text-gray-600">
                            Frequency: {employerProfile.salaryAndBenefits.paymentFrequency}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {employerProfile.salaryAndBenefits.overtimeAvailable && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Overtime
                              </span>
                            )}
                            {employerProfile.salaryAndBenefits.foodFacility !== 'Not Provided' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Food: {employerProfile.salaryAndBenefits.foodFacility}
                              </span>
                            )}
                            {employerProfile.salaryAndBenefits.accommodationFacility !== 'Not Provided' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Stay: {employerProfile.salaryAndBenefits.accommodationFacility}
                              </span>
                            )}
                            {employerProfile.salaryAndBenefits.transportationFacility !== 'Not Provided' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Transport: {employerProfile.salaryAndBenefits.transportationFacility}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {employerProfile.workingConditions && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Working Conditions & Shifts
                          </span>
                          <p className="text-sm font-extrabold text-gray-900">
                            {employerProfile.workingConditions.dailyWorkingHours} &bull;{' '}
                            {employerProfile.workingConditions.shiftTimings}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            Holiday: {employerProfile.workingConditions.weeklyHolidays} &bull; Env:{' '}
                            {employerProfile.workingConditions.workEnvironment}
                          </p>
                        </div>
                      )}

                      {employerProfile.hiringPreferences && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            Hiring Preferences
                          </span>
                          <p className="text-sm font-extrabold text-gray-900">
                            {employerProfile.hiringPreferences.hiringScale} &bull;{' '}
                            {employerProfile.hiringPreferences.hiringUrgency}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            Contract: {employerProfile.hiringPreferences.employmentNature} &bull; Max Radius:{' '}
                            {employerProfile.hiringPreferences.maxSearchRadiusKm} KM
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 6: EMPLOYER VERIFICATION & UPLOADED BUSINESS IMAGES */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>6. Employer Verification Status & Uploaded Documents</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {resolvedVerificationStatus === 'Verified' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        <span className="text-xs font-black text-gray-900">
                          Current Verification Status: {resolvedVerificationStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        Mobile OTP: {employerProfile?.mobileOtpVerified ? 'Verified' : 'Pending'} &bull; Email:{' '}
                        {employerProfile?.emailVerified ? 'Verified' : 'Pending'} &bull; GSTIN:{' '}
                        {employerProfile?.gstinVerified
                          ? 'Verified'
                          : employerProfile?.documentNumber
                          ? 'Submitted for Verification'
                          : 'Not Provided'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('trust_centre')}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Open Trust & Verification Centre
                    </button>
                  </div>

                  {employerProfile?.businessImages && employerProfile.businessImages.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                        Uploaded Business / Sign Board Photos ({employerProfile.businessImages.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {employerProfile.businessImages.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt={`Business Photo ${idx + 1}`}
                            className="w-full h-28 object-cover rounded-2xl border border-gray-200 shadow-xs"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: WORKERS NEAR ME (5 KM - 100 KM Radar & Map) */}
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

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in">
              <SettingsView
                role="employer"
                userName={employerProfile?.businessName || employerProfile?.ownerName || userProfile?.name}
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

          {/* Change City / Relocation Modal */}
          <ChangeLocationModal
            isOpen={changeLocationOpen}
            onClose={() => setChangeLocationOpen(false)}
            role="employer"
            onLocationUpdated={(summary) =>
              setLocationUpdateNotice(
                `Worksite location changed to ${summary}. Nearby worker discovery radar updated!`
              )
            }
          />
        </div>
      </div>
    </div>
  );
};


