import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Building2,
  Check,
  MapPin
} from 'lucide-react';
import { UserRole } from '../../types';
import { executeRecaptchaEnterprise } from '../../lib/recaptcha';
import welcomeBanner from '../../assets/images/jobsetu_welcome_banner_1793980683855.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialMode?: 'signin' | 'signup' | 'forgot';
  onModeUrlChange?: (mode: 'signin' | 'signup' | 'forgot') => void;
  onAuthSuccess: (role: UserRole) => void;
}

type AuthStep = 'auth' | 'role-selection' | 'forgot';
type AuthMode = 'signup' | 'signin';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole,
  initialMode = 'signin',
  onModeUrlChange,
  onAuthSuccess
}) => {
  const {
    workerProfile,
    employerProfile,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendPasswordReset,
    setInitialRole,
    intendedRole,
    setIntendedRole
  } = useAuth();

  const [step, setStep] = useState<AuthStep>(initialMode === 'forgot' ? 'forgot' : 'auth');
  const [mode, setMode] = useState<AuthMode>(initialMode === 'signup' ? 'signup' : 'signin');
  const [selectedSignupRole, setSelectedSignupRole] = useState<UserRole | null>(initialRole || null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'forgot') {
        setStep('forgot');
      } else {
        setStep('auth');
        setMode(initialMode === 'signup' ? 'signup' : 'signin');
      }
      setSelectedSignupRole(initialRole || null);
    } else {
      setStep('auth');
      setErrorMsg(null);
      setInfoMsg(null);
      setLoading(false);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  const switchAuthMode = (targetMode: AuthMode) => {
    setMode(targetMode);
    setStep('auth');
    setErrorMsg(null);
    setInfoMsg(null);
    onModeUrlChange?.(targetMode);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const recaptcha = await executeRecaptchaEnterprise('GOOGLE_LOGIN');
      if (!recaptcha.verified) {
        setErrorMsg(recaptcha.error || 'reCAPTCHA verification failed. Please try again.');
        return;
      }
      const fallbackRole = selectedSignupRole || initialRole || intendedRole || 'worker';
      const resolvedRole = await loginWithGoogle(fallbackRole);

      // If creating a new account (signup mode) or brand-new user with no profiles yet, ask them to choose Find Job vs Find Employees
      if (mode === 'signup' || (!workerProfile && !employerProfile && !selectedSignupRole)) {
        setStep('role-selection');
      } else {
        // Existing account sign-in: go straight in without asking
        onAuthSuccess(resolvedRole);
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Sign-in notice:', err?.message || err);
      setErrorMsg(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    try {
      setLoading(true);

      const recaptcha = await executeRecaptchaEnterprise(mode === 'signup' ? 'SIGNUP' : 'LOGIN');
      if (!recaptcha.verified) {
        setErrorMsg(recaptcha.error || 'reCAPTCHA verification failed. Please try again.');
        return;
      }

      if (mode === 'signup') {
        const defaultRole = selectedSignupRole || initialRole || intendedRole || 'worker';
        await registerWithEmail(name.trim(), email.trim(), password, defaultRole);
        if (selectedSignupRole) {
          setIntendedRole(selectedSignupRole);
          await setInitialRole(selectedSignupRole);
          onAuthSuccess(selectedSignupRole);
          onClose();
        } else {
          // Always ask new account creators whether they want to Find Job or Find Employees if not already chosen
          setStep('role-selection');
        }
      } else {
        // Sign In: do NOT ask whether they are looking for Jobs or Employees; redirect immediately
        const resolvedRole = await loginWithEmail(email.trim(), password);
        onAuthSuccess(resolvedRole);
        onClose();
      }
    } catch (err: any) {
      console.warn('Email auth notice:', err?.message || err);
      let message = err.message || 'Authentication failed. Please check your credentials.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please sign in instead.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (selectedRole: UserRole) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setIntendedRole(selectedRole);
      await setInitialRole(selectedRole);
      onAuthSuccess(selectedRole);
      onClose();
    } catch (err: any) {
      console.warn('Role selection notice:', err?.message || err);
      setErrorMsg('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const recaptcha = await executeRecaptchaEnterprise('PASSWORD_RESET');
      if (!recaptcha.verified) {
        setErrorMsg(recaptcha.error || 'reCAPTCHA verification failed. Please try again.');
        return;
      }
      await sendPasswordReset(email.trim());
      setInfoMsg(`Password reset instructions sent to ${email.trim()}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto grid grid-cols-1 md:grid-cols-12 min-h-[580px] animate-in fade-in zoom-in-95 duration-200">
        {/* ================= LEFT SIDE: IMAGE & BRANDING ================= */}
        <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-8 text-white overflow-hidden bg-blue-950">
          {/* Background Image (50% Transparency) */}
          <img
            src={welcomeBanner}
            alt="JOBSETU India Workforce"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
          />

          {/* Deep Royal Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/50 to-blue-900/30" />

          {/* Top Logo & Tagline */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <img
                src="https://i.ibb.co/jv67DNGx/Jobsetulogo.png"
                alt="JOBSETU Logo"
                className="w-10 h-10 rounded-xl bg-white object-contain p-1 shadow-lg shrink-0"
              />
              <div>
                <span className="text-2xl font-black tracking-tight text-white">
                  JOB<span className="text-[#F59E0B]">SETU</span>
                </span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-gray-950 px-1.5 py-0.5 rounded">
                  India
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-100 font-medium mt-1">
              Connecting People. Creating Opportunities.
            </p>
          </div>

          {/* Bottom Value Pillars */}
          <div className="relative z-10 space-y-4 pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-amber-300 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pan-India Workforce Connectivity</span>
            </div>

            <h3 className="text-xl lg:text-2xl font-black text-white leading-snug">
              Empowering Bharat’s Seekers & Enterprises
            </h3>

            <div className="space-y-2.5 text-xs text-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-300" />
                </div>
                <span>Direct contact with 100% verified employers</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-300" />
                </div>
                <span>Zero placement fees or wage cuts for workers</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-300" />
                </div>
                <span>Unified account: Seek jobs & hire with one login</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-blue-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Covering all 28 States & 8 Union Territories</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: AUTH & ROLE CHOICE ================= */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between relative bg-white">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-20 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ================= STEP 1: AUTHENTICATION ================= */}
          {step === 'auth' && (
            <div className="animate-in fade-in duration-200 my-auto">
              <div className="mb-5">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {mode === 'signup' ? 'Create your Account' : 'Welcome Back'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {mode === 'signup'
                    ? 'Choose whether you want to Find a Job or Find Employees'
                    : 'Sign in directly to your JOBSETU dashboard'}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex p-1 rounded-xl bg-gray-100 mb-5">
                <button
                  type="button"
                  onClick={() => switchAuthMode('signin')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Sign In (/signin)
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('signup')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Create Account (/signup)
                </button>
              </div>

              {/* ROLE SELECTION CARDS SHOWN ONLY DURING CREATE ACCOUNT (SIGN UP) */}
              {mode === 'signup' && (
                <div className="mb-5 space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-800">
                    What do you want to do on JOBSETU? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSignupRole('worker')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                        selectedSignupRole === 'worker'
                          ? 'border-[#2563EB] bg-blue-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedSignupRole === 'worker'
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-blue-100 text-[#2563EB]'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">Find Job</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                          I am looking for jobs near me (Job Seeker)
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSignupRole('employer')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                        selectedSignupRole === 'employer'
                          ? 'border-[#F59E0B] bg-amber-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedSignupRole === 'employer'
                            ? 'bg-[#F59E0B] text-white'
                            : 'bg-amber-100 text-[#F59E0B]'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">Find Employees</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                          I want to hire staff for my business (Employer)
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl border-2 border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-semibold">Or with email & password</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot');
                          setErrorMsg(null);
                          onModeUrlChange?.('forgot');
                        }}
                        className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : mode === 'signup' ? (
                    <span>
                      {selectedSignupRole === 'employer'
                        ? 'Create Employer Account (Find Employees)'
                        : selectedSignupRole === 'worker'
                        ? 'Create Job Seeker Account (Find Job)'
                        : 'Create Account & Choose Role'}
                    </span>
                  ) : (
                    <span>Sign In to JOBSETU</span>
                  )}
                </button>
              </form>

              {/* Bottom Mode Switch */}
              <p className="text-center text-xs text-gray-500 mt-4">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => switchAuthMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up Free'}
                </button>
              </p>
            </div>
          )}

          {/* ================= STEP 2: ROLE SELECTION (FOR NEW ACCOUNT CREATION) ================= */}
          {step === 'role-selection' && (
            <div className="animate-in fade-in duration-300 my-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Account Created Successfully</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Choose Your Primary Role
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
                  Do you want to Find a Job or Find Employees? You can always switch or activate both roles later.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* The Two Role Choices */}
              <div className="space-y-4">
                {/* CHOICE 1: Find Job */}
                <div
                  onClick={() => handleSelectRole('worker')}
                  className="group relative p-5 sm:p-6 rounded-2xl border-2 border-gray-200 hover:border-[#2563EB] hover:bg-blue-50/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors shadow-xs">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#2563EB] transition-colors">
                        Find Job (I am looking for Jobs)
                      </h3>
                      <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        Job Seeker
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Discover jobs within a 50 KM radius, showcase your skills, and connect directly with verified employers across India.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500 mt-2.5">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">100% Free</span>
                      <span>• 50 KM Radar</span>
                      <span>• Direct Hiring</span>
                    </div>
                  </div>
                  <div className="self-center hidden sm:block">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* CHOICE 2: Find Employees */}
                <div
                  onClick={() => handleSelectRole('employer')}
                  className="group relative p-5 sm:p-6 rounded-2xl border-2 border-gray-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#F59E0B] flex items-center justify-center shrink-0 group-hover:bg-[#F59E0B] group-hover:text-white transition-colors shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-gray-900 group-hover:text-amber-700 transition-colors">
                        Find Employees (I want to hire staff)
                      </h3>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Employer
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Find verified workers within a 50 KM radius, post vacancies, and recruit skilled staff for your shop, coaching classes, or company.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500 mt-2.5">
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded">Direct Recruitment</span>
                      <span>• 50 KM Worker Radar</span>
                      <span>• AI Board Verified</span>
                    </div>
                  </div>
                  <div className="self-center hidden sm:block">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {loading && (
                <div className="text-center mt-4 text-xs font-semibold text-gray-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                  <span>Setting up your dashboard...</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: FORGOT PASSWORD ================= */}
          {step === 'forgot' && (
            <div className="animate-in fade-in duration-200 my-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your registered email and we will send you a password reset link.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
                </button>

                <button
                  type="button"
                  onClick={() => switchAuthMode('signin')}
                  className="w-full text-center text-xs font-semibold text-gray-600 hover:text-gray-900 mt-2 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </form>
            </div>
          )}

          {/* Bottom Trust Badge */}
          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Protected by Google reCAPTCHA Enterprise & Firebase Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
};
