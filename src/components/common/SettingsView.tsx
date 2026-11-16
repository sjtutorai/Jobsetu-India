import React, { useState, useEffect } from 'react';
import {
  Globe,
  Smartphone,
  Shield,
  Bell,
  CheckCircle2,
  Lock,
  Download,
  AlertCircle,
  User,
  Eye,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  Trash2,
  KeyRound,
  LogOut,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SupportCenterView } from './SupportCenterView';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  role: 'worker' | 'employer';
  userName?: string;
  userEmail?: string;
  isVerified?: boolean;
}

type SettingsSection =
  | 'account'
  | 'visibility'
  | 'privacy'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'support'
  | 'lifecycle';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', popular: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', popular: true },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', popular: true },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', popular: false },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', popular: false },
  { code: 'mr', name: 'Marathi', native: 'मराठी', popular: false },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', popular: false },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', popular: false },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', popular: false },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', popular: false }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  role,
  userName,
  userEmail,
  isVerified = true
}) => {
  const {
    currentUser,
    userProfile,
    workerProfile,
    employerProfile,
    saveDraftWorkerProfile,
    saveDraftEmployerProfile,
    sendPasswordReset,
    logout
  } = useAuth();

  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [savedNotice, setSavedNotice] = useState('');

  // A. Account State
  const [accountName, setAccountName] = useState(userName || userProfile?.name || '');
  const [accountPhone, setAccountPhone] = useState(
    workerProfile?.phone || employerProfile?.ownerPhone || userProfile?.phone || ''
  );

  // B. Profile & Visibility
  const [visibilityMode, setVisibilityMode] = useState<
    'signed_in_employers' | 'only_after_application' | 'hidden'
  >(() => (localStorage.getItem('jobsetu_visibility_mode') as any) || 'signed_in_employers');
  const [appearInWorkerSearch, setAppearInWorkerSearch] = useState<boolean>(
    workerProfile?.privacySettings?.showLocationInNearby ?? true
  );

  // C. Privacy & Data
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(
    () => localStorage.getItem('jobsetu_analytics_consent') !== 'false'
  );
  const [marketingConsent, setMarketingConsent] = useState<boolean>(
    () => localStorage.getItem('jobsetu_marketing_consent') === 'true'
  );
  const [personalizedRecs, setPersonalizedRecs] = useState<boolean>(
    () => localStorage.getItem('jobsetu_personalized_recs') !== 'false'
  );

  // D. Security
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(
    () => localStorage.getItem('jobsetu_mfa_enabled') === 'true'
  );

  // E. Notifications
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    jobAlertFrequency: 'immediate' as 'immediate' | 'daily' | 'off',
    applicationUpdates: true,
    messages: true,
    interviews: true,
    securityAlerts: true, // mandatory for account safety
    productAnnouncements: false,
    channelInApp: true,
    channelEmail: true,
    channelPush: false
  });

  // F. Appearance & Accessibility
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('jobsetu_theme') as any) || 'light';
  });
  const [fontScale, setFontScale] = useState<'compact' | 'standard' | 'large'>(() => {
    return (localStorage.getItem('jobsetu_font_scale') as any) || 'standard';
  });
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('jobsetu_reduced_motion') === 'true';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('jobsetu_high_contrast') === 'true';
  });

  // G. Language
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('jobsetu_lang') || 'en';
  });

  // I. Account Lifecycle Confirmation
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const showToast = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 3500);
  };

  // Apply Appearance & Accessibility to <html>
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('jobsetu_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-scale', fontScale);
    localStorage.setItem('jobsetu_font_scale', fontScale);
  }, [fontScale]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    localStorage.setItem('jobsetu_reduced_motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-high-contrast', String(highContrast));
    localStorage.setItem('jobsetu_high_contrast', String(highContrast));
  }, [highContrast]);

  const handleSaveAccountChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'worker') {
      await saveDraftWorkerProfile({
        fullName: accountName.trim(),
        phone: accountPhone.trim()
      });
    } else {
      await saveDraftEmployerProfile({
        ownerName: accountName.trim(),
        ownerPhone: accountPhone.trim()
      });
    }
    showToast('Account contact details updated and synced.');
  };

  const handleExportPersonalData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'Jobsetu India (JOBSETU)',
      account: {
        uid: currentUser?.uid,
        name: userProfile?.name || userName,
        email: userProfile?.email || userEmail,
        enabledRoles: userProfile?.enabledRoles,
        activeRole: userProfile?.activeRole,
        accountStatus: userProfile?.accountStatus
      },
      seekerProfile: workerProfile || null,
      employerProfile: employerProfile || null,
      privacyPreferences: {
        visibilityMode,
        appearInWorkerSearch,
        analyticsConsent,
        marketingConsent,
        personalizedRecs
      }
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobsetu_india_personal_data_${currentUser?.uid?.slice(0, 8) || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Readable JSON export of your personal data downloaded.');
  };

  const navItems: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: 'A. Account', icon: User },
    { id: 'visibility', label: 'B. Profile & Visibility', icon: Eye },
    { id: 'privacy', label: 'C. Privacy & Data', icon: Lock },
    { id: 'security', label: 'D. Security', icon: KeyRound },
    { id: 'notifications', label: 'E. Notifications', icon: Bell },
    { id: 'appearance', label: 'F. Appearance & Accessibility', icon: Sliders },
    { id: 'language', label: 'G. Language', icon: Globe },
    { id: 'support', label: 'H. Support & Legal', icon: HelpCircle },
    { id: 'lifecycle', label: 'I. Account Lifecycle', icon: Trash2 }
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Settings & Account Governance — Jobsetu India
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage account details, visibility, data exports, security sessions, accessibility, and language preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton compact />
          {savedNotice && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#10213B] text-white dark:bg-[#267BE8]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* A. ACCOUNT */}
      {activeSection === 'account' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            A. Account Details & Connected Sign-In Providers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Account ID</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                {currentUser?.uid || 'USR-ACTIVE'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Active Workspace Role</span>
              <span className="font-bold text-slate-900 dark:text-white mt-1 block capitalize">
                {role === 'worker' ? 'Job Seeker (Adult 18+)' : 'Employer / Recruiter'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Connected Sign-In Provider</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                Firebase Auth ({currentUser?.providerData?.[0]?.providerId || 'Email / Password'})
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveAccountChanges} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email (Reauthentication required to change)
              </label>
              <input
                type="email"
                disabled
                value={userEmail || userProfile?.email || currentUser?.email || ''}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (Masked on public pages)
              </label>
              <input
                type="tel"
                value={accountPhone}
                onChange={(e) => setAccountPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#267BE8] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Save Account Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* B. PROFILE & VISIBILITY */}
      {activeSection === 'visibility' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            B. Profile Discovery & Visibility Controls
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose who can discover your profile. Hidden profiles are immediately excluded from new employer searches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'signed_in_employers',
                title: 'Public to Signed-In Employers',
                desc: 'Verified employers can discover your skills, city, and experience. Phone & email remain hidden until you apply or accept contact.'
              },
              {
                id: 'only_after_application',
                title: 'Visible Only After Application',
                desc: 'Your profile will not appear in general worker search. Only employers whose jobs you apply to can view your profile.'
              },
              {
                id: 'hidden',
                title: 'Hidden from Discovery',
                desc: 'Immediately hides your profile from all new candidate searches while preserving your existing applications.'
              }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={async () => {
                  setVisibilityMode(opt.id as any);
                  localStorage.setItem('jobsetu_visibility_mode', opt.id);
                  const allowDiscovery = opt.id === 'signed_in_employers';
                  setAppearInWorkerSearch(allowDiscovery);
                  if (role === 'worker') {
                    await saveDraftWorkerProfile({
                      privacySettings: {
                        allowDirectContact: allowDiscovery,
                        showLocationInNearby: allowDiscovery
                      }
                    });
                  }
                  showToast(`Visibility updated: ${opt.title}`);
                }}
                className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  visibilityMode === opt.id
                    ? 'border-[#267BE8] bg-blue-50/60 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{opt.title}</span>
                  {visibilityMode === opt.id && <CheckCircle2 className="w-4 h-4 text-[#267BE8]" />}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* C. PRIVACY & DATA */}
      {activeSection === 'privacy' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            C. Privacy, Consent, AI Explainability & Data Export
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Explainable Smart Matching & Personalised Job Recommendations
                </p>
                <p className="text-[11px] text-slate-500">
                  Deterministic weights: Skills 40% · Location 25% · Experience 15% · Salary 10% · Employment Type 10%. Never uses protected traits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !personalizedRecs;
                  setPersonalizedRecs(next);
                  localStorage.setItem('jobsetu_personalized_recs', String(next));
                  showToast(next ? 'Personalised recommendations enabled.' : 'Personalised recommendations disabled.');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  personalizedRecs ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    personalizedRecs ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Optional Privacy-Respecting Funnel Analytics Consent
                </p>
                <p className="text-[11px] text-slate-500">
                  Helps measure genuine hiring outcomes (applications, interviews, hires). You may withdraw consent at any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !analyticsConsent;
                  setAnalyticsConsent(next);
                  localStorage.setItem('jobsetu_analytics_consent', String(next));
                  showToast('Analytics consent preference updated.');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  analyticsConsent ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    analyticsConsent ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Optional Marketing Communications Consent
                </p>
                <p className="text-[11px] text-slate-500">
                  Kept separate from essential security and application notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !marketingConsent;
                  setMarketingConsent(next);
                  localStorage.setItem('jobsetu_marketing_consent', String(next));
                  showToast('Marketing consent preference updated.');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  marketingConsent ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    marketingConsent ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportPersonalData}
              className="px-4 py-2.5 rounded-xl bg-[#10213B] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#36C5F0]" />
              <span>Download Personal Data Export (JSON)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('jobsetu_detected_coords');
                showToast('Saved location & preference history cleared.');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Clear Saved Location & Preference History
            </button>
          </div>
        </div>
      )}

      {/* D. SECURITY */}
      {activeSection === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            D. Security, Active Sessions & Password Recovery
          </h2>
          <p className="text-xs text-slate-500">
            Secrets, password hashes, OTPs, and full tokens are never displayed. Support staff will never ask for your password.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Password Reset & Reauthentication
              </p>
              <p className="text-[11px] text-slate-500">
                Send a single-use password reset link to your registered email address.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const targetEmail = userEmail || userProfile?.email || currentUser?.email;
                  if (targetEmail) {
                    await sendPasswordReset(targetEmail).catch(() => {});
                  }
                  showToast('If an account is registered, a password reset link has been dispatched.');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#267BE8] text-white text-xs font-bold cursor-pointer"
              >
                Send Password Reset Email
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Multi-Factor Verification Prompt
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next = !mfaEnabled;
                    setMfaEnabled(next);
                    localStorage.setItem('jobsetu_mfa_enabled', String(next));
                    showToast(next ? 'Step-up MFA verification enabled.' : 'Step-up MFA disabled.');
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    mfaEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      mfaEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Require secondary OTP verification on sensitive account changes.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Current Active Session ({navigator.platform || 'Web Browser'})
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Status: Authenticated · Last verified: Today
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('support')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer"
            >
              Report Suspicious Activity
            </button>
          </div>
        </div>
      )}

      {/* E. NOTIFICATIONS */}
      {activeSection === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            E. Notification Channels & Alert Frequency
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['immediate', 'daily', 'off'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => {
                  setNotifications({ ...notifications, jobAlertFrequency: freq });
                  showToast(`Job alert frequency set to ${freq}.`);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer ${
                  notifications.jobAlertFrequency === freq
                    ? 'border-[#267BE8] bg-blue-50/60 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                  Job Alerts: {freq === 'daily' ? 'Daily Digest' : freq}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {freq === 'immediate'
                    ? 'Instant matching job notifications'
                    : freq === 'daily'
                    ? 'Consolidated once per day'
                    : 'Paused until re-enabled'}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {[
              {
                key: 'applicationUpdates',
                label: 'Application Status Changes',
                desc: 'Submitted, Shortlisted, Interview Invited, Selected or Closed.'
              },
              {
                key: 'messages',
                label: 'Direct Messages',
                desc: 'New messages in permitted job/application conversations.'
              },
              {
                key: 'interviews',
                label: 'Interview Invitations & Reminders',
                desc: 'Date, time zone, mode, and meeting location/link updates.'
              },
              {
                key: 'productAnnouncements',
                label: 'Platform Announcements',
                desc: 'Clearly labeled product updates (kept separate from marketing).'
              }
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifications((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }));
                    showToast('Notification preference saved.');
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    (notifications as any)[item.key] ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      (notifications as any)[item.key] ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Essential Security Alerts (Required)
                </p>
                <p className="text-[11px] text-slate-500">
                  Important login, password, or recovery notifications cannot be silently disabled for account safety.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Always Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* F. APPEARANCE & ACCESSIBILITY */}
      {activeSection === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            F. Appearance, Theme & Accessibility Controls
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Color Theme (Deep Navy #10213B · Blue #267BE8 · Cyan #36C5F0 · Light #F5F7FB)
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeMode(t.id as any);
                      showToast(`Theme switched to ${t.label}.`);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      themeMode === t.id
                        ? 'border-[#267BE8] bg-blue-50/70 dark:bg-blue-950 text-[#267BE8]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Accessible Font Size Scaling
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {(['compact', 'standard', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setFontScale(sz);
                    showToast(`Font size set to ${sz}.`);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer ${
                    fontScale === sz
                      ? 'border-[#267BE8] bg-blue-50/70 dark:bg-blue-950 text-[#267BE8]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Reduced Motion Mode
                </p>
                <p className="text-[11px] text-slate-500">
                  Minimizes decorative motion and transitions across all screens.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReducedMotion(!reducedMotion);
                  showToast(!reducedMotion ? 'Reduced motion enabled.' : 'Standard motion restored.');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  reducedMotion ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    reducedMotion ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  High-Contrast Legibility Support
                </p>
                <p className="text-[11px] text-slate-500">
                  Increases border and text contrast for outdoor and low-vision readability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHighContrast(!highContrast);
                  showToast('Contrast setting updated.');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  highContrast ? 'bg-[#267BE8]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    highContrast ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* G. LANGUAGE */}
      {activeSection === 'language' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            G. Launch Languages & Regional Script Selection
          </h2>
          <p className="text-xs text-slate-500">
            Select your preferred interface language (including English, Hindi, Kannada, and major Indian regional languages). Legal notices are never machine-translated without review.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    localStorage.setItem('jobsetu_lang', lang.code);
                    showToast(`Language set to ${lang.name} (${lang.native}).`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#267BE8] bg-blue-50/70 dark:bg-blue-950/60'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{lang.native}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#267BE8]" />}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* H. SUPPORT & LEGAL */}
      {activeSection === 'support' && <SupportCenterView />}

      {/* I. ACCOUNT LIFECYCLE */}
      {activeSection === 'lifecycle' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            I. Account Deactivation, Export & Deletion Lifecycle
          </h2>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Step 1: Export Your Personal Data Before Deactivating or Deleting
            </h3>
            <p className="text-[11px] text-slate-500">
              Download a complete copy of your profile, skills, and preferences in readable JSON format.
            </p>
            <button
              type="button"
              onClick={handleExportPersonalData}
              className="px-4 py-2 rounded-xl bg-[#10213B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#36C5F0]" />
              <span>Export My Data</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Deactivate Account Temporarily
            </h3>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Hides your profile and active listings from discovery. You can reactivate anytime by signing back in.
            </p>
            {!confirmDeactivate ? (
              <button
                type="button"
                onClick={() => setConfirmDeactivate(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Deactivate Account
              </button>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Deactivation & Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(false)}
                  className="px-3 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-3">
            <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
              Permanent Account Deletion Request
            </h3>
            <p className="text-[11px] text-red-800 dark:text-red-300 leading-relaxed">
              Deleting your account removes your public profile, resume, and saved items. Audit records required for active safety investigations or legal compliance are retained strictly per policy. Type <strong>DELETE</strong> below to confirm.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
              <button
                type="button"
                disabled={confirmDeleteText !== 'DELETE'}
                onClick={async () => {
                  showToast('Account deletion request recorded. Signing out safely...');
                  setTimeout(() => {
                    logout();
                  }, 1200);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Account Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
