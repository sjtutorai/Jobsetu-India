import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobContext';
import {
  Briefcase,
  Users,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  Bell,
  Navigation
} from 'lucide-react';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedImage, MagneticButton, RippleContainer, RippleRadarPulse } from './animations';

interface NavbarProps {
  onOpenAuth: (role?: UserRole, mode?: 'signin' | 'signup') => void;
  onOpenModal: (type: 'about' | 'how-it-works' | 'contact') => void;
  onGoHome: () => void;
  onGoDashboard: () => void;
  onStartOnboarding: (role: UserRole) => void;
  onOpenAIAssistant?: () => void;
  onOpenAdmin?: () => void;
  onOpen50KmRadius?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenModal,
  onGoHome,
  onGoDashboard,
  onStartOnboarding,
  onOpenAIAssistant,
  onOpenAdmin,
  onOpen50KmRadius
}) => {
  const { currentUser, userProfile, logout, switchActiveRole, enableAdditionalRole } = useAuth();
  const { unreadNotificationsCount } = useJobs();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRole = userProfile?.activeRole || 'worker';
  const enabledRoles = userProfile?.enabledRoles || ['worker'];
  const hasBothRoles = enabledRoles.includes('worker') && enabledRoles.includes('employer');

  const handleRoleSwitch = async (newRole: UserRole) => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    if (enabledRoles.includes(newRole)) {
      await switchActiveRole(newRole);
      onGoDashboard();
    } else {
      await enableAdditionalRole(newRole);
      onStartOnboarding(newRole);
    }
  };

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <AnimatedImage
              variant="tilt3d"
              src="https://i.ibb.co/jv67DNGx/Jobsetulogo.png"
              alt="JOBSETU"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-[#111827]">
                  JOB<span className="text-[#2563EB]">SETU</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-[#F59E0B] border border-amber-200">
                  India
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#6B7280] hidden sm:block">
                Connecting People. Creating Opportunities.
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#111827]">
            <button
              onClick={onGoHome}
              className="text-[#2563EB] hover:text-blue-700 transition-colors cursor-pointer jobsetu-nav-underline"
            >
              Home
            </button>
            <RippleContainer className="rounded-xl">
              <button
                onClick={onOpen50KmRadius}
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-all cursor-pointer shadow-2xs jobsetu-liquid-btn"
              >
                <span className="relative flex items-center justify-center">
                  <RippleRadarPulse />
                  <Navigation className="w-3.5 h-3.5 text-emerald-600 relative z-10" />
                </span>
                <span>50 KM Radius</span>
              </button>
            </RippleContainer>
            <button
              onClick={() => onOpenModal('about')}
              className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer jobsetu-nav-underline"
            >
              About Us
            </button>
            <button
              onClick={() => onOpenModal('how-it-works')}
              className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer jobsetu-nav-underline"
            >
              How It Works
            </button>
            <button
              onClick={() => onOpenModal('contact')}
              className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer jobsetu-nav-underline"
            >
              Contact
            </button>
          </nav>

          {/* User Auth / Profile Actions */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser && userProfile ? (
              <div className="relative">
                <div className="flex items-center gap-3">
                  {/* Current Active Role Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-semibold text-[#2563EB]">
                    {activeRole === 'worker' ? (
                      <>
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Job Seeker Mode</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span className="text-amber-800">Employer Mode</span>
                      </>
                    )}
                  </div>

                  {/* AI Assistant Quick Launcher */}
                  <button
                    type="button"
                    onClick={onOpenAIAssistant}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    title="JOBSETU AI Assistant"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>AI Assistant</span>
                  </button>

                  {/* Notification Bell Button */}
                  <button
                    type="button"
                    onClick={onGoDashboard}
                    className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    {userProfile.profilePhoto ? (
                      <img
                        src={userProfile.profilePhoto}
                        alt={userProfile.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">
                      {userProfile.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50"
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{userProfile.name}</p>
                      <p className="text-xs text-gray-500 truncate">{userProfile.email || userProfile.phone || 'Jobsetu Account'}</p>
                    </div>

                    {/* Role Switcher Section */}
                    <div className="p-2 border-b border-gray-100 bg-slate-50/50 m-2 rounded-xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                        Active Role
                      </p>
                      <button
                        onClick={() => handleRoleSwitch('worker')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                          activeRole === 'worker'
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Job Seeker (Worker)
                        </span>
                        {enabledRoles.includes('worker') ? (
                          activeRole === 'worker' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>
                        ) : (
                          <span className="text-[10px] text-blue-600 font-bold">+ Activate</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleRoleSwitch('employer')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg mt-1 transition-colors ${
                          activeRole === 'employer'
                            ? 'bg-[#F59E0B] text-white shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Employer (Hiring)
                        </span>
                        {enabledRoles.includes('employer') ? (
                          activeRole === 'employer' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-bold">+ Activate</span>
                        )}
                      </button>

                      {!hasBothRoles && (
                        <p className="text-[10px] text-gray-500 mt-2 px-2 leading-tight">
                          💡 You can use both Job Seeker and Employer modes with one unified account.
                        </p>
                      )}
                    </div>

                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onGoDashboard();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] rounded-lg transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        My Profile & Hub
                      </button>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenAIAssistant?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        JOBSETU AI Assistant
                      </button>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenAdmin?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Admin Console
                      </button>

                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout();
                          onGoHome();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAuth(undefined, 'signin')}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#2563EB] transition-colors cursor-pointer jobsetu-nav-underline"
                >
                  Sign In
                </button>
                <MagneticButton>
                  <RippleContainer className="rounded-xl">
                    <button
                      onClick={() => onOpenAuth(undefined, 'signup')}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 cursor-pointer jobsetu-liquid-btn"
                    >
                      Create Account
                    </button>
                  </RippleContainer>
                </MagneticButton>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpen50KmRadius}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span>50 KM</span>
            </button>
            {currentUser && (
              <button
                onClick={onGoDashboard}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-[#2563EB]"
              >
                Hub
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg overflow-hidden"
        >
          <div className="flex flex-col space-y-2 text-sm font-semibold">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGoHome();
              }}
              className="text-left py-2 px-3 rounded-lg text-[#2563EB] bg-blue-50"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpen50KmRadius?.();
              }}
              className="text-left py-2.5 px-3 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-2 font-bold"
            >
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>50 KM Radius — Jobs & Workers</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenModal('about');
              }}
              className="text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              About Us
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenModal('how-it-works');
              }}
              className="text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenModal('contact');
              }}
              className="text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Contact
            </button>
          </div>

          {currentUser && userProfile ? (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{userProfile.name}</p>
                  <p className="text-xs text-gray-500">{activeRole === 'worker' ? 'Job Seeker' : 'Employer'}</p>
                </div>
              </div>

              {/* Mobile Role Switcher */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleRoleSwitch('worker')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border ${
                    activeRole === 'worker'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  Job Seeker Mode
                </button>
                <button
                  onClick={() => handleRoleSwitch('employer')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border ${
                    activeRole === 'employer'
                      ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  Employer Mode
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoDashboard();
                  }}
                  className="w-full text-left py-2 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  My Profile & Hub
                </button>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    onGoHome();
                  }}
                  className="w-full text-left py-2 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth(undefined, 'signin');
                }}
                className="w-full py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth(undefined, 'signup');
                }}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-sm shadow-md"
              >
                Create Account
              </button>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.header>
  );
};
