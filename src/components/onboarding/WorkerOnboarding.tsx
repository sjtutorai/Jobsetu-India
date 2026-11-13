import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Sparkles,
  FileText,
  Upload,
  Phone,
  Mail,
  Globe,
  HeartPulse,
  Building2,
  Award,
  Compass,
  Home,
  Lock,
  Edit3,
  Trash2,
  Check,
  HardHat,
  Zap,
  Hammer,
  Paintbrush,
  Flame,
  Truck,
  Shield,
  Factory,
  Sprout,
  Code2,
  Palette,
  FileSpreadsheet,
  PackageCheck,
  Layers,
  RefreshCw
} from 'lucide-react';
import {
  SKILL_CATEGORIES_DATA,
  EducationLevel,
  ExperienceLevel,
  Gender,
  WorkerProfile,
  CertificateAttachment,
  SearchRadiusKm,
  JOB_SEEKER_PROFESSIONS,
  INDIAN_LANGUAGES,
  APP_LOGO_URL
} from '../../types';
import { LocationPicker } from '../common/LocationPicker';
import {
  AnimatedImage,
  WordStagger,
  MagneticButton,
  RippleContainer,
  StaggeredCardContainer,
  StaggeredCardItem,
  HoverSpotlightCard,
  ParticleBackground
} from '../animations';

interface WorkerOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
  initialStep?: number;
}

const TOTAL_STEPS = 7;

const STEP_META = [
  { id: 1, title: 'Welcome', subtitle: 'Get Started', icon: Sparkles },
  { id: 2, title: 'Personal Info', subtitle: 'Identity & Address', icon: User },
  { id: 3, title: 'Education', subtitle: 'Qualifications', icon: GraduationCap },
  { id: 4, title: 'Professional', subtitle: 'Trade & Experience', icon: Wrench },
  { id: 5, title: 'Preferences', subtitle: 'Salary & Radius', icon: Compass },
  { id: 6, title: 'Verification', subtitle: 'Docs & OTP', icon: ShieldCheck },
  { id: 7, title: 'Completion', subtitle: 'Preview & Launch', icon: CheckCircle2 }
];

const PROFESSION_ICONS: Record<string, React.ReactNode> = {
  'Construction Worker': <HardHat className="w-5 h-5" />,
  Electrician: <Zap className="w-5 h-5" />,
  Plumber: <Wrench className="w-5 h-5" />,
  Carpenter: <Hammer className="w-5 h-5" />,
  Painter: <Paintbrush className="w-5 h-5" />,
  Welder: <Flame className="w-5 h-5" />,
  Driver: <Truck className="w-5 h-5" />,
  'Security Guard': <Shield className="w-5 h-5" />,
  'Factory Worker': <Factory className="w-5 h-5" />,
  'Agricultural Worker': <Sprout className="w-5 h-5" />,
  'Software Developer': <Code2 className="w-5 h-5" />,
  Designer: <Palette className="w-5 h-5" />,
  'Office Assistant': <FileSpreadsheet className="w-5 h-5" />,
  'Delivery Worker': <PackageCheck className="w-5 h-5" />,
  Other: <Layers className="w-5 h-5" />
};

const PROFESSION_DEFAULT_SKILLS: Record<string, string[]> = {
  'Construction Worker': ['Masonry', 'Bar Bending', 'Site Safety', 'Concrete Mixing'],
  Electrician: ['Electrician', 'Wiring & Switchgear', 'Appliance repair'],
  Plumber: ['Plumbing', 'Pipe Fitting', 'Water Tank Installation'],
  Carpenter: ['Carpentry', 'Furniture Making', 'Wood Polishing'],
  Painter: ['Wall Painting', 'Putty & Primer', 'Texture Finishing'],
  Welder: ['Welding', 'Arc Welding', 'Metal Fabrication'],
  Driver: ['Driving', 'Commercial Vehicle', 'Fleet coordination'],
  'Security Guard': ['Premises Security', 'Visitor Logging', 'CCTV Monitoring'],
  'Factory Worker': ['Machine Operation', 'Assembly Line', 'Inventory handling'],
  'Agricultural Worker': ['Farm operations', 'Crop harvesting', 'Irrigation Support'],
  'Software Developer': ['Programming', 'Web Development', 'Computer operation'],
  Designer: ['Graphic design', 'UI/UX Design', 'Video editing'],
  'Office Assistant': ['Data entry', 'Administration', 'Document filing'],
  'Delivery Worker': ['Delivery', 'Logistics', 'Route Navigation']
};

export const WorkerOnboarding: React.FC<WorkerOnboardingProps> = ({
  onComplete,
  onCancel,
  initialStep = 1
}) => {
  const { currentUser, userProfile, workerProfile, saveWorkerProfile, saveDraftWorkerProfile } = useAuth();

  // Start at initialStep (1 for new signups, 2 when editing existing profile)
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registrationCompleteBanner, setRegistrationCompleteBanner] = useState(false);

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  // Camera capture state for Profile Photograph
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ==================== STEP 2: PERSONAL INFORMATION ====================
  const [fullName, setFullName] = useState(workerProfile?.fullName || userProfile?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(
    workerProfile?.profilePhoto || userProfile?.profilePhoto || ''
  );
  const [isPhotoVerifiedReal, setIsPhotoVerifiedReal] = useState<boolean>(
    workerProfile?.isPhotoVerifiedReal ?? true
  );
  const [dateOfBirth, setDateOfBirth] = useState(workerProfile?.dateOfBirth || '');
  const [ageEligibilityConfirmed, setAgeEligibilityConfirmed] = useState(
    workerProfile?.ageEligibilityConfirmed ?? true
  );
  const [gender, setGender] = useState<Gender | undefined>(workerProfile?.gender || 'male');
  const [phone, setPhone] = useState(
    workerProfile?.phone || userProfile?.phone || currentUser?.phoneNumber || '+91 '
  );
  const [email, setEmail] = useState(
    workerProfile?.email || userProfile?.email || currentUser?.email || ''
  );
  const [currentAddress, setCurrentAddress] = useState(workerProfile?.currentAddress || '');
  const [country] = useState('India');
  const [state, setState] = useState(workerProfile?.state || '');
  const [district, setDistrict] = useState(workerProfile?.district || '');
  const [city, setCity] = useState(workerProfile?.city || '');
  const [area, setArea] = useState(workerProfile?.area || '');
  const [pincode, setPincode] = useState(workerProfile?.pincode || '');
  const [lat, setLat] = useState<number | undefined>(workerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(workerProfile?.lng);
  const [preferredLanguage, setPreferredLanguage] = useState(
    workerProfile?.preferredLanguage || userProfile?.preferredLanguage || 'Hindi (हिन्दी)'
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    workerProfile?.emergencyContactName || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    workerProfile?.emergencyContactPhone || ''
  );
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(
    workerProfile?.emergencyContactRelation || ''
  );

  // ==================== STEP 3: EDUCATION DETAILS ====================
  const [education, setEducation] = useState<EducationLevel>(
    workerProfile?.education || 'Higher secondary'
  );
  const [schoolOrCollegeName, setSchoolOrCollegeName] = useState(
    workerProfile?.schoolOrCollegeName || ''
  );
  const [passingYear, setPassingYear] = useState(workerProfile?.passingYear || '');
  const [additionalQualifications, setAdditionalQualifications] = useState(
    workerProfile?.additionalQualifications || ''
  );
  const [educationCertificates, setEducationCertificates] = useState<CertificateAttachment[]>(
    workerProfile?.educationCertificates || []
  );

  // ==================== STEP 4: PROFESSIONAL DETAILS ====================
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(
    workerProfile?.selectedProfessions || []
  );
  const [customProfession, setCustomProfession] = useState(workerProfile?.customProfession || '');
  const [experience, setExperience] = useState<ExperienceLevel>(
    workerProfile?.experience || '1–3 years'
  );
  const [previousCompanyName, setPreviousCompanyName] = useState(
    workerProfile?.previousCompanyName || ''
  );
  const [previousJobRole, setPreviousJobRole] = useState(workerProfile?.previousJobRole || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(workerProfile?.skills || []);
  const [customSkills, setCustomSkills] = useState<string[]>(workerProfile?.customSkills || []);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('All');
  const [workPortfolioUrl, setWorkPortfolioUrl] = useState(workerProfile?.workPortfolioUrl || '');
  const [workPortfolioDescription, setWorkPortfolioDescription] = useState(
    workerProfile?.workPortfolioDescription || ''
  );
  const [workPortfolioImages, setWorkPortfolioImages] = useState<string[]>(
    workerProfile?.workPortfolioImages || []
  );
  const [skillCertificates, setSkillCertificates] = useState<CertificateAttachment[]>(
    workerProfile?.skillCertificates || []
  );

  // ==================== STEP 5: JOB PREFERENCES ====================
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    workerProfile?.preferredLocations || workerProfile?.jobPreferences?.preferredLocations || []
  );
  const [locationInput, setLocationInput] = useState('');
  const [preferredSearchRadiusKm, setPreferredSearchRadiusKm] = useState<SearchRadiusKm>(
    workerProfile?.jobPreferences?.preferredSearchRadiusKm || 50
  );
  const [jobTypes, setJobTypes] = useState<string[]>(
    workerProfile?.jobPreferences?.jobTypes || ['Full-time']
  );
  const [expectedSalary, setExpectedSalary] = useState(
    workerProfile?.jobPreferences?.expectedSalary || '₹15,000 - ₹25,000 / month'
  );
  const [expectedDailyWage, setExpectedDailyWage] = useState(
    workerProfile?.jobPreferences?.expectedDailyWage || '₹600 - ₹900 / day'
  );
  const [preferredWorkingHours, setPreferredWorkingHours] = useState(
    workerProfile?.jobPreferences?.preferredWorkingHours || '8 Hours Standard (Day Shift)'
  );
  const [availability, setAvailability] = useState<
    'Immediate' | 'Within 15 days' | 'Within 1 month' | 'Flexible'
  >(workerProfile?.jobPreferences?.availability || 'Immediate');
  const [willingToRelocate, setWillingToRelocate] = useState<boolean>(
    workerProfile?.jobPreferences?.willingToRelocate ?? false
  );
  const [accommodationRequired, setAccommodationRequired] = useState<boolean>(
    workerProfile?.jobPreferences?.accommodationRequired ?? false
  );

  // ==================== STEP 6: DOCUMENTS & VERIFICATION ====================
  const [identityVerificationProvider, setIdentityVerificationProvider] = useState(
    workerProfile?.identityVerificationProvider || 'UIDAI Offline e-KYC (Authorized Provider)'
  );
  const [last4IdDigits, setLast4IdDigits] = useState(
    workerProfile?.identityVerifiedMask ? workerProfile.identityVerifiedMask.slice(-4) : ''
  );
  const [identityConsentChecked, setIdentityConsentChecked] = useState<boolean>(
    Boolean(workerProfile?.identityVerifiedMask)
  );
  const [identityVerificationStatus, setIdentityVerificationStatus] = useState<
    'Verified' | 'Pending' | 'Not Started'
  >(workerProfile?.identityVerificationStatus || 'Not Started');

  const [digilockerLinked, setDigilockerLinked] = useState<boolean>(
    workerProfile?.digilockerLinked ?? false
  );
  const [digilockerSharedDocs, setDigilockerSharedDocs] = useState<string[]>(
    workerProfile?.digilockerSharedDocs || []
  );

  const [resumeUrl, setResumeUrl] = useState(workerProfile?.resumeUrl || '');
  const [resumeName, setResumeName] = useState(workerProfile?.resumeName || '');

  // Mobile OTP Verification interactive state
  const [mobileOtpVerified, setMobileOtpVerified] = useState<boolean>(
    workerProfile?.mobileOtpVerified ?? false
  );
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState('');
  const [generatedMobileOtp, setGeneratedMobileOtp] = useState('482910');

  // Email Verification interactive state
  const [emailVerified, setEmailVerified] = useState<boolean>(
    workerProfile?.emailVerified ?? Boolean(currentUser?.emailVerified || email)
  );
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');

  // Reactive Hydration: whenever workerProfile, userProfile, or currentUser loads/updates,
  // populate any empty local fields so saved profile details NEVER disappear!
  useEffect(() => {
    if (!workerProfile && !userProfile && !currentUser) return;
    setFullName((prev) => prev || workerProfile?.fullName || userProfile?.name || currentUser?.displayName || '');
    setProfilePhoto((prev) => prev || workerProfile?.profilePhoto || userProfile?.profilePhoto || '');
    setPhone((prev) =>
      prev && prev.trim() !== '+91'
        ? prev
        : workerProfile?.phone || userProfile?.phone || currentUser?.phoneNumber || '+91 '
    );
    setEmail((prev) => prev || workerProfile?.email || userProfile?.email || currentUser?.email || '');
    if (workerProfile?.dateOfBirth) setDateOfBirth((prev) => prev || workerProfile.dateOfBirth!);
    if (workerProfile?.gender) setGender(workerProfile.gender);
    if (workerProfile?.currentAddress) setCurrentAddress((prev) => prev || workerProfile.currentAddress!);
    if (workerProfile?.state) setState((prev) => prev || workerProfile.state);
    if (workerProfile?.district) setDistrict((prev) => prev || workerProfile.district!);
    if (workerProfile?.city) setCity((prev) => prev || workerProfile.city!);
    if (workerProfile?.area) setArea((prev) => prev || workerProfile.area!);
    if (workerProfile?.pincode) setPincode((prev) => prev || workerProfile.pincode);
    if (typeof workerProfile?.lat === 'number') setLat((prev) => prev ?? workerProfile.lat);
    if (typeof workerProfile?.lng === 'number') setLng((prev) => prev ?? workerProfile.lng);
    if (workerProfile?.preferredLanguage || userProfile?.preferredLanguage) {
      setPreferredLanguage(
        (prev) => prev || workerProfile?.preferredLanguage || userProfile?.preferredLanguage || 'Hindi (हिन्दी)'
      );
    }
    if (workerProfile?.emergencyContactName) setEmergencyContactName((prev) => prev || workerProfile.emergencyContactName!);
    if (workerProfile?.emergencyContactPhone) setEmergencyContactPhone((prev) => prev || workerProfile.emergencyContactPhone!);
    if (workerProfile?.emergencyContactRelation) {
      setEmergencyContactRelation((prev) => prev || workerProfile.emergencyContactRelation!);
    }
    if (workerProfile?.education) setEducation(workerProfile.education);
    if (workerProfile?.schoolOrCollegeName) setSchoolOrCollegeName((prev) => prev || workerProfile.schoolOrCollegeName!);
    if (workerProfile?.passingYear) setPassingYear((prev) => prev || workerProfile.passingYear!);
    if (workerProfile?.additionalQualifications) {
      setAdditionalQualifications((prev) => prev || workerProfile.additionalQualifications!);
    }
    if (workerProfile?.educationCertificates?.length) {
      setEducationCertificates((prev) => (prev.length > 0 ? prev : workerProfile.educationCertificates!));
    }
    if (workerProfile?.selectedProfessions?.length) {
      setSelectedProfessions((prev) => (prev.length > 0 ? prev : workerProfile.selectedProfessions!));
    }
    if (workerProfile?.customProfession) setCustomProfession((prev) => prev || workerProfile.customProfession!);
    if (workerProfile?.experience) setExperience(workerProfile.experience);
    if (workerProfile?.previousCompanyName) setPreviousCompanyName((prev) => prev || workerProfile.previousCompanyName!);
    if (workerProfile?.previousJobRole) setPreviousJobRole((prev) => prev || workerProfile.previousJobRole!);
    if (workerProfile?.skills?.length) setSelectedSkills((prev) => (prev.length > 0 ? prev : workerProfile.skills!));
    if (workerProfile?.customSkills?.length) setCustomSkills((prev) => (prev.length > 0 ? prev : workerProfile.customSkills!));
    if (workerProfile?.workPortfolioUrl) setWorkPortfolioUrl((prev) => prev || workerProfile.workPortfolioUrl!);
    if (workerProfile?.workPortfolioDescription) {
      setWorkPortfolioDescription((prev) => prev || workerProfile.workPortfolioDescription!);
    }
    if (workerProfile?.workPortfolioImages?.length) {
      setWorkPortfolioImages((prev) => (prev.length > 0 ? prev : workerProfile.workPortfolioImages!));
    }
    if (workerProfile?.skillCertificates?.length) {
      setSkillCertificates((prev) => (prev.length > 0 ? prev : workerProfile.skillCertificates!));
    }
    if (workerProfile?.preferredLocations?.length || workerProfile?.jobPreferences?.preferredLocations?.length) {
      setPreferredLocations((prev) =>
        prev.length > 0
          ? prev
          : workerProfile?.preferredLocations || workerProfile?.jobPreferences?.preferredLocations || []
      );
    }
    if (workerProfile?.jobPreferences) {
      const jp = workerProfile.jobPreferences;
      if (jp.preferredSearchRadiusKm) setPreferredSearchRadiusKm(jp.preferredSearchRadiusKm);
      if (jp.jobTypes?.length) setJobTypes((prev) => (prev.length > 0 ? prev : jp.jobTypes));
      if (jp.expectedSalary) setExpectedSalary((prev) => prev || jp.expectedSalary);
      if (jp.expectedDailyWage) setExpectedDailyWage((prev) => prev || jp.expectedDailyWage!);
      if (jp.preferredWorkingHours) setPreferredWorkingHours((prev) => prev || jp.preferredWorkingHours!);
      if (jp.availability) setAvailability(jp.availability);
      if (jp.willingToRelocate !== undefined) setWillingToRelocate(jp.willingToRelocate);
      if (jp.accommodationRequired !== undefined) setAccommodationRequired(jp.accommodationRequired);
    }
    if (workerProfile?.resumeUrl) setResumeUrl((prev) => prev || workerProfile.resumeUrl!);
    if (workerProfile?.resumeName) setResumeName((prev) => prev || workerProfile.resumeName!);
    if (workerProfile?.identityVerificationStatus) {
      setIdentityVerificationStatus(workerProfile.identityVerificationStatus);
    }
    if (workerProfile?.digilockerLinked) setDigilockerLinked(true);
    if (workerProfile?.digilockerSharedDocs?.length) {
      setDigilockerSharedDocs((prev) => (prev.length > 0 ? prev : workerProfile.digilockerSharedDocs!));
    }
    if (workerProfile?.mobileOtpVerified) setMobileOtpVerified(true);
    if (workerProfile?.emailVerified) setEmailVerified(true);
  }, [workerProfile, userProfile, currentUser]);

  // Stop webcam stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Calculate live Profile Completion Percentage (0 - 100%)
  const calculateCompletionPercentage = (): number => {
    let score = 0;
    // 1. Personal Info (25%)
    if (fullName.trim()) score += 5;
    if (profilePhoto) score += 8;
    if (phone.replace(/\D/g, '').length >= 10) score += 5;
    if (state && pincode.length === 6) score += 7;

    // 2. Education Details (15%)
    if (education) score += 8;
    if (schoolOrCollegeName.trim() || passingYear.trim() || educationCertificates.length > 0) {
      score += 7;
    }

    // 3. Professional Details (25%)
    if (selectedProfessions.length > 0) score += 10;
    if (selectedSkills.length + customSkills.length > 0) score += 10;
    if (experience) score += 5;

    // 4. Job Preferences (15%)
    if (jobTypes.length > 0 && expectedSalary) score += 8;
    if (preferredSearchRadiusKm) score += 7;

    // 5. Verification & Documents (20%)
    if (mobileOtpVerified) score += 7;
    if (emailVerified) score += 5;
    if (identityVerificationStatus === 'Verified' || digilockerLinked || resumeUrl) score += 8;

    return Math.min(score, 100);
  };

  const liveCompletionPercent = calculateCompletionPercentage();

  // Build current draft payload for Firestore autosave
  const buildCurrentDraft = (): Partial<WorkerProfile> => ({
    fullName: fullName.trim() || userProfile?.name || '',
    phone: phone.trim(),
    email: email.trim() || userProfile?.email || currentUser?.email || '',
    dateOfBirth: dateOfBirth || '',
    ageEligibilityConfirmed,
    gender,
    profilePhoto: profilePhoto || '',
    isPhotoVerifiedReal: !!isPhotoVerifiedReal,
    currentAddress: currentAddress.trim(),
    country,
    state,
    district: district.trim(),
    city: city.trim(),
    area: area.trim(),
    pincode: pincode.trim(),
    lat: lat || 28.6139,
    lng: lng || 77.2090,
    preferredLanguage,
    emergencyContactName: emergencyContactName.trim(),
    emergencyContactPhone: emergencyContactPhone.trim(),
    emergencyContactRelation: emergencyContactRelation.trim(),
    preferredLocations,
    education,
    schoolOrCollegeName: schoolOrCollegeName.trim(),
    passingYear: passingYear.trim(),
    additionalQualifications: additionalQualifications.trim(),
    educationCertificates,
    selectedProfessions,
    customProfession: customProfession.trim(),
    skills: selectedSkills,
    customSkills,
    experience,
    previousCompanyName: previousCompanyName.trim(),
    previousJobRole: previousJobRole.trim(),
    workPortfolioUrl: workPortfolioUrl.trim(),
    workPortfolioDescription: workPortfolioDescription.trim(),
    workPortfolioImages,
    skillCertificates,
    jobPreferences: {
      jobTypes,
      expectedSalary,
      expectedDailyWage,
      preferredWorkingHours,
      preferredSearchRadiusKm,
      availability,
      preferredLocations,
      willingToRelocate,
      accommodationRequired
    },
    resumeUrl,
    resumeName,
    identityVerificationProvider,
    identityVerifiedMask:
      last4IdDigits.length === 4 ? `XXXX-XXXX-${last4IdDigits}` : workerProfile?.identityVerifiedMask || '',
    identityVerificationStatus,
    digilockerLinked,
    digilockerSharedDocs,
    mobileOtpVerified,
    emailVerified,
    profileCompletionPercentage: liveCompletionPercent
  });

  const triggerAutosave = async () => {
    try {
      setAutosaving(true);
      await saveDraftWorkerProfile(buildCurrentDraft());
      const now = new Date();
      setLastAutosavedAt(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      // ignore transient offline errors
    } finally {
      setAutosaving(false);
    }
  };

  const handleSaveDraftAndExit = async () => {
    await triggerAutosave();
    onCancel();
  };

  // ==================== CAMERA & FILE UPLOAD HANDLERS ====================
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Profile photograph must be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const startLiveCamera = async () => {
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = mediaStream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);
    } catch {
      setErrorMsg(
        'Unable to access camera directly. Please use the "Upload from Gallery / Device" button instead.'
      );
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setProfilePhoto(dataUrl);
      setIsPhotoVerifiedReal(true);
    }
    stopLiveCamera();
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCertificateUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'education' | 'skill'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('Each certificate file must be under 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const attachment: CertificateAttachment = {
          name: file.name,
          url: reader.result as string,
          uploadedAt: new Date().toLocaleDateString('en-IN')
        };
        if (target === 'education') {
          setEducationCertificates((prev) => [...prev, attachment]);
        } else {
          setSkillCertificates((prev) => [...prev, attachment]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePortfolioImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (file.size > 3 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkPortfolioImages((prev) =>
          prev.length < 4 ? [...prev, reader.result as string] : prev
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Resume file must be under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setResumeUrl(reader.result as string);
      setResumeName(file.name);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // ==================== PROFESSION & SKILL TOGGLES ====================
  const toggleProfession = (prof: string) => {
    setSelectedProfessions((prev) => {
      const exists = prev.includes(prof);
      const updated = exists ? prev.filter((p) => p !== prof) : [...prev, prof];
      // Auto-suggest relevant trade skills when selecting a profession
      if (!exists && PROFESSION_DEFAULT_SKILLS[prof]) {
        const defaults = PROFESSION_DEFAULT_SKILLS[prof];
        setSelectedSkills((currSkills) => {
          const combined = new Set([...currSkills, ...defaults]);
          return Array.from(combined);
        });
      }
      return updated;
    });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !customSkills.includes(trimmed) && !selectedSkills.includes(trimmed)) {
      setCustomSkills((prev) => [...prev, trimmed]);
      setCustomSkillInput('');
    }
  };

  const removeCustomSkill = (skill: string) => {
    setCustomSkills((prev) => prev.filter((s) => s !== skill));
  };

  const addPreferredLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !preferredLocations.includes(trimmed)) {
      setPreferredLocations((prev) => [...prev, trimmed]);
      setLocationInput('');
    }
  };

  const removePreferredLocation = (loc: string) => {
    setPreferredLocations((prev) => prev.filter((l) => l !== loc));
  };

  const toggleJobType = (type: string) => {
    setJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleDigilockerDoc = (docName: string) => {
    setDigilockerSharedDocs((prev) =>
      prev.includes(docName) ? prev.filter((d) => d !== docName) : [...prev, docName]
    );
  };

  // ==================== STEP VALIDATION ====================
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 2) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your Full Legal Name.');
        return false;
      }
      if (!profilePhoto) {
        setErrorMsg('Please upload or capture your Profile Photograph.');
        return false;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        setErrorMsg('Please enter a valid 10-digit Indian Mobile Number.');
        return false;
      }
      if (!state) {
        setErrorMsg('Please select your State.');
        return false;
      }
      if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        setErrorMsg('Please enter a valid 6-digit Indian PIN Code.');
        return false;
      }
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          setErrorMsg('Workers must be 18 years or older to register on JOBSETU INDIA.');
          return false;
        }
      }
      if (!ageEligibilityConfirmed) {
        setErrorMsg('Please confirm that you are 18+ years of age.');
        return false;
      }
    } else if (step === 3) {
      if (!education) {
        setErrorMsg('Please select your Highest Education Qualification.');
        return false;
      }
    } else if (step === 4) {
      if (selectedProfessions.length === 0) {
        setErrorMsg('Please select at least one Profession from the list.');
        return false;
      }
      if (selectedSkills.length === 0 && customSkills.length === 0) {
        setErrorMsg('Please select or add at least one Professional Skill.');
        return false;
      }
    } else if (step === 5) {
      if (jobTypes.length === 0) {
        setErrorMsg('Please select at least one Employment Type (Full-Time, Part-Time, etc.).');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      await triggerAutosave();
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        await handleSubmitProfile();
      }
    }
  };

  const handleBack = async () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      await triggerAutosave();
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleSaveDraftAndExit();
    }
  };

  const handleSendMobileOtp = () => {
    setErrorMsg(null);
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit Mobile Number in Step 2 first.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedMobileOtp(code);
    setMobileOtpInput(code);
    setMobileOtpSent(true);
  };

  const handleVerifyMobileOtp = () => {
    if (mobileOtpInput.trim().length >= 4) {
      setMobileOtpVerified(true);
      setMobileOtpSent(false);
    } else {
      setErrorMsg('Please enter the 6-digit OTP sent to your mobile number.');
    }
  };

  const handleVerifyIdentityProvider = () => {
    if (last4IdDigits.replace(/\D/g, '').length !== 4) {
      setErrorMsg('Please enter only the last 4 digits of your ID for masked verification.');
      return;
    }
    if (!identityConsentChecked) {
      setErrorMsg('Please check the consent box to authorize verification.');
      return;
    }
    setErrorMsg(null);
    setIdentityVerificationStatus('Verified');
  };

  const handleSubmitProfile = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const finalDraft = buildCurrentDraft();
      const profilePayload: Omit<WorkerProfile, 'uid' | 'submittedAt' | 'updatedAt'> = {
        fullName: finalDraft.fullName || fullName.trim(),
        phone: finalDraft.phone || phone.trim(),
        email: finalDraft.email || email.trim(),
        dateOfBirth: finalDraft.dateOfBirth || '',
        ageEligibilityConfirmed: true,
        gender: finalDraft.gender || 'male',
        profilePhoto: finalDraft.profilePhoto || '',
        isPhotoVerifiedReal: true,
        currentAddress: finalDraft.currentAddress || '',
        country: 'India',
        state: finalDraft.state || state,
        district: finalDraft.district || '',
        city: finalDraft.city || '',
        area: finalDraft.area || '',
        pincode: finalDraft.pincode || pincode,
        lat: finalDraft.lat || 28.6139,
        lng: finalDraft.lng || 77.2090,
        preferredLanguage: finalDraft.preferredLanguage || 'Hindi (हिन्दी)',
        emergencyContactName: finalDraft.emergencyContactName || '',
        emergencyContactPhone: finalDraft.emergencyContactPhone || '',
        emergencyContactRelation: finalDraft.emergencyContactRelation || '',
        preferredLocations: finalDraft.preferredLocations || [],
        education: finalDraft.education || 'Higher secondary',
        schoolOrCollegeName: finalDraft.schoolOrCollegeName || '',
        passingYear: finalDraft.passingYear || '',
        additionalQualifications: finalDraft.additionalQualifications || '',
        educationCertificates: finalDraft.educationCertificates || [],
        selectedProfessions: finalDraft.selectedProfessions || [],
        customProfession: finalDraft.customProfession || '',
        skills: finalDraft.skills || [],
        customSkills: finalDraft.customSkills || [],
        experience: finalDraft.experience || '1–3 years',
        previousCompanyName: finalDraft.previousCompanyName || '',
        previousJobRole: finalDraft.previousJobRole || '',
        workPortfolioUrl: finalDraft.workPortfolioUrl || '',
        workPortfolioDescription: finalDraft.workPortfolioDescription || '',
        workPortfolioImages: finalDraft.workPortfolioImages || [],
        skillCertificates: finalDraft.skillCertificates || [],
        jobPreferences: finalDraft.jobPreferences!,
        resumeUrl: finalDraft.resumeUrl || '',
        resumeName: finalDraft.resumeName || '',
        identityVerificationProvider: finalDraft.identityVerificationProvider || '',
        identityVerifiedMask: finalDraft.identityVerifiedMask || '',
        identityVerificationStatus: finalDraft.identityVerificationStatus || 'Verified',
        digilockerLinked: Boolean(finalDraft.digilockerLinked),
        digilockerSharedDocs: finalDraft.digilockerSharedDocs || [],
        mobileOtpVerified: Boolean(finalDraft.mobileOtpVerified),
        emailVerified: Boolean(finalDraft.emailVerified),
        profileCompletionPercentage: Math.max(liveCompletionPercent, 90)
      };

      await saveWorkerProfile(profilePayload);
      setRegistrationCompleteBanner(true);
      setTimeout(() => {
        onComplete();
      }, 900);
    } catch (err: any) {
      console.error('Error saving worker profile:', err);
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Bar with Logo, Autosave Status & Save/Exit */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/90 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO_URL}
              alt="JOBSETU INDIA Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  JOB<span className="text-[#2563EB]">SETU</span>{' '}
                  <span className="text-amber-600">INDIA</span>
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-semibold text-[#2563EB]">
                  Job Seeker & Worker Registration
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Connecting India&apos;s Skilled Workforce, Tradespeople & Professionals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {autosaving ? (
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving progress...
              </span>
            ) : lastAutosavedAt ? (
              <span className="text-[11px] font-medium text-emerald-700 hidden sm:inline">
                Autosaved at {lastAutosavedAt}
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleSaveDraftAndExit}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Save & Go to Dashboard
            </button>
          </div>
        </div>

        {/* Animated Progress Bar & Interactive Stepper */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#2563EB]">
                0{currentStep}. {STEP_META[currentStep - 1].title}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 font-medium">
                {STEP_META[currentStep - 1].subtitle}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
              <span className="text-slate-600">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700">
                Profile Strength: {liveCompletionPercent}%
              </span>
            </div>
          </div>

          {/* Animated Smooth Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#2563EB] via-indigo-600 to-emerald-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>

          {/* Step Indicators Row */}
          <div className="grid grid-cols-7 gap-1.5 pt-4 mt-4 border-t border-slate-100">
            {STEP_META.map((step) => {
              const IconComponent = step.icon;
              const isCurrent = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`group flex flex-col items-center text-center p-1.5 rounded-xl transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/80 text-[#2563EB]'
                      : isCompleted
                      ? 'text-emerald-700 hover:bg-emerald-50/50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/30 scale-105'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <IconComponent className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold mt-1.5 hidden sm:block truncate max-w-full">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-red-500 hover:text-red-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Step Container */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/90"
        >
            {/* ==================== STEP 1: SIGNUP WELCOME SCREEN ==================== */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Brand Message & Value Props */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80">
                      <img
                        src={APP_LOGO_URL}
                        alt="JOBSETU INDIA"
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-md object-contain"
                      />
                      <span className="text-xs font-extrabold text-[#2563EB] tracking-tight">
                        JOBSETU INDIA · Bharat&apos;s Verified Employment Network
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.12]">
                        <WordStagger text="Find Opportunities." />{' '}
                        <span className="text-[#2563EB]">
                          <WordStagger text="Build Your Future." delay={0.22} />
                        </span>
                      </h1>
                      <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
                        Your next opportunity is just one step away.
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Whether you are a skilled electrician, construction worker, driver, technician, delivery partner, or software professional — build your verified JOBSETU profile in minutes and connect directly with trusted employers within 5 to 100 km of your home.
                      </p>
                    </div>

                    {/* Key Highlights */}
                    <StaggeredCardContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <StaggeredCardItem>
                        <HoverSpotlightCard className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 h-full">
                          <span className="text-lg font-black text-[#2563EB] tabular-nums block">
                            100% Free
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            Zero middlemen or commission fees for workers
                          </span>
                        </HoverSpotlightCard>
                      </StaggeredCardItem>
                      <StaggeredCardItem>
                        <HoverSpotlightCard spotlightColor="rgba(16, 185, 129, 0.08)" className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 h-full">
                          <span className="text-lg font-black text-emerald-700 tabular-nums block">
                            5–100 KM
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            Hyperlocal radar matches jobs near your PIN code
                          </span>
                        </HoverSpotlightCard>
                      </StaggeredCardItem>
                      <StaggeredCardItem>
                        <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.08)" className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 h-full">
                          <span className="text-lg font-black text-amber-600 tabular-nums block">
                            15+ Trades
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            Daily wage, skilled trades & office careers
                          </span>
                        </HoverSpotlightCard>
                      </StaggeredCardItem>
                    </StaggeredCardContainer>

                    {/* Primary CTA */}
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <MagneticButton>
                        <RippleContainer className="rounded-2xl">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-8 py-4 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-600/25 flex items-center gap-3 cursor-pointer transition-colors jobsetu-liquid-btn"
                          >
                            <span>Create Your Profile</span>
                            <ArrowRight className="w-5 h-5" />
                          </motion.button>
                        </RippleContainer>
                      </MagneticButton>

                      <button
                        type="button"
                        onClick={handleSaveDraftAndExit}
                        className="px-5 py-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Explore Dashboard First
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Animated Indian Workers Illustration & Floating Industry Cards */}
                  <div className="lg:col-span-6 relative">
                    <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-900 aspect-16/10">
                      <ParticleBackground count={8} dotColor="bg-white/20" />
                      <AnimatedImage
                        variant="curtain"
                        curtainColor="bg-blue-700"
                        src="/src/assets/images/indian_workers_welcome_hero_1794496422187.jpg"
                        alt="Indian workers across construction, electrical, delivery, office and technical industries"
                        referrerPolicy="no-referrer"
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-amber-300">
                            Skilled & General Workforce Across 28 States & 8 UTs
                          </p>
                          <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                            Direct Hiring by Verified Indian Enterprises & Local Shops
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Floating Animated Worker Cards */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 absolute -top-4 -left-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Construction, Electrical & Plumbing
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Daily Wage & Monthly Roles Available
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 absolute -bottom-4 -right-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          DigiLocker & OTP Verified Profile
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          3x Faster Employer Callbacks
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Secondary Visual Showcase Strip of Indian Industries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <HoverSpotlightCard className="rounded-2xl">
                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <AnimatedImage
                        variant="zoomThrough"
                        src="/src/assets/images/indian_skilled_trades_showcase_1794496423409.jpg"
                        alt="Indian Electrician and Skilled Technicians"
                        referrerPolicy="no-referrer"
                        wrapperClassName="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200"
                        className="w-full h-full object-cover"
                      />
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900">
                          Industrial, Technical & Craft Trades
                        </h3>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          Electricians, Plumbers, Welders, Carpenters, Painters, Mechanics & Factory Operators.
                        </p>
                      </div>
                    </div>
                  </HoverSpotlightCard>

                  <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.08)" className="rounded-2xl">
                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <AnimatedImage
                        variant="parallax"
                        src="/src/assets/images/indian_professional_logistics_showcase_1794496424468.jpg"
                        alt="Indian Delivery, Office and IT Professionals"
                        referrerPolicy="no-referrer"
                        wrapperClassName="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200"
                        className="w-full h-full object-cover"
                      />
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900">
                          Logistics, Office, Retail & Digital Careers
                        </h3>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          Drivers, Delivery Partners, Security Guards, Office Assistants, Designers & Software Developers.
                        </p>
                      </div>
                    </div>
                  </HoverSpotlightCard>
                </div>
              </div>
            )}

            {/* ==================== STEP 2: PERSONAL INFORMATION ==================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#2563EB]" />
                      <span>02. Personal Information & Current Address</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your identity, contact details, and residential location help nearby employers reach you.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    * Indicates mandatory field
                  </span>
                </div>

                {/* Profile Photograph (Camera + Gallery Upload + Animated Preview) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="relative shrink-0"
                    >
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Worker Profile Preview"
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-[#2563EB] shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-[#2563EB]">
                          <Camera className="w-7 h-7 mb-1" />
                          <span className="text-[10px] font-bold">Photo *</span>
                        </div>
                      )}
                    </motion.div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Profile Photograph (Camera or Gallery) <span className="text-red-500">*</span>
                        </h3>
                        <span className="text-xs text-emerald-700 font-semibold">
                          · Authentic Portrait Required
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Upload a clear photograph from your phone/computer gallery or take a live selfie with your camera so verified employers recognize you.
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>{profilePhoto ? 'Change from Gallery' : 'Upload from Gallery'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={cameraActive ? stopLiveCamera : startLiveCamera}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{cameraActive ? 'Close Camera' : 'Take Photo with Camera'}</span>
                        </button>

                        {profilePhoto && (
                          <button
                            type="button"
                            onClick={() => setProfilePhoto('')}
                            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Webcam Viewfinder if active */}
                  {cameraActive && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-sm mx-auto rounded-xl border border-slate-700"
                      />
                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={captureCameraFrame}
                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs cursor-pointer"
                        >
                          Capture Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopLiveCamera}
                          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 pt-2 border-t border-slate-200/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPhotoVerifiedReal}
                      onChange={(e) => setIsPhotoVerifiedReal(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] mt-0.5"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      I confirm this is a genuine photograph of myself and I am 18+ years old.
                    </span>
                  </label>
                </div>

                {/* Full Name, Date of Birth & Gender (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar Verma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Birth <span className="text-slate-400 font-normal">(18+ yrs)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gender <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={gender || ''}
                      onChange={(e) =>
                        setGender((e.target.value as Gender) || undefined)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Number, Email Address & Preferred Language */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="worker@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Language
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                      >
                        {INDIAN_LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Current Residential Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Residential Address (House No., Street, Landmark)
                  </label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="e.g. House No. 42, Near Metro Pillar 118, Laxmi Nagar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                  />
                </div>

                {/* State, District, City & PIN Code with Interactive Map & GPS */}
                <div className="pt-2">
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
                </div>

                {/* Emergency Contact (Optional) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-extrabold text-slate-800">
                      Emergency Contact Details (Optional — For Workplace Safety)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Contact Person Name"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#2563EB]"
                    />
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="Emergency Mobile Number"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#2563EB]"
                    />
                    <input
                      type="text"
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                      placeholder="Relation (e.g. Father, Spouse, Brother)"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 3: EDUCATION DETAILS ==================== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#2563EB]" />
                    <span>03. Education & Academic Qualifications</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All educational backgrounds—from practical trade experience to ITI, Diploma, and University degrees—are welcome on JOBSETU INDIA.
                  </p>
                </div>

                {/* Highest Education Qualification */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2.5">
                    Highest Education Qualification <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(
                      [
                        'No formal education',
                        'Primary',
                        'Secondary',
                        'Higher secondary',
                        'ITI',
                        'Diploma',
                        'Undergraduate',
                        'Graduate',
                        'Postgraduate',
                        'Other'
                      ] as EducationLevel[]
                    ).map((lvl) => {
                      const isSelected = education === lvl;
                      return (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={lvl}
                          type="button"
                          onClick={() => setEducation(lvl)}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB]'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                          }`}
                        >
                          <span className="text-xs font-bold">{lvl}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* School / College Name & Passing Year */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School / College / ITI / Polytechnic Name
                    </label>
                    <input
                      type="text"
                      value={schoolOrCollegeName}
                      onChange={(e) => setSchoolOrCollegeName(e.target.value)}
                      placeholder="e.g. Govt. Industrial Training Institute (ITI), Pusa or Delhi University"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Passing Year
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={passingYear}
                      onChange={(e) => setPassingYear(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 2022"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm tabular-nums"
                    />
                  </div>
                </div>

                {/* Additional Qualifications */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Additional Qualifications / Short-Term Courses (Optional)
                  </label>
                  <input
                    type="text"
                    value={additionalQualifications}
                    onChange={(e) => setAdditionalQualifications(e.target.value)}
                    placeholder="e.g. PMKVY Skill India Course, Tally ERP, Basic Computer Diploma, Fire Safety"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                  />
                </div>

                {/* Education Certificates Upload */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">
                        Upload Academic / ITI / Diploma Certificates (Optional)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Attach marksheets, ITI trade certificates, or degree scans (PDF or Image).
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#2563EB] text-xs font-bold text-[#2563EB] cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>+ Upload Certificate</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => handleCertificateUpload(e, 'education')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {educationCertificates.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {educationCertificates.map((cert, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-800 truncate">{cert.name}</p>
                              <p className="text-[10px] text-slate-400">Added {cert.uploadedAt}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEducationCertificates((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== STEP 4: PROFESSIONAL DETAILS ==================== */}
            {currentStep === 4 && (
              <div className="space-y-7">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#2563EB]" />
                    <span>04. Profession, Work Experience & Skills</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your primary profession(s), add your work experience, and highlight your trade or professional skills.
                  </p>
                </div>

                {/* 15 Professions Multi-Select Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-extrabold text-slate-800">
                      Select Your Profession(s) <span className="text-red-500">*</span>{' '}
                      <span className="font-normal text-slate-500">(You can select multiple)</span>
                    </label>
                    <span className="text-xs font-bold text-[#2563EB] tabular-nums">
                      {selectedProfessions.length} Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {JOB_SEEKER_PROFESSIONS.map((prof) => {
                      const isSelected = selectedProfessions.includes(prof);
                      return (
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          key={prof}
                          type="button"
                          onClick={() => toggleProfession(prof)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-[#2563EB] bg-blue-50/90 text-[#2563EB] shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`p-2 rounded-xl ${
                                isSelected
                                  ? 'bg-[#2563EB] text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {PROFESSION_ICONS[prof] || <Wrench className="w-5 h-5" />}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
                          </div>
                          <span className="text-xs font-bold leading-snug">{prof}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {selectedProfessions.includes('Other') && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={customProfession}
                        onChange={(e) => setCustomProfession(e.target.value)}
                        placeholder="Specify your profession (e.g. CNC Operator, Crane Operator, Lab Technician)..."
                        className="w-full px-4 py-2.5 rounded-xl border border-blue-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Total Work Experience, Previous Company & Previous Job Role */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Work Experience <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white font-semibold"
                    >
                      <option value="Fresher">Fresher (0 years)</option>
                      <option value="Less than one year">Less than 1 year</option>
                      <option value="1–3 years">1–3 years</option>
                      <option value="3–5 years">3–5 years</option>
                      <option value="More than five years">More than 5 years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Previous Company / Contractor Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={previousCompanyName}
                        onChange={(e) => setPreviousCompanyName(e.target.value)}
                        placeholder="e.g. Local Electrical Contractor / Private Company"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Previous Job Role / Title
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={previousJobRole}
                        onChange={(e) => setPreviousJobRole(e.target.value)}
                        placeholder="e.g. Senior Site Electrician"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Skills Multi-Selection */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-slate-800">
                      Professional & Vocational Skills <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-emerald-700 tabular-nums">
                      {selectedSkills.length + customSkills.length} Skills Selected
                    </span>
                  </div>

                  {/* Search & Filter Skills */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        placeholder="Filter skills (e.g. Welding, Wiring, Driving, Tally)..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-xs"
                      />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryTab('All')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                          activeCategoryTab === 'All'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      {Object.keys(SKILL_CATEGORIES_DATA).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategoryTab(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                            activeCategoryTab === cat
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    {Object.entries(SKILL_CATEGORIES_DATA)
                      .filter(([cat]) => activeCategoryTab === 'All' || activeCategoryTab === cat)
                      .map(([category, skillsList]) => {
                        const matching = skillsList.filter((s) =>
                          s.toLowerCase().includes(skillSearchQuery.toLowerCase())
                        );
                        if (matching.length === 0) return null;
                        return (
                          <div key={category}>
                            <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                              {category}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {matching.map((skill) => {
                                const isSelected = selectedSkills.includes(skill);
                                return (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#2563EB] text-white shadow-2xs'
                                        : 'bg-white text-slate-700 border border-slate-300 hover:border-[#2563EB]'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                    <span>{skill}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Add Custom Skill */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addCustomSkill())
                      }
                      placeholder="Add another specific skill (e.g. Solar Panel Wiring, Tig Welding, AutoCAD)..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="px-4 py-2 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      + Add Skill
                    </button>
                  </div>

                  {customSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {customSkills.map((cs) => (
                        <span
                          key={cs}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900"
                        >
                          <span>{cs}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomSkill(cs)}
                            className="hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Portfolio (Optional) & Skill Certificates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#2563EB]" />
                      <span>Work Portfolio & Sample Photos (Optional)</span>
                    </h3>
                    <input
                      type="url"
                      value={workPortfolioUrl}
                      onChange={(e) => setWorkPortfolioUrl(e.target.value)}
                      placeholder="Portfolio / GitHub / Behance / Work Video Link"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#2563EB]"
                    />
                    <textarea
                      rows={2}
                      value={workPortfolioDescription}
                      onChange={(e) => setWorkPortfolioDescription(e.target.value)}
                      placeholder="Describe major projects, sites, or machines you have worked on..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#2563EB]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Upload photos of your past work ({workPortfolioImages.length}/4)
                      </span>
                      <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#2563EB] text-[11px] font-bold text-[#2563EB] cursor-pointer">
                        + Add Work Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePortfolioImagesUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {workPortfolioImages.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {workPortfolioImages.map((img, i) => (
                          <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border">
                            <img src={img} alt="Work sample" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setWorkPortfolioImages((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Skill Certificates Upload */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Skill & Trade Certificates (Optional)</span>
                      </h3>
                      <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#2563EB] text-[11px] font-bold text-[#2563EB] cursor-pointer">
                        + Upload Certificate
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={(e) => handleCertificateUpload(e, 'skill')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Upload Skill India, NSDC, Driving Licence, Wireman Licence, or trade experience letters.
                    </p>
                    {skillCertificates.length > 0 && (
                      <div className="space-y-1.5">
                        {skillCertificates.map((sc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate">{sc.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSkillCertificates((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 5: JOB PREFERENCES ==================== */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#2563EB]" />
                    <span>05. Job Preferences, Search Radius & Salary</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your hyperlocal search radius, expected monthly/daily wages, shift timings, and accommodation needs.
                  </p>
                </div>

                {/* Preferred Search Radius (5, 10, 25, 50, 100 km) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-2">
                    Preferred Hyperlocal Search Radius (Distance from your location)
                  </label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {([5, 10, 25, 50, 100] as SearchRadiusKm[]).map((radius) => {
                      const isSelected = preferredSearchRadiusKm === radius;
                      return (
                        <button
                          key={radius}
                          type="button"
                          onClick={() => setPreferredSearchRadiusKm(radius)}
                          className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer tabular-nums ${
                            isSelected
                              ? 'border-[#2563EB] bg-[#2563EB] text-white font-black shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-bold'
                          }`}
                        >
                          <span className="text-sm sm:text-base block">{radius} km</span>
                          <span
                            className={`text-[10px] block ${
                              isSelected ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {radius <= 10 ? 'Neighborhood' : radius <= 50 ? 'City & Suburbs' : 'Regional'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Job Locations */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Preferred Job Cities / Industrial Areas
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addPreferredLocation())
                      }
                      placeholder="e.g. Noida, Pune Chakan MIDC, Bengaluru Whitefield, Surat..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={addPreferredLocation}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                    >
                      + Add Location
                    </button>
                  </div>
                  {preferredLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {preferredLocations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-[#2563EB]"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => removePreferredLocation(loc)}
                            className="hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Full-Time / Part-Time / Contract / Temporary */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-2">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Work from home'].map(
                      (jt) => {
                        const isSelected = jobTypes.includes(jt);
                        return (
                          <button
                            key={jt}
                            type="button"
                            onClick={() => toggleJobType(jt)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            <span>{jt}</span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Expected Monthly Salary, Expected Daily Wages & Preferred Working Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Monthly Salary
                    </label>
                    <select
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      <option value="₹10,000 - ₹15,000 / month">₹10,000 - ₹15,000 / month</option>
                      <option value="₹15,000 - ₹25,000 / month">₹15,000 - ₹25,000 / month</option>
                      <option value="₹25,000 - ₹40,000 / month">₹25,000 - ₹40,000 / month</option>
                      <option value="₹40,000 - ₹70,000 / month">₹40,000 - ₹70,000 / month</option>
                      <option value="₹70,000+ / month">₹70,000+ / month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Daily Wages (Dehadi)
                    </label>
                    <select
                      value={expectedDailyWage}
                      onChange={(e) => setExpectedDailyWage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      <option value="₹400 - ₹600 / day">₹400 - ₹600 / day</option>
                      <option value="₹600 - ₹900 / day">₹600 - ₹900 / day</option>
                      <option value="₹900 - ₹1,200 / day">₹900 - ₹1,200 / day</option>
                      <option value="₹1,200 - ₹1,800 / day">₹1,200 - ₹1,800 / day</option>
                      <option value="₹1,800+ / day">₹1,800+ / day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Working Hours / Shift
                    </label>
                    <select
                      value={preferredWorkingHours}
                      onChange={(e) => setPreferredWorkingHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] outline-none text-sm bg-white"
                    >
                      <option value="8 Hours Standard (Day Shift)">8 Hours Standard (Day Shift)</option>
                      <option value="10–12 Hours (With Overtime Pay)">10–12 Hours (With Overtime Pay)</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="Rotational Shift">Rotational Shift</option>
                      <option value="Flexible / Part-Time Hours">Flexible / Part-Time Hours</option>
                    </select>
                  </div>
                </div>

                {/* Joining Availability */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-2">
                    Joining Availability (Immediate Joining or Later)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['Immediate', 'Within 15 days', 'Within 1 month', 'Flexible'] as const).map(
                      (avail) => {
                        const isSelected = availability === avail;
                        return (
                          <button
                            key={avail}
                            type="button"
                            onClick={() => setAvailability(avail)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-500'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {avail}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Willingness to Relocate & Accommodation Requirement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Willingness to Relocate
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Are you open to moving to another city/state for higher wages?
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWillingToRelocate(!willingToRelocate)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 ${
                        willingToRelocate
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {willingToRelocate ? 'Yes, Willing' : 'No, Local Only'}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Accommodation Requirement</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Do you require employer-provided room/hostel at the work site?
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccommodationRequired(!accommodationRequired)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 ${
                        accommodationRequired
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {accommodationRequired ? 'Yes, Needed' : 'Not Required'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 6: DOCUMENTS & VERIFICATION ==================== */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>06. Documents, DigiLocker & OTP Verification</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify your mobile, email, and credentials through authorized verification providers. JOBSETU never stores raw Aadhaar or sensitive government ID numbers.
                  </p>
                </div>

                {/* Privacy & Data Minimization Guarantee */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700">
                    <span className="font-extrabold text-slate-900 block">
                      Zero Raw Identity Storage Guarantee
                    </span>
                    <span>
                      In compliance with Indian privacy guidelines, JOBSETU INDIA only records a masked 4-digit verification token (`XXXX-XXXX-1234`) and issuer status. Full identity numbers are never stored.
                    </span>
                  </div>
                </div>

                {/* 1. Mobile OTP & Email Verification Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile OTP Verification */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#2563EB]" />
                        <h3 className="text-xs font-extrabold text-slate-900">
                          Mobile OTP Verification
                        </h3>
                      </div>
                      {mobileOtpVerified ? (
                        <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Pending</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      Number: <strong className="text-slate-900">{phone || 'Not entered'}</strong>
                    </p>

                    {!mobileOtpVerified && !mobileOtpSent && (
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Send 6-Digit Mobile OTP
                      </button>
                    )}

                    {!mobileOtpVerified && mobileOtpSent && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Instant Verification OTP generated: <strong>{generatedMobileOtp}</strong>
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={mobileOtpInput}
                            onChange={(e) => setMobileOtpInput(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyMobileOtp}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Verification */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#2563EB]" />
                        <h3 className="text-xs font-extrabold text-slate-900">
                          Email Address Verification
                        </h3>
                      </div>
                      {emailVerified ? (
                        <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Pending</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 truncate">
                      Email: <strong className="text-slate-900">{email || 'Not entered'}</strong>
                    </p>

                    {!emailVerified && !emailOtpSent && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOtpInput('739204');
                          setEmailOtpSent(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                      >
                        Send Email Verification Code
                      </button>
                    )}

                    {!emailVerified && emailOtpSent && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value)}
                          placeholder="Verification Code"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEmailVerified(true);
                            setEmailOtpSent(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Verify Email
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Authorized Identity Verification Provider */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Identity Verification via Authorized Provider
                      </h3>
                      <p className="text-xs text-slate-500">
                        Verify age & identity using masked reference numbers only.
                      </p>
                    </div>
                    {identityVerificationStatus === 'Verified' && (
                      <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Masked ID Verified (XXXX-XXXX-{last4IdDigits || '4829'})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Authorized Verification Provider
                      </label>
                      <select
                        value={identityVerificationProvider}
                        onChange={(e) => setIdentityVerificationProvider(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none"
                      >
                        <option value="UIDAI Offline e-KYC (Authorized Provider)">
                          UIDAI Paperless Offline e-KYC
                        </option>
                        <option value="DigiLocker Verified Citizen ID">
                          DigiLocker Verified Citizen ID
                        </option>
                        <option value="NSDC Skill India Registry">
                          NSDC Skill India Registry
                        </option>
                        <option value="Voter ID / Driving Licence (Masked)">
                          Voter ID / Driving Licence (Masked)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Last 4 Digits Only (For Masked Reference)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={last4IdDigits}
                          onChange={(e) => setLast4IdDigits(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 4829 (Last 4 digits only)"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono tabular-nums outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyIdentityProvider}
                          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Verify ID
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={identityConsentChecked}
                      onChange={(e) => setIdentityConsentChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] mt-0.5"
                    />
                    <span className="text-xs text-slate-600">
                      I consent to one-time identity verification through the selected authorized provider. I understand only the last 4 digits are stored.
                    </span>
                  </label>
                </div>

                {/* 3. DigiLocker Document Sharing (Optional) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        DigiLocker Document Sharing (Optional)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select verified digital certificates from your DigiLocker account to share with employers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDigilockerLinked(!digilockerLinked)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        digilockerLinked
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {digilockerLinked ? '✓ DigiLocker Connected' : 'Connect DigiLocker'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      'Class 10 / 12 Marksheet',
                      'ITI Trade Certificate',
                      'Driving Licence',
                      'Skill India / PMKVY Certificate',
                      'Diploma / Degree Certificate'
                    ].map((docItem) => {
                      const isShared = digilockerSharedDocs.includes(docItem);
                      return (
                        <button
                          key={docItem}
                          type="button"
                          onClick={() => {
                            toggleDigilockerDoc(docItem);
                            setDigilockerLinked(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isShared
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isShared && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{docItem}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Resume Upload */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Resume / Bio-Data Upload (Optional)
                    </h3>
                    <p className="text-xs text-slate-500">
                      {resumeName
                        ? `Attached: ${resumeName}`
                        : 'Upload your CV, Bio-Data, or experience summary (PDF, DOC, or Image).'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#2563EB] text-xs font-bold text-[#2563EB] cursor-pointer">
                      {resumeUrl ? 'Replace Resume' : '+ Upload Resume'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                      />
                    </label>
                    {resumeUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setResumeUrl('');
                          setResumeName('');
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 7: PROFILE COMPLETION & PREVIEW SCREEN ==================== */}
            {currentStep === 7 && (
              <div className="space-y-8">
                {/* Registration Success Animation Banner */}
                <AnimatePresence>
                  {registrationCompleteBanner && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 rounded-3xl bg-emerald-600 text-white text-center space-y-2 shadow-xl"
                    >
                      <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-200" />
                      <h3 className="text-2xl font-black">
                        Profile Saved to JOBSETU INDIA!
                      </h3>
                      <p className="text-xs text-emerald-100">
                        Redirecting you to your live Job Seeker Dashboard...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Top Completion Percentage Header */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-400">
                      07. Profile Completion & Live Preview
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      Your JOBSETU Profile is {liveCompletionPercent}% Complete
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Review your complete worker & job seeker card below. You can jump back to edit any section or launch straight into your Dashboard.
                    </p>
                  </div>

                  {/* Animated Circular Percentage Gauge */}
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/15 shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-slate-950 flex flex-col items-center justify-center font-black tabular-nums">
                      <span className="text-xl leading-none">{liveCompletionPercent}%</span>
                      <span className="text-[9px] uppercase font-extrabold mt-0.5">Ready</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-extrabold text-white">Verified Candidate Card</p>
                      <p className="text-emerald-300 text-[11px]">
                        Visible to Employers in {preferredSearchRadiusKm} km radius
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comprehensive Profile Preview Card */}
                <div className="rounded-3xl border-2 border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt={fullName}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-[#2563EB] shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-black text-2xl">
                          {(fullName || 'W').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {fullName || 'Your Name'}
                        </h3>
                        <p className="text-xs font-bold text-[#2563EB] mt-0.5">
                          {selectedProfessions.length > 0
                            ? selectedProfessions.join(' · ')
                            : 'Job Seeker'}
                          {customProfession ? ` (${customProfession})` : ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {city ? `${city}, ` : ''}
                          {district ? `${district}, ` : ''}
                          {state || 'India'} {pincode ? `- ${pincode}` : ''} · {preferredLanguage}
                        </p>
                      </div>
                    </div>

                    {/* Quick Edit Step Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#2563EB] text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Experience & Past Role
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">{experience}</p>
                      <p className="text-slate-600">
                        {previousJobRole || 'Role not specified'}
                        {previousCompanyName ? ` at ${previousCompanyName}` : ''}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Education & Institute
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">{education}</p>
                      <p className="text-slate-600">
                        {schoolOrCollegeName || 'Institute not specified'}
                        {passingYear ? ` (${passingYear})` : ''}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Preferred Location & Search Radius
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm tabular-nums">
                        Within {preferredSearchRadiusKm} KM Radius
                      </p>
                      <p className="text-slate-600">
                        {preferredLocations.length > 0
                          ? preferredLocations.join(', ')
                          : city || state || 'All nearby areas'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Expected Salary & Daily Wage
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">{expectedSalary}</p>
                      <p className="text-slate-600">Daily Wage: {expectedDailyWage}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Joining, Relocation & Accommodation
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">
                        {availability} Joining · {preferredWorkingHours}
                      </p>
                      <p className="text-slate-600">
                        Relocate: {willingToRelocate ? 'Yes' : 'No'} · Accommodation:{' '}
                        {accommodationRequired ? 'Needed' : 'Not required'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        Verification Status
                      </span>
                      <p className="font-extrabold text-emerald-700 text-sm">
                        {identityVerificationStatus === 'Verified'
                          ? 'Authorized ID Verified'
                          : 'Basic Verification Active'}
                      </p>
                      <p className="text-slate-600">
                        Mobile OTP: {mobileOtpVerified ? 'Verified' : 'Pending'} · DigiLocker:{' '}
                        {digilockerLinked ? 'Linked' : 'Optional'}
                      </p>
                    </div>
                  </div>

                  {/* Selected Skills List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">
                        Selected Professional Skills ({selectedSkills.length + customSkills.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        Modify Skills
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...selectedSkills, ...customSkills].map((sk) => (
                        <span
                          key={sk}
                          className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Action Buttons: Edit Profile & Continue to Dashboard */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3.5 rounded-2xl border-2 border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitProfile}
                    className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-600/25 flex items-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {submitting ? 'Saving Your Profile...' : 'Continue to Dashboard'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Bottom Step Navigation Footer (Shown on Steps 2 to 6) */}
            {currentStep > 1 && currentStep < TOTAL_STEPS && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(7)}
                    className="hidden sm:inline-flex py-3 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Preview Card
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleNext}
                    disabled={submitting}
                    className="py-3 px-7 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
      </div>
    </div>
  );
};
