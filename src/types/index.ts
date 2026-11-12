export type UserRole = 'worker' | 'employer';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  enabledRoles: UserRole[];
  activeRole: UserRole;
  profilePhoto?: string;
  preferredLanguage?: string;
  accountStatus: 'active' | 'pending' | 'suspended';
  onboardingCompleted: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type Gender = 'male' | 'female' | 'other';

export type EducationLevel =
  | 'No formal education'
  | 'Primary'
  | 'Secondary'
  | 'Higher secondary'
  | 'Diploma'
  | 'ITI'
  | 'Undergraduate'
  | 'Graduate'
  | 'Postgraduate'
  | 'Other';

export const EDUCATION_LEVELS: EducationLevel[] = [
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
];

export type ExperienceLevel =
  | 'Fresher'
  | 'Less than one year'
  | '1–3 years'
  | '3–5 years'
  | 'More than five years';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Fresher',
  'Less than one year',
  '1–3 years',
  '3–5 years',
  'More than five years'
];

export interface JobPreferences {
  jobTypes: string[];
  expectedSalary: string;
  availability: 'Immediate' | 'Within 15 days' | 'Within 1 month' | 'Flexible';
  preferredLocations: string[];
}

export interface WorkerProfile {
  uid: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  ageEligibilityConfirmed: boolean;
  gender: Gender;
  profilePhoto?: string;
  isPhotoVerifiedReal?: boolean;
  country: string;
  state: string;
  district?: string;
  city?: string;
  area?: string;
  pincode: string;
  lat?: number;
  lng?: number;
  preferredLocations: string[];
  education: EducationLevel;
  skills: string[];
  customSkills: string[];
  experience: ExperienceLevel;
  jobPreferences: JobPreferences;
  resumeUrl?: string;
  resumeName?: string;
  privacySettings?: {
    allowDirectContact: boolean;
    showLocationInNearby: boolean;
  };
  submittedAt?: any;
  updatedAt?: any;
}

export type VerificationStatus =
  | 'Pending'
  | 'Verified'
  | 'Rejected'
  | 'Requires additional information';

export interface EmployerProfile {
  uid: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  designation: string;
  businessName: string;
  businessCategory: string;
  businessDescription?: string;
  businessLogo?: string;
  businessImages?: string[];
  boardGstinVerifiedByAI?: boolean;
  aiBoardVerificationSummary?: string;
  website?: string;
  state: string;
  district?: string;
  city?: string;
  area?: string;
  pincode: string;
  lat?: number;
  lng?: number;
  businessAddress?: string;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  documentNumber?: string;
  submittedAt?: any;
  updatedAt?: any;
}

export type JobStatus = 'active' | 'draft' | 'paused' | 'closed';
export type PaymentFrequency = 'Per hour' | 'Per day' | 'Per week' | 'Per month' | 'Negotiable';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Temporary' | 'Contract' | 'Internship';

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  isEmployerVerified?: boolean;
  title: string;
  category: string;
  description: string;
  responsibilities?: string;
  requiredSkills: string[];
  education: EducationLevel;
  experience: ExperienceLevel;
  vacancies: number;
  minSalary: number;
  maxSalary: number;
  paymentFrequency: PaymentFrequency;
  employmentType: EmploymentType;
  workingHours?: string;
  state: string;
  district?: string;
  city: string;
  area?: string;
  pincode: string;
  lat?: number;
  lng?: number;
  benefits?: string[];
  deadline?: string;
  status: JobStatus;
  applicationsCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn';

export interface InterviewDetails {
  date: string;
  time: string;
  mode: 'In-person' | 'Phone Call' | 'Video Call';
  venueOrLink: string;
  notes?: string;
}

export interface ApplicationFormDetails {
  applicantName?: string;
  applicantPhone?: string;
  applicantEmail?: string;
  applicantCity?: string;
  applicantState?: string;
  applicantPincode?: string;
  qualification?: string;
  experience?: string;
  expectedSalary?: string;
  availabilityToJoin?: string;
  preferredShift?: string;
  applicationSubject?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  workerId: string;
  workerName: string;
  workerPhone?: string;
  workerEmail?: string;
  workerPhoto?: string;
  workerSkills: string[];
  workerExperience: string;
  workerEducation: string;
  workerCity?: string;
  workerState?: string;
  workerPincode?: string;
  workerLat?: number;
  workerLng?: number;
  expectedSalary?: string;
  availabilityToJoin?: string;
  preferredShift?: string;
  applicationSubject?: string;
  candidateNote?: string;
  resumeUrl?: string;
  resumeName?: string;
  status: ApplicationStatus;
  interviewDetails?: InterviewDetails;
  appliedAt?: any;
  updatedAt?: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Record<string, {
    name: string;
    photo?: string;
    role: UserRole;
  }>;
  lastMessage?: string;
  lastSenderId?: string;
  lastMessageAt?: any;
  unreadBy?: string[];
  isBlocked?: boolean;
  blockedBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt?: any;
}

export type NotificationType =
  | 'application_received'
  | 'status_change'
  | 'new_message'
  | 'job_update'
  | 'contact_request'
  | 'job_matching'
  | 'application_shortlisted'
  | 'application_decision'
  | 'account_verification'
  | 'job_expiring';

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt?: any;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  createdAt?: any;
}

export interface SavedCandidate {
  id: string;
  employerId: string;
  workerId: string;
  createdAt?: any;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'job' | 'user' | 'conversation';
  targetId: string;
  reason: string;
  status?: 'pending' | 'resolved' | 'dismissed';
  createdAt?: any;
}

export interface SmartMatchResult {
  job: Job;
  score: number; // 0 - 100
  matchReasons: string[];
  skillMatchCount: number;
  distanceKm: number | null;
}

export interface CandidateSmartMatchResult {
  candidate: WorkerProfile;
  score: number; // 0 - 100
  matchReasons: string[];
  skillMatchCount: number;
  distanceKm: number | null;
}

export const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

export const SKILL_CATEGORIES_DATA: Record<string, string[]> = {
  'Retail': ['Sales', 'Cashier', 'Customer service', 'Store management', 'Inventory handling', 'Billing'],
  'Hospitality': ['Cooking', 'Kitchen assistance', 'Restaurant service', 'Housekeeping', 'Food presentation', 'Barista'],
  'Technical': ['Electrician', 'Plumbing', 'Welding', 'Computer operation', 'Mechanical work', 'Appliance repair', 'Carpentry'],
  'Transport': ['Driving', 'Delivery', 'Logistics', 'Forklift operation', 'Fleet coordination'],
  'Office': ['Data entry', 'Reception', 'Administration', 'Accounting', 'Tally', 'Document filing'],
  'Education': ['Teaching', 'Tutoring', 'Training', 'Curriculum support', 'Childcare'],
  'Digital': ['Graphic design', 'Video editing', 'Programming', 'Digital marketing', 'Social media handling', 'Content writing'],
  'Agriculture': ['Farm operations', 'Gardening', 'Agricultural support', 'Dairy farming', 'Crop harvesting']
};

export const BUSINESS_CATEGORIES = [
  'Coaching Classes / Education Institute',
  'Retail',
  'Restaurant',
  'Hotel',
  'Manufacturing',
  'Construction',
  'IT',
  'Education',
  'Healthcare',
  'Transport',
  'Agriculture',
  'Service provider',
  'Other'
];

export const APP_LOGO_URL = 'https://i.ibb.co/jv67DNGx/Jobsetulogo.png';

// ==================== PART 4: OCCUPATION CLASSIFICATION ====================
export interface OccupationGroup {
  groupName: string;
  professions: string[];
}

export const WORKER_OCCUPATION_GROUPS: OccupationGroup[] = [
  {
    groupName: 'Skilled Workers',
    professions: [
      'Electrician',
      'Plumber',
      'Carpenter',
      'Painter',
      'Mechanic',
      'AC Technician',
      'Computer Technician',
      'Mobile Repair Technician',
      'Welder',
      'Machine Operator',
      'Tailor',
      'Driver',
      'Delivery Professional'
    ]
  },
  {
    groupName: 'Unskilled and General Workers',
    professions: [
      'Construction Helper',
      'Agricultural Worker',
      'Loading and Unloading Worker',
      'Cleaning Staff',
      'Housekeeping Worker',
      'Packaging Worker',
      'Factory Helper',
      'Warehouse Helper',
      'General Labourer'
    ]
  },
  {
    groupName: 'Professional Workers',
    professions: [
      'Software Developer',
      'Accountant',
      'Teacher',
      'Nurse',
      'Engineer',
      'Designer',
      'Marketing Executive',
      'Sales Representative',
      'Office Assistant',
      'Customer Support Executive'
    ]
  },
  {
    groupName: 'Home and Personal Services',
    professions: [
      'Cook',
      'Gardener',
      'Caregiver',
      'Housekeeping Professional',
      'Maintenance Worker'
    ]
  }
];

// ==================== PART 4: HIRING REQUESTS ====================
export type HiringRequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Negotiating' | 'Cancelled';

export interface HiringRequest {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  workerProfession?: string;
  jobId?: string;
  jobTitle: string;
  offeredSalary: string;
  workplaceLocation: string;
  workplaceLat?: number;
  workplaceLng?: number;
  workTimings: string;
  joiningDate: string;
  message?: string;
  status: HiringRequestStatus;
  responseNote?: string;
  createdAt?: any;
  updatedAt?: any;
}

// ==================== PART 5: ATTENDANCE MANAGEMENT ====================
export interface EmployerWorkplace {
  id: string;
  employerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  geofenceRadiusMeters: number; // e.g. 150m
  qrSecretCode: string;
  isActive: boolean;
  createdAt?: any;
}

export type ShiftType = 'Morning' | 'Afternoon' | 'Night' | 'Rotational' | 'Flexible' | 'Custom';

export interface WorkShift {
  id: string;
  employerId: string;
  name: string;
  shiftType: ShiftType;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breakDurationMinutes: number; // e.g. 60
  weeklyOffDays: string[]; // ["Sunday"]
  graceMinutes: number; // e.g. 15 mins for late arrival
  isActive: boolean;
  createdAt?: any;
}

export type EmployeeStatus = 'Active' | 'Invited' | 'On Leave' | 'Inactive';

export interface EmployeeRecord {
  id: string;
  employerId: string;
  workerUid?: string; // linked JOBSETU user UID
  employeeIdNumber: string; // e.g. "EMP-1042"
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  shiftId: string;
  shiftName?: string;
  workplaceId: string;
  workplaceName?: string;
  status: EmployeeStatus;
  joiningDate: string;
  wageOrSalary?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type AttendanceVerificationType = 'GPS Geofence' | 'Workplace QR Code' | 'Employer Approval';
export type AttendanceRecordStatus = 'Present' | 'Late' | 'Half Day' | 'Overtime' | 'Absent' | 'On Leave';

export interface AttendanceRecord {
  id: string;
  employerId: string;
  workerUid: string;
  employeeRecordId?: string;
  employeeName: string;
  employeeIdNumber?: string;
  workplaceId: string;
  workplaceName: string;
  shiftId: string;
  shiftName: string;
  dateString: string; // "YYYY-MM-DD"
  checkInTime: string; // ISO string or timestamp
  checkOutTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkInDistanceMeters?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  verificationMethod: AttendanceVerificationType;
  totalWorkingMinutes?: number;
  effectiveWorkingHours?: number; // e.g. 7.5
  overtimeMinutes?: number;
  isLate: boolean;
  isEarlyDeparture?: boolean;
  status: AttendanceRecordStatus;
  employerApproved?: boolean;
  correctionId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Emergency Leave' | 'Unpaid Leave' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id: string;
  employerId: string;
  workerUid: string;
  employeeName: string;
  employeeIdNumber?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  approverNote?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AttendanceCorrection {
  id: string;
  employerId: string;
  workerUid: string;
  employeeName: string;
  attendanceDate: string;
  attendanceRecordId?: string;
  issueType: 'Missing Check-in' | 'Missing Check-out' | 'Wrong Timestamps' | 'Incorrect Status';
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: CorrectionStatus;
  employerResponse?: string;
  createdAt?: any;
  updatedAt?: any;
}

// ==================== PART 5: TOP COMPANIES IN INDIA ====================
export const COMPANY_INDUSTRIES = [
  'Information Technology',
  'Banking and Financial Services',
  'Automobile',
  'Manufacturing',
  'Healthcare',
  'Retail',
  'E-commerce',
  'Telecommunications',
  'Hospitality',
  'Logistics and Transportation',
  'Construction and Infrastructure',
  'Education',
  'Energy',
  'Government and Public Sector'
] as const;

export type CompanyIndustry = typeof COMPANY_INDUSTRIES[number];

export interface VerifiedVacancy {
  id: string;
  title: string;
  location: string;
  experienceLevel: string;
  category: string;
  eligibility: string;
  keySkills: string[];
  officialApplyUrl: string;
  verifiedDate: string;
  isActivelyRecruiting: boolean;
}

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  industry: CompanyIndustry;
  overview: string;
  headquarters: string;
  officialWebsite: string;
  careersPortalUrl: string;
  businessSectors: string[];
  jobCategories: string[];
  commonSkills: string[];
  generalEligibility: string;
  lastVerifiedDate: string;
  isFeatured: boolean;
  isActivelyHiring: boolean;
  openVacanciesCount: number;
  sampleVacancies: VerifiedVacancy[];
}

export interface SavedCompany {
  id: string;
  userId: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  industry: string;
  savedAt?: any;
}

// ==================== TRUST, AADHAAR, DIGILOCKER & REPUTATION ====================
export type TrustVerificationStatus =
  | 'Not Started'
  | 'Pending'
  | 'Under Review'
  | 'Verified'
  | 'Rejected'
  | 'Resubmission Required';

export type IdentityMethod =
  | 'Aadhaar Paperless Offline e-KYC'
  | 'UIDAI Secure QR XML'
  | 'Alternative Govt ID (Voter ID / Driving Licence)';

export interface IdentityVerificationRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: 'worker' | 'employer';
  method: IdentityMethod;
  maskedReferenceNumber: string; // e.g. "XXXX-XXXX-4829" (NEVER full Aadhaar)
  consentReferenceId: string;
  consentTimestamp: string;
  nameMatchScore: number; // 0 - 100
  ageEligibilityVerified: boolean;
  digitalSignatureValid: boolean;
  status: TrustVerificationStatus;
  reviewerNote?: string;
  verifiedAt?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type DigiLockerDocCategory =
  | 'Class 10 Marks Card'
  | 'Class 12 Marks Card'
  | 'ITI Trade Certificate'
  | 'Diploma Certificate'
  | 'Degree Certificate'
  | 'Driving Licence'
  | 'Skill India / NSDC Certificate';

export type DocumentVerificationStatus =
  | 'Verified'
  | 'Pending'
  | 'Failed'
  | 'Expired'
  | 'Issuer Unavailable';

export interface VerifiedDocumentRecord {
  id: string;
  userId: string;
  userName: string;
  documentCategory: DigiLockerDocCategory;
  issuingAuthority: string; // e.g. "CBSE / State Board", "NCVT / DGT", "Ministry of Road Transport"
  documentReference: string; // Masked URI / Reference
  issuerAuthenticityResult: string;
  consentReferenceId: string;
  status: DocumentVerificationStatus;
  verificationDate: string;
  expiryDate?: string;
  viaDigiLocker: boolean;
  createdAt?: any;
}

export interface WorkerRatingCategoryScores {
  workQuality: number; // 1-5 (weight 30%)
  reliability: number; // 1-5 (weight 25%)
  professionalBehaviour: number; // 1-5 (weight 20%)
  timeliness: number; // 1-5 (weight 15%)
  communication: number; // 1-5 (weight 10%)
}

export interface WorkerRatingRecord {
  id: string;
  workerId: string;
  workerName: string;
  employerId: string;
  employerName: string;
  assignmentId: string; // HiringRequest ID or Attendance ID to prevent duplicates
  jobTitle: string;
  categoryScores: WorkerRatingCategoryScores;
  weightedOverallScore: number; // Calculated: 0.3*WQ + 0.25*R + 0.2*PB + 0.15*T + 0.1*C
  feedbackText: string;
  isReported?: boolean;
  reportReason?: string;
  appealStatus?: 'None' | 'Pending Appeal' | 'Upheld' | 'Removed';
  createdAt?: any;
}

export interface RatingAppealRecord {
  id: string;
  ratingId: string;
  workerId: string;
  workerName: string;
  employerName: string;
  reason: string;
  status: 'Pending' | 'Resolved - Removed' | 'Resolved - Upheld';
  adminNote?: string;
  createdAt?: any;
}

export interface VerificationAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  targetUserId: string;
  action: string;
  details: string;
  createdAt?: any;
}

