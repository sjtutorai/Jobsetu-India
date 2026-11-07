import React, { useState } from 'react';
import {
  Globe,
  Smartphone,
  Shield,
  Bell,
  CheckCircle2,
  Lock,
  Download,
  AlertCircle,
  FileCheck2,
  Sparkles,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  role: 'worker' | 'employer';
  userName?: string;
  userEmail?: string;
  isVerified?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', popular: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', popular: true },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', popular: false },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', popular: false },
  { code: 'mr', name: 'Marathi', native: 'मराठी', popular: false },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', popular: false },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', popular: false },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', popular: false },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', popular: false },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', popular: false }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  role,
  userName,
  userEmail,
  isVerified = true
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('jobsetu_lang') || 'en';
  });

  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    employerInquiries: true,
    applicationUpdates: true,
    emailDigest: false,
    whatsappAlerts: true
  });

  const [privacy, setPrivacy] = useState({
    hidePhoneUntilInterview: true,
    showOnlineStatus: true,
    allowNearbyEmployerDiscovery: true
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem('jobsetu_lang', code);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTogglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in">
      {/* Settings Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                {role === 'worker' ? 'Job Seeker Portal' : 'Employer Hub'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configure your regional language, communication alerts, privacy controls, and view application build diagnostics.
            </p>
          </div>

          {savedNotice && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Preferences Saved</span>
            </div>
          )}
        </div>

        {/* Section 1: Language Selection */}
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-gray-900">Regional Language Selection</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Select your preferred regional language for browsing job listings, notifications, and communication.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/70 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{lang.native}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1">{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: App Version and Diagnostics */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-gray-900">Application Version & Diagnostics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                App Version
              </span>
              <span className="text-sm font-black text-gray-900 mt-1 block">JOBSETU v2.4.0</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                ● Latest Release (Nov 2026)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Cloud Architecture
              </span>
              <span className="text-sm font-black text-gray-900 mt-1 block">Firestore Enterprise</span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">Region: asia-east1</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Smart Match Engine
              </span>
              <span className="text-sm font-black text-[#2563EB] mt-1 block">0–100% Multi-Factor</span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">50km Proximity + Skills</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                AI Assistant Engine
              </span>
              <span className="text-sm font-black text-indigo-700 mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gemini 3.8 Flash</span>
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">Full-Stack Proxy Active</span>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-gray-900">Notification Alerts</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {role === 'worker' ? 'Nearby Job Alerts (Within 50 km)' : 'New Applicant Alerts'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {role === 'worker'
                    ? 'Get instant notifications when verified shops & businesses post vacancies within 50km.'
                    : 'Get notified immediately when skilled candidates submit applications to your openings.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification('jobAlerts')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications.jobAlerts ? 'bg-[#2563EB]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    notifications.jobAlerts ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {role === 'worker' ? 'Employer Inquiries & Messages' : 'Candidate Direct Messages'}
                </p>
                <p className="text-[11px] text-gray-500">
                  Receive sound alerts and badge counters for incoming recruitment inquiries and chat updates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification('employerInquiries')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications.employerInquiries ? 'bg-[#2563EB]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    notifications.employerInquiries ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-gray-900">WhatsApp & SMS Updates</p>
                <p className="text-[11px] text-gray-500">
                  Receive critical interview reminders and shortlisted notifications via SMS/WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification('whatsappAlerts')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications.whatsappAlerts ? 'bg-[#2563EB]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    notifications.whatsappAlerts ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Privacy & Safety */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-gray-900">Privacy & Profile Protection</h2>
          </div>

          <div className="space-y-3">
            {role === 'worker' && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">Protect Phone & Contact Info</p>
                  <p className="text-[11px] text-gray-500">
                    Mask phone number and full street address until you accept an interview invitation from an employer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePrivacy('hidePhoneUntilInterview')}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    privacy.hidePhoneUntilInterview ? 'bg-[#2563EB]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      privacy.hidePhoneUntilInterview ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-gray-900">Verified Real-Person Profile Certification</p>
                <p className="text-[11px] text-gray-500">
                  Certified authentic photo and 18+ age eligibility confirmed for verified employment listing.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
