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

export interface CertificateAttachment {
  name: string;
  url: string;
  issuer?: string;
  uploadedAt: string;
}

export type SearchRadiusKm = 5 | 10 | 25 | 50 | 100;

export interface JobPreferences {
  jobTypes: string[];
  expectedSalary: string;
  expectedDailyWage?: string;
  preferredWorkingHours?: string;
  preferredSearchRadiusKm?: SearchRadiusKm;
  availability: 'Immediate' | 'Within 15 days' | 'Within 1 month' | 'Flexible';
  preferredLocations: string[];
  willingToRelocate?: boolean;
  accommodationRequired?: boolean;
}

export const JOB_SEEKER_PROFESSIONS = [
  'Construction Worker',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Welder',
  'Driver',
  'Security Guard',
  'Factory Worker',
  'Agricultural Worker',
  'Software Developer',
  'Designer',
  'Office Assistant',
  'Delivery Worker',
  'Other'
] as const;

export const INDIAN_LANGUAGES = [
  'Hindi (हिन्दी)',
  'English',
  'Marathi (मराठी)',
  'Tamil (தமிழ்)',
  'Telugu (తెలుగు)',
  'Bengali (বাংলা)',
  'Gujarati (ગુજરાતી)',
  'Kannada (ಕನ್ನಡ)',
  'Malayalam (മലയാളം)',
  'Punjabi (ਪੰਜਾਬੀ)',
  'Odia (ଓଡ଼ିଆ)',
  'Assamese (অসমীয়া)',
  'Urdu (اردو)'
] as const;

export interface WorkerProfile {
  uid: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  ageEligibilityConfirmed: boolean;
  gender?: Gender;
  profilePhoto?: string;
  isPhotoVerifiedReal?: boolean;
  currentAddress?: string;
  country: string;
  state: string;
  district?: string;
  city?: string;
  area?: string;
  pincode: string;
  lat?: number;
  lng?: number;
  preferredLanguage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  preferredLocations: string[];
  // Education Details
  education: EducationLevel;
  schoolOrCollegeName?: string;
  passingYear?: string;
  additionalQualifications?: string;
  educationCertificates?: CertificateAttachment[];
  // Professional Details
  selectedProfessions?: string[];
  customProfession?: string;
  skills: string[];
  customSkills: string[];
  experience: ExperienceLevel;
  previousCompanyName?: string;
  previousJobRole?: string;
  workPortfolioUrl?: string;
  workPortfolioDescription?: string;
  workPortfolioImages?: string[];
  skillCertificates?: CertificateAttachment[];
  // Job Preferences
  jobPreferences: JobPreferences;
  // Documents & Verification (Never stores raw sensitive ID numbers)
  resumeUrl?: string;
  resumeName?: string;
  identityVerificationProvider?: string;
  identityVerifiedMask?: string;
  identityVerificationStatus?: 'Verified' | 'Pending' | 'Not Started';
  digilockerLinked?: boolean;
  digilockerSharedDocs?: string[];
  mobileOtpVerified?: boolean;
  emailVerified?: boolean;
  profileCompletionPercentage?: number;
  privacySettings?: {
    allowDirectContact: boolean;
    showLocationInNearby: boolean;
  };
  submittedAt?: any;
  updatedAt?: any;
}

export type VerificationStatus =
  | 'Pending'
  | 'Pending Verification'
  | 'Verification Required'
  | 'Verified'
  | 'Rejected'
  | 'Requires additional information';

export interface WorksiteBranch {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
}

export interface EmployerLabourRequirement {
  jobTitle: string;
  workerCategory: string;
  workersRequiredCount: number;
  requiredSkills: string[];
  minimumExperience: ExperienceLevel;
  educationQualification: EducationLevel;
  jobDescription: string;
  workResponsibilities: string;
  preferredJoiningDate: string;
  jobDuration: string;
  workLocation: string;
}

export interface EmployerSalaryAndBenefits {
  paymentMode: 'Daily Wage' | 'Monthly Salary' | 'Hourly Payment';
  minSalary: number;
  maxSalary: number;
  paymentFrequency: PaymentFrequency;
  overtimeAvailable: boolean;
  overtimeRateNote?: string;
  foodFacility: 'Provided Free' | 'Subsidized' | 'Not Provided';
  accommodationFacility: 'Provided on Site' | 'Allowance Provided' | 'Not Provided';
  transportationFacility: 'Company Pickup/Drop' | 'Travel Allowance' | 'Not Provided';
  insuranceAndBenefits: string[];
}

export interface EmployerWorkingConditions {
  dailyWorkingHours: string;
  shiftTimings: string;
  weeklyHolidays: string;
  workEnvironment: string;
  safetyEquipmentProvided: string[];
  workplaceFacilities: string[];
  jobStartDate: string;
  expectedCompletionDate?: string;
}

export interface EmployerHiringPreferences {
  hiringScale: 'Individual Hiring' | 'Bulk Hiring' | 'Both Individual & Bulk';
  hiringUrgency: 'Immediate Hiring' | 'Future Hiring';
  employmentNature: 'Permanent' | 'Temporary' | 'Contract';
  interviewRequired: boolean;
  interviewMode?: string;
  maxSearchRadiusKm: SearchRadiusKm;
  workerAvailabilityRequirements: string;
  additionalHiringInstructions?: string;
}

export const WORKFORCE_TYPES_OPTIONS = [
  'Skilled Labour',
  'Semi-Skilled Labour',
  'Unskilled Labour',
  'Technical Employees',
  'Office Employees',
  'Professional Employees',
  'Temporary Workers',
  'Contract Workers'
] as const;

export const EMPLOYER_DESIGNATIONS = [
  'Owner',
  'Director',
  'Manager',
  'Contractor',
  'HR Manager',
  'Proprietor / Business Owner'
] as const;

export const COMPANY_SIZES = [
  '1–10 Employees',
  '11–50 Employees',
  '51–200 Employees',
  '201–500 Employees',
  '500+ Employees'
] as const;

export const COMPANY_REGISTRATION_TYPES = [
  'Sole Proprietorship',
  'Partnership Firm',
  'Private Limited (Pvt Ltd)',
  'Limited Liability Partnership (LLP)',
  'MSME / Udyam Registered',
  'Licensed Contractor',
  'Public Limited Company',
  'Individual / Local Business'
] as const;

export interface EmployerProfile {
  uid: string;
  // Step 2: Owner Information
  ownerName: string;
  ownerProfilePhoto?: string;
  ownerEmail: string;
  ownerPhone?: string;
  designation: string;
  preferredLanguage?: string;
  ownerContactAddress?: string;
  // Step 3: Company Information
  businessName: string;
  businessLogo?: string;
  businessCategory: string;
  businessDescription?: string;
  yearOfEstablishment?: string;
  companySize?: string;
  companyRegistrationType?: string;
  documentNumber?: string; // GSTIN if applicable
  website?: string;
  companyRegistrationDocuments?: CertificateAttachment[];
  businessImages?: string[];
  boardGstinVerifiedByAI?: boolean;
  aiBoardVerificationSummary?: string;
  // Step 4: Company Location
  country?: string;
  state: string;
  district?: string;
  city?: string;
  area?: string;
  businessAddress?: string;
  pincode: string;
  worksiteLocation?: string;
  lat?: number;
  lng?: number;
  multipleWorkLocations?: WorksiteBranch[];
  discoveryRadiusKm?: SearchRadiusKm;
  // Step 5: Hiring Requirements
  workforceTypesNeeded?: string[];
  // Step 6: Labour Details
  labourRequirementDetails?: EmployerLabourRequirement;
  // Step 7: Salary & Benefits
  salaryAndBenefits?: EmployerSalaryAndBenefits;
  // Step 8: Working Conditions
  workingConditions?: EmployerWorkingConditions;
  // Step 9: Hiring Preferences
  hiringPreferences?: EmployerHiringPreferences;
  // Step 10: Employer Verification
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  mobileOtpVerified?: boolean;
  companyDocumentVerified?: boolean;
  gstinVerified?: boolean;
  authorizedVerificationProvider?: string;
  authorizedVerificationRef?: string;
  profileCompletionPercentage?: number;
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
  'A. Construction, building and infrastructure': [
    'General construction worker', 'Mason / bricklayer', 'Concrete worker', 'Shuttering carpenter',
    'Steel fixer', 'Painter', 'Plasterer', 'Tile fitter', 'Flooring installer', 'Roofer',
    'Waterproofing technician', 'Civil site supervisor', 'Site engineer', 'Surveying assistant',
    'Road construction worker', 'Heavy equipment operator', 'Building maintenance technician', 'Interior installation worker'
  ],
  'B. Electrical, electronics and renewable energy': [
    'Electrician', 'Electrical helper', 'Industrial electrician', 'Panel technician', 'Wiring technician',
    'Electronics repair technician', 'Solar panel installer', 'Solar maintenance technician',
    'Inverter / UPS technician', 'CCTV installer', 'Fire alarm technician', 'Lift / elevator technician',
    'Telecom technician', 'Electrical supervisor'
  ],
  'C. Plumbing, water and sanitation': [
    'Plumber', 'Plumbing helper', 'Pipe fitter', 'Pump operator', 'Water treatment technician',
    'RO service technician', 'Drainage technician', 'Sanitation worker', 'Irrigation technician', 'HVAC water-system technician'
  ],
  'D. Mechanical, automotive and fabrication': [
    'Two-wheeler mechanic', 'Car mechanic', 'Diesel mechanic', 'Truck mechanic', 'Tractor mechanic',
    'Auto electrician', 'Vehicle service advisor', 'Welder', 'Fabricator', 'CNC operator', 'Lathe operator',
    'Machine operator', 'Industrial maintenance technician', 'Production technician', 'Quality inspector', 'Tool-room technician'
  ],
  'E. Manufacturing, factory and industrial operations': [
    'Assembly-line worker', 'Packaging worker', 'Factory helper', 'Machine operator', 'Production supervisor',
    'Quality-control assistant', 'Quality engineer', 'Maintenance fitter', 'Store / inventory assistant',
    'Safety assistant', 'Process technician', 'Textile machine operator', 'Food-processing worker'
  ],
  'F. Logistics, transport and warehousing': [
    'Delivery associate', 'Courier worker', 'Warehouse associate', 'Picker / packer', 'Inventory controller',
    'Forklift operator (appropriately licensed)', 'Loading / unloading worker', 'Fleet coordinator',
    'Dispatch executive', 'Supply-chain analyst', 'Transport supervisor', 'Commercial driver (valid licence required)',
    'Bus / truck driver (appropriate licence required)'
  ],
  'G. Agriculture, farming and allied work': [
    'Farm worker', 'Crop-care worker', 'Irrigation worker', 'Tractor operator (qualified)', 'Dairy farm assistant',
    'Poultry farm worker', 'Horticulture worker', 'Nursery worker', 'Food-grain processing worker',
    'Agricultural equipment technician', 'Farm supervisor', 'Aquaculture worker', 'Agricultural sales representative'
  ],
  'H. Domestic, facility and maintenance services': [
    'Housekeeping staff', 'Office cleaner', 'Residential cleaner', 'Cook', 'Home maintenance technician',
    'Gardener', 'Laundry worker', 'Pest-management technician (properly licensed)', 'Facility supervisor',
    'Building caretaker', 'Waste-management worker', 'Water-tank cleaning technician'
  ],
  'I. Hospitality, tourism and food services': [
    'Hotel front-office associate', 'Receptionist', 'Housekeeping associate', 'Chef', 'Assistant cook',
    'Kitchen helper', 'Restaurant service staff', 'Barista', 'Bakery assistant', 'Catering staff',
    'Event service staff', 'Travel desk associate', 'Tour guide (where qualified)', 'Hotel manager', 'Restaurant manager'
  ],
  'J. Retail, sales and customer service': [
    'Retail sales associate', 'Cashier', 'Store assistant', 'Store manager', 'Merchandiser',
    'Field sales executive', 'Business development executive', 'Customer support associate',
    'Call-centre agent', 'Telecaller', 'Customer success associate', 'Visual merchandiser', 'Retail inventory assistant'
  ],
  'K. Office, administration and business operations': [
    'Office assistant', 'Receptionist', 'Data-entry operator', 'Administrative assistant', 'Executive assistant',
    'Office manager', 'HR assistant', 'Recruitment coordinator', 'Payroll assistant', 'Accountant',
    'Bookkeeper', 'Auditor (qualified)', 'Procurement assistant', 'Operations executive', 'Compliance associate'
  ],
  'L. Banking, finance, insurance and accounting': [
    'Accounts assistant', 'Accountant', 'Tax assistant', 'Financial analyst', 'Banking operations associate',
    'Insurance advisor (appropriately authorised)', 'Loan operations associate', 'Claims processor',
    'Risk analyst', 'Credit analyst', 'Financial controller', 'Company secretary professional (qualified)'
  ],
  'M. Information technology and software': [
    'Frontend developer', 'Backend developer', 'Full-stack developer', 'Mobile app developer', 'QA tester',
    'Automation tester', 'DevOps engineer', 'Cloud engineer', 'Cybersecurity analyst', 'IT support technician',
    'System administrator', 'Network engineer', 'Database administrator', 'Data engineer', 'AI / ML engineer',
    'Product manager', 'UI developer'
  ],
  'N. Design, media, content and creative work': [
    'Graphic designer', 'UI designer', 'UX designer', 'Video editor', 'Photographer', 'Videographer',
    'Animator', 'Motion designer', 'Content writer', 'Copywriter', 'Translator', 'Proofreader',
    'Social media manager', 'Digital content creator', 'Illustrator', 'Audio editor'
  ],
  'O. Education, training and tutoring': [
    'School teacher (eligible and qualified)', 'Tutor', 'Subject trainer', 'Language trainer', 'Computer instructor',
    'Vocational trainer', 'Teaching assistant', 'Academic coordinator', 'Special educator (qualified)',
    'Education counsellor', 'Instructional designer', 'Corporate trainer'
  ],
  'P. Healthcare and allied health': [
    'Registered nurse', 'Doctor (registered and qualified)', 'Pharmacist (registered and qualified)',
    'Lab technician (qualified)', 'Radiology technician (qualified)', 'Physiotherapist (qualified)',
    'Dental assistant', 'Medical receptionist', 'Hospital administrator', 'Medical records assistant',
    'Healthcare support worker', 'Emergency medical technician (qualified)'
  ],
  'Q. Science, engineering and professional services': [
    'Civil engineer', 'Mechanical engineer', 'Electrical engineer', 'Electronics engineer', 'Chemical engineer',
    'Environmental engineer', 'Architect (registered where required)', 'Interior designer', 'Quantity surveyor',
    'Research assistant', 'Laboratory technician', 'Quality engineer', 'Technical consultant'
  ],
  'R. Legal, compliance and public-facing professional services': [
    'Legal assistant', 'Advocate (enrolled and qualified)', 'Legal researcher', 'Compliance analyst',
    'Company-law professional', 'Documentation executive', 'Public relations executive', 'Policy researcher',
    'Customer grievance associate'
  ],
  'S. Beauty, wellness, fitness and personal services': [
    'Hair stylist', 'Beautician', 'Makeup artist', 'Salon receptionist', 'Spa therapist (appropriately trained)',
    'Fitness trainer (qualified)', 'Yoga instructor (qualified)', 'Sports coach (qualified)', 'Personal care service provider'
  ],
  'T. Security and safety services': [
    'Security guard (legally eligible and trained)', 'Security supervisor', 'Safety officer (qualified)',
    'Fire-safety technician', 'CCTV monitoring operator', 'Emergency-response coordinator'
  ],
  'U. Freelance, consulting and independent work': [
    'Freelance developer', 'Freelance designer', 'Independent writer', 'Translator', 'Consultant',
    'Virtual assistant', 'Online tutor', 'Independent photographer', 'Project-based analyst',
    'Business consultant', 'Remote specialist'
  ],
  'V. Government, public-sector and regulated vacancies': [
    'Public-sector vacancy listings', 'Government recruitment notices', 'Public institution opportunities',
    'Apprenticeship notices for eligible adults', 'Public-sector contract roles'
  ],
  'W. Other and emerging occupations': [
    'Green-energy technician', 'EV service technician', 'Drone technician (authorised)', 'Robotics technician',
    '3D-printing operator', 'E-commerce operations associate', 'Repair and reuse technician', 'Other admin-approved occupation'
  ]
};

export const BUSINESS_CATEGORIES = [
  'Construction, building and infrastructure',
  'Electrical, electronics and renewable energy',
  'Plumbing, water and sanitation',
  'Mechanical, automotive and fabrication',
  'Manufacturing, factory and industrial operations',
  'Logistics, transport and warehousing',
  'Agriculture, farming and allied work',
  'Domestic, facility and maintenance services',
  'Hospitality, tourism and food services',
  'Retail, sales and customer service',
  'Office, administration and business operations',
  'Banking, finance, insurance and accounting',
  'Information technology and software',
  'Design, media, content and creative work',
  'Education, training and tutoring',
  'Healthcare and allied health',
  'Science, engineering and professional services',
  'Legal, compliance and public-facing professional services',
  'Beauty, wellness, fitness and personal services',
  'Security and safety services',
  'Freelance, consulting and independent work',
  'Government, public-sector and regulated vacancies',
  'Other and emerging occupations'
];

export type AdminRoleType =
  | 'Super Admin'
  | 'Verification Admin'
  | 'Job Moderator'
  | 'Support Admin'
  | 'Analytics Admin';

export interface SupportTicket {
  id: string;
  referenceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  category: 'Account & Verification' | 'Payment Scam / Fraud Report' | 'Bug / Technical Issue' | 'Privacy / Data Request' | 'Appeal Decision' | 'General Help';
  subject: string;
  description: string;
  status: 'Open' | 'Assigned' | 'In Review' | 'Escalated' | 'Resolved' | 'Closed';
  assignedToRole?: AdminRoleType;
  internalNotes?: string;
  adminResponse?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface WorkHistoryRecord {
  id: string;
  userId: string;
  roleTitle: string;
  employerName: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  workType: string;
  responsibilities: string;
  verificationStatus: 'Self-Reported' | 'Pending Verification' | 'Verified by Employer';
  createdAt?: any;
}

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

