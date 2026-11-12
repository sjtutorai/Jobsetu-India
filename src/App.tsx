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
import { Shield, MapPin, Navigation, X, ArrowLeft } from 'lucide-react';
import { executeRecaptchaEnterprise } from './lib/recaptcha';

type AppView = 'home' | '50km-radius' | 'worker-onboarding' | 'employer-onboarding' | 'dashboard' | 'admin';

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
  const navigateTo = (path: string, newView: AppView, role?: UserRole) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    if (role) {
      setIntendedRole(role);
      switchActiveRole(role).catch(() => {});
    }
    setView(newView);
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
            role === 'worker'
              ? (workerProfile ? 'dashboard' : 'worker-onboarding')
              : (employerProfile ? 'dashboard' : 'employer-onboarding'),
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
            role === 'worker'
              ? (workerProfile ? 'dashboard' : 'worker-onboarding')
              : (employerProfile ? 'dashboard' : 'employer-onboarding'),
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
        setIntendedRole('worker');
        if (currentUser) {
          if (workerProfile) {
            switchActiveRole('worker').catch(() => {});
            setView('dashboard');
          } else {
            setView('worker-onboarding');
          }
        } else {
          setView('home');
          setAuthInitialRole('worker');
          setAuthMode('signin');
          setAuthModalOpen(true);
        }
      } else if (path === '/findemployee' || path.startsWith('/findemployee/')) {
        setIntendedRole('employer');
        if (currentUser) {
          if (employerProfile) {
            switchActiveRole('employer').catch(() => {});
            setView('dashboard');
          } else {
            setView('employer-onboarding');
          }
        } else {
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
          if (role === 'worker') {
            setView(workerProfile ? 'dashboard' : 'worker-onboarding');
          } else {
            setView(employerProfile ? 'dashboard' : 'employer-onboarding');
          }
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
        if (workerProfile) {
          switchActiveRole('worker').then(() => {
            navigateTo('/jobfinder', 'dashboard', 'worker');
            addToast('info', 'Switched to Job Seeker Hub');
          });
        } else {
          navigateTo('/worker-onboarding', 'worker-onboarding', 'worker');
        }
      } else {
        if (employerProfile) {
          switchActiveRole('employer').then(() => {
            navigateTo('/findemployee', 'dashboard', 'employer');
            addToast('info', 'Switched to Employer Hub');
          });
        } else {
          navigateTo('/employer-onboarding', 'employer-onboarding', 'employer');
        }
      }
    }
  };

  const handleAuthSuccess = (selectedRole: UserRole) => {
    addToast('success', `Welcome to JOBSETU!`, 'Signed In');
    if (selectedRole === 'worker') {
      if (!workerProfile) {
        navigateTo('/worker-onboarding', 'worker-onboarding', 'worker');
      } else {
        navigateTo('/jobfinder', 'dashboard', 'worker');
      }
    } else {
      if (!employerProfile) {
        navigateTo('/employer-onboarding', 'employer-onboarding', 'employer');
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
        <img
          src="https://i.ibb.co/jv67DNGx/Jobsetulogo.png"
          alt="JOBSETU Logo"
          className="w-20 h-20 rounded-2xl object-contain bg-white border border-gray-100 shadow-xl shadow-blue-500/15 p-2 mb-4 animate-pulse"
        />
        <p className="text-sm font-extrabold text-gray-800 tracking-tight">
          JOB<span className="text-[#2563EB]">SETU</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Connecting People. Creating Opportunities.</p>
      </div>
    );
  }

  const activeRole = userProfile?.activeRole || intendedRole || 'worker';

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
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

      {/* Main Content Area */}
      <main className="flex-1">
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
            onComplete={handleWorkerOnboardingComplete}
            onCancel={() =>
              navigateTo(currentUser ? '/jobfinder' : '/', currentUser ? 'dashboard' : 'home')
            }
          />
        )}

        {view === 'employer-onboarding' && (
          <EmployerOnboarding
            onComplete={handleEmployerOnboardingComplete}
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
                  navigateTo('/worker-onboarding', 'worker-onboarding', 'worker')
                }
                onActivateEmployer={handleActivateEmployer}
                onSwitchRole={handleSwitchRole}
                onOpenAIAssistant={handleOpenAIAssistant}
              />
            ) : (
              <EmployerDashboard
                onEditProfile={() =>
                  navigateTo('/employer-onboarding', 'employer-onboarding', 'employer')
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
      </main>

      {/* Admin Console Shortcut (Only for Admin; AI Assistant is kept exclusively in the Slide Navigation Bar after login) */}
      {currentUser?.email === 'sjtutorai@gmail.com' && view !== 'admin' && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            onClick={() => navigateTo('/admin', 'admin')}
            className="px-3.5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
            title="Open Admin Console"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>
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
    <AuthProvider>
      <JobProvider>
        <AttendanceProvider>
          <MainApp />
        </AttendanceProvider>
      </JobProvider>
    </AuthProvider>
  );
}
