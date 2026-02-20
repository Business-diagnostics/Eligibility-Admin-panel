// Malta Grant Eligibility Tool - Core Types

// Business Size Classification
export type BusinessSize = 'micro' | 'small' | 'medium' | 'large';

// Business Registration Status
export type RegistrationStatus = 'yes' | 'in_process' | 'no';

// Legal Structure
export type LegalStructure = 'self_employed' | 'partnership' | 'limited_company';

export const LEGAL_STRUCTURE_LABELS: Record<LegalStructure, string> = {
  self_employed: 'Self-Employed (Sole Trader)',
  partnership: 'Partnership',
  limited_company: 'Limited Liability Company (Ltd)',
};

// Business Age Classification
export type BusinessAge = 'startup' | 'established';

// Project Location
export type ProjectLocation = 'malta' | 'gozo';

// NACE Industry Codes
export const NACE_CODES = {
  A: 'Agriculture, forestry and fishing (01–03)',
  B: 'Mining and quarrying (05–09)',
  CA: 'Manufacture of food products, beverages and tobacco products (10–12)',
  CB: 'Manufacture of textiles, apparel, leather and related products (13–15)',
  CC: 'Manufacture of wood and paper products; printing and reproduction of recorded media (16–18)',
  CD: 'Manufacture of coke and refined petroleum products (19)',
  CE: 'Manufacture of chemicals and chemical products (20)',
  CF: 'Manufacture of pharmaceuticals, medicinal chemical and botanical products (21)',
  CG: 'Manufacture of rubber and plastics products; other non-metallic mineral products (22–23)',
  CH: 'Manufacture of basic metals and fabricated metal products, except machinery and equipment (24–25)',
  CI: 'Manufacture of computer, electronic and optical products (26)',
  CJ: 'Manufacture of electrical equipment (27)',
  CK: 'Manufacture of machinery and equipment n.e.c. (28)',
  CL: 'Manufacture of transport equipment (29–30)',
  CM: 'Other manufacturing; repair and installation of machinery and equipment (31–33)',
  D: 'Electricity, gas, steam and air-conditioning supply (35)',
  E: 'Water supply; sewerage, waste management and remediation activities (36–39)',
  F: 'Construction (41–43)',
  G: 'Wholesale and retail trade; repair of motor vehicles and motorcycles (45–47)',
  H: 'Transportation and storage (49–53)',
  I: 'Accommodation and food service activities (55–56)',
  JA: 'Publishing, audiovisual and broadcasting activities (58–60)',
  JB: 'Telecommunications (61)',
  JC: 'IT and other information services (62–63)',
  K: 'Financial and insurance activities (64–66)',
  L: 'Real estate activities (68)',
  MA: 'Legal, accounting, management, architecture, engineering, technical testing and analysis (69–71)',
  MB: 'Scientific research and development (72)',
  MC: 'Other professional, scientific and technical activities (73–75)',
  N: 'Administrative and support service activities (77–82)',
  O: 'Public administration and defence; compulsory social security (84)',
  P: 'Education (85)',
  QA: 'Human health services (86)',
  QB: 'Residential care and social work activities (87–88)',
  R: 'Arts, entertainment and recreation (90–93)',
  S: 'Other service activities (94–96)',
  T: 'Activities of households as employers; undifferentiated goods and services for own use (97–98)',
} as const;

export type NaceCode = keyof typeof NACE_CODES;

// Manufacturing NACE codes for special eligibility rules
export const MANUFACTURING_NACE_CODES: NaceCode[] = [
  'CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CL', 'CM'
];

// Primary Project Activities
export const PRIMARY_ACTIVITIES = {
  manufacturing: 'Manufacturing & Production',
  technology: 'Technology & Digital Solutions',
  research: 'Research, Innovation & IP',
  life_sciences: 'Life Sciences & Advanced Technologies',
  sustainability: 'Sustainability & Environmental Projects',
  industrial: 'Industrial & Technical Services',
  creative: 'Culture, Creative & Audio-Visual',
  business: 'Business Services & Advisory',
  skills: 'Skills & Workforce Development',
  retail: 'Retail and wholesale',
  construction: 'Construction and Finishing',
  hospitality: 'Hotels and guesthouse',
} as const;

export type PrimaryActivity = keyof typeof PRIMARY_ACTIVITIES;

// Sub-activities mapped to primary activities
export const SUB_ACTIVITIES: Record<PrimaryActivity, string[]> = {
  manufacturing: [
    'Manufacturing of goods',
    'Industrial production processes',
    'Artisanal and craft production',
    'Product assembly and finishing',
    'Industrial packaging',
  ],
  technology: [
    'Software development',
    'Digital platforms and systems (ERP, CRM, e-commerce)',
    'Automation and digital transformation',
    'Artificial intelligence and advanced digital technologies',
    'Cloud, data analytics, and cybersecurity solutions',
  ],
  research: [
    'Research and development (R&D)',
    'Industrial research',
    'Experimental development',
    'Product or process innovation',
    'Development or commercialisation of intellectual property',
  ],
  life_sciences: [
    'Biotechnology and pharmaceuticals',
    'Medical devices',
    'Health and life sciences technologies',
    'Scientific and laboratory-based activities',
  ],
  sustainability: [
    'Energy efficiency improvements',
    'Environmental sustainability initiatives',
    'Resource optimisation and waste reduction',
    'Green and low-carbon technologies',
  ],
  industrial: [
    'Machinery and equipment repair',
    'Electrical and mechanical maintenance',
    'Motor vehicle maintenance and repair',
    'Marine and vessel repair',
    'Industrial laundry and specialised services',
  ],
  creative: [
    'Film, video, and audio-visual production',
    'Post-production and editing',
    'Digital and creative media content',
  ],
  business: [
    'Business plans and feasibility studies',
    'Strategy, restructuring, and transformation projects',
    'Operational improvement initiatives',
  ],
  skills: [
    'Employee training and upskilling',
    'Digital and technical skills training',
    'Sustainability and ESG-related training',
  ],
  retail: ['Retail operations', 'Wholesale operations'],
  construction: ['Construction services', 'Finishing works'],
  hospitality: [
    'Operation of licensed hotels and guest houses',
    'Related amenities licensed by the Malta Tourism Authority',
  ],
};

// Cost Category Types
export interface CostItem {
  amount: number;
  description?: string;
}

export interface CostCategory {
  capex: CostItem; // One-time capital expenditure
  opex: CostItem;  // Annual/recurring operational expenditure
}

// All Project Costs
export interface ProjectCosts {
  premises: {
    landAndBuilding: CostItem;        // CAPEX
    leaseAndRental: CostItem;         // OPEX - Annual
    construction: CostItem;           // CAPEX
  };
  equipment: {
    equipmentMachinery: CostItem;     // CAPEX
    furnitureFixtures: CostItem;      // CAPEX
  };
  wages: {
    wageCost: CostItem;               // OPEX - Annual
    relocationEmployees: CostItem;    // CAPEX
  };
  digital: {
    hardwareSoftware: CostItem;       // CAPEX
    digitalTools: CostItem;           // CAPEX (includes 2yr subscription)
  };
  vehicles: {
    vehicles: CostItem;               // CAPEX
  };
  innovation: {
    specialisedServices: CostItem;    // OPEX - Annual
    innovativeWages: CostItem;        // OPEX - Annual
    professionalFees: CostItem;       // OPEX - One-time
    rdExpertise: CostItem;            // OPEX - One-time
    businessTravel: CostItem;         // OPEX - One-time
    ipProtection: CostItem;           // CAPEX
    marketing: CostItem;              // OPEX - One-time
    certification: CostItem;          // OPEX - One-time
  };
}

// Business Basics - Updated with turnover and de minimis tracking
export interface BusinessBasics {
  name: string;
  registrationStatus: RegistrationStatus;
  legalStructure: LegalStructure;
  size: BusinessSize;
  age: BusinessAge;
  employeeCount: number;
  annualTurnover: number; // Annual turnover in EUR for accurate size classification
  hasExceededDeMinimis: boolean; // Has received > €300,000 state aid in last 3 years
}

// Project Activities
export interface ProjectActivities {
  primaryNace: NaceCode | null;
  primaryActivity: PrimaryActivity | null;
  subActivity: string | null;
}

// Complete Project Data
export interface ProjectData {
  businessBasics: BusinessBasics;
  projectActivities: ProjectActivities;
  projectLocation: ProjectLocation;
  costs: ProjectCosts;
}

// Form Step
export type FormStep = 'basics' | 'industry' | 'activities' | 'costs' | 'results';

// Grant Eligibility Result
export interface EligibilityResult {
  grantSchemeId: string;
  schemeName: string;
  isEligible: boolean;
  matchScore: number;
  maxGrant: number | null;
  aidIntensity: number;
  eligibleCosts: string[];
  notes: string[];
}

// Default empty cost item
export const emptyCostItem: CostItem = {
  amount: 0,
  description: '',
};

// Default project costs
export const defaultProjectCosts: ProjectCosts = {
  premises: {
    landAndBuilding: { ...emptyCostItem },
    leaseAndRental: { ...emptyCostItem },
    construction: { ...emptyCostItem },
  },
  equipment: {
    equipmentMachinery: { ...emptyCostItem },
    furnitureFixtures: { ...emptyCostItem },
  },
  wages: {
    wageCost: { ...emptyCostItem },
    relocationEmployees: { ...emptyCostItem },
  },
  digital: {
    hardwareSoftware: { ...emptyCostItem },
    digitalTools: { ...emptyCostItem },
  },
  vehicles: {
    vehicles: { ...emptyCostItem },
  },
  innovation: {
    specialisedServices: { ...emptyCostItem },
    innovativeWages: { ...emptyCostItem },
    professionalFees: { ...emptyCostItem },
    rdExpertise: { ...emptyCostItem },
    businessTravel: { ...emptyCostItem },
    ipProtection: { ...emptyCostItem },
    marketing: { ...emptyCostItem },
    certification: { ...emptyCostItem },
  },
};

// Default project data
export const defaultProjectData: ProjectData = {
  businessBasics: {
    name: '',
    registrationStatus: 'yes',
    legalStructure: 'limited_company',
    size: 'micro',
    age: 'established',
    employeeCount: 0,
    annualTurnover: 0,
    hasExceededDeMinimis: false,
  },
  projectActivities: {
    primaryNace: null,
    primaryActivity: null,
    subActivity: null,
  },
  projectLocation: 'malta',
  costs: defaultProjectCosts,
};

// ============= Size Classification Helpers =============

/**
 * Determine business size based on EU SME definition:
 * - Micro: Employees < 10 AND Turnover <= €2M
 * - Small: Employees < 50 AND Turnover <= €10M
 * - Medium: Employees < 250 AND Turnover <= €50M
 * - Large: Exceeds Medium limits
 * 
 * If turnover is unknown (0), uses employee count only as fallback
 */
export function calculateBusinessSize(employeeCount: number, annualTurnover: number): BusinessSize {
  // If turnover is unknown (0), use employee-count-only triggers:
  // Micro: 0–10 employees, Small: 11–50, Medium: 51–250
  if (annualTurnover === 0) {
    if (employeeCount <= 10) return 'micro';
    if (employeeCount <= 50) return 'small';
    if (employeeCount <= 250) return 'medium';
    return 'large';
  }
  
  // Full EU SME classification with both criteria
  if (employeeCount < 10 && annualTurnover <= 2_000_000) {
    return 'micro';
  }
  if (employeeCount < 50 && annualTurnover <= 10_000_000) {
    return 'small';
  }
  if (employeeCount < 250 && annualTurnover <= 50_000_000) {
    return 'medium';
  }
  return 'large';
}

/**
 * Check if business qualifies as SME (Micro, Small, or Medium)
 */
export function isSME(size: BusinessSize): boolean {
  return size === 'micro' || size === 'small' || size === 'medium';
}

/**
 * Check if business is a startup (< 5 years old)
 */
export function isStartup(age: BusinessAge): boolean {
  return age === 'startup';
}

/**
 * Check if NACE code is in manufacturing sector
 */
export function isManufacturingNace(naceCode: NaceCode | null): boolean {
  if (!naceCode) return false;
  return MANUFACTURING_NACE_CODES.includes(naceCode);
}
