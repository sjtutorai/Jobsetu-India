import { CompanyProfile } from '../types';

export const VERIFIED_COMPANIES_DATA: CompanyProfile[] = [
  // 1. INFORMATION TECHNOLOGY
  {
    id: 'tcs',
    name: 'Tata Consultancy Services (TCS)',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
    industry: 'Information Technology',
    overview: 'TCS is India\'s largest multinational information technology services and consulting company, operating across 150 locations in 46 countries.',
    headquarters: 'Mumbai, Maharashtra',
    officialWebsite: 'https://www.tcs.com',
    careersPortalUrl: 'https://www.tcs.com/careers/india',
    businessSectors: ['IT Services', 'Cloud Architecture', 'Digital Transformation', 'Enterprise Software', 'AI & Automation'],
    jobCategories: ['Software Engineer', 'Systems Engineer', 'Cloud Architect', 'Cybersecurity Specialist', 'Business Analyst'],
    commonSkills: ['Java', 'Python', 'React', 'SQL', 'Cloud (AWS/Azure)', 'Data Structures'],
    generalEligibility: 'B.E/B.Tech/M.E/M.Tech/MCA/B.Sc IT or diploma with minimum 60% aggregate. Fresher and lateral recruitment drives.',
    lastVerifiedDate: '2026-11-01',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 1420,
    sampleVacancies: [
      {
        id: 'tcs-vac-1',
        title: 'Full Stack Java / React Developer',
        location: 'Bengaluru / Hyderabad / Pune',
        experienceLevel: '2 - 5 Years',
        category: 'Software Development',
        eligibility: 'B.Tech/MCA or equivalent with Spring Boot & React experience',
        keySkills: ['Java', 'Spring Boot', 'React', 'REST APIs', 'PostgreSQL'],
        officialApplyUrl: 'https://www.tcs.com/careers/india',
        verifiedDate: '2026-11-04',
        isActivelyRecruiting: true
      },
      {
        id: 'tcs-vac-2',
        title: 'Junior Cloud Infrastructure Associate',
        location: 'Chennai / Mumbai / Noida',
        experienceLevel: '0 - 2 Years',
        category: 'Cloud & Infrastructure',
        eligibility: 'Any graduate / engineering background with cloud fundamentals',
        keySkills: ['Linux', 'Networking', 'AWS Basics', 'Shell Scripting'],
        officialApplyUrl: 'https://www.tcs.com/careers/india',
        verifiedDate: '2026-11-05',
        isActivelyRecruiting: true
      }
    ]
  },
  {
    id: 'infosys',
    name: 'Infosys Limited',
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=160&auto=format&fit=crop&q=80',
    industry: 'Information Technology',
    overview: 'A global leader in next-generation digital services and consulting, enabling clients across 56 countries to navigate their digital transformation.',
    headquarters: 'Bengaluru, Karnataka',
    officialWebsite: 'https://www.infosys.com',
    careersPortalUrl: 'https://www.infosys.com/careers.html',
    businessSectors: ['Digital Consulting', 'AI & Automation', 'Core Banking', 'Enterprise Solutions'],
    jobCategories: ['Software Development', 'Quality Assurance', 'Data Analytics', 'SAP Consulting'],
    commonSkills: ['Python', 'Java', 'Angular', 'Machine Learning', 'DevOps'],
    generalEligibility: 'Graduate in Engineering, Computing or Mathematical disciplines.',
    lastVerifiedDate: '2026-11-02',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 980,
    sampleVacancies: [
      {
        id: 'inf-vac-1',
        title: 'Data Analyst & Visualization Associate',
        location: 'Bengaluru / Pune',
        experienceLevel: '1 - 4 Years',
        category: 'Data Science',
        eligibility: 'B.E./B.Tech/B.Sc. in Maths/Stats/CS',
        keySkills: ['SQL', 'PowerBI', 'Python', 'Excel'],
        officialApplyUrl: 'https://www.infosys.com/careers.html',
        verifiedDate: '2026-11-03',
        isActivelyRecruiting: true
      }
    ]
  },
  {
    id: 'wipro',
    name: 'Wipro Enterprises & Technology',
    logo: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=160&auto=format&fit=crop&q=80',
    industry: 'Information Technology',
    overview: 'A leading technology services and consulting company focused on building innovative solutions that address clients\' most complex digital transformation needs.',
    headquarters: 'Bengaluru, Karnataka',
    officialWebsite: 'https://www.wipro.com',
    careersPortalUrl: 'https://careers.wipro.com',
    businessSectors: ['Cybersecurity', 'Cloud Services', 'Healthcare IT', 'Manufacturing Tech'],
    jobCategories: ['Network Administrator', 'DevOps Specialist', 'IT Service Desk', 'Python Developer'],
    commonSkills: ['Python', 'Docker', 'Kubernetes', 'Linux', 'ITIL'],
    generalEligibility: 'Engineering graduates, MCA, or certified vocational tech professionals.',
    lastVerifiedDate: '2026-11-03',
    isFeatured: false,
    isActivelyHiring: true,
    openVacanciesCount: 650,
    sampleVacancies: [
      {
        id: 'wip-vac-1',
        title: 'Customer Support / IT Service Desk Executive',
        location: 'Noida / Kolkata',
        experienceLevel: '0 - 3 Years',
        category: 'Customer Support',
        eligibility: 'Any graduate with good communication skills',
        keySkills: ['Customer Service', 'Troubleshooting', 'CRM Tools'],
        officialApplyUrl: 'https://careers.wipro.com',
        verifiedDate: '2026-11-02',
        isActivelyRecruiting: true
      }
    ]
  },

  // 2. BANKING AND FINANCIAL SERVICES (BFSI)
  {
    id: 'sbi',
    name: 'State Bank of India (SBI)',
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=160&auto=format&fit=crop&q=80',
    industry: 'Banking and Financial Services',
    overview: 'India\'s largest public sector bank and Fortune 500 company, serving over 48 crore customers through 22,000+ branches nationwide.',
    headquarters: 'Mumbai, Maharashtra',
    officialWebsite: 'https://www.sbi.co.in',
    careersPortalUrl: 'https://sbi.co.in/web/careers',
    businessSectors: ['Commercial Banking', 'Rural Finance', 'Retail Loans', 'Digital YONO Platform', 'Treasury'],
    jobCategories: ['Probationary Officer (PO)', 'Junior Associate (Clerical)', 'Specialist Cadre Officer', 'Financial Analyst'],
    commonSkills: ['Banking Operations', 'Credit Analysis', 'Customer Relations', 'Financial Accounting'],
    generalEligibility: 'Graduation in any discipline from a recognized University. Age limits apply per official IBPS/SBI notifications.',
    lastVerifiedDate: '2026-11-04',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 8200,
    sampleVacancies: [
      {
        id: 'sbi-vac-1',
        title: 'Junior Associate (Customer Support & Sales)',
        location: 'Pan-India All Districts',
        experienceLevel: 'Fresher / Entry Level',
        category: 'Banking Operations',
        eligibility: 'Graduate in any discipline. Local language proficiency required.',
        keySkills: ['Customer Service', 'Cash Operations', 'KYC Verification', 'Basic Computer Operation'],
        officialApplyUrl: 'https://sbi.co.in/web/careers',
        verifiedDate: '2026-11-06',
        isActivelyRecruiting: true
      }
    ]
  },
  {
    id: 'hdfc-bank',
    name: 'HDFC Bank',
    logo: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=160&auto=format&fit=crop&q=80',
    industry: 'Banking and Financial Services',
    overview: 'India\'s largest private sector bank by assets, renowned for technology-led retail banking, branch connectivity, and MSME lending.',
    headquarters: 'Mumbai, Maharashtra',
    officialWebsite: 'https://www.hdfcbank.com',
    careersPortalUrl: 'https://www.hdfcbank.com/personal/about-us/careers',
    businessSectors: ['Retail Banking', 'Wholesale Banking', 'MSME Lending', 'Wealth Management', 'Credit Cards'],
    jobCategories: ['Branch Manager', 'Relationship Officer', 'Credit Underwriter', 'Customer Service Executive'],
    commonSkills: ['Retail Sales', 'Account Servicing', 'KYC Documentation', 'Tally / Excel'],
    generalEligibility: 'Graduates/Post-graduates in Commerce, Arts, or Science with interest in banking.',
    lastVerifiedDate: '2026-11-03',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 1850,
    sampleVacancies: [
      {
        id: 'hdfc-vac-1',
        title: 'Retail Relationship Manager - Branch Banking',
        location: 'Delhi NCR / Ahmedabad / Jaipur / Lucknow',
        experienceLevel: '1 - 5 Years',
        category: 'Sales & Relationship',
        eligibility: 'Graduate with banking or NBFC sales experience',
        keySkills: ['CASA Sales', 'Customer Acquisition', 'Financial Products'],
        officialApplyUrl: 'https://www.hdfcbank.com/personal/about-us/careers',
        verifiedDate: '2026-11-04',
        isActivelyRecruiting: true
      }
    ]
  },

  // 3. AUTOMOBILE & MANUFACTURING
  {
    id: 'tata-motors',
    name: 'Tata Motors',
    logo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=160&auto=format&fit=crop&q=80',
    industry: 'Automobile',
    overview: 'India\'s pioneer automobile manufacturer producing commercial vehicles, passenger cars, and electric vehicles across state-of-the-art facilities.',
    headquarters: 'Mumbai / Pune, Maharashtra',
    officialWebsite: 'https://www.tatamotors.com',
    careersPortalUrl: 'https://careers.tatamotors.com',
    businessSectors: ['Electric Vehicles', 'Commercial Trucks & Buses', 'Automotive R&D', 'Manufacturing Operations'],
    jobCategories: ['Assembly Line Technician', 'Mechanical Engineer', 'Quality Inspector', 'CNC Operator', 'Welder'],
    commonSkills: ['Automotive Mechanics', 'CAD/CAM', 'Assembly Line Operations', 'Safety Protocols', 'Welding'],
    generalEligibility: 'Diploma / ITI (Fitter, Motor Mechanic, Electrician, Welder) or B.E./B.Tech Mechanical/Electrical.',
    lastVerifiedDate: '2026-11-05',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 750,
    sampleVacancies: [
      {
        id: 'tm-vac-1',
        title: 'Vehicle Assembly & Quality Technician',
        location: 'Pune / Sanand / Jamshedpur / Pantnagar',
        experienceLevel: '0 - 4 Years',
        category: 'Manufacturing',
        eligibility: 'ITI / Diploma in Mechanical or Automobile Engineering',
        keySkills: ['Fitter Tools', 'Assembly Operations', 'Torque Tools', 'Quality Checks'],
        officialApplyUrl: 'https://careers.tatamotors.com',
        verifiedDate: '2026-11-03',
        isActivelyRecruiting: true
      }
    ]
  },
  {
    id: 'maruti-suzuki',
    name: 'Maruti Suzuki India Limited',
    logo: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=160&auto=format&fit=crop&q=80',
    industry: 'Automobile',
    overview: 'India\'s largest passenger car company holding more than 40% of the domestic passenger car market with world-class plants in Manesar and Gurugram.',
    headquarters: 'New Delhi',
    officialWebsite: 'https://www.marutisuzuki.com',
    careersPortalUrl: 'https://www.marutisuzuki.com/corporate/careers',
    businessSectors: ['Automobile Manufacturing', 'Spare Parts Distribution', 'Dealership Service Network'],
    jobCategories: ['Service Technician', 'Painter', 'Dent Repair Specialist', 'Parts Inventory Handler'],
    commonSkills: ['Automobile Paint', 'Denting', 'Mechanic Troubleshooting', 'Diagnostic Scanners'],
    generalEligibility: 'ITI Pass in relevant trade (Motor Mechanic, Painter, Diesel Mechanic) or Diploma.',
    lastVerifiedDate: '2026-11-04',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 920,
    sampleVacancies: [
      {
        id: 'ms-vac-1',
        title: 'Authorized Workshop Motor Mechanic',
        location: 'Gurugram / Manesar / Chandigarh / Indore',
        experienceLevel: '1 - 3 Years',
        category: 'Technicians',
        eligibility: 'ITI Motor Vehicle Mechanic certificate',
        keySkills: ['Engine Overhaul', 'Brake Systems', 'Wheel Alignment', 'Vehicle Servicing'],
        officialApplyUrl: 'https://www.marutisuzuki.com/corporate/careers',
        verifiedDate: '2026-11-05',
        isActivelyRecruiting: true
      }
    ]
  },

  // 4. RETAIL & E-COMMERCE
  {
    id: 'reliance-retail',
    name: 'Reliance Retail',
    logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=160&auto=format&fit=crop&q=80',
    industry: 'Retail',
    overview: 'The largest and most profitable retailer in India with over 18,000 stores across grocery, electronics, fashion, and pharma (Smart Bazaar, Digital, Trends).',
    headquarters: 'Mumbai, Maharashtra',
    officialWebsite: 'https://relianceretail.com',
    careersPortalUrl: 'https://relianceretail.com/careers.html',
    businessSectors: ['Supermarkets', 'Fashion & Lifestyle', 'Consumer Electronics', 'JioMart Supply Chain'],
    jobCategories: ['Store Associate', 'Cashier / Billing Executive', 'Inventory Associate', 'Department Manager', 'Delivery Executive'],
    commonSkills: ['Retail Billing (POS)', 'Customer Assistance', 'Stock Merchandising', 'Stock Auditing'],
    generalEligibility: '10th / 12th pass or Graduate. Training provided for store operations.',
    lastVerifiedDate: '2026-11-06',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 5400,
    sampleVacancies: [
      {
        id: 'rr-vac-1',
        title: 'Store Operations & Billing Associate',
        location: 'Pan-India Across 500+ Cities',
        experienceLevel: 'Fresher / 0 - 2 Years',
        category: 'Retail Store Operations',
        eligibility: '12th Pass or Graduate. Basic computer and local language skills.',
        keySkills: ['POS Billing', 'Inventory Stocking', 'Customer Help', 'Barcoding'],
        officialApplyUrl: 'https://relianceretail.com/careers.html',
        verifiedDate: '2026-11-06',
        isActivelyRecruiting: true
      }
    ]
  },
  {
    id: 'dmart',
    name: 'DMart (Avenue Supermarts)',
    logo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=160&auto=format&fit=crop&q=80',
    industry: 'Retail',
    overview: 'DMart is a nationwide supermarket chain that offers customers a wide range of basic home and personal products under one roof with everyday low prices.',
    headquarters: 'Mumbai, Maharashtra',
    officialWebsite: 'https://www.dmartindia.com',
    careersPortalUrl: 'https://careers.dmartindia.com',
    businessSectors: ['Hypermarkets', 'Fast Moving Consumer Goods', 'Direct Fulfillment Centers'],
    jobCategories: ['Store Picker', 'Loading Staff', 'Cashier', 'Security Supervisor', 'Warehouse Associate'],
    commonSkills: ['Loading / Unloading', 'Inventory Counting', 'Customer Service', 'Store Cleanliness'],
    generalEligibility: '10th/12th standard or equivalent. Immediate vacancies in city outskirts and logistics centers.',
    lastVerifiedDate: '2026-11-03',
    isFeatured: false,
    isActivelyHiring: true,
    openVacanciesCount: 1200,
    sampleVacancies: [
      {
        id: 'dmart-vac-1',
        title: 'Fulfillment & Warehouse Helper',
        location: 'Thane / Surat / Nagpur / Hyderabad',
        experienceLevel: 'Fresher',
        category: 'Unskilled and General Workers',
        eligibility: '10th standard pass or basic literacy. Physically active.',
        keySkills: ['Loading & Unloading', 'Packaging', 'Pallet Movement'],
        officialApplyUrl: 'https://careers.dmartindia.com',
        verifiedDate: '2026-11-04',
        isActivelyRecruiting: true
      }
    ]
  },

  // 5. HEALTHCARE
  {
    id: 'apollo-hospitals',
    name: 'Apollo Hospitals Group',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=160&auto=format&fit=crop&q=80',
    industry: 'Healthcare',
    overview: 'Asia\'s foremost integrated healthcare services provider, operating 70+ hospitals, 5,000+ pharmacies, and primary care clinics.',
    headquarters: 'Chennai, Tamil Nadu',
    officialWebsite: 'https://www.apollohospitals.com',
    careersPortalUrl: 'https://www.apollohospitals.com/careers',
    businessSectors: ['Multi-specialty Hospitals', 'Pharmacy Retail', 'Diagnostics', 'Home Healthcare'],
    jobCategories: ['Staff Nurse', 'Pharmacy Assistant', 'Lab Technician', 'Patient Care Attendant', 'Medical Transcriptionist'],
    commonSkills: ['Patient Care', 'Medicine Dispensing', 'First Aid', 'Vital Signs Monitoring'],
    generalEligibility: 'ANM/GNM/B.Sc Nursing, B.Pharm/D.Pharm, or healthcare support certifications.',
    lastVerifiedDate: '2026-11-05',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 1650,
    sampleVacancies: [
      {
        id: 'apo-vac-1',
        title: 'Pharmacy Dispenser / Assistant',
        location: 'Bengaluru / Hyderabad / Chennai / Delhi',
        experienceLevel: '0 - 3 Years',
        category: 'Healthcare',
        eligibility: 'D.Pharm or B.Pharm with State Pharmacy Council Registration',
        keySkills: ['Prescription Reading', 'Inventory Management', 'Billing'],
        officialApplyUrl: 'https://www.apollohospitals.com/careers',
        verifiedDate: '2026-11-05',
        isActivelyRecruiting: true
      }
    ]
  },

  // 6. LOGISTICS AND TRANSPORTATION
  {
    id: 'delhivery',
    name: 'Delhivery Logistics',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=160&auto=format&fit=crop&q=80',
    industry: 'Logistics and Transportation',
    overview: 'India\'s largest fully-integrated logistics provider, connecting over 18,500 pin codes with automated sorting hubs and last-mile delivery fleets.',
    headquarters: 'Gurugram, Haryana',
    officialWebsite: 'https://www.delhivery.com',
    careersPortalUrl: 'https://www.delhivery.com/careers',
    businessSectors: ['Express Parcel', 'Part Truckload Freight', 'Supply Chain Services', 'Cross Border Logistics'],
    jobCategories: ['Delivery Associate', 'Hub Sortation Staff', 'Forklift Driver', 'Fleet Supervisor', 'Warehouse In-charge'],
    commonSkills: ['Two-wheeler Driving', 'Smartphone Operation', 'GPS Route Navigation', 'Package Handling'],
    generalEligibility: 'Valid Driving License (for delivery drivers), 10th pass, clean background verification.',
    lastVerifiedDate: '2026-11-05',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 3800,
    sampleVacancies: [
      {
        id: 'del-vac-1',
        title: 'Last-Mile Delivery Associate',
        location: 'All Tier 1, 2, and 3 Indian Cities',
        experienceLevel: 'Fresher / Experienced',
        category: 'Delivery Professionals',
        eligibility: 'Must possess a two-wheeler with valid driving license and smartphone',
        keySkills: ['Route Navigation', 'Package Delivery', 'Cash on Delivery Handling'],
        officialApplyUrl: 'https://www.delhivery.com/careers',
        verifiedDate: '2026-11-06',
        isActivelyRecruiting: true
      }
    ]
  },

  // 7. CONSTRUCTION AND INFRASTRUCTURE
  {
    id: 'larsen-toubro',
    name: 'Larsen & Toubro (L&T)',
    logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=160&auto=format&fit=crop&q=80',
    industry: 'Construction and Infrastructure',
    overview: 'An Indian multinational engaged in EPC projects, hi-tech manufacturing, metro rail, highways, smart cities, and heavy civil construction.',
    headquarters: 'Mumbai, Maharashtra',
    officialWebsite: 'https://www.larsentoubro.com',
    careersPortalUrl: 'https://www.larsentoubro.com/corporate/careers',
    businessSectors: ['Heavy Civil Infrastructure', 'Power Transmission', 'Buildings & Factories', 'Hydrocarbon Projects'],
    jobCategories: ['Site Supervisor', 'Civil Engineer', 'Electrician (High Voltage)', 'Safety Officer', 'Heavy Crane Operator'],
    commonSkills: ['Blueprint Reading', 'Bar Bending Schedule', 'Concrete Quality', 'Site Safety', 'Crane Handling'],
    generalEligibility: 'Diploma / Degree in Civil, Mechanical, or Electrical, or ITI Trade certifications.',
    lastVerifiedDate: '2026-11-04',
    isFeatured: true,
    isActivelyHiring: true,
    openVacanciesCount: 1100,
    sampleVacancies: [
      {
        id: 'lt-vac-1',
        title: 'Industrial Electrical Technician',
        location: 'Project Sites Across Gujarat, Rajasthan, Tamil Nadu',
        experienceLevel: '2 - 6 Years',
        category: 'Skilled Workers',
        eligibility: 'ITI or Diploma in Electrical with Wireman / Electrical Supervisor License',
        keySkills: ['Transformer Maintenance', 'Cable Laying', 'Switchgear', 'Safety Compliance'],
        officialApplyUrl: 'https://www.larsentoubro.com/corporate/careers',
        verifiedDate: '2026-11-05',
        isActivelyRecruiting: true
      }
    ]
  }
];

export const CAREER_GUIDANCE_PATHS = [
  {
    role: 'Electrician & Wireman',
    category: 'Skilled Workers',
    avgSalary: '₹18,000 - ₹35,000 / month',
    growthPath: 'Assistant Electrician → Licensed Electrician → Maintenance Supervisor → Electrical Contractor',
    topSectors: ['Construction', 'Manufacturing', 'Residential Maintenance', 'Commercial Complexes'],
    certifications: ['ITI Electrician', 'National Apprenticeship Certificate (NAC)', 'State Wireman License']
  },
  {
    role: 'Delivery Associate & Fleet Driver',
    category: 'Skilled / Logistics',
    avgSalary: '₹16,000 - ₹32,000 / month + Incentives',
    growthPath: 'Last-Mile Associate → Team Lead → Hub Operations Supervisor → Dispatch Manager',
    topSectors: ['E-commerce', 'Courier Services', 'Food Delivery', 'Quick Commerce'],
    certifications: ['Commercial Driving License', 'Defensive Driving Certification']
  },
  {
    role: 'Store Billing & Retail Executive',
    category: 'Retail & Commercial',
    avgSalary: '₹15,000 - ₹28,000 / month',
    growthPath: 'Billing Clerk → Customer Executive → Department Supervisor → Assistant Store Manager',
    topSectors: ['Supermarkets', 'Consumer Electronics', 'Fashion Showrooms', 'Department Stores'],
    certifications: ['Retail Management Diploma', 'Tally Prime Certification', 'POS Systems Training']
  },
  {
    role: 'Software & Web Developer',
    category: 'Professional Workers',
    avgSalary: '₹30,000 - ₹95,000 / month',
    growthPath: 'Junior Developer → Full Stack Engineer → Tech Lead → Software Architect',
    topSectors: ['Information Technology', 'E-commerce', 'Banking & FinTech', 'HealthTech'],
    certifications: ['Cloud Practitioner (AWS/Azure)', 'Full Stack Web Certification', 'Python Data Specialist']
  }
];
