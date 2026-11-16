export interface JobCategoryDefinition {
  id: string;
  code: string;
  name: string;
  iconName: string;
  description: string;
  active: boolean;
  allowedJobTypes: string[];
  subcategories: string[];
  skillTags: string[];
}

export const ALL_JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Temporary',
  'Fixed-term contract',
  'Daily-wage',
  'Project-based',
  'Freelance / Independent',
  'Apprenticeship (18+ Eligible)'
] as const;

export const ALL_WORK_MODES = [
  'On-site',
  'Hybrid',
  'Remote',
  'Field-based',
  'Multiple locations'
] as const;

export const ALL_PAY_FREQUENCIES = [
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
  'Per project',
  'Per task',
  'Commission-based (disclosed)'
] as const;

export const ALL_SCHEDULES = [
  'Day shift',
  'Night shift',
  'Rotating',
  'Flexible',
  'Fixed hours',
  'Weekend',
  'Seasonal'
] as const;

export const ALL_URGENCY_LABELS = [
  'Standard',
  'Closing soon',
  'Immediate start'
] as const;

export const MASTER_JOB_CATEGORIES: JobCategoryDefinition[] = [
  {
    id: 'cat_a_construction',
    code: 'A',
    name: 'Construction, building and infrastructure',
    iconName: 'HardHat',
    description: 'Civil works, masonry, carpentry, painting, site engineering and building maintenance across India.',
    active: true,
    allowedJobTypes: ['Full-time', 'Daily-wage', 'Temporary', 'Fixed-term contract', 'Project-based'],
    subcategories: [
      'General construction worker',
      'Mason / bricklayer',
      'Concrete worker',
      'Shuttering carpenter',
      'Steel fixer',
      'Painter',
      'Plasterer',
      'Tile fitter',
      'Flooring installer',
      'Roofer',
      'Waterproofing technician',
      'Civil site supervisor',
      'Site engineer',
      'Surveying assistant',
      'Road construction worker',
      'Heavy equipment operator',
      'Building maintenance technician',
      'Interior installation worker'
    ],
    skillTags: ['Masonry', 'Shuttering', 'Bar Bending', 'Painting', 'Tiling', 'Waterproofing', 'Site Supervision', 'AutoCAD Civil']
  },
  {
    id: 'cat_b_electrical',
    code: 'B',
    name: 'Electrical, electronics and renewable energy',
    iconName: 'Zap',
    description: 'Domestic and industrial wiring, solar PV installation, UPS/inverter repair, CCTV and elevator systems.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Daily-wage', 'Fixed-term contract', 'Project-based'],
    subcategories: [
      'Electrician',
      'Electrical helper',
      'Industrial electrician',
      'Panel technician',
      'Wiring technician',
      'Electronics repair technician',
      'Solar panel installer',
      'Solar maintenance technician',
      'Inverter / UPS technician',
      'CCTV installer',
      'Fire alarm technician',
      'Lift / elevator technician',
      'Telecom technician',
      'Electrical supervisor'
    ],
    skillTags: ['Three-Phase Wiring', 'Control Panels', 'Solar PV', 'Inverter Repair', 'CCTV Networking', 'Fire Alarm Systems', 'Wireman Licence']
  },
  {
    id: 'cat_c_plumbing',
    code: 'C',
    name: 'Plumbing, water and sanitation',
    iconName: 'Droplets',
    description: 'Piping systems, water treatment, RO servicing, drainage, sanitation and irrigation technicians.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Daily-wage', 'Temporary', 'Project-based'],
    subcategories: [
      'Plumber',
      'Plumbing helper',
      'Pipe fitter',
      'Pump operator',
      'Water treatment technician',
      'RO service technician',
      'Drainage technician',
      'Sanitation worker',
      'Irrigation technician',
      'HVAC water-system technician'
    ],
    skillTags: ['CPVC/UPVC Piping', 'Pump Maintenance', 'RO Purification', 'Sanitary Fittings', 'Drainage', 'Drip Irrigation']
  },
  {
    id: 'cat_d_mechanical',
    code: 'D',
    name: 'Mechanical, automotive and fabrication',
    iconName: 'Wrench',
    description: 'Two/four-wheeler mechanics, heavy diesel, welding, CNC/lathe operation and industrial maintenance.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Daily-wage', 'Apprenticeship (18+ Eligible)'],
    subcategories: [
      'Two-wheeler mechanic',
      'Car mechanic',
      'Diesel mechanic',
      'Truck mechanic',
      'Tractor mechanic',
      'Auto electrician',
      'Vehicle service advisor',
      'Welder',
      'Fabricator',
      'CNC operator',
      'Lathe operator',
      'Machine operator',
      'Industrial maintenance technician',
      'Production technician',
      'Quality inspector',
      'Tool-room technician'
    ],
    skillTags: ['MIG/TIG Welding', 'Arc Welding', 'CNC Programming', 'Lathe Operation', 'Diesel Engine Overhaul', 'Auto Diagnostics']
  },
  {
    id: 'cat_e_manufacturing',
    code: 'E',
    name: 'Manufacturing, factory and industrial operations',
    iconName: 'Factory',
    description: 'Assembly line, packaging, plant quality control, textile machinery and food processing operations.',
    active: true,
    allowedJobTypes: ['Full-time', 'Temporary', 'Fixed-term contract', 'Daily-wage', 'Apprenticeship (18+ Eligible)'],
    subcategories: [
      'Assembly-line worker',
      'Packaging worker',
      'Factory helper',
      'Machine operator',
      'Production supervisor',
      'Quality-control assistant',
      'Quality engineer',
      'Maintenance fitter',
      'Store / inventory assistant',
      'Safety assistant',
      'Process technician',
      'Textile machine operator',
      'Food-processing worker'
    ],
    skillTags: ['Assembly Line', '5S Safety', 'Quality Inspection', 'Inventory Tally', 'Packaging', 'Machine Maintenance']
  },
  {
    id: 'cat_f_logistics',
    code: 'F',
    name: 'Logistics, transport and warehousing',
    iconName: 'Truck',
    description: 'Last-mile delivery, warehouse fulfilment, licensed forklift and commercial drivers, and fleet operations.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Daily-wage', 'Fixed-term contract', 'Temporary'],
    subcategories: [
      'Delivery associate',
      'Courier worker',
      'Warehouse associate',
      'Picker / packer',
      'Inventory controller',
      'Forklift operator (appropriately licensed)',
      'Loading / unloading worker',
      'Fleet coordinator',
      'Dispatch executive',
      'Supply-chain analyst',
      'Transport supervisor',
      'Commercial driver (valid licence required)',
      'Bus / truck driver (appropriate licence required)'
    ],
    skillTags: ['Valid LMV/HMV Licence', 'Forklift Certification', 'Barcode Scanning', 'Dispatch Planning', 'Route Navigation']
  },
  {
    id: 'cat_g_agriculture',
    code: 'G',
    name: 'Agriculture, farming and allied work',
    iconName: 'Sprout',
    description: 'Crop care, dairy, poultry, horticulture, nursery management, tractor operation and agri-equipment.',
    active: true,
    allowedJobTypes: ['Full-time', 'Daily-wage', 'Temporary', 'Fixed-term contract'],
    subcategories: [
      'Farm worker',
      'Crop-care worker',
      'Irrigation worker',
      'Tractor operator (qualified)',
      'Dairy farm assistant',
      'Poultry farm worker',
      'Horticulture worker',
      'Nursery worker',
      'Food-grain processing worker',
      'Agricultural equipment technician',
      'Farm supervisor',
      'Aquaculture worker',
      'Agricultural sales representative'
    ],
    skillTags: ['Crop Harvesting', 'Tractor Driving', 'Dairy Management', 'Greenhouse Care', 'Soil & Irrigation', 'Agri Inputs']
  },
  {
    id: 'cat_h_domestic',
    code: 'H',
    name: 'Domestic, facility and maintenance services',
    iconName: 'Home',
    description: 'Housekeeping, commercial and residential cleaning, cooking, gardening and facility supervision.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Daily-wage', 'Temporary'],
    subcategories: [
      'Housekeeping staff',
      'Office cleaner',
      'Residential cleaner',
      'Cook',
      'Home maintenance technician',
      'Gardener',
      'Laundry worker',
      'Pest-management technician (properly licensed)',
      'Facility supervisor',
      'Building caretaker',
      'Waste-management worker',
      'Water-tank cleaning technician'
    ],
    skillTags: ['Housekeeping', 'Hygienic Cooking', 'Landscaping', 'Facility Sanitization', 'Caretaking']
  },
  {
    id: 'cat_i_hospitality',
    code: 'I',
    name: 'Hospitality, tourism and food services',
    iconName: 'Utensils',
    description: 'Hotels, restaurants, commercial kitchens, bakery, catering, front-office and travel services.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Temporary', 'Fixed-term contract'],
    subcategories: [
      'Hotel front-office associate',
      'Receptionist',
      'Housekeeping associate',
      'Chef',
      'Assistant cook',
      'Kitchen helper',
      'Restaurant service staff',
      'Barista',
      'Bakery assistant',
      'Catering staff',
      'Event service staff',
      'Travel desk associate',
      'Tour guide (where qualified)',
      'Hotel manager',
      'Restaurant manager'
    ],
    skillTags: ['FSSAI Hygiene', 'Culinary Arts', 'Front Desk', 'F&B Service', 'Barista', 'Banquet Operations']
  },
  {
    id: 'cat_j_retail',
    code: 'J',
    name: 'Retail, sales and customer service',
    iconName: 'ShoppingBag',
    description: 'Store operations, cashiering, field sales, business development, telecalling and customer support.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Temporary', 'Fixed-term contract'],
    subcategories: [
      'Retail sales associate',
      'Cashier',
      'Store assistant',
      'Store manager',
      'Merchandiser',
      'Field sales executive',
      'Business development executive',
      'Customer support associate',
      'Call-centre agent',
      'Telecaller',
      'Customer success associate',
      'Visual merchandiser',
      'Retail inventory assistant'
    ],
    skillTags: ['POS Billing', 'Customer Support', 'Field Sales', 'Inventory Audits', 'CRM', 'Multilingual Communication']
  },
  {
    id: 'cat_k_office',
    code: 'K',
    name: 'Office, administration and business operations',
    iconName: 'Briefcase',
    description: 'Office assistance, data entry, HR coordination, payroll, bookkeeping and procurement.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Remote'],
    subcategories: [
      'Office assistant',
      'Receptionist',
      'Data-entry operator',
      'Administrative assistant',
      'Executive assistant',
      'Office manager',
      'HR assistant',
      'Recruitment coordinator',
      'Payroll assistant',
      'Accountant',
      'Bookkeeper',
      'Auditor (qualified)',
      'Procurement assistant',
      'Operations executive',
      'Compliance associate'
    ],
    skillTags: ['MS Excel', 'Tally Prime', 'Typing Speed', 'HR Onboarding', 'Vendor Coordination', 'Office Administration']
  },
  {
    id: 'cat_l_finance',
    code: 'L',
    name: 'Banking, finance, insurance and accounting',
    iconName: 'Landmark',
    description: 'GST/tax filing, financial analysis, banking operations, authorised insurance advisory and credit review.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Freelance / Independent'],
    subcategories: [
      'Accounts assistant',
      'Accountant',
      'Tax assistant',
      'Financial analyst',
      'Banking operations associate',
      'Insurance advisor (appropriately authorised)',
      'Loan operations associate',
      'Claims processor',
      'Risk analyst',
      'Credit analyst',
      'Financial controller',
      'Company secretary professional (qualified)'
    ],
    skillTags: ['GST Filing', 'TDS/ITR', 'Tally ERP', 'Financial Modelling', 'Audit Compliance', 'KYC Verification']
  },
  {
    id: 'cat_m_it',
    code: 'M',
    name: 'Information technology and software',
    iconName: 'Code2',
    description: 'Web and mobile development, QA testing, cloud/DevOps, cybersecurity, IT support and data engineering.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Project-based', 'Freelance / Independent', 'Apprenticeship (18+ Eligible)'],
    subcategories: [
      'Frontend developer',
      'Backend developer',
      'Full-stack developer',
      'Mobile app developer',
      'QA tester',
      'Automation tester',
      'DevOps engineer',
      'Cloud engineer',
      'Cybersecurity analyst',
      'IT support technician',
      'System administrator',
      'Network engineer',
      'Database administrator',
      'Data engineer',
      'AI / ML engineer',
      'Product manager',
      'UI developer'
    ],
    skillTags: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Cloud Infrastructure', 'Hardware & Networking', 'QA Automation']
  },
  {
    id: 'cat_n_design',
    code: 'N',
    name: 'Design, media, content and creative work',
    iconName: 'Palette',
    description: 'Graphic/UI/UX design, video editing, photography, regional translation, copywriting and digital content.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Project-based', 'Freelance / Independent'],
    subcategories: [
      'Graphic designer',
      'UI designer',
      'UX designer',
      'Video editor',
      'Photographer',
      'Videographer',
      'Animator',
      'Motion designer',
      'Content writer',
      'Copywriter',
      'Translator',
      'Proofreader',
      'Social media manager',
      'Digital content creator',
      'Illustrator',
      'Audio editor'
    ],
    skillTags: ['Figma', 'Adobe Premiere', 'Photoshop', 'Regional Translation', 'Copywriting', 'Motion Graphics']
  },
  {
    id: 'cat_o_education',
    code: 'O',
    name: 'Education, training and tutoring',
    iconName: 'GraduationCap',
    description: 'Qualified school teachers, vocational trainers, computer instructors, academic coordinators and tutors.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Freelance / Independent'],
    subcategories: [
      'School teacher (eligible and qualified)',
      'Tutor',
      'Subject trainer',
      'Language trainer',
      'Computer instructor',
      'Vocational trainer',
      'Teaching assistant',
      'Academic coordinator',
      'Special educator (qualified)',
      'Education counsellor',
      'Instructional designer',
      'Corporate trainer'
    ],
    skillTags: ['B.Ed / TET', 'STEM Tutoring', 'Spoken English', 'Vocational Training', 'Curriculum Design']
  },
  {
    id: 'cat_p_healthcare',
    code: 'P',
    name: 'Healthcare and allied health',
    iconName: 'HeartPulse',
    description: 'Registered nurses, doctors, pharmacists, qualified lab/radiology technicians and patient support staff.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract'],
    subcategories: [
      'Registered nurse',
      'Doctor (registered and qualified)',
      'Pharmacist (registered and qualified)',
      'Lab technician (qualified)',
      'Radiology technician (qualified)',
      'Physiotherapist (qualified)',
      'Dental assistant',
      'Medical receptionist',
      'Hospital administrator',
      'Medical records assistant',
      'Healthcare support worker',
      'Emergency medical technician (qualified)'
    ],
    skillTags: ['B.Sc Nursing / GNM', 'Pharmacy Council Reg', 'DMLT', 'Patient Care', 'BLS/EMT', 'Hospital Records']
  },
  {
    id: 'cat_q_engineering',
    code: 'Q',
    name: 'Science, engineering and professional services',
    iconName: 'Compass',
    description: 'Civil, mechanical, electrical and chemical engineers, architects, quantity surveyors and lab analysts.',
    active: true,
    allowedJobTypes: ['Full-time', 'Fixed-term contract', 'Project-based', 'Freelance / Independent'],
    subcategories: [
      'Civil engineer',
      'Mechanical engineer',
      'Electrical engineer',
      'Electronics engineer',
      'Chemical engineer',
      'Environmental engineer',
      'Architect (registered where required)',
      'Interior designer',
      'Quantity surveyor',
      'Research assistant',
      'Laboratory technician',
      'Quality engineer',
      'Technical consultant'
    ],
    skillTags: ['Structural Design', 'BOQ & Estimation', 'ISO Quality', 'CAD/BIM', 'Lab Analysis']
  },
  {
    id: 'cat_r_legal',
    code: 'R',
    name: 'Legal, compliance and public-facing professional services',
    iconName: 'Scale',
    description: 'Legal assistants, enrolled advocates, compliance analysts, documentation executives and PR specialists.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Freelance / Independent'],
    subcategories: [
      'Legal assistant',
      'Advocate (enrolled and qualified)',
      'Legal researcher',
      'Compliance analyst',
      'Company-law professional',
      'Documentation executive',
      'Public relations executive',
      'Policy researcher',
      'Customer grievance associate'
    ],
    skillTags: ['Contract Drafting', 'Labour Law Compliance', 'ROC Filings', 'Legal Research', 'Grievance Redressal']
  },
  {
    id: 'cat_s_wellness',
    code: 'S',
    name: 'Beauty, wellness, fitness and personal services',
    iconName: 'Sparkles',
    description: 'Salons, spa therapy, certified fitness trainers, yoga instructors and sports coaching.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Freelance / Independent'],
    subcategories: [
      'Hair stylist',
      'Beautician',
      'Makeup artist',
      'Salon receptionist',
      'Spa therapist (appropriately trained)',
      'Fitness trainer (qualified)',
      'Yoga instructor (qualified)',
      'Sports coach (qualified)',
      'Personal care service provider'
    ],
    skillTags: ['Cosmetology', 'Hair Styling', 'Certified Fitness Training', 'Yoga Protocol', 'Client Care']
  },
  {
    id: 'cat_t_security',
    code: 'T',
    name: 'Security and safety services',
    iconName: 'Shield',
    description: 'PSARA-trained security guards, supervisors, industrial safety officers and fire-safety technicians.',
    active: true,
    allowedJobTypes: ['Full-time', 'Fixed-term contract', 'Temporary'],
    subcategories: [
      'Security guard (legally eligible and trained)',
      'Security supervisor',
      'Safety officer (qualified)',
      'Fire-safety technician',
      'CCTV monitoring operator',
      'Emergency-response coordinator'
    ],
    skillTags: ['Access Control', 'Fire Safety Drill', 'CCTV Surveillance', 'Visitor Logging', 'Industrial EHS']
  },
  {
    id: 'cat_u_freelance',
    code: 'U',
    name: 'Freelance, consulting and independent work',
    iconName: 'Laptop',
    description: 'Independent consultants, freelance developers/designers, virtual assistants and online educators.',
    active: true,
    allowedJobTypes: ['Project-based', 'Freelance / Independent', 'Part-time'],
    subcategories: [
      'Freelance developer',
      'Freelance designer',
      'Independent writer',
      'Translator',
      'Consultant',
      'Virtual assistant',
      'Online tutor',
      'Independent photographer',
      'Project-based analyst',
      'Business consultant',
      'Remote specialist'
    ],
    skillTags: ['Project Delivery', 'Remote Collaboration', 'Technical Writing', 'Business Consulting']
  },
  {
    id: 'cat_v_government',
    code: 'V',
    name: 'Government, public-sector and regulated vacancies',
    iconName: 'Building2',
    description: 'Verified public-sector vacancy notices, government contract roles and adult apprenticeship notices.',
    active: true,
    allowedJobTypes: ['Full-time', 'Fixed-term contract', 'Apprenticeship (18+ Eligible)'],
    subcategories: [
      'Public-sector vacancy listings',
      'Government recruitment notices',
      'Public institution opportunities',
      'Apprenticeship notices for eligible adults',
      'Public-sector contract roles'
    ],
    skillTags: ['Official Notification Verification', 'NAPS Apprenticeship', 'Public Institution Compliance']
  },
  {
    id: 'cat_w_emerging',
    code: 'W',
    name: 'Other and emerging occupations',
    iconName: 'Cpu',
    description: 'Green energy, EV servicing, authorised drone operations, robotics, 3D printing and repair economy.',
    active: true,
    allowedJobTypes: ['Full-time', 'Part-time', 'Fixed-term contract', 'Project-based'],
    subcategories: [
      'Green-energy technician',
      'EV service technician',
      'Drone technician (authorised)',
      'Robotics technician',
      '3D-printing operator',
      'E-commerce operations associate',
      'Repair and reuse technician',
      'Other admin-approved occupation'
    ],
    skillTags: ['EV Battery Diagnostics', 'DGCA Drone Pilot', 'Solar/Wind O&M', '3D CAD Printing', 'Right-to-Repair']
  }
];
