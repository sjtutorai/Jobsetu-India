import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JobProvider, useJobs } from './context/JobContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/home/Hero';
import { StatsSection, HowItWorksSection, SkillCategoriesShowcase } from './components/home/HomeSections';
import { TopCompaniesSection } from './components/companies/TopCompaniesSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { WorkerOnboarding } from './components/onboarding/WorkerOnboarding';
import { EmployerOnboarding } from './components/onboarding/EmployerOnboarding';
import { WorkerDashboard } from './components/dashboard/WorkerDashboard';
import { EmployerDashboard } from './components/dashboard/EmployerDashboard';
import { ContentModals, ModalType } from './components/modals/ContentModals';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { JobsNearMeView } from './components/location/JobsNearMeView';
import { JobDetailModal } from './components/jobs/JobDetailModal';
import { Job, UserRole } from './types';
import { fireCelebrationConfetti } from './lib/confetti';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { AIAssistantModal } from './components/common/AIAssistantModal';
import { Shield, MapPin, Navigation, X, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { executeRecaptchaEnterprise } from './lib/recaptcha';
import { MotionConfig, motion } from 'motion/react';
import {
  GlobalCursorEffects,
  PageTransitionWrapper,
  PageTransitionKind,
  AnimatedImage,
  ScrambleText,
  TypewriterText,
  AnimatedSVGDrawLine,
  MagneticButton,
  RippleContainer
} from './components/animations';

type AppView = 'home' | '50km-radius' | 'worker-onboarding' | 'employer-onboarding' | 'dashboard' | 'admin';

const VIEW_TRANSITION_KIND: Record<AppView, PageTransitionKind> = {
  home: 'fade',
  '50km-radius': 'zoomThrough',
  'worker-onboarding': 'circularReveal',
  'employer-onboarding': 'verticalCurtain',
  dashboard: 'horizontalSlide',
  admin: 'blur'
};

const MODAL_PATHS: Record<ModalType, string> = {
  about: '/about',
  'how-it-works': '/how-it-works',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  help: '/help'
};

const PATH_TO_MODAL: Record<string, ModalType> = {
  '/about': 'about',
  '/how-it-works': 'how-it-works',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/help': 'help'
};

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected display error occurred.'
    };
  }

  componentDidCatch(error: Error) {
    console.error('JOBSETU UI ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Display Recovery Needed</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We caught an unexpected screen error while loading this view ({this.state.errorMessage}). Your profile and saved data are completely safe.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.history.pushState(null, '', '/');
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload JOBSETU</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Try Returning Back
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const {
    currentUser,
    userProfile,
    workerProfile,
    employerProfile,
    loading,
    intendedRole,
    setIntendedRole,
    switchActiveRole,
    enableAdditionalRole
  } = useAuth();
  const {
    savedJobIds,
    myApplications,
    applyToJob,
    toggleSaveJob,
    reportItem
  } = useJobs();

  const [view, setView] = useState<AppView>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [locationDeniedBanner, setLocationDeniedBanner] = useState(false);
  const [publicSelectedJob, setPublicSelectedJob] = useState<Job | null>(null);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<number>(1);

  // Execute reCAPTCHA Enterprise assessment on app initialization to verify token & update request.json
  useEffect(() => {
    executeRecaptchaEnterprise('LOGIN').catch(() => {});
  }, []);

  const requestUserLocationPermission = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationDeniedBanner(false);
        try {
          localStorage.setItem(
            'jobsetu_detected_coords',
            JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          );
        } catch {
          // ignore
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDeniedBanner(true);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Request browser geolocation permission immediately after login or when starting onboarding or 50km-radius
  useEffect(() => {
    const isOnboardingOrRadar =
      view === 'worker-onboarding' || view === 'employer-onboarding' || view === '50km-radius';
    if (currentUser || isOnboardingOrRadar) {
      requestUserLocationPermission();
    }
  }, [currentUser, view]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Route navigator with browser history pushState
  const navigateTo = (
    path: string,
    newView: AppView,
    role?: UserRole,
    options?: { initialStep?: number }
  ) => {
    if (options?.initialStep !== undefined) {
      setOnboardingInitialStep(options.initialStep);
    } else if (newView === 'worker-onboarding' || newView === 'employer-onboarding') {
      setOnboardingInitialStep(1);
    }
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    if (role) {
      setIntendedRole(role);
      if (userProfile?.activeRole !== role) {
        switchActiveRole(role).catch(() => {});
      }
    }
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const openAuthWithRoute = (role?: UserRole, mode: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthInitialRole(role);
    setAuthMode(mode);
    setAuthModalOpen(true);
    const targetPath = mode === 'signup' ? '/signup' : mode === 'forgot' ? '/forgot-password' : '/signin';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
    const path = window.location.pathname;
    if (path === '/signin' || path === '/signup' || path === '/forgot-password') {
      const fallbackPath = view === '50km-radius' ? '/50km-radius' : '/';
      window.history.pushState(null, '', fallbackPath);
    }
  };

  const handleOpenContentModal = (type: ModalType) => {
    setActiveModal(type);
    const targetPath = MODAL_PATHS[type];
    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleCloseContentModal = () => {
    setActiveModal(null);
    const path = window.location.pathname;
    if (PATH_TO_MODAL[path]) {
      const fallbackPath =
        view === '50km-radius'
          ? '/50km-radius'
          : currentUser
            ? (userProfile?.activeRole === 'employer' ? '/findemployee' : '/jobfinder')
            : '/';
      window.history.pushState(null, '', fallbackPath);
    }
  };

  const handleOpenAIAssistant = () => {
    setAiModalOpen(true);
    if (window.location.pathname !== '/ai-assistant') {
      window.history.pushState(null, '', '/ai-assistant');
    }
  };

  const handleCloseAIAssistant = () => {
    setAiModalOpen(false);
    if (window.location.pathname === '/ai-assistant') {
      const fallbackPath =
        view === '50km-radius'
          ? '/50km-radius'
          : currentUser
            ? (userProfile?.activeRole === 'employer' ? '/findemployee' : '/jobfinder')
            : '/';
      window.history.pushState(null, '', fallbackPath);
    }
  };

  const handleOpen50KmRadius = () => {
    if (currentUser) {
      const role = userProfile?.activeRole || intendedRole || 'worker';
      if (role === 'worker') {
        navigateTo('/jobfinder/50km-radius', 'dashboard', 'worker');
      } else {
        navigateTo('/findemployee/50km-radius', 'dashboard', 'employer');
      }
    } else {
      navigateTo('/50km-radius', '50km-radius');
    }
  };

  // Synchronize on mount and browser back/forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;

      if (path === '/signin') {
        if (currentUser) {
          const role = userProfile?.activeRole || intendedRole || 'worker';
          navigateTo(
            role === 'worker' ? '/jobfinder' : '/findemployee',
            'dashboard',
            role
          );
        } else {
          setView('home');
          setAuthMode('signin');
          setAuthInitialRole(undefined);
          setAuthModalOpen(true);
        }
        return;
      }

      if (path === '/signup') {
        if (currentUser) {
          const role = userProfile?.activeRole || intendedRole || 'worker';
          navigateTo(
            role === 'worker' ? '/jobfinder' : '/findemployee',
            'dashboard',
            role
          );
        } else {
          setView('home');
          setAuthMode('signup');
          setAuthModalOpen(true);
        }
        return;
      }

      if (path === '/forgot-password') {
        setView('home');
        setAuthMode('forgot');
        setAuthModalOpen(true);
        return;
      }

      if (PATH_TO_MODAL[path]) {
        setActiveModal(PATH_TO_MODAL[path]);
        return;
      }

      if (path === '/ai-assistant') {
        setAiModalOpen(true);
        return;
      }

      if (path === '/50km-radius') {
        if (currentUser) {
          const role = userProfile?.activeRole || intendedRole || 'worker';
          navigateTo(
            role === 'worker' ? '/jobfinder/50km-radius' : '/findemployee/50km-radius',
            'dashboard',
            role
          );
        } else {
          setView('50km-radius');
        }
        return;
      }

      if (path === '/worker-onboarding') {
        setIntendedRole('worker');
        if (currentUser) {
          setView('worker-onboarding');
        } else {
          setView('home');
          openAuthWithRoute('worker', 'signup');
        }
        return;
      }

      if (path === '/employer-onboarding') {
        setIntendedRole('employer');
        if (currentUser) {
          setView('employer-onboarding');
        } else {
          setView('home');
          openAuthWithRoute('employer', 'signup');
        }
        return;
      }

      if (path === '/jobfinder' || path.startsWith('/jobfinder/')) {
        if (currentUser) {
          // Respect user's saved role if they haven't explicitly enabled worker role
          if (userProfile && userProfile.activeRole === 'employer' && !userProfile.enabledRoles?.includes('worker')) {
            navigateTo('/findemployee', 'dashboard', 'employer');
            return;
          }
          setIntendedRole('worker');
          switchActiveRole('worker').catch(() => {});
          setView('dashboard');
        } else {
          setIntendedRole('worker');
          setView('home');
          setAuthInitialRole('worker');
          setAuthMode('signin');
          setAuthModalOpen(true);
        }
      } else if (path === '/findemployee' || path.startsWith('/findemployee/')) {
        if (currentUser) {
          if (userProfile && userProfile.activeRole === 'worker' && !userProfile.enabledRoles?.includes('employer')) {
            navigateTo('/jobfinder', 'dashboard', 'worker');
            return;
          }
          setIntendedRole('employer');
          switchActiveRole('employer').catch(() => {});
          setView('dashboard');
        } else {
          setIntendedRole('employer');
          setView('home');
          setAuthInitialRole('employer');
          setAuthMode('signin');
          setAuthModalOpen(true);
        }
      } else if (path === '/admin') {
        setView('admin');
      } else if (path === '/' || path === '') {
        if (currentUser) {
          const role = userProfile?.activeRole || intendedRole || 'worker';
          navigateTo(
            role === 'worker' ? '/jobfinder' : '/findemployee',
            'dashboard',
            role
          );
        } else {
          setView('home');
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentUser, userProfile, workerProfile, employerProfile, intendedRole]);

  const handleSelectRoleFromHome = (role: UserRole) => {
    setIntendedRole(role);
    setAuthInitialRole(role);

    if (!currentUser) {
      openAuthWithRoute(role, 'signup');
    } else {
      // User is logged in
      if (role === 'worker') {
        switchActiveRole('worker').then(() => {
          navigateTo('/jobfinder', 'dashboard', 'worker');
          addToast('info', 'Switched to Job Seeker Hub');
        });
      } else {
        switchActiveRole('employer').then(() => {
          navigateTo('/findemployee', 'dashboard', 'employer');
          addToast('info', 'Switched to Employer Hub');
        });
      }
    }
  };

  const handleAuthSuccess = (selectedRole: UserRole, isNewSignup?: boolean) => {
    const resolvedRole = userProfile?.activeRole || selectedRole;
    if (isNewSignup) {
      addToast(
        'success',
        resolvedRole === 'employer'
          ? 'Account created for Finding Labours / Staff! Complete your business profile or save & exit anytime.'
          : 'Account created for Finding Jobs! Complete your 100% profile to unlock the best jobs in India.',
        'Account Created'
      );
      if (resolvedRole === 'worker') {
        navigateTo('/worker-onboarding', 'worker-onboarding', 'worker');
      } else {
        navigateTo('/employer-onboarding', 'employer-onboarding', 'employer');
      }
    } else {
      addToast('success', 'Welcome back to JOBSETU!', 'Signed In');
      if (resolvedRole === 'worker') {
        navigateTo('/jobfinder', 'dashboard', 'worker');
      } else {
        navigateTo('/findemployee', 'dashboard', 'employer');
      }
    }
  };

  const handleWorkerOnboardingComplete = () => {
    fireCelebrationConfetti();
    addToast('success', 'Your worker profile is active and visible to verified employers across India!', 'Profile Saved');
    navigateTo('/jobfinder', 'dashboard', 'worker');
  };

  const handleEmployerOnboardingComplete = () => {
    fireCelebrationConfetti();
    addToast('success', 'Your business registration has been submitted for audit. Verification pending review.', 'Employer Profile Created');
    navigateTo('/findemployee', 'dashboard', 'employer');
  };

  const handleActivateEmployer = async () => {
    await enableAdditionalRole('employer');
    if (!employerProfile) {
      navigateTo('/employer-onboarding', 'employer-onboarding', 'employer');
      addToast('info', 'Please complete your business details to start recruiting.');
    } else {
      navigateTo('/findemployee', 'dashboard', 'employer');
      addToast('success', 'Employer Mode Activated!');
    }
  };

  const handleActivateWorker = async () => {
    await enableAdditionalRole('worker');
    if (!workerProfile) {
      navigateTo('/worker-onboarding', 'worker-onboarding', 'worker');
      addToast('info', 'Please complete your vocational details to seek employment.');
    } else {
      navigateTo('/jobfinder', 'dashboard', 'worker');
      addToast('success', 'Job Seeker Mode Activated!');
    }
  };

  const handleSwitchRole = async (targetRole: UserRole) => {
    try {
      await switchActiveRole(targetRole);
      if (targetRole === 'worker') {
        navigateTo('/jobfinder', 'dashboard', 'worker');
      } else {
        navigateTo('/findemployee', 'dashboard', 'employer');
      }
      addToast('info', `Switched to ${targetRole === 'worker' ? 'Job Seeker' : 'Employer'} Hub`);
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AnimatedImage
          variant="morphTransition"
          src="https://i.ibb.co/jv67DNGx/Jobsetulogo.png"
          alt="JOBSETU Logo"
          className="w-20 h-20 rounded-2xl object-contain bg-white border border-gray-100 shadow-xl shadow-blue-500/15 p-2 mb-4 jobsetu-float-3d"
        />
        <p className="text-sm font-extrabold text-gray-800 tracking-tight">
          <ScrambleText text="JOB" />
          <span className="text-[#2563EB]">
            <ScrambleText text="SETU" delay={0.15} />
          </span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <TypewriterText text="Connecting People. Creating Opportunities." speedMs={22} />
        </p>
        <AnimatedSVGDrawLine className="w-40 h-4 mt-2" />
      </div>
    );
  }

  const activeRole = userProfile?.activeRole || intendedRole || 'worker';

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827] relative">
      {/* Desktop Cursor Spotlight & Custom Animated Cursor */}
      <GlobalCursorEffects />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Non-intrusive Location Permission Denied Banner */}
      {locationDeniedBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 z-50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Location access is off:</strong> Enable browser/mobile location permissions so JOBSETU can match you with verified nearby jobs and workers within 50 km, or select your pin directly on the Indian map.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={requestUserLocationPermission}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Navigation className="w-3 h-3" />
              <span>Retry Location Access</span>
            </button>
            <button
              type="button"
              onClick={() => setLocationDeniedBanner(false)}
              className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Top Navbar (Shown before login on home or public 50km-radius page) */}
      {!currentUser && (view === 'home' || view === '50km-radius') && (
        <Navbar
          onOpenAuth={(role, mode) => {
            openAuthWithRoute(role, mode || 'signin');
          }}
          onOpenModal={(type) => handleOpenContentModal(type)}
          onGoHome={() => navigateTo('/', 'home')}
          onGoDashboard={() =>
            navigateTo(activeRole === 'worker' ? '/jobfinder' : '/findemployee', 'dashboard')
          }
          onStartOnboarding={(role) => {
            navigateTo(
              role === 'worker' ? '/worker-onboarding' : '/employer-onboarding',
              role === 'worker' ? 'worker-onboarding' : 'employer-onboarding',
              role
            );
          }}
          onOpenAIAssistant={handleOpenAIAssistant}
          onOpenAdmin={() => navigateTo('/admin', 'admin')}
          onOpen50KmRadius={handleOpen50KmRadius}
        />
      )}

      {/* Main Content Area with View Page Transitions */}
      <main className="flex-1">
        <PageTransitionWrapper
          key={view}
          routeKey={view}
          kind={VIEW_TRANSITION_KIND[view]}
        >
            {view === 'home' && (
              <>
                <Hero
                  onSelectRole={handleSelectRoleFromHome}
                  onOpen50KmRadius={handleOpen50KmRadius}
                />
                <StatsSection />
                <TopCompaniesSection onOpenAIAssistant={handleOpenAIAssistant} />
                <HowItWorksSection onSelectRole={handleSelectRoleFromHome} />
                <SkillCategoriesShowcase />
              </>
            )}

        {view === '50km-radius' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo('/', 'home')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
                <div>
                  <h1 className="text-lg font-black text-gray-900">
                    50 KM Radius — Hyperlocal Job & Worker Radar
                  </h1>
                  <p className="text-xs text-gray-500">
                    Discover verified jobs within 50 KM of your GPS location or any Indian city
                  </p>
                </div>
              </div>
              {!currentUser && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAuthWithRoute(undefined, 'signin')}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthWithRoute(undefined, 'signup')}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Create Account to Apply
                  </button>
                </div>
              )}
            </div>

            <JobsNearMeView
              onApplyJob={(job: Job) => {
                if (!currentUser) {
                  openAuthWithRoute('worker', 'signin');
                } else {
                  setPublicSelectedJob(job);
                }
              }}
            />

            {publicSelectedJob && (
              <JobDetailModal
                job={publicSelectedJob}
                onClose={() => setPublicSelectedJob(null)}
                workerProfile={workerProfile}
                isSaved={savedJobIds.includes(publicSelectedJob.id)}
                hasApplied={myApplications.some(
                  (a) => a.jobId === publicSelectedJob.id && a.status !== 'Withdrawn'
                )}
                onApply={async (job, note, resumeUrl, resumeName, formDetails) => {
                  await applyToJob(job, note, resumeUrl, resumeName, formDetails);
                  addToast('success', 'Official Job Application submitted!', 'Application Sent');
                }}
                onToggleSave={(jobId) => toggleSaveJob(jobId)}
                onReport={(jobId, reason) => reportItem('job', jobId, reason)}
              />
            )}
          </div>
        )}

        {view === 'worker-onboarding' && (
          <WorkerOnboarding
            initialStep={onboardingInitialStep}
            onComplete={handleWorkerOnboardingComplete}
            onCancel={() =>
              navigateTo(currentUser ? '/jobfinder' : '/', currentUser ? 'dashboard' : 'home')
            }
          />
        )}

        {view === 'employer-onboarding' && (
          <EmployerOnboarding
            initialStep={onboardingInitialStep}
            onComplete={handleEmployerOnboardingComplete}
            onExploreNearbyWorkers={() => {
              fireCelebrationConfetti();
              addToast('success', 'Employer profile saved! Exploring nearby verified workers.', 'Profile Ready');
              navigateTo('/findemployee/50km-radius', 'dashboard', 'employer');
            }}
            onCancel={() =>
              navigateTo(currentUser ? '/findemployee' : '/', currentUser ? 'dashboard' : 'home')
            }
          />
        )}

        {view === 'dashboard' && (
          <>
            {activeRole === 'worker' ? (
              <WorkerDashboard
                onEditProfile={() =>
                  navigateTo('/worker-onboarding', 'worker-onboarding', 'worker', { initialStep: 2 })
                }
                onActivateEmployer={handleActivateEmployer}
                onSwitchRole={handleSwitchRole}
                onOpenAIAssistant={handleOpenAIAssistant}
              />
            ) : (
              <EmployerDashboard
                onEditProfile={() =>
                  navigateTo('/employer-onboarding', 'employer-onboarding', 'employer', { initialStep: 2 })
                }
                onActivateWorker={handleActivateWorker}
                onSwitchRole={handleSwitchRole}
                onOpenAIAssistant={handleOpenAIAssistant}
              />
            )}
          </>
        )}

        {view === 'admin' && (
          <AdminDashboard
            onBackToApp={() =>
              navigateTo(activeRole === 'worker' ? '/jobfinder' : '/findemployee', 'dashboard')
            }
          />
        )}
        </PageTransitionWrapper>
      </main>

      {/* Admin Console Shortcut (Only for Admin; AI Assistant is kept exclusively in the Slide Navigation Bar after login) */}
      {currentUser?.email === 'sjtutorai@gmail.com' && view !== 'admin' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
        >
          <MagneticButton>
            <RippleContainer className="rounded-full">
              <button
                onClick={() => navigateTo('/admin', 'admin')}
                className="px-3.5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 jobsetu-liquid-btn"
                title="Open Admin Console"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </RippleContainer>
          </MagneticButton>
        </motion.div>
      )}

      {/* Global Footer (Shown on public landing or 50km-radius view when not logged in) */}
      {!currentUser && (view === 'home' || view === '50km-radius') && (
        <Footer onOpenModal={(type) => handleOpenContentModal(type)} />
      )}

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={handleCloseAIAssistant}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuthModal}
        initialRole={authInitialRole}
        initialMode={authMode}
        onModeUrlChange={(newMode) => {
          setAuthMode(newMode);
          const targetPath =
            newMode === 'signup' ? '/signup' : newMode === 'forgot' ? '/forgot-password' : '/signin';
          if (window.location.pathname !== targetPath) {
            window.history.pushState(null, '', targetPath);
          }
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Information & Legal Modals */}
      <ContentModals
        activeModal={activeModal}
        onClose={handleCloseContentModal}
        onSelectRole={handleSelectRoleFromHome}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <JobProvider>
            <AttendanceProvider>
              <MainApp />
            </AttendanceProvider>
          </JobProvider>
        </AuthProvider>
      </MotionConfig>
    </AppErrorBoundary>
  );
}
