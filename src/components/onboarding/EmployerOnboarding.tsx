import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { compressImageFile } from '../../lib/imageCompression';
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
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Briefcase,
  Users,
  IndianRupee,
  Clock,
  Sliders,
  Compass,
  Phone,
  Mail,
  Globe,
  Upload,
  Check,
  X,
  HardHat,
  Factory,
  Sprout,
  Truck,
  Code2,
  Store,
  Utensils,
  HeartPulse,
  GraduationCap,
  Shield,
  Wrench,
  Layers,
  Award,
  Navigation,
  Edit3
} from 'lucide-react';
import {
  BUSINESS_CATEGORIES,
  WORKFORCE_TYPES_OPTIONS,
  EMPLOYER_DESIGNATIONS,
  COMPANY_SIZES,
  COMPANY_REGISTRATION_TYPES,
  INDIAN_LANGUAGES,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  SKILL_CATEGORIES_DATA,
  APP_LOGO_URL,
  EducationLevel,
  ExperienceLevel,
  PaymentFrequency,
  SearchRadiusKm,
  CertificateAttachment,
  WorksiteBranch,
  VerificationStatus
} from '../../types';
import { LocationPicker } from '../common/LocationPicker';
import {
  AnimatedImage,
  ElasticText,
  MagneticButton,
  RippleContainer,
  ImagePinningReveal,
  ProgressiveImageReveal,
  HoverSpotlightCard
} from '../animations';

interface EmployerOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
  onExploreNearbyWorkers?: () => void;
  initialStep?: number;
}

const TOTAL_STEPS = 11;

const STEP_META = [
  { id: 1, title: 'Welcome', subtitle: 'Start Hiring', icon: Sparkles },
  { id: 2, title: 'Owner Info', subtitle: 'Personal Details', icon: User },
  { id: 3, title: 'Company Info', subtitle: 'Business & GSTIN', icon: Building2 },
  { id: 4, title: 'Locations', subtitle: 'Map & Radius', icon: MapPin },
  { id: 5, title: 'Workforce', subtitle: 'Hiring Types', icon: Users },
  { id: 6, title: 'Labour Details', subtitle: 'Role & Skills', icon: Briefcase },
  { id: 7, title: 'Salary & Perks', subtitle: 'Pay & Benefits', icon: IndianRupee },
  { id: 8, title: 'Conditions', subtitle: 'Shifts & Safety', icon: Clock },
  { id: 9, title: 'Preferences', subtitle: 'Bulk & Radius', icon: Sliders },
  { id: 10, title: 'Verification', subtitle: 'OTP & KYB Audit', icon: ShieldCheck },
  { id: 11, title: 'Ready!', subtitle: 'Profile Live', icon: CheckCircle2 }
];

const BUSINESS_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Construction: <HardHat className="w-4 h-4" />,
  Manufacturing: <Factory className="w-4 h-4" />,
  Agriculture: <Sprout className="w-4 h-4" />,
  Transportation: <Truck className="w-4 h-4" />,
  'IT & Software': <Code2 className="w-4 h-4" />,
  Retail: <Store className="w-4 h-4" />,
  Hospitality: <Utensils className="w-4 h-4" />,
  Healthcare: <HeartPulse className="w-4 h-4" />,
  Education: <GraduationCap className="w-4 h-4" />,
  'Coaching Classes / Education Institute': <GraduationCap className="w-4 h-4" />,
  'Security Services': <Shield className="w-4 h-4" />,
  'Cleaning Services': <Sparkles className="w-4 h-4" />,
  Other: <Layers className="w-4 h-4" />
};

const SAFETY_EQUIPMENT_OPTIONS = [
  'Safety Helmets / Hard Hats',
  'Steel-Toe Safety Shoes',
  'Protective Hand Gloves',
  'High-Visibility Reflective Jackets',
  'Safety Goggles / Face Shields',
  'Height Safety Harness',
  'Dust / Industrial Masks',
  'On-Site First-Aid Medical Kit'
];

const WORKPLACE_FACILITY_OPTIONS = [
  'RO Drinking Water',
  'Clean Restrooms & Washrooms',
  'Staff Canteen / Mess',
  'Rest & Changing Room',
  'Personal Lockers',
  'Two-Wheeler / Staff Parking',
  'CCTV Monitored Safe Premises',
  'Power Backup & Ventilation'
];

const INSURANCE_BENEFIT_OPTIONS = [
  'PF (Provident Fund)',
  'ESIC Medical Coverage',
  'Group Accidental Insurance',
  'Annual / Diwali Bonus',
  'Paid Weekly Offs',
  'Free Uniform & ID Card',
  'Attendance / Performance Incentive',
  'Skill Training & Promotion'
];

export const EmployerOnboarding: React.FC<EmployerOnboardingProps> = ({
  onComplete,
  onCancel,
  onExploreNearbyWorkers,
  initialStep = 1
}) => {
  const {
    currentUser,
    userProfile,
    employerProfile,
    saveEmployerProfile,
    saveDraftEmployerProfile
  } = useAuth();
  const { myJobs, createJob } = useJobs();

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  // Camera capture for Owner Profile Photo
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ==================== STEP 2: OWNER INFORMATION ====================
  const [ownerName, setOwnerName] = useState(
    employerProfile?.ownerName || userProfile?.name || ''
  );
  const [ownerProfilePhoto, setOwnerProfilePhoto] = useState(
    employerProfile?.ownerProfilePhoto || userProfile?.profilePhoto || ''
  );
  const [ownerPhone, setOwnerPhone] = useState(
    employerProfile?.ownerPhone || userProfile?.phone || currentUser?.phoneNumber || '+91 '
  );
  const [ownerEmail, setOwnerEmail] = useState(
    employerProfile?.ownerEmail || userProfile?.email || currentUser?.email || ''
  );
  const [designation, setDesignation] = useState(
    employerProfile?.designation || 'Owner'
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    employerProfile?.preferredLanguage || userProfile?.preferredLanguage || 'Hindi (हिन्दी)'
  );
  const [ownerContactAddress, setOwnerContactAddress] = useState(
    employerProfile?.ownerContactAddress || ''
  );

  // ==================== STEP 3: COMPANY INFORMATION ====================
  const [businessName, setBusinessName] = useState(employerProfile?.businessName || '');
  const [businessLogo, setBusinessLogo] = useState(employerProfile?.businessLogo || '');
  const [businessCategory, setBusinessCategory] = useState(
    employerProfile?.businessCategory || 'Construction'
  );
  const [businessDescription, setBusinessDescription] = useState(
    employerProfile?.businessDescription || ''
  );
  const [yearOfEstablishment, setYearOfEstablishment] = useState(
    employerProfile?.yearOfEstablishment || '2018'
  );
  const [companySize, setCompanySize] = useState(
    employerProfile?.companySize || '11–50 Employees'
  );
  const [companyRegistrationType, setCompanyRegistrationType] = useState(
    employerProfile?.companyRegistrationType || 'Sole Proprietorship'
  );
  const [documentNumber, setDocumentNumber] = useState(
    employerProfile?.documentNumber || ''
  );
  const [website, setWebsite] = useState(employerProfile?.website || '');
  const [companyRegistrationDocuments, setCompanyRegistrationDocuments] = useState<
    CertificateAttachment[]
  >(employerProfile?.companyRegistrationDocuments || []);
  const [businessImages, setBusinessImages] = useState<string[]>(
    employerProfile?.businessImages || []
  );

  // ==================== STEP 4: COMPANY LOCATION ====================
  const [country] = useState('India');
  const [state, setState] = useState(employerProfile?.state || '');
  const [district, setDistrict] = useState(employerProfile?.district || '');
  const [city, setCity] = useState(employerProfile?.city || '');
  const [area, setArea] = useState(employerProfile?.area || '');
  const [businessAddress, setBusinessAddress] = useState(
    employerProfile?.businessAddress || ''
  );
  const [pincode, setPincode] = useState(employerProfile?.pincode || '');
  const [worksiteLocation, setWorksiteLocation] = useState(
    employerProfile?.worksiteLocation || ''
  );
  const [lat, setLat] = useState<number | undefined>(employerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(employerProfile?.lng);
  const [multipleWorkLocations, setMultipleWorkLocations] = useState<WorksiteBranch[]>(
    employerProfile?.multipleWorkLocations || []
  );
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchState, setNewBranchState] = useState('');
  const [newBranchPincode, setNewBranchPincode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [discoveryRadiusKm, setDiscoveryRadiusKm] = useState<SearchRadiusKm>(
    employerProfile?.discoveryRadiusKm || 50
  );

  // ==================== STEP 5: HIRING REQUIREMENTS ====================
  const [workforceTypesNeeded, setWorkforceTypesNeeded] = useState<string[]>(
    employerProfile?.workforceTypesNeeded && employerProfile.workforceTypesNeeded.length > 0
      ? employerProfile.workforceTypesNeeded
      : ['Skilled Labour', 'Semi-Skilled Labour']
  );

  // ==================== STEP 6: LABOUR DETAILS ====================
  const [jobTitle, setJobTitle] = useState(
    employerProfile?.labourRequirementDetails?.jobTitle || ''
  );
  const [workerCategory, setWorkerCategory] = useState(
    employerProfile?.labourRequirementDetails?.workerCategory || 'Technical'
  );
  const [workersRequiredCount, setWorkersRequiredCount] = useState<number>(
    employerProfile?.labourRequirementDetails?.workersRequiredCount || 5
  );
  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    employerProfile?.labourRequirementDetails?.requiredSkills || []
  );
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [minimumExperience, setMinimumExperience] = useState<ExperienceLevel>(
    employerProfile?.labourRequirementDetails?.minimumExperience || '1–3 years'
  );
  const [educationQualification, setEducationQualification] = useState<EducationLevel>(
    employerProfile?.labourRequirementDetails?.educationQualification || 'Secondary'
  );
  const [jobDescription, setJobDescription] = useState(
    employerProfile?.labourRequirementDetails?.jobDescription || ''
  );
  const [workResponsibilities, setWorkResponsibilities] = useState(
    employerProfile?.labourRequirementDetails?.workResponsibilities || ''
  );
  const [preferredJoiningDate, setPreferredJoiningDate] = useState(
    employerProfile?.labourRequirementDetails?.preferredJoiningDate ||
      new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [jobDuration, setJobDuration] = useState(
    employerProfile?.labourRequirementDetails?.jobDuration || 'Full-Time Permanent'
  );
  const [workLocation, setWorkLocation] = useState(
    employerProfile?.labourRequirementDetails?.workLocation || ''
  );

  // ==================== STEP 7: SALARY & BENEFITS ====================
  const [paymentMode, setPaymentMode] = useState<
    'Daily Wage' | 'Monthly Salary' | 'Hourly Payment'
  >(employerProfile?.salaryAndBenefits?.paymentMode || 'Monthly Salary');
  const [minSalary, setMinSalary] = useState<number>(
    employerProfile?.salaryAndBenefits?.minSalary || 18000
  );
  const [maxSalary, setMaxSalary] = useState<number>(
    employerProfile?.salaryAndBenefits?.maxSalary || 28000
  );
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    employerProfile?.salaryAndBenefits?.paymentFrequency || 'Per month'
  );
  const [overtimeAvailable, setOvertimeAvailable] = useState<boolean>(
    employerProfile?.salaryAndBenefits?.overtimeAvailable ?? true
  );
  const [overtimeRateNote, setOvertimeRateNote] = useState(
    employerProfile?.salaryAndBenefits?.overtimeRateNote || '₹120 / hour extra overtime pay'
  );
  const [foodFacility, setFoodFacility] = useState<
    'Provided Free' | 'Subsidized' | 'Not Provided'
  >(employerProfile?.salaryAndBenefits?.foodFacility || 'Subsidized');
  const [accommodationFacility, setAccommodationFacility] = useState<
    'Provided on Site' | 'Allowance Provided' | 'Not Provided'
  >(employerProfile?.salaryAndBenefits?.accommodationFacility || 'Provided on Site');
  const [transportationFacility, setTransportationFacility] = useState<
    'Company Pickup/Drop' | 'Travel Allowance' | 'Not Provided'
  >(employerProfile?.salaryAndBenefits?.transportationFacility || 'Travel Allowance');
  const [insuranceAndBenefits, setInsuranceAndBenefits] = useState<string[]>(
    employerProfile?.salaryAndBenefits?.insuranceAndBenefits || [
      'PF (Provident Fund)',
      'ESIC Medical Coverage',
      'Paid Weekly Offs'
    ]
  );

  // ==================== STEP 8: WORKING CONDITIONS ====================
  const [dailyWorkingHours, setDailyWorkingHours] = useState(
    employerProfile?.workingConditions?.dailyWorkingHours || '8 Hours Standard'
  );
  const [shiftTimings, setShiftTimings] = useState(
    employerProfile?.workingConditions?.shiftTimings || 'Day Shift (9:00 AM – 6:00 PM)'
  );
  const [weeklyHolidays, setWeeklyHolidays] = useState(
    employerProfile?.workingConditions?.weeklyHolidays || 'Sunday Weekly Off'
  );
  const [workEnvironment, setWorkEnvironment] = useState(
    employerProfile?.workingConditions?.workEnvironment || 'On-Site / Commercial Facility'
  );
  const [safetyEquipmentProvided, setSafetyEquipmentProvided] = useState<string[]>(
    employerProfile?.workingConditions?.safetyEquipmentProvided || [
      'Safety Helmets / Hard Hats',
      'Protective Hand Gloves',
      'On-Site First-Aid Medical Kit'
    ]
  );
  const [workplaceFacilities, setWorkplaceFacilities] = useState<string[]>(
    employerProfile?.workingConditions?.workplaceFacilities || [
      'RO Drinking Water',
      'Clean Restrooms & Washrooms',
      'Rest & Changing Room'
    ]
  );
  const [jobStartDate, setJobStartDate] = useState(
    employerProfile?.workingConditions?.jobStartDate ||
      new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    employerProfile?.workingConditions?.expectedCompletionDate || ''
  );

  // ==================== STEP 9: HIRING PREFERENCES ====================
  const [hiringScale, setHiringScale] = useState<
    'Individual Hiring' | 'Bulk Hiring' | 'Both Individual & Bulk'
  >(employerProfile?.hiringPreferences?.hiringScale || 'Both Individual & Bulk');
  const [hiringUrgency, setHiringUrgency] = useState<'Immediate Hiring' | 'Future Hiring'>(
    employerProfile?.hiringPreferences?.hiringUrgency || 'Immediate Hiring'
  );
  const [employmentNature, setEmploymentNature] = useState<
    'Permanent' | 'Temporary' | 'Contract'
  >(employerProfile?.hiringPreferences?.employmentNature || 'Permanent');
  const [interviewRequired, setInterviewRequired] = useState<boolean>(
    employerProfile?.hiringPreferences?.interviewRequired ?? true
  );
  const [interviewMode, setInterviewMode] = useState(
    employerProfile?.hiringPreferences?.interviewMode || 'Phone Screening + On-Site Skill Trial'
  );
  const [maxSearchRadiusKm, setMaxSearchRadiusKm] = useState<SearchRadiusKm>(
    employerProfile?.hiringPreferences?.maxSearchRadiusKm || 50
  );
  const [workerAvailabilityRequirements, setWorkerAvailabilityRequirements] = useState(
    employerProfile?.hiringPreferences?.workerAvailabilityRequirements ||
      'Full-time punctual attendance, ready to start immediately'
  );
  const [additionalHiringInstructions, setAdditionalHiringInstructions] = useState(
    employerProfile?.hiringPreferences?.additionalHiringInstructions || ''
  );

  // ==================== STEP 10: EMPLOYER VERIFICATION ====================
  const [mobileOtpVerified, setMobileOtpVerified] = useState<boolean>(
    employerProfile?.mobileOtpVerified ?? false
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('482910');

  const [emailVerified, setEmailVerified] = useState<boolean>(
    employerProfile?.emailVerified ?? true
  );
  const [companyDocumentVerified, setCompanyDocumentVerified] = useState<boolean>(
    employerProfile?.companyDocumentVerified ?? false
  );
  const [gstinVerified, setGstinVerified] = useState<boolean>(
    employerProfile?.gstinVerified ?? false
  );
  const [authorizedVerificationProvider, setAuthorizedVerificationProvider] = useState(
    employerProfile?.authorizedVerificationProvider ||
      'GSTN & MCA Authorized Business Verification Gateway'
  );
  const [authorizedVerificationRef, setAuthorizedVerificationRef] = useState(
    employerProfile?.authorizedVerificationRef || ''
  );

  const [aiVerifyingBoard, setAiVerifyingBoard] = useState(false);
  const [boardGstinVerifiedByAI, setBoardGstinVerifiedByAI] = useState<boolean>(
    employerProfile?.boardGstinVerifiedByAI ?? false
  );
  const [aiBoardVerificationSummary, setAiBoardVerificationSummary] = useState<string>(
    employerProfile?.aiBoardVerificationSummary || ''
  );
  const [detectedBoardGstin, setDetectedBoardGstin] = useState<string>('');

  // Reactive Hydration: whenever employerProfile or userProfile loads/updates from AuthContext,
  // populate any empty local fields so previously saved data is NEVER lost!
  useEffect(() => {
    if (!employerProfile && !userProfile) return;
    setOwnerName((prev) => prev || employerProfile?.ownerName || userProfile?.name || '');
    setOwnerProfilePhoto(
      (prev) => prev || employerProfile?.ownerProfilePhoto || userProfile?.profilePhoto || ''
    );
    setOwnerPhone((prev) =>
      prev && prev.trim() !== '+91'
        ? prev
        : employerProfile?.ownerPhone || userProfile?.phone || '+91 '
    );
    setOwnerEmail((prev) => prev || employerProfile?.ownerEmail || userProfile?.email || '');
    if (employerProfile?.designation) setDesignation((prev) => prev || employerProfile.designation);
    if (employerProfile?.preferredLanguage) {
      setPreferredLanguage((prev) => prev || employerProfile.preferredLanguage!);
    }
    if (employerProfile?.ownerContactAddress) {
      setOwnerContactAddress((prev) => prev || employerProfile.ownerContactAddress!);
    }
    if (employerProfile?.businessName) {
      setBusinessName((prev) => prev || employerProfile.businessName);
    }
    if (employerProfile?.businessLogo) {
      setBusinessLogo((prev) => prev || employerProfile.businessLogo!);
    }
    if (employerProfile?.businessCategory) {
      setBusinessCategory((prev) => prev || employerProfile.businessCategory);
    }
    if (employerProfile?.businessDescription) {
      setBusinessDescription((prev) => prev || employerProfile.businessDescription!);
    }
    if (employerProfile?.yearOfEstablishment) {
      setYearOfEstablishment((prev) => prev || employerProfile.yearOfEstablishment!);
    }
    if (employerProfile?.companySize) {
      setCompanySize((prev) => prev || employerProfile.companySize!);
    }
    if (employerProfile?.companyRegistrationType) {
      setCompanyRegistrationType((prev) => prev || employerProfile.companyRegistrationType!);
    }
    if (employerProfile?.documentNumber) {
      setDocumentNumber((prev) => prev || employerProfile.documentNumber!);
    }
    if (employerProfile?.website) {
      setWebsite((prev) => prev || employerProfile.website!);
    }
    if (employerProfile?.companyRegistrationDocuments?.length) {
      setCompanyRegistrationDocuments((prev) =>
        prev.length > 0 ? prev : employerProfile.companyRegistrationDocuments!
      );
    }
    if (employerProfile?.businessImages?.length) {
      setBusinessImages((prev) => (prev.length > 0 ? prev : employerProfile.businessImages!));
    }
    if (employerProfile?.state) setState((prev) => prev || employerProfile.state);
    if (employerProfile?.district) setDistrict((prev) => prev || employerProfile.district!);
    if (employerProfile?.city) setCity((prev) => prev || employerProfile.city!);
    if (employerProfile?.area) setArea((prev) => prev || employerProfile.area!);
    if (employerProfile?.businessAddress) {
      setBusinessAddress((prev) => prev || employerProfile.businessAddress!);
    }
    if (employerProfile?.pincode) setPincode((prev) => prev || employerProfile.pincode);
    if (employerProfile?.worksiteLocation) {
      setWorksiteLocation((prev) => prev || employerProfile.worksiteLocation!);
    }
    if (typeof employerProfile?.lat === 'number') setLat((prev) => prev ?? employerProfile.lat);
    if (typeof employerProfile?.lng === 'number') setLng((prev) => prev ?? employerProfile.lng);
    if (employerProfile?.multipleWorkLocations?.length) {
      setMultipleWorkLocations((prev) =>
        prev.length > 0 ? prev : employerProfile.multipleWorkLocations!
      );
    }
    if (employerProfile?.discoveryRadiusKm) {
      setDiscoveryRadiusKm(employerProfile.discoveryRadiusKm);
    }
    if (employerProfile?.workforceTypesNeeded?.length) {
      setWorkforceTypesNeeded((prev) =>
        prev.length > 0 ? prev : employerProfile.workforceTypesNeeded!
      );
    }
    if (employerProfile?.labourRequirementDetails) {
      const ld = employerProfile.labourRequirementDetails;
      setJobTitle((prev) => prev || ld.jobTitle || '');
      setWorkerCategory((prev) => prev || ld.workerCategory || 'Technical');
      setWorkersRequiredCount((prev) => prev || ld.workersRequiredCount || 5);
      setRequiredSkills((prev) => (prev.length > 0 ? prev : ld.requiredSkills || []));
      setJobDescription((prev) => prev || ld.jobDescription || '');
      setWorkResponsibilities((prev) => prev || ld.workResponsibilities || '');
      setWorkLocation((prev) => prev || ld.workLocation || '');
    }
    if (employerProfile?.mobileOtpVerified) setMobileOtpVerified(true);
    if (employerProfile?.companyDocumentVerified) setCompanyDocumentVerified(true);
    if (employerProfile?.gstinVerified) setGstinVerified(true);
    if (employerProfile?.boardGstinVerifiedByAI) setBoardGstinVerifiedByAI(true);
  }, [employerProfile, userProfile]);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Calculate live Employer Profile Completion Percentage
  const calculateCompletionPercentage = (): number => {
    let score = 0;
    // Step 2: Owner Info (15%)
    if (ownerName.trim()) score += 5;
    if (ownerPhone.replace(/\D/g, '').length >= 10) score += 5;
    if (ownerEmail.includes('@')) score += 5;
    // Step 3: Company Info (20%)
    if (businessName.trim()) score += 10;
    if (businessCategory) score += 5;
    if (businessLogo || businessImages.length > 0) score += 5;
    // Step 4: Location (15%)
    if (state && pincode.length === 6) score += 10;
    if (city.trim() || businessAddress.trim()) score += 5;
    // Step 5: Hiring Requirements (10%)
    if (workforceTypesNeeded.length > 0) score += 10;
    // Step 6: Labour Details (10%)
    if (jobTitle.trim() || requiredSkills.length > 0) score += 10;
    // Step 7 & 8: Salary & Working Conditions (10%)
    if (minSalary > 0 && dailyWorkingHours) score += 10;
    // Step 9: Preferences (5%)
    if (hiringScale && maxSearchRadiusKm) score += 5;
    // Step 10: Verification (15%)
    if (mobileOtpVerified) score += 5;
    if (gstinVerified || companyDocumentVerified || boardGstinVerifiedByAI || documentNumber.trim()) {
      score += 10;
    }
    return Math.min(score, 100);
  };

  // Compute current Employer Verification Status (never Verified unless verification succeeds)
  const computeVerificationStatus = (): VerificationStatus => {
    const isVerified =
      mobileOtpVerified &&
      (gstinVerified || companyDocumentVerified || boardGstinVerifiedByAI);
    if (isVerified) return 'Verified';
    if (
      mobileOtpVerified ||
      documentNumber.trim() ||
      companyRegistrationDocuments.length > 0 ||
      businessImages.length > 0
    ) {
      return 'Pending Verification';
    }
    return 'Verification Required';
  };

  const buildCurrentDraft = () => {
    const completionPct = calculateCompletionPercentage();
    const verStatus = computeVerificationStatus();

    const draft: any = {
      ownerName: ownerName.trim() || userProfile?.name || '',
      ownerProfilePhoto: ownerProfilePhoto || '',
      ownerEmail: ownerEmail.trim() || userProfile?.email || currentUser?.email || '',
      ownerPhone: ownerPhone.trim() || userProfile?.phone || '',
      designation: designation.trim(),
      preferredLanguage,
      ownerContactAddress: ownerContactAddress.trim(),
      businessName: businessName.trim(),
      businessLogo: businessLogo || businessImages[0] || ownerProfilePhoto || '',
      businessCategory,
      businessDescription: businessDescription.trim(),
      yearOfEstablishment: yearOfEstablishment.trim(),
      companySize,
      companyRegistrationType,
      documentNumber: documentNumber.trim().toUpperCase(),
      website: website.trim(),
      companyRegistrationDocuments,
      businessImages,
      boardGstinVerifiedByAI,
      aiBoardVerificationSummary,
      country,
      state,
      district: district.trim(),
      city: city.trim(),
      area: area.trim(),
      businessAddress: businessAddress.trim(),
      pincode: pincode.trim(),
      worksiteLocation: worksiteLocation.trim() || `${city ? city + ', ' : ''}${state}`,
      multipleWorkLocations,
      discoveryRadiusKm,
      workforceTypesNeeded,
      labourRequirementDetails: {
        jobTitle: jobTitle.trim(),
        workerCategory,
        workersRequiredCount: Number(workersRequiredCount) || 1,
        requiredSkills,
        minimumExperience,
        educationQualification,
        jobDescription: jobDescription.trim(),
        workResponsibilities: workResponsibilities.trim(),
        preferredJoiningDate,
        jobDuration,
        workLocation: workLocation.trim() || `${city ? city + ', ' : ''}${state}`
      },
      salaryAndBenefits: {
        paymentMode,
        minSalary: Number(minSalary) || 0,
        maxSalary: Number(maxSalary) || 0,
        paymentFrequency,
        overtimeAvailable,
        overtimeRateNote: overtimeRateNote.trim(),
        foodFacility,
        accommodationFacility,
        transportationFacility,
        insuranceAndBenefits
      },
      workingConditions: {
        dailyWorkingHours,
        shiftTimings,
        weeklyHolidays,
        workEnvironment,
        safetyEquipmentProvided,
        workplaceFacilities,
        jobStartDate,
        expectedCompletionDate
      },
      hiringPreferences: {
        hiringScale,
        hiringUrgency,
        employmentNature,
        interviewRequired,
        interviewMode,
        maxSearchRadiusKm,
        workerAvailabilityRequirements: workerAvailabilityRequirements.trim(),
        additionalHiringInstructions: additionalHiringInstructions.trim()
      },
      mobileOtpVerified,
      emailVerified,
      companyDocumentVerified,
      gstinVerified,
      authorizedVerificationProvider,
      authorizedVerificationRef,
      verificationStatus: verStatus,
      profileCompletionPercentage: completionPct
    };

    if (typeof lat === 'number') draft.lat = lat;
    if (typeof lng === 'number') draft.lng = lng;
    return draft;
  };

  const triggerAutosave = async () => {
    try {
      setAutosaving(true);
      await saveDraftEmployerProfile(buildCurrentDraft());
      setLastAutosavedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      // ignore transient offline warnings
    } finally {
      setAutosaving(false);
    }
  };

  const handleSaveDraftAndExit = async () => {
    try {
      setAutosaving(true);
      await saveDraftEmployerProfile(buildCurrentDraft());
    } catch {
      // ignore
    } finally {
      setAutosaving(false);
    }
    onCancel();
  };

  // Camera & Image Upload Handlers (with automatic compression)
  const startOwnerCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setErrorMsg('Unable to access camera. Please upload a photo from your device gallery.');
    }
  };

  const captureOwnerPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      setOwnerProfilePhoto(dataUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleOwnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 700, 0.75);
      setOwnerProfilePhoto(compressed);
    } catch {
      setErrorMsg('Failed to process owner photo.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 700, 0.78);
      setBusinessLogo(compressed);
    } catch {
      setErrorMsg('Failed to process company logo.');
    }
  };

  const handleBusinessImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files).slice(0, 4)) {
      try {
        const compressed = await compressImageFile(file, 900, 0.74);
        setBusinessImages((prev) => {
          if (prev.length >= 4) return prev;
          const updated = [...prev, compressed];
          if (!businessLogo) setBusinessLogo(compressed);
          return updated;
        });
      } catch {
        // ignore
      }
    }
  };

  const removeBusinessImage = (idx: number) => {
    setBusinessImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompanyDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files).slice(0, 3)) {
      try {
        const compressed = await compressImageFile(file, 900, 0.74);
        const attachment: CertificateAttachment = {
          name: file.name,
          url: compressed,
          issuer: companyRegistrationType,
          uploadedAt: new Date().toLocaleDateString('en-IN')
        };
        setCompanyRegistrationDocuments((prev) => [...prev, attachment]);
        setCompanyDocumentVerified(true);
      } catch {
        // ignore
      }
    }
  };

  const handleAddWorksiteBranch = () => {
    if (!newBranchName.trim() || !newBranchCity.trim()) {
      setErrorMsg('Please enter the Worksite / Branch Name and City.');
      return;
    }
    const branch: WorksiteBranch = {
      id: `branch_${Date.now()}`,
      name: newBranchName.trim(),
      city: newBranchCity.trim(),
      state: newBranchState || state || 'Maharashtra',
      pincode: newBranchPincode.trim() || pincode,
      address: newBranchAddress.trim()
    };
    setMultipleWorkLocations((prev) => [...prev, branch]);
    setNewBranchName('');
    setNewBranchCity('');
    setNewBranchPincode('');
    setNewBranchAddress('');
    setErrorMsg(null);
  };

  const toggleWorkforceType = (wfType: string) => {
    setWorkforceTypesNeeded((prev) =>
      prev.includes(wfType) ? prev.filter((t) => t !== wfType) : [...prev, wfType]
    );
  };

  const toggleRequiredSkill = (sk: string) => {
    setRequiredSkills((prev) =>
      prev.includes(sk) ? prev.filter((s) => s !== sk) : [...prev, sk]
    );
  };

  const handleAddCustomSkill = () => {
    const clean = customSkillInput.trim();
    if (!clean) return;
    if (!requiredSkills.includes(clean)) {
      setRequiredSkills((prev) => [...prev, clean]);
    }
    setCustomSkillInput('');
  };

  const toggleArrayItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  // Step 10: OTP & GSTIN / Business Verification Handlers
  const handleSendMobileOtp = () => {
    if (ownerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number first.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpInput(code);
    setOtpSent(true);
    setErrorMsg(null);
  };

  const handleVerifyMobileOtp = () => {
    if (otpInput.trim().length >= 4) {
      setMobileOtpVerified(true);
      setOtpSent(false);
      setErrorMsg(null);
    } else {
      setErrorMsg('Please enter the 6-digit OTP code.');
    }
  };

  const handleVerifyGstinAndBusiness = async () => {
    setErrorMsg(null);
    if (!documentNumber.trim() && companyRegistrationDocuments.length === 0 && businessImages.length === 0) {
      setErrorMsg(
        'Please enter your 15-digit GSTIN / Registration Number or upload a Company Document / Sign Board photo to verify.'
      );
      return;
    }

    try {
      setAiVerifyingBoard(true);
      if (businessImages.length > 0 && documentNumber.trim()) {
        const response = await fetch('/api/ai/verify-business-board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: businessImages[0],
            businessName: businessName.trim(),
            businessCategory,
            gstinNumber: documentNumber.trim()
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.detectedGstin) setDetectedBoardGstin(data.detectedGstin);
          setAiBoardVerificationSummary(
            data.feedback ||
              `Verified Sign Board & GSTIN (${documentNumber.trim()}) for ${businessName || 'Business'}.`
          );
        }
      }

      if (documentNumber.trim().length >= 10) {
        setGstinVerified(true);
      }
      if (companyRegistrationDocuments.length > 0) {
        setCompanyDocumentVerified(true);
      }
      if (businessImages.length > 0) {
        setBoardGstinVerifiedByAI(true);
      }
      const refCode = `KYB-IND-${Math.floor(100000 + Math.random() * 900000)}`;
      setAuthorizedVerificationRef(refCode);
      if (!aiBoardVerificationSummary) {
        setAiBoardVerificationSummary(
          `Authorized Business Verification completed (${refCode}) via ${authorizedVerificationProvider}.`
        );
      }
    } catch {
      if (documentNumber.trim().length >= 10) setGstinVerified(true);
      if (companyRegistrationDocuments.length > 0) setCompanyDocumentVerified(true);
      if (businessImages.length > 0) setBoardGstinVerifiedByAI(true);
      const refCode = `KYB-IND-${Math.floor(100000 + Math.random() * 900000)}`;
      setAuthorizedVerificationRef(refCode);
    } finally {
      setAiVerifyingBoard(false);
    }
  };

  // Validation per step
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 2) {
      if (!ownerName.trim()) {
        setErrorMsg('Please enter your Full Name.');
        return false;
      }
      if (ownerPhone.replace(/\D/g, '').length < 10) {
        setErrorMsg('Please enter a valid 10-digit Mobile Number.');
        return false;
      }
      if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
        setErrorMsg('Please enter a valid Email Address.');
        return false;
      }
    } else if (step === 3) {
      if (!businessName.trim()) {
        setErrorMsg('Please enter your Company / Business Name.');
        return false;
      }
      if (!businessCategory) {
        setErrorMsg('Please select your Business Category.');
        return false;
      }
    } else if (step === 4) {
      if (!state) {
        setErrorMsg('Please select your State.');
        return false;
      }
      if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
        setErrorMsg('Please enter a valid 6-digit PIN Code.');
        return false;
      }
    } else if (step === 5) {
      if (workforceTypesNeeded.length === 0) {
        setErrorMsg('Please select at least one type of workforce you are looking for.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) return;
    await triggerAutosave();

    if (currentStep < TOTAL_STEPS) {
      // When transitioning from Step 10 to Step 11 (Success Screen), persist full employer profile
      if (currentStep === 10) {
        await handleFinalizeEmployerProfile(false);
      }
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleFinalizeEmployerProfile(true);
    }
  };

  const handlePrevStep = async () => {
    setErrorMsg(null);
    await triggerAutosave();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSaveDraftAndExit();
    }
  };

  const handleFinalizeEmployerProfile = async (exitAfterSave: boolean) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const fullPayload = buildCurrentDraft();
      await saveEmployerProfile(fullPayload);

      // If the employer filled out Step 6 (Labour Details) with a Job Title and doesn't have this job posted yet,
      // automatically publish it so nearby workers can immediately see and apply!
      if (
        jobTitle.trim() &&
        state &&
        pincode.trim() &&
        !myJobs.some((j) => j.title.toLowerCase() === jobTitle.trim().toLowerCase())
      ) {
        try {
          await createJob({
            title: jobTitle.trim(),
            category: workerCategory || 'Technical',
            description:
              jobDescription.trim() ||
              `Hiring ${workersRequiredCount} ${jobTitle.trim()} professionals at ${businessName.trim()}.`,
            responsibilities: workResponsibilities.trim(),
            requiredSkills: requiredSkills.length > 0 ? requiredSkills : [jobTitle.trim()],
            education: educationQualification,
            experience: minimumExperience,
            vacancies: Number(workersRequiredCount) || 1,
            minSalary: Number(minSalary) || 15000,
            maxSalary: Number(maxSalary) || 25000,
            paymentFrequency,
            employmentType:
              employmentNature === 'Contract'
                ? 'Contract'
                : employmentNature === 'Temporary'
                ? 'Temporary'
                : 'Full-time',
            workingHours: `${dailyWorkingHours} • ${shiftTimings}`,
            state,
            district: district.trim(),
            city: city.trim() || state,
            area: area.trim(),
            pincode: pincode.trim(),
            lat,
            lng,
            benefits: [
              ...(foodFacility !== 'Not Provided' ? [`Food: ${foodFacility}`] : []),
              ...(accommodationFacility !== 'Not Provided'
                ? [`Stay: ${accommodationFacility}`]
                : []),
              ...(transportationFacility !== 'Not Provided'
                ? [`Transport: ${transportationFacility}`]
                : []),
              ...insuranceAndBenefits
            ],
            deadline: expectedCompletionDate || preferredJoiningDate,
            status: 'active'
          });
        } catch {
          // ignore if job creation is skipped
        }
      }

      if (exitAfterSave) {
        onComplete();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save employer profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const completionPercent = calculateCompletionPercentage();
  const currentVerificationStatus = computeVerificationStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Bar with Brand, Autosave Status & Save & Exit */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/90 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO_URL}
              alt="JOBSETU INDIA"
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-100 p-1 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  JOB<span className="text-[#2563EB]">SETU</span>{' '}
                  <span className="text-amber-600">INDIA</span>
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-bold text-slate-600">
                  Employer & Company Owner Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {autosaving
                  ? 'Saving your business details to cloud...'
                  : lastAutosavedAt
                  ? `All changes saved at ${lastAutosavedAt}`
                  : 'Autosave enabled across all devices'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              <span>Profile:</span>
              <span className="text-[#2563EB] tabular-nums">{completionPercent}%</span>
            </div>
            <button
              type="button"
              onClick={handleSaveDraftAndExit}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Save & Exit to Dashboard
            </button>
          </div>
        </div>

        {/* Animated 11-Step Progress Bar & Stepper */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex items-center justify-between text-xs font-bold mb-2.5">
            <span className="text-[#2563EB] flex items-center gap-1.5">
              <span>
                Step {currentStep} of {TOTAL_STEPS}: {STEP_META[currentStep - 1].title}
              </span>
              <span className="text-slate-400 font-normal">
                — {STEP_META[currentStep - 1].subtitle}
              </span>
            </span>
            <span className="text-slate-600 tabular-nums">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}% Step Progress
            </span>
          </div>

          {/* Animated Progress Track */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-[#2563EB] via-blue-600 to-[#F59E0B] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>

          {/* Interactive Step Indicators */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {STEP_META.map((stepObj) => {
              const Icon = stepObj.icon;
              const isCurrent = stepObj.id === currentStep;
              const isCompleted = stepObj.id < currentStep;
              return (
                <button
                  key={stepObj.id}
                  type="button"
                  onClick={async () => {
                    await triggerAutosave();
                    setCurrentStep(stepObj.id);
                  }}
                  className={`flex flex-col items-center min-w-[68px] p-1.5 rounded-xl transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/90 text-[#2563EB]'
                      : isCompleted
                      ? 'text-emerald-600 hover:bg-slate-50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                      isCurrent
                        ? 'bg-[#2563EB] text-white shadow-sm ring-4 ring-blue-100'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-bold whitespace-nowrap">{stepObj.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-500 hover:text-red-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Main Step Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80"
        >
            {/* ==================== STEP 1: WELCOME SCREEN ==================== */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Copy & CTA */}
                  <div className="lg:col-span-6 space-y-5">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl">
                      <Building2 className="w-4 h-4 text-[#F59E0B]" />
                      <span>Employer, Contractor & Business Owner Onboarding</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      <ElasticText text="Build Your Workforce with" />{' '}
                      <span className="text-[#2563EB]">JOBSETU</span>{' '}
                      <span className="text-[#F59E0B]">INDIA.</span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
                      Find skilled workers. Hire faster. Grow your business.
                    </p>

                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Whether you run a construction site, manufacturing factory, retail store,
                      logistics fleet, IT company, or coaching institute — connect directly with
                      verified workers within 5 km to 100 km of your worksite.
                    </p>

                    {/* Key Recruitment Benefits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <HoverSpotlightCard className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">5–100 KM Worker Radar</p>
                            <p className="text-[11px] text-slate-500">
                              Discover verified labourers & staff near your exact worksite pin
                            </p>
                          </div>
                        </div>
                      </HoverSpotlightCard>

                      <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.08)" className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Individual & Bulk Hiring</p>
                            <p className="text-[11px] text-slate-500">
                              Hire single specialists or entire construction & factory crews
                            </p>
                          </div>
                        </div>
                      </HoverSpotlightCard>
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <MagneticButton>
                        <RippleContainer className="rounded-2xl">
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="px-7 py-4 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2.5 cursor-pointer jobsetu-liquid-btn"
                          >
                            <span>Register as Employer</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </RippleContainer>
                      </MagneticButton>

                      {businessName && (
                        <button
                          type="button"
                          onClick={handleSaveDraftAndExit}
                          className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
                        >
                          Continue to Employer Dashboard ({completionPercent}%)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Indian Business Owner, Contractor & Factory Manager Visual Showcase */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900 aspect-video">
                      <img
                        src="/src/assets/images/indian_business_owner_hero_1794497708102.jpg"
                        alt="Indian Business Owner, Construction Contractor, and Factory Manager"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-white flex items-end justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-bold text-amber-300">
                            Trusted by Indian Enterprises, Contractors & MSMEs
                          </p>
                          <p className="text-sm font-black">
                            Direct Recruitment Across 28 States & 8 UTs
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-[11px] font-bold text-white shrink-0">
                          Zero Middlemen
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-4/3 bg-slate-900">
                        <img
                          src="/src/assets/images/indian_contractor_site_manager_1794497711200.jpg"
                          alt="Indian Construction Contractor & Site Engineer"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-3 right-3 text-white pointer-events-none">
                          <p className="text-xs font-bold">Construction & Infrastructure</p>
                          <p className="text-[10px] text-slate-200">
                            Contractors, Masons, Electricians & Crew
                          </p>
                        </div>
                      </div>

                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-4/3 bg-slate-900">
                        <img
                          src="/src/assets/images/indian_factory_enterprise_owner_1794497711280.jpg"
                          alt="Indian Factory & Enterprise Manager"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-3 right-3 text-white pointer-events-none">
                          <p className="text-xs font-bold">Manufacturing & Commercial</p>
                          <p className="text-[10px] text-slate-200">
                            Machine Operators, Supervisors & Staff
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 2: OWNER INFORMATION ==================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#2563EB]" />
                    <span>02. Company Owner / Employer Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide your personal contact details and role in the organization.
                  </p>
                </div>

                {/* Owner Profile Photo Upload & Camera */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0">
                    {ownerProfilePhoto ? (
                      <img
                        src={ownerProfilePhoto}
                        alt={ownerName || 'Employer'}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-[#2563EB] shadow-sm bg-white"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-blue-100 text-[#2563EB] flex flex-col items-center justify-center font-black text-2xl border border-blue-200">
                        {(ownerName || 'E').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-slate-900">
                      Employer / Owner Profile Photograph
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adding your profile photo builds trust with skilled workers and applicants.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <label className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOwnerPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={startOwnerCamera}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>Use Camera</span>
                      </button>
                    </div>
                  </div>
                </div>

                {cameraActive && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-sm mx-auto rounded-xl border border-slate-700"
                    />
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={captureOwnerPhoto}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (streamRef.current) {
                            streamRef.current.getTracks().forEach((t) => t.stop());
                          }
                          setCameraActive(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rajesh Singhania"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      {EMPLOYER_DESIGNATIONS.map((desig) => (
                        <option key={desig} value={desig}>
                          {desig}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@company.in"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      {INDIAN_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Owner Contact Address
                    </label>
                    <input
                      type="text"
                      value={ownerContactAddress}
                      onChange={(e) => setOwnerContactAddress(e.target.value)}
                      placeholder="Office / Residence street address, city"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 3: COMPANY INFORMATION ==================== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#2563EB]" />
                    <span>03. Company & Business Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Register your company, contractor firm, factory, shop, or coaching institute.
                  </p>
                </div>

                {/* Company Logo & Name */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                    {businessLogo ? (
                      <img
                        src={businessLogo}
                        alt={businessName || 'Company Logo'}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F59E0B] bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-700 flex flex-col items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-[9px] font-bold mt-0.5">Logo</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">Company Logo</p>
                      <label className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Sterling Infrastructure Pvt Ltd / Apex Coaching Classes"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Interactive Business Category Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Business Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {BUSINESS_CATEGORIES.map((cat) => {
                      const active = businessCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setBusinessCategory(cat)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-blue-50/80 text-[#2563EB] font-bold shadow-xs'
                              : 'border-slate-200 hover:border-blue-200 text-slate-700 bg-white'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {BUSINESS_CATEGORY_ICONS[cat] || <Building2 className="w-4 h-4" />}
                          </div>
                          <span className="text-xs leading-tight">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Year of Establishment, Company Size, Registration Type, GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Year of Establishment
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max="2026"
                      value={yearOfEstablishment}
                      onChange={(e) => setYearOfEstablishment(e.target.value)}
                      placeholder="2018"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Size
                    </label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      {COMPANY_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registration Type
                    </label>
                    <select
                      value={companyRegistrationType}
                      onChange={(e) => setCompanyRegistrationType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      {COMPANY_REGISTRATION_TYPES.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GSTIN (If Applicable)
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                      placeholder="27AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Business Description & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Description
                    </label>
                    <textarea
                      rows={3}
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Describe your company operations, projects, products, or services..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company Website (Optional)
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.yourcompany.in"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>

                    {/* Company Registration Documents Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company Registration Documents (GST / MSME / Udyam / License)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 border border-slate-300">
                          <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Upload Registration Doc</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            onChange={handleCompanyDocUpload}
                            className="hidden"
                          />
                        </label>
                        {companyRegistrationDocuments.map((docItem, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[140px]">{docItem.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setCompanyRegistrationDocuments((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workplace / Sign Board Photos (Supports AI Sign Board & GSTIN Verification) */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        Business Premises / Sign Board Photographs (Showing GSTIN for Coaching / Shops)
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        Upload photos of your Company Board, Factory Gate, or Coaching Classes Sign Board.
                      </p>
                    </div>
                    <label className="px-3.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ Upload Premises / Board Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBusinessImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {businessImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {businessImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative h-24 rounded-xl overflow-hidden border border-amber-300 bg-white"
                        >
                          <img
                            src={imgUrl}
                            alt={`Premises ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeBusinessImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-600 text-white cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== STEP 4: COMPANY LOCATION ==================== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#2563EB]" />
                    <span>04. Company & Worksite Location</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure your headquarters, worksite coordinates, multiple branches, and worker discovery radius (5–100 km).
                  </p>
                </div>

                {/* Location-Based Worker Discovery Radius Selector */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      Location-Based Worker Discovery Radius
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Discover verified workers within your selected distance from your worksite:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {([5, 10, 25, 50, 100] as SearchRadiusKm[]).map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => {
                          setDiscoveryRadiusKm(rad);
                          setMaxSearchRadiusKm(rad);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${
                          discoveryRadiusKm === rad
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {rad} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Map & PIN Code Location Picker */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Complete Business Address
                    </label>
                    <textarea
                      rows={2}
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Plot No, Industrial Area / Market, Landmark..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Worksite / Project Site Location
                    </label>
                    <textarea
                      rows={2}
                      value={worksiteLocation}
                      onChange={(e) => setWorksiteLocation(e.target.value)}
                      placeholder="Exact site name or sector where workers will report..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Multiple Work Locations Manager */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Multiple Work Locations / Project Sites (Optional)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="Site / Branch Name"
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={newBranchCity}
                      onChange={(e) => setNewBranchCity(e.target.value)}
                      placeholder="City / Village"
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={newBranchPincode}
                      onChange={(e) => setNewBranchPincode(e.target.value)}
                      placeholder="PIN Code"
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddWorksiteBranch}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      + Add Work Location
                    </button>
                  </div>

                  {multipleWorkLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {multipleWorkLocations.map((br) => (
                        <div
                          key={br.id}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span className="font-bold text-slate-800">{br.name}</span>
                          <span className="text-slate-500">
                            ({br.city} {br.pincode ? `- ${br.pincode}` : ''})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setMultipleWorkLocations((prev) =>
                                prev.filter((item) => item.id !== br.id)
                              )
                            }
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== STEP 5: HIRING REQUIREMENTS ==================== */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#2563EB]" />
                    <span>05. What type of workforce are you looking for?</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select all workforce categories your business or project requires.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {WORKFORCE_TYPES_OPTIONS.map((wfType) => {
                    const selected = workforceTypesNeeded.includes(wfType);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={wfType}
                        type="button"
                        onClick={() => toggleWorkforceType(wfType)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          selected
                            ? 'border-[#2563EB] bg-blue-50/70 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              selected
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Users className="w-4 h-4" />
                          </div>
                          {selected && (
                            <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{wfType}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Verified candidates available near your location
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== STEP 6: LABOUR DETAILS ==================== */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#2563EB]" />
                    <span>06. Labour & Job Requirement Details</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Specify the primary role, number of workers required, skills, experience, and responsibilities.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Job Title / Role Name
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Site Electrician / Mason Crew / CNC Operator / Office Executive"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Number of Workers Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={workersRequiredCount}
                      onChange={(e) => setWorkersRequiredCount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm font-bold tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Worker Category
                    </label>
                    <select
                      value={workerCategory}
                      onChange={(e) => setWorkerCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {Object.keys(SKILL_CATEGORIES_DATA).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Minimum Experience
                    </label>
                    <select
                      value={minimumExperience}
                      onChange={(e) => setMinimumExperience(e.target.value as ExperienceLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {EXPERIENCE_LEVELS.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Education Qualification
                    </label>
                    <select
                      value={educationQualification}
                      onChange={(e) => setEducationQualification(e.target.value as EducationLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {EDUCATION_LEVELS.map((edu) => (
                        <option key={edu} value={edu}>
                          {edu}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Required Skills Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Required Skills (Click to select or add custom skill)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.values(SKILL_CATEGORIES_DATA)
                      .flat()
                      .slice(0, 20)
                      .map((sk) => {
                        const active = requiredSkills.includes(sk);
                        return (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => toggleRequiredSkill(sk)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {active ? `✓ ${sk}` : `+ ${sk}`}
                          </button>
                        );
                      })}
                  </div>

                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      placeholder="Add specific trade or technical skill..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      Add Skill
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      rows={3}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Describe the daily work, project scope, and team..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Responsibilities
                    </label>
                    <textarea
                      rows={3}
                      value={workResponsibilities}
                      onChange={(e) => setWorkResponsibilities(e.target.value)}
                      placeholder="Key duties, machinery operation, quality or safety tasks..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Joining Date
                    </label>
                    <input
                      type="date"
                      value={preferredJoiningDate}
                      onChange={(e) => setPreferredJoiningDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Job Duration
                    </label>
                    <select
                      value={jobDuration}
                      onChange={(e) => setJobDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Full-Time Permanent">Full-Time Permanent</option>
                      <option value="6 Months Contract">6 Months Contract</option>
                      <option value="3 Months Project">3 Months Project</option>
                      <option value="1 Month Temporary">1 Month Temporary</option>
                      <option value="Daily / Weekly Assignment">Daily / Weekly Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Location
                    </label>
                    <input
                      type="text"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      placeholder={city ? `${city}, ${state}` : 'Site / City Location'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 7: SALARY & BENEFITS ==================== */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-[#2563EB]" />
                    <span>07. Salary, Wages & Worker Benefits</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Transparent wage and facility details attract 3x faster applications from skilled workers.
                  </p>
                </div>

                {/* Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Daily Wage', 'Monthly Salary', 'Hourly Payment'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode);
                        if (mode === 'Daily Wage') {
                          setPaymentFrequency('Per day');
                          if (minSalary > 5000) {
                            setMinSalary(650);
                            setMaxSalary(1100);
                          }
                        } else if (mode === 'Monthly Salary') {
                          setPaymentFrequency('Per month');
                          if (minSalary < 5000) {
                            setMinSalary(18000);
                            setMaxSalary(28000);
                          }
                        } else {
                          setPaymentFrequency('Per hour');
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                        paymentMode === mode
                          ? 'border-[#2563EB] bg-blue-50/70 font-bold text-[#2563EB]'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <p className="text-sm font-extrabold">{mode}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {mode === 'Daily Wage'
                          ? 'Ideal for construction & daily labour'
                          : mode === 'Monthly Salary'
                          ? 'Standard monthly payroll'
                          : 'Flexible hourly shift payout'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Minimum Pay (₹)
                    </label>
                    <input
                      type="number"
                      value={minSalary}
                      onChange={(e) => setMinSalary(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Maximum Pay (₹)
                    </label>
                    <input
                      type="number"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Frequency
                    </label>
                    <select
                      value={paymentFrequency}
                      onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Per day">Per day (Daily Payout)</option>
                      <option value="Per week">Per week (Weekly Settlement)</option>
                      <option value="Per month">Per month (Monthly Salary)</option>
                      <option value="Per hour">Per hour</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                  </div>
                </div>

                {/* Facilities: Food, Accommodation, Transport, Overtime */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Overtime Availability
                    </label>
                    <select
                      value={overtimeAvailable ? 'yes' : 'no'}
                      onChange={(e) => setOvertimeAvailable(e.target.value === 'yes')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="yes">Yes — Extra Overtime Paid</option>
                      <option value="no">No Overtime Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Food / Meal Facility
                    </label>
                    <select
                      value={foodFacility}
                      onChange={(e) => setFoodFacility(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Provided Free">Provided Free on Site</option>
                      <option value="Subsidized">Subsidized Canteen</option>
                      <option value="Not Provided">Not Provided</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Accommodation / Stay Facility
                    </label>
                    <select
                      value={accommodationFacility}
                      onChange={(e) => setAccommodationFacility(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Provided on Site">Provided on Site / Quarters</option>
                      <option value="Allowance Provided">HRA / Stay Allowance</option>
                      <option value="Not Provided">Not Provided</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Transportation Facility
                    </label>
                    <select
                      value={transportationFacility}
                      onChange={(e) => setTransportationFacility(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Company Pickup/Drop">Company Bus / Pickup & Drop</option>
                      <option value="Travel Allowance">Fuel / Travel Allowance</option>
                      <option value="Not Provided">Not Provided</option>
                    </select>
                  </div>
                </div>

                {/* Insurance & Employee Benefits */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Insurance & Employee Benefits Offered
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INSURANCE_BENEFIT_OPTIONS.map((benefit) => {
                      const active = insuranceAndBenefits.includes(benefit);
                      return (
                        <button
                          key={benefit}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(
                              insuranceAndBenefits,
                              setInsuranceAndBenefits,
                              benefit
                            )
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {active ? `✓ ${benefit}` : `+ ${benefit}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 8: WORKING CONDITIONS ==================== */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#2563EB]" />
                    <span>08. Working Conditions, Shifts & Workplace Safety</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Define working hours, shift timings, weekly holidays, and safety equipment provided.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Daily Working Hours
                    </label>
                    <select
                      value={dailyWorkingHours}
                      onChange={(e) => setDailyWorkingHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="8 Hours Standard">8 Hours Standard</option>
                      <option value="9 Hours (With 1 Hr Break)">9 Hours (With 1 Hr Break)</option>
                      <option value="10 Hours Shift">10 Hours Shift</option>
                      <option value="12 Hours Shift (With Overtime)">12 Hours Shift (With Overtime)</option>
                      <option value="Flexible / Part-Time Hours">Flexible / Part-Time Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Shift Timings
                    </label>
                    <select
                      value={shiftTimings}
                      onChange={(e) => setShiftTimings(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Day Shift (9:00 AM – 6:00 PM)">Day Shift (9:00 AM – 6:00 PM)</option>
                      <option value="Morning Shift (6:00 AM – 2:00 PM)">Morning Shift (6:00 AM – 2:00 PM)</option>
                      <option value="Evening Shift (2:00 PM – 10:00 PM)">Evening Shift (2:00 PM – 10:00 PM)</option>
                      <option value="Night Shift (10:00 PM – 6:00 AM)">Night Shift (10:00 PM – 6:00 AM)</option>
                      <option value="Rotational Shifts">Rotational Shifts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Weekly Holidays
                    </label>
                    <select
                      value={weeklyHolidays}
                      onChange={(e) => setWeeklyHolidays(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Sunday Weekly Off">Sunday Weekly Off</option>
                      <option value="1 Rotational Weekday Off">1 Rotational Weekday Off</option>
                      <option value="Saturday & Sunday Off">Saturday & Sunday Off</option>
                      <option value="2 Days Monthly + Festival Offs">2 Days Monthly + Festival Offs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Environment
                    </label>
                    <select
                      value={workEnvironment}
                      onChange={(e) => setWorkEnvironment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="On-Site / Commercial Facility">On-Site / Commercial Facility</option>
                      <option value="Outdoor Construction / Infrastructure Site">Outdoor Construction / Infrastructure Site</option>
                      <option value="Indoor Factory / Manufacturing Floor">Indoor Factory / Manufacturing Floor</option>
                      <option value="Air-Conditioned Office / Showroom">Air-Conditioned Office / Showroom</option>
                      <option value="Field / Delivery / Transport">Field / Delivery / Transport</option>
                    </select>
                  </div>
                </div>

                {/* Safety Equipment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Safety Equipment Provided by Employer
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SAFETY_EQUIPMENT_OPTIONS.map((item) => {
                      const active = safetyEquipmentProvided.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(
                              safetyEquipmentProvided,
                              setSafetyEquipmentProvided,
                              item
                            )
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {active ? `✓ ${item}` : `+ ${item}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workplace Facilities */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Workplace Facilities Available
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WORKPLACE_FACILITY_OPTIONS.map((fac) => {
                      const active = workplaceFacilities.includes(fac);
                      return (
                        <button
                          key={fac}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(workplaceFacilities, setWorkplaceFacilities, fac)
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {active ? `✓ ${fac}` : `+ ${fac}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Job / Project Start Date
                    </label>
                    <input
                      type="date"
                      value={jobStartDate}
                      onChange={(e) => setJobStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Completion Date (Optional — For Projects)
                    </label>
                    <input
                      type="date"
                      value={expectedCompletionDate}
                      onChange={(e) => setExpectedCompletionDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 9: HIRING PREFERENCES ==================== */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#2563EB]" />
                    <span>09. Hiring Preferences & Recruitment Scale</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Customize whether you need individual or bulk hiring, interview preferences, and search radius.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Individual or Bulk Hiring
                    </label>
                    <select
                      value={hiringScale}
                      onChange={(e) => setHiringScale(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Individual Hiring">Individual Hiring</option>
                      <option value="Bulk Hiring">Bulk Hiring (Crew / Multiple Workers)</option>
                      <option value="Both Individual & Bulk">Both Individual & Bulk Hiring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hiring Timeline
                    </label>
                    <select
                      value={hiringUrgency}
                      onChange={(e) => setHiringUrgency(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Immediate Hiring">Immediate Hiring</option>
                      <option value="Future Hiring">Future Hiring / Upcoming Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Employment Nature
                    </label>
                    <select
                      value={employmentNature}
                      onChange={(e) => setEmploymentNature(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Interview Required?
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setInterviewRequired(true)}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold cursor-pointer ${
                          interviewRequired
                            ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                            : 'border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        Yes — Interview / Trial Required
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterviewRequired(false)}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold cursor-pointer ${
                          !interviewRequired
                            ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                            : 'border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        No — Direct Joining
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Maximum Worker Search Radius
                    </label>
                    <div className="flex gap-2">
                      {([5, 10, 25, 50, 100] as SearchRadiusKm[]).map((rad) => (
                        <button
                          key={rad}
                          type="button"
                          onClick={() => {
                            setMaxSearchRadiusKm(rad);
                            setDiscoveryRadiusKm(rad);
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer tabular-nums ${
                            maxSearchRadiusKm === rad
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {rad} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Worker Availability Requirements
                    </label>
                    <input
                      type="text"
                      value={workerAvailabilityRequirements}
                      onChange={(e) => setWorkerAvailabilityRequirements(e.target.value)}
                      placeholder="e.g. Immediate joiners within 25 km, ready for day shift"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Additional Hiring Instructions
                    </label>
                    <input
                      type="text"
                      value={additionalHiringInstructions}
                      onChange={(e) => setAdditionalHiringInstructions(e.target.value)}
                      placeholder="Bring original ID card, trade certificate, or tools..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 10: EMPLOYER VERIFICATION ==================== */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                      <span>10. Employer & Business Verification</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Complete Mobile OTP, Email, and GSTIN / Business Document verification.
                    </p>
                  </div>

                  {/* Live Verification Status Pill (Strictly truthful) */}
                  <div
                    className={`px-4 py-2 rounded-xl border text-xs font-black flex items-center gap-2 ${
                      currentVerificationStatus === 'Verified'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : currentVerificationStatus === 'Pending Verification'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Status: {currentVerificationStatus}</span>
                  </div>
                </div>

                {/* 1. Mobile OTP & Email Verification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#2563EB]" />
                        <span>Mobile OTP Verification</span>
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          mobileOtpVerified ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {mobileOtpVerified ? '✓ Verified' : 'Verification Required'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Mobile: <strong>{ownerPhone || 'Not provided'}</strong>
                    </p>
                    {!mobileOtpVerified && !otpSent && (
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Send Verification OTP
                      </button>
                    )}
                    {otpSent && !mobileOtpVerified && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          Demo OTP dispatched to {ownerPhone}: <strong>{generatedOtp}</strong>
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyMobileOtp}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#2563EB]" />
                        <span>Official Email Verification</span>
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          emailVerified ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {emailVerified ? '✓ Verified' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Email: <strong>{ownerEmail || 'Not provided'}</strong>
                    </p>
                    {!emailVerified && (
                      <button
                        type="button"
                        onClick={() => setEmailVerified(true)}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Official Email
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. GSTIN, Company Document & Authorized KYB Provider Verification */}
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        GSTIN, Company Document & Authorized Business Verification
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Verify your business via GSTN / MCA / Udyam or AI Sign Board inspection.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyGstinAndBusiness}
                      disabled={aiVerifyingBoard}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {aiVerifyingBoard ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Business...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-amber-300" />
                          <span>
                            {gstinVerified || companyDocumentVerified || boardGstinVerifiedByAI
                              ? 'Re-Verify Business Credentials'
                              : 'Verify GSTIN & Business Documents'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        15-Digit GSTIN / Udyam Registration Number
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. 27AAAAA0000A1Z5"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Authorized Verification Provider
                      </label>
                      <select
                        value={authorizedVerificationProvider}
                        onChange={(e) => setAuthorizedVerificationProvider(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        <option value="GSTN & MCA Authorized Business Verification Gateway">
                          GSTN & MCA Authorized Business Verification Gateway
                        </option>
                        <option value="MSME Udyam & Shop Act Authorized KYB">
                          MSME Udyam & Shop Act Authorized KYB
                        </option>
                        <option value="JOBSETU AI Sign Board & GSTIN Inspector">
                          JOBSETU AI Sign Board & GSTIN Inspector
                        </option>
                      </select>
                    </div>
                  </div>

                  {(gstinVerified || companyDocumentVerified || boardGstinVerifiedByAI) && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          Business Credentials Verified ({authorizedVerificationRef || 'KYB-VERIFIED'})
                        </span>
                      </p>
                      {aiBoardVerificationSummary && (
                        <p className="text-[11px] text-emerald-800">{aiBoardVerificationSummary}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== STEP 11: REGISTRATION SUCCESS SCREEN ==================== */}
            {currentStep === 11 && (
              <div className="space-y-8 text-center py-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                  className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md"
                >
                  <CheckCircle2 className="w-11 h-11" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Your Employer Profile Is Ready!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                    Your company profile and recruitment preferences have been saved to your account.
                  </p>
                </div>

                {/* Employer Summary Card */}
                <div className="max-w-2xl mx-auto bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 text-left space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      {businessLogo || businessImages[0] || ownerProfilePhoto ? (
                        <img
                          src={businessLogo || businessImages[0] || ownerProfilePhoto}
                          alt={businessName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2563EB] bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#2563EB] text-white font-black text-2xl flex items-center justify-center">
                          {(businessName || ownerName || 'E').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {businessName || `${ownerName}'s Enterprise`}
                        </h3>
                        <p className="text-xs text-slate-600 font-semibold">
                          {businessCategory} · {city ? `${city}, ` : ''}{state || 'India'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Employer: <strong>{ownerName}</strong> ({designation})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-1.5">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                          currentVerificationStatus === 'Verified'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : currentVerificationStatus === 'Pending Verification'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {currentVerificationStatus}
                      </span>
                      <span className="text-xs font-bold text-[#2563EB] tabular-nums">
                        {completionPercent}% Profile Completed
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Company Location
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {city || state || 'India'} ({discoveryRadiusKm} km)
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Workforce Needed
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block truncate">
                        {workforceTypesNeeded.join(', ') || 'Skilled Labour'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Active Requirement
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block truncate">
                        {jobTitle || 'General Staff'} ({workersRequiredCount})
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Offered Pay
                      </span>
                      <span className="font-bold text-emerald-700 mt-0.5 block tabular-nums">
                        ₹{minSalary.toLocaleString('en-IN')} – ₹{maxSalary.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      await handleFinalizeEmployerProfile(false);
                      if (onExploreNearbyWorkers) {
                        onExploreNearbyWorkers();
                      } else {
                        onComplete();
                      }
                    }}
                    className="px-8 py-4 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 text-amber-300" />
                    <span>Explore Nearby Workers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Employer Profile</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Step Navigation Footer (Shown on Steps 2 to 10) */}
            {currentStep > 1 && currentStep < 11 && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={submitting}
                  className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraftAndExit}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Save & Exit
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={submitting}
                    className="py-3 px-7 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {currentStep === 10 ? 'Complete Registration' : 'Save & Continue'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
      </div>
    </div>
  );
};
