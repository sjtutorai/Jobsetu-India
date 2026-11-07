import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Building2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  Plus,
  AlertCircle,
  FileText,
  Sparkles,
  Search
} from 'lucide-react';
import {
  INDIAN_STATES_AND_UTS,
  BUSINESS_CATEGORIES,
  EmployerProfile,
  VerificationStatus
} from '../../types';
import { LocationPicker } from '../common/LocationPicker';

interface EmployerOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TOTAL_STEPS = 5;

export const EmployerOnboarding: React.FC<EmployerOnboardingProps> = ({ onComplete, onCancel }) => {
  const { currentUser, userProfile, employerProfile, saveEmployerProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: Owner info
  const [ownerName, setOwnerName] = useState(
    employerProfile?.ownerName || userProfile?.name || ''
  );
  const [ownerEmail, setOwnerEmail] = useState(
    employerProfile?.ownerEmail || userProfile?.email || currentUser?.email || ''
  );
  const [ownerPhone, setOwnerPhone] = useState(
    employerProfile?.ownerPhone || userProfile?.phone || currentUser?.phoneNumber || '+91 '
  );
  const [designation, setDesignation] = useState(
    employerProfile?.designation || 'Proprietor / Business Owner'
  );

  // STEP 2: Business info
  const [businessName, setBusinessName] = useState(employerProfile?.businessName || '');
  const [businessCategory, setBusinessCategory] = useState(
    employerProfile?.businessCategory || 'Retail'
  );
  const [businessDescription, setBusinessDescription] = useState(
    employerProfile?.businessDescription || ''
  );
  const [businessLogo, setBusinessLogo] = useState(
    employerProfile?.businessLogo || userProfile?.profilePhoto || ''
  );
  const [website, setWebsite] = useState(employerProfile?.website || '');

  // STEP 3: Location
  const [state, setState] = useState(employerProfile?.state || '');
  const [district, setDistrict] = useState(employerProfile?.district || '');
  const [city, setCity] = useState(employerProfile?.city || '');
  const [area, setArea] = useState(employerProfile?.area || '');
  const [pincode, setPincode] = useState(employerProfile?.pincode || '');
  const [lat, setLat] = useState<number | undefined>(employerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(employerProfile?.lng);
  const [businessAddress, setBusinessAddress] = useState(employerProfile?.businessAddress || '');

  // STEP 4: Verification
  const [documentNumber, setDocumentNumber] = useState(employerProfile?.documentNumber || '');

  const stepTitles = [
    'Owner Info',
    'Business Info',
    'Location',
    'Verification',
    'Review'
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Logo image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!ownerName.trim()) {
        setErrorMsg('Please enter your full name.');
        return false;
      }
      if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
        setErrorMsg('Please enter a valid owner email address.');
        return false;
      }
      if (!designation.trim()) {
        setErrorMsg('Please state your designation.');
        return false;
      }
    } else if (step === 2) {
      if (!businessName.trim()) {
        setErrorMsg('Please enter your registered or trade business name.');
        return false;
      }
      if (!businessCategory) {
        setErrorMsg('Please select a business category.');
        return false;
      }
    } else if (step === 3) {
      if (!state) {
        setErrorMsg('Please select your state.');
        return false;
      }
      if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
        return false;
      }
    } else if (step === 4) {
      if (!documentNumber.trim()) {
        setErrorMsg('Please provide a business identifier (GSTIN, PAN, Udyam MSME, or Shop Act number).');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmitProfile();
      }
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onCancel();
    }
  };

  const handleSubmitProfile = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
        designation: designation.trim(),
        businessName: businessName.trim(),
        businessCategory,
        businessDescription: businessDescription.trim(),
        businessLogo,
        website: website.trim(),
        state,
        district: district.trim(),
        city: city.trim(),
        area: area.trim(),
        pincode: pincode.trim(),
        lat: lat || 19.0760,
        lng: lng || 72.8777,
        businessAddress: businessAddress.trim(),
        documentNumber: documentNumber.trim()
      };

      await saveEmployerProfile(payload);
      onComplete();
    } catch (err: any) {
      console.error('Error saving employer profile:', err);
      setErrorMsg(err.message || 'Failed to create employer profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-gray-900 tracking-tight">
                JOB<span className="text-[#2563EB]">SETU</span>
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                Employer Onboarding
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Register your enterprise to recruit verified candidates across India
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Save & Exit
          </button>
        </div>

        {/* Progress Bar & Steps Indicator */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-gray-600">
            <span className="text-[#F59E0B]">
              Step {currentStep} of {TOTAL_STEPS}: {stepTitles[currentStep - 1]}
            </span>
            <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% Completed</span>
          </div>

          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#F59E0B] to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          <div className="hidden sm:flex justify-between items-center mt-4 pt-3 border-t border-gray-50 text-[11px] font-semibold text-gray-400">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isPast = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div
                  key={title}
                  className={`flex items-center gap-1.5 ${
                    isCurrent
                      ? 'text-[#F59E0B] font-bold'
                      : isPast
                      ? 'text-emerald-600'
                      : 'text-gray-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-[#F59E0B] text-white'
                        : isPast
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isPast ? '✓' : stepNum}
                  </span>
                  <span>{title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 transition-all">
          {/* STEP 1: Owner Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#F59E0B]" />
                  <span>Business Representative / Owner Information</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Point of contact responsible for candidate communication and compliance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rajesh Singhania"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Designation in the Business <span className="text-red-500">*</span>
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white"
                >
                  <option value="Proprietor / Business Owner">Proprietor / Business Owner</option>
                  <option value="Managing Director / CEO">Managing Director / CEO</option>
                  <option value="HR Manager / Talent Acquisition">HR Manager / Talent Acquisition</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Store / Facility Manager">Store / Facility Manager</option>
                  <option value="Authorized Representative">Authorized Representative</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Business Information */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#F59E0B]" />
                  <span>Business Information</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Information displayed to potential job applicants on JOBSETU.
                </p>
              </div>

              {/* Business Logo */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  {businessLogo ? (
                    <img
                      src={businessLogo}
                      alt="Business Logo"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F59E0B] shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center text-[#F59E0B]">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Logo</span>
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 bg-[#F59E0B] text-white p-1.5 rounded-lg shadow-md cursor-pointer hover:bg-amber-600 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Business Logo / Storefront Photo</p>
                  <p className="text-[11px] text-gray-500">
                    Helps job seekers recognize your brand or business premises.
                  </p>
                  {businessLogo && (
                    <button
                      type="button"
                      onClick={() => setBusinessLogo('')}
                      className="text-[11px] text-red-600 hover:underline mt-1 font-semibold"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Registered / Trading Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Omkar Logistics Pvt Ltd or Shanti Sweets & Catering"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm font-semibold"
                />
              </div>

              {/* Business Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Primary Business Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Brief Business Description
                </label>
                <textarea
                  rows={3}
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Tell candidates about your operations, staff size, work culture, or products..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Website / Google Maps Profile / Social Page (Optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#F59E0B]" />
                  <span>Workplace & Office Location</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Allows candidates in your vicinity to calculate commute time and apply.
                </p>
              </div>

              {/* Interactive Location Picker */}
              <LocationPicker
                state={state}
                setState={setState}
                district={district}
                setDistrict={setDistrict}
                city={city}
                setCity={setCity}
                area={area}
                setArea={setArea}
                pincode={pincode}
                setPincode={setPincode}
                lat={lat}
                lng={lng}
                onCoordinatesChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />

              {/* Full Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Business Address
                </label>
                <textarea
                  rows={2}
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Plot/Shop number, building name, landmark..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Verification */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
                  <span>Business Verification & Trust Compliance</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  JOBSETU protects job seekers against fraud by auditing every employer.
                </p>
              </div>

              {/* Status Notice Banner (Strict Rule: Never an unearned badge) */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                  <span>Initial Verification Status: Pending Document Audit</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  In compliance with JOBSETU integrity guidelines, newly registered employers start with a <strong>Pending</strong> status until our verification team reviews your business registration documents (typically within 24-48 hours). We never display unearned badges.
                </p>
              </div>

              {/* Verification Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Email Verification</p>
                      <p className="text-[11px] text-gray-500">{ownerEmail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Mobile Verification</p>
                      <p className="text-[11px] text-gray-500">{ownerPhone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                    Recorded
                  </span>
                </div>
              </div>

              {/* Business Registration Number / Document */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Business Registration / Identifier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                    placeholder="Enter GSTIN, PAN, Udyam MSME, or Shop & Establishment Act number"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm font-mono uppercase"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  e.g. 27AAAAA0000A1Z5 (GST) or AAAPL1234K (PAN) or UDYAM-MH-01-0000000
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Review Business Profile</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Confirm enterprise details before finalizing registration.
                </p>
              </div>

              {/* Review Card */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-gray-200 space-y-4 text-sm">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  {businessLogo ? (
                    <img
                      src={businessLogo}
                      alt={businessName}
                      className="w-16 h-16 rounded-2xl object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center font-bold text-xl">
                      {businessName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">{businessName}</h3>
                    <p className="text-xs text-gray-500">{businessCategory} • {state}, India</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Verification Status: Pending Review
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 block uppercase">Owner / Representative</span>
                    <p className="text-gray-800 font-semibold mt-0.5">
                      {ownerName} ({designation})
                    </p>
                    <p className="text-gray-500">{ownerEmail} • {ownerPhone}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase">Registration ID</span>
                    <p className="text-gray-800 font-mono font-bold mt-0.5">
                      {documentNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500 block text-xs uppercase mb-1">
                    Address
                  </span>
                  <p className="text-xs text-gray-700">
                    {businessAddress ? `${businessAddress}, ` : ''}{area ? `${area}, ` : ''}{city ? `${city}, ` : ''}{district ? `${district}, ` : ''}{state} - {pincode}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="py-3 px-5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="py-3 px-7 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Creating Employer Profile...</span>
              ) : currentStep === TOTAL_STEPS ? (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Create Employer Profile</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
