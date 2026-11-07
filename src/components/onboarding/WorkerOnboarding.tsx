import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Calendar,
  MapPin,
  GraduationCap,
  Wrench,
  Clock,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  X,
  AlertCircle,
  Camera,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  INDIAN_STATES_AND_UTS,
  SKILL_CATEGORIES_DATA,
  EducationLevel,
  ExperienceLevel,
  Gender,
  WorkerProfile
} from '../../types';
import { LocationPicker } from '../common/LocationPicker';

interface WorkerOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TOTAL_STEPS = 7;

export const WorkerOnboarding: React.FC<WorkerOnboardingProps> = ({ onComplete, onCancel }) => {
  const { currentUser, userProfile, workerProfile, saveWorkerProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: Personal info
  const [fullName, setFullName] = useState(workerProfile?.fullName || userProfile?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(workerProfile?.dateOfBirth || '');
  const [ageEligibilityConfirmed, setAgeEligibilityConfirmed] = useState(
    workerProfile?.ageEligibilityConfirmed ?? true
  );
  const [gender, setGender] = useState<Gender>(
    workerProfile?.gender === 'female' || workerProfile?.gender === 'other' ? workerProfile.gender : 'male'
  );
  const [profilePhoto, setProfilePhoto] = useState(
    workerProfile?.profilePhoto || userProfile?.profilePhoto || ''
  );
  const [isPhotoVerifiedReal, setIsPhotoVerifiedReal] = useState<boolean>(
    workerProfile?.isPhotoVerifiedReal ?? true
  );

  // STEP 2: Location
  const [country] = useState('India');
  const [state, setState] = useState(workerProfile?.state || '');
  const [district, setDistrict] = useState(workerProfile?.district || '');
  const [city, setCity] = useState(workerProfile?.city || '');
  const [area, setArea] = useState(workerProfile?.area || '');
  const [pincode, setPincode] = useState(workerProfile?.pincode || '');
  const [lat, setLat] = useState<number | undefined>(workerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(workerProfile?.lng);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    workerProfile?.preferredLocations || []
  );
  const [locationInput, setLocationInput] = useState('');

  // STEP 3: Education
  const [education, setEducation] = useState<EducationLevel>(
    workerProfile?.education || 'Higher secondary'
  );

  // STEP 4: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>(workerProfile?.skills || []);
  const [customSkills, setCustomSkills] = useState<string[]>(workerProfile?.customSkills || []);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('All');

  // STEP 5: Experience
  const [experience, setExperience] = useState<ExperienceLevel>(
    workerProfile?.experience || '1–3 years'
  );

  // STEP 6: Job preferences
  const [jobTypes, setJobTypes] = useState<string[]>(
    workerProfile?.jobPreferences?.jobTypes || ['Full-time']
  );
  const [expectedSalary, setExpectedSalary] = useState(
    workerProfile?.jobPreferences?.expectedSalary || '₹15,000 - ₹25,000 / month'
  );
  const [availability, setAvailability] = useState<'Immediate' | 'Within 15 days' | 'Within 1 month' | 'Flexible'>(
    workerProfile?.jobPreferences?.availability || 'Immediate'
  );

  const stepTitles = [
    'Personal Info',
    'Location',
    'Education',
    'Skills',
    'Experience',
    'Preferences',
    'Review'
  ];

  // Photo upload simulation / data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return false;
      }
      if (!gender) {
        setErrorMsg('Gender is mandatory. Please select Male, Female, or Other.');
        return false;
      }
      if (!profilePhoto) {
        setErrorMsg('Profile photo is mandatory. Please upload your real photograph.');
        return false;
      }
      if (!isPhotoVerifiedReal) {
        setErrorMsg('Please confirm that your photo is an authentic photograph of a real person and not AI-generated.');
        return false;
      }
      if (!ageEligibilityConfirmed) {
        setErrorMsg('You must confirm that you are 18 years of age or older to seek employment on JOBSETU.');
        return false;
      }
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          setErrorMsg('Initial job-seeker eligibility requires candidate to be 18+ years old.');
          return false;
        }
      }
    } else if (step === 2) {
      if (!state) {
        setErrorMsg('Please select your state.');
        return false;
      }
      if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
        return false;
      }
    } else if (step === 3) {
      if (!education) {
        setErrorMsg('Please select your highest level of education.');
        return false;
      }
    } else if (step === 4) {
      if (selectedSkills.length === 0 && customSkills.length === 0) {
        setErrorMsg('Please select at least one skill or add a custom skill.');
        return false;
      }
    } else if (step === 5) {
      if (!experience) {
        setErrorMsg('Please specify your experience level.');
        return false;
      }
    } else if (step === 6) {
      if (jobTypes.length === 0) {
        setErrorMsg('Please select at least one job type preference.');
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

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !customSkills.includes(trimmed) && !selectedSkills.includes(trimmed)) {
      setCustomSkills(prev => [...prev, trimmed]);
      setCustomSkillInput('');
    }
  };

  const removeCustomSkill = (skill: string) => {
    setCustomSkills(prev => prev.filter(s => s !== skill));
  };

  const addPreferredLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !preferredLocations.includes(trimmed)) {
      setPreferredLocations(prev => [...prev, trimmed]);
      setLocationInput('');
    }
  };

  const removePreferredLocation = (loc: string) => {
    setPreferredLocations(prev => prev.filter(l => l !== loc));
  };

  const toggleJobType = (type: string) => {
    setJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmitProfile = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const profilePayload = {
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || '',
        ageEligibilityConfirmed: true,
        gender,
        profilePhoto: profilePhoto || '',
        isPhotoVerifiedReal: !!isPhotoVerifiedReal,
        country: 'India',
        state,
        district: district.trim(),
        city: city.trim(),
        area: area.trim(),
        pincode: pincode.trim(),
        lat: lat || 28.6139,
        lng: lng || 77.2090,
        preferredLocations,
        education,
        skills: selectedSkills,
        customSkills,
        experience,
        jobPreferences: {
          jobTypes,
          expectedSalary,
          availability,
          preferredLocations
        }
      };

      await saveWorkerProfile(profilePayload);
      onComplete();
    } catch (err: any) {
      console.error('Error saving worker profile:', err);
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
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
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-[#2563EB]">
                Worker Onboarding
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Complete your profile to unlock job opportunities across India
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
            <span className="text-[#2563EB]">Step {currentStep} of {TOTAL_STEPS}: {stepTitles[currentStep - 1]}</span>
            <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% Completed</span>
          </div>

          {/* Visual Bar */}
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#2563EB] to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Mini Stepper Chips */}
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
                      ? 'text-[#2563EB] font-bold'
                      : isPast
                      ? 'text-emerald-600'
                      : 'text-gray-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-[#2563EB] text-white'
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

        {/* Step Content Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 transition-all">
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2563EB]" />
                  <span>Personal Information</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your identity helps employers connect with you safely.
                </p>
              </div>

              {/* Profile Photo (Authentic Real Person Requirement) */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative group shrink-0">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Candidate Portrait"
                        className="w-24 h-24 rounded-2xl object-cover border-3 border-[#2563EB] shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-[#2563EB]">
                        <Camera className="w-7 h-7 mb-1 text-[#2563EB]" />
                        <span className="text-[10px] font-bold">Photo *</span>
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 bg-[#2563EB] text-white p-2 rounded-xl shadow-md cursor-pointer hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">Real Profile Photograph <span className="text-red-500">*</span></p>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Real Person Only
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      JOBSETU mandates an authentic portrait of the job seeker. <strong>AI-generated, cartoon, or stock avatars are prohibited</strong> to protect employer trust and verification.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>{profilePhoto ? 'Change Profile Photo' : 'Upload Your Real Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {profilePhoto && (
                        <button
                          type="button"
                          onClick={() => setProfilePhoto('')}
                          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Authenticity Confirmation Checkbox */}
                <div className="p-3 bg-white rounded-xl border border-blue-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPhotoVerifiedReal}
                      onChange={(e) => setIsPhotoVerifiedReal(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-gray-800 font-medium">
                      I confirm and certify that this is a real photograph of an actual person and is not AI-generated or synthetic. <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none text-sm font-medium"
                />
              </div>

              {/* Date of Birth & Mandatory Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Date of Birth <span className="text-gray-400 font-normal">(DD/MM/YYYY)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Mandatory Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm bg-white font-medium"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Age Eligibility Checkbox (CRITICAL 18+ requirement) */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageEligibilityConfirmed}
                    onChange={(e) => setAgeEligibilityConfirmed(e.target.checked)}
                    className="w-5 h-5 rounded text-[#2563EB] focus:ring-[#2563EB] mt-0.5 shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900 block">
                      Age Eligibility Confirmation (18+ Requirement) <span className="text-red-500">*</span>
                    </span>
                    <span className="text-gray-600 leading-relaxed mt-0.5 block">
                      I confirm that I am at least 18 years of age and legally eligible for adult employment in India in accordance with national labor guidelines.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2563EB]" />
                  <span>Location & Contact Area</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Helps employers find you for nearby jobs and regional vacancies.
                </p>
              </div>

              {/* Interactive Location Picker with Map, GPS, and Manual Modes */}
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

              {/* Preferred Job Locations */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Preferred Job Locations (Where are you willing to work?)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferredLocation())}
                    placeholder="e.g. Noida, Gurgaon, Mumbai Suburban"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={addPreferredLocation}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferredLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => removePreferredLocation(loc)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Education */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#2563EB]" />
                  <span>Educational Qualification</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  JOBSETU supports all qualifications from practical trades to postgraduate degrees.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'No formal education',
                  'Primary',
                  'Secondary',
                  'Higher secondary',
                  'Diploma',
                  'ITI',
                  'Undergraduate',
                  'Graduate',
                  'Postgraduate',
                  'Other'
                ].map((lvl) => {
                  const isSelected = education === lvl;
                  return (
                    <label
                      key={lvl}
                      onClick={() => setEducation(lvl as EducationLevel)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-[#2563EB] bg-[#2563EB]' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="font-bold text-sm text-gray-800">{lvl}</span>
                      </div>
                      {lvl === 'ITI' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Trade Certified
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Skills */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#2563EB]" />
                  <span>Skills & Vocations</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select your skills across categories or add custom ones.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  placeholder="Search any skill (e.g. Electrician, Sales, Cooking, Accounting)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm"
                />
              </div>

              {/* Category Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeCategoryTab === 'All'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Sectors
                </button>
                {Object.keys(SKILL_CATEGORIES_DATA).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      activeCategoryTab === cat
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Categorized Skills Grid */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.entries(SKILL_CATEGORIES_DATA)
                  .filter(([cat]) => activeCategoryTab === 'All' || activeCategoryTab === cat)
                  .map(([category, skillsList]) => {
                    const matchingSkills = skillsList.filter(s =>
                      s.toLowerCase().includes(skillSearchQuery.toLowerCase())
                    );
                    if (matchingSkills.length === 0) return null;

                    return (
                      <div key={category} className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2.5">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchingSkills.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#2563EB] text-white shadow-xs'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#2563EB]'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>{skill}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Custom Skills Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Add Custom Skills (Cannot find your skill above?)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                    placeholder="e.g. CNC Machine Operator, CCTV Installation"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white font-bold text-xs transition-colors"
                  >
                    + Add Skill
                  </button>
                </div>

                {customSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customSkills.map((cs) => (
                      <span
                        key={cs}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900"
                      >
                        <span>{cs}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomSkill(cs)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Skills Selected Badge */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span>Selected Skills: {selectedSkills.length + customSkills.length}</span>
                <span className="text-[#2563EB]">Choose as many relevant skills as you possess</span>
              </div>
            </div>
          )}

          {/* STEP 5: Experience */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2563EB]" />
                  <span>Years of Experience</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Both freshers and seasoned veterans find high-demand roles.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Fresher', desc: 'No formal prior experience; eager to learn and work hard' },
                  { label: 'Less than one year', desc: 'Entry level with up to 12 months on-the-job experience' },
                  { label: '1–3 years', desc: 'Good practical command in your chosen trade or vocation' },
                  { label: '3–5 years', desc: 'Solid experience capable of working independently' },
                  { label: 'More than five years', desc: 'Expert craftsman, specialist, or supervisor' }
                ].map((item) => {
                  const isSelected = experience === item.label;
                  return (
                    <label
                      key={item.label}
                      onClick={() => setExperience(item.label as ExperienceLevel)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-[#2563EB] bg-[#2563EB]' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Job Preferences */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#2563EB]" />
                  <span>Job Preferences & Availability</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tell employers what kind of work arrangements suit your needs.
                </p>
              </div>

              {/* Job Types (Multi-select) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Job Type Preferences <span className="text-gray-400 font-normal">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Full-time', 'Part-time', 'Temporary', 'Contract', 'Work from home'].map((jt) => {
                    const isSelected = jobTypes.includes(jt);
                    return (
                      <button
                        key={jt}
                        type="button"
                        onClick={() => toggleJobType(jt)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{jt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expected Salary */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Expected Monthly Salary or Wage Range
                </label>
                <select
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                >
                  <option value="₹10,000 - ₹15,000 / month">₹10,000 - ₹15,000 / month</option>
                  <option value="₹15,000 - ₹25,000 / month">₹15,000 - ₹25,000 / month</option>
                  <option value="₹25,000 - ₹40,000 / month">₹25,000 - ₹40,000 / month</option>
                  <option value="₹40,000 - ₹70,000 / month">₹40,000 - ₹70,000 / month</option>
                  <option value="₹70,000+ / month">₹70,000+ / month</option>
                  <option value="Daily wage negotiable">Daily wage / Piece rate negotiable</option>
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Availability to Join
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['Immediate', 'Within 15 days', 'Within 1 month', 'Flexible'] as const).map((avail) => {
                    const isSelected = availability === avail;
                    return (
                      <button
                        key={avail}
                        type="button"
                        onClick={() => setAvailability(avail)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {avail}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Submit */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Review Your Profile</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Please verify that all details are accurate before submitting to JOBSETU.
                </p>
              </div>

              {/* Review Card */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-gray-200 space-y-5 text-sm">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={fullName}
                      className="w-16 h-16 rounded-2xl object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xl">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">{fullName}</h3>
                    <p className="text-xs text-gray-500">{education} • {experience}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        18+ Verified
                      </span>
                      <span className="text-xs text-gray-600">{state}, India</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 block uppercase">Location Details</span>
                    <p className="text-gray-800 font-semibold mt-0.5">
                      {area ? `${area}, ` : ''}{city ? `${city}, ` : ''}{district ? `${district}, ` : ''}{state} - {pincode}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase">Work Availability</span>
                    <p className="text-gray-800 font-semibold mt-0.5">
                      {availability} • {expectedSalary}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500 block text-xs uppercase mb-1.5">
                    Job Type Preferences
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {jobTypes.map((jt) => (
                      <span key={jt} className="px-2.5 py-1 rounded-md bg-blue-100 text-[#2563EB] text-xs font-semibold">
                        {jt}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-500 block text-xs uppercase mb-1.5">
                    Selected Skills ({selectedSkills.length + customSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-md bg-white border border-gray-300 text-gray-800 text-xs font-semibold">
                        {sk}
                      </span>
                    ))}
                    {customSkills.map((cs) => (
                      <span key={cs} className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                        ★ {cs}
                      </span>
                    ))}
                  </div>
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
              className="py-3 px-7 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Saving to Firestore...</span>
              ) : currentStep === TOTAL_STEPS ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit Worker Profile</span>
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
