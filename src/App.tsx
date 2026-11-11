import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JobProvider } from './context/JobContext';
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
import { UserRole } from './types';
import { fireCelebrationConfetti } from './lib/confetti';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { AIAssistantModal } from './components/common/AIAssistantModal';
import { Shield, MapPin, Navigation, X } from 'lucide-react';
import { executeRecaptchaEnterprise } from './lib/recaptcha';

type AppView = 'home' | 'worker-onboarding' | 'employer-onboarding' | 'dashboard' | 'admin';

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

  const [view, setView] = useState<AppView>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('worker');
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [locationDeniedBanner, setLocationDeniedBanner] = useState(false);

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

  // Request browser geolocation permission immediately after login or when starting onboarding
  useEffect(() => {
    const isOnboarding = view === 'worker-onboarding' || view === 'employer-onboarding';
    if (currentUser || isOnboarding) {
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

  // Synchronize on mount and browser back/forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/jobfinder') {
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
          setAuthModalOpen(true);
        }
      } else if (path === '/findemployee') {
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
      setAuthModalOpen(true);
    } else {
      // User is logged in
      if (role === 'worker') {
        if (workerProfile) {
          switchActiveRole('worker').then(() => {
            navigateTo('/jobfinder', 'dashboard', 'worker');
            addToast('info', 'Switched to Job Seeker Hub');
          });
        } else {
          navigateTo('/jobfinder', 'worker-onboarding', 'worker');
        }
      } else {
        if (employerProfile) {
          switchActiveRole('employer').then(() => {
            navigateTo('/findemployee', 'dashboard', 'employer');
            addToast('info', 'Switched to Employer Hub');
          });
        } else {
          navigateTo('/findemployee', 'employer-onboarding', 'employer');
        }
      }
    }
  };

  const handleAuthSuccess = (selectedRole: UserRole) => {
    addToast('success', `Welcome to JOBSETU!`, 'Signed In');
    if (selectedRole === 'worker') {
      if (!workerProfile) {
        navigateTo('/jobfinder', 'worker-onboarding', 'worker');
      } else {
        navigateTo('/jobfinder', 'dashboard', 'worker');
      }
    } else {
      if (!employerProfile) {
        navigateTo('/findemployee', 'employer-onboarding', 'employer');
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
      navigateTo('/findemployee', 'employer-onboarding', 'employer');
      addToast('info', 'Please complete your business details to start recruiting.');
    } else {
      navigateTo('/findemployee', 'dashboard', 'employer');
      addToast('success', 'Employer Mode Activated!');
    }
  };

  const handleActivateWorker = async () => {
    await enableAdditionalRole('worker');
    if (!workerProfile) {
      navigateTo('/jobfinder', 'worker-onboarding', 'worker');
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

      {/* Global Top Navbar (Shown ONLY before login; completely removed once logged in) */}
      {!currentUser && view === 'home' && (
        <Navbar
          onOpenAuth={(role) => {
            if (role) setAuthInitialRole(role);
            setAuthModalOpen(true);
          }}
          onOpenModal={(type) => setActiveModal(type)}
          onGoHome={() => navigateTo('/', 'home')}
          onGoDashboard={() =>
            navigateTo(activeRole === 'worker' ? '/jobfinder' : '/findemployee', 'dashboard')
          }
          onStartOnboarding={(role) => {
            navigateTo(
              role === 'worker' ? '/jobfinder' : '/findemployee',
              role === 'worker' ? 'worker-onboarding' : 'employer-onboarding',
              role
            );
          }}
          onOpenAIAssistant={() => setAiModalOpen(true)}
          onOpenAdmin={() => navigateTo('/admin', 'admin')}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'home' && (
          <>
            <Hero onSelectRole={handleSelectRoleFromHome} />
            <StatsSection />
            <TopCompaniesSection onOpenAIAssistant={() => setAiModalOpen(true)} />
            <HowItWorksSection onSelectRole={handleSelectRoleFromHome} />
            <SkillCategoriesShowcase />
          </>
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
                  navigateTo('/jobfinder', 'worker-onboarding', 'worker')
                }
                onActivateEmployer={handleActivateEmployer}
                onSwitchRole={handleSwitchRole}
                onOpenAIAssistant={() => setAiModalOpen(true)}
              />
            ) : (
              <EmployerDashboard
                onEditProfile={() =>
                  navigateTo('/findemployee', 'employer-onboarding', 'employer')
                }
                onActivateWorker={handleActivateWorker}
                onSwitchRole={handleSwitchRole}
                onOpenAIAssistant={() => setAiModalOpen(true)}
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
            onClick={() => setView('admin')}
            className="px-3.5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
            title="Open Admin Console"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>
      )}

      {/* Global Footer (Shown only on public landing view when not logged in) */}
      {!currentUser && view === 'home' && <Footer onOpenModal={(type) => setActiveModal(type)} />}

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authInitialRole}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Information & Legal Modals */}
      <ContentModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
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
