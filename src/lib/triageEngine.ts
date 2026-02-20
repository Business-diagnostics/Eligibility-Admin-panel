// Malta Grant Eligibility Tool - Triage Engine
// Matches user project data against grant schemes to find the best funding option
// Updated for 2024-2026 official guidelines

import { 
  ProjectData, 
  ProjectCosts, 
  BusinessSize, 
  BusinessAge, 
  ProjectLocation,
  LegalStructure,
  NaceCode,
  RegistrationStatus,
  isSME,
  isStartup,
} from '@/types/eligibility';

// Grant scheme structure from database
export interface GrantScheme {
  id: string;
  scheme_name: string;
  scheme_code: string | null;
  description: string | null;
  min_investment_required: number | null;
  max_grant_amount: number | null;
  max_investment_allowed: number | null;
  standard_aid_intensity: number | null;
  sme_aid_intensity: number | null;
  sme_gozo_aid_intensity: number | null;
  large_entity_aid_intensity: number | null;
  large_entity_gozo_aid_intensity: number | null;
  startup_aid_intensity: number | null;
  hospitality_aid_intensity: number | null;
  eligible_nace_codes: string[] | null;
  eligible_activities: string[] | null;
  eligible_costs: EligibleCostsMap | null;
  startup_required: boolean | null;
  micro_only: boolean | null;
  sme_only: boolean | null;
  is_active: boolean | null;
  aid_framework: string | null;
  min_grant_amount?: number | null;
  allowed_legal_structures: string[] | null;
  supported_sub_activities: string[] | null;
  allowed_registration_statuses: string[] | null;
}

// Cost eligibility mapping - mirrors cost structure
export interface EligibleCostsMap {
  premises_land_building?: boolean;
  premises_lease_rental?: boolean;
  premises_construction?: boolean;
  equipment_machinery?: boolean;
  equipment_furniture?: boolean;
  wages_cost?: boolean;
  wages_relocation?: boolean;
  digital_hardware_software?: boolean;
  digital_tools?: boolean;
  vehicles?: boolean;
  innovation_specialised_services?: boolean;
  innovation_wages?: boolean;
  innovation_professional_fees?: boolean;
  innovation_rd_expertise?: boolean;
  innovation_business_travel?: boolean;
  innovation_ip_protection?: boolean;
  innovation_marketing?: boolean;
  innovation_certification?: boolean;
}

// Result of the triage process
export interface TriageResult {
  grantId: string;
  schemeName: string;
  schemeCode: string | null;
  isEligible: boolean;
  matchScore: number;
  totalEligibleCosts: number;
  applicableAidIntensity: number;
  estimatedMaxGrant: number;
  matchedCostCategories: string[];
  notes: string[];
  exclusionReason?: string;
}

// User data structure for the triage function
export interface UserData {
  totalProjectCost: number;
  totalCapex: number;
  totalOpex: number;
  naceCode: NaceCode | null;
  primaryActivity: string | null;
  subActivity: string | null;
  businessSize: BusinessSize;
  businessAge: BusinessAge;
  projectLocation: ProjectLocation;
  legalStructure: LegalStructure;
  costs: ProjectCosts;
  hasExceededDeMinimis: boolean;
  registrationStatus: RegistrationStatus;
}

// ============= Aid Intensity Lookup =============

/**
 * Get the applicable aid intensity based on business characteristics and grant scheme
 * Applies Location Multiplier (Gozo gets higher intensity)
 */
function getApplicableAidIntensity(
  grant: GrantScheme,
  businessSize: BusinessSize,
  businessAge: BusinessAge,
  projectLocation: ProjectLocation,
  primaryActivity: string | null
): number {
  // Check for hospitality-specific intensity
  if (primaryActivity === 'hospitality' && grant.hospitality_aid_intensity) {
    return grant.hospitality_aid_intensity;
  }

  // Check for startup-specific intensity (only if scheme supports it)
  if (isStartup(businessAge) && grant.startup_aid_intensity) {
    return grant.startup_aid_intensity;
  }

  const isGozo = projectLocation === 'gozo';
  const isSMEBusiness = isSME(businessSize);

  // Determine aid intensity based on size and location
  if (isSMEBusiness) {
    if (isGozo && grant.sme_gozo_aid_intensity) {
      return grant.sme_gozo_aid_intensity;
    }
    return grant.sme_aid_intensity ?? grant.standard_aid_intensity ?? 0;
  } else {
    // Large entity
    if (isGozo && grant.large_entity_gozo_aid_intensity) {
      return grant.large_entity_gozo_aid_intensity;
    }
    return grant.large_entity_aid_intensity ?? grant.standard_aid_intensity ?? 0;
  }
}

// ============= Cost Calculation =============

/**
 * Calculate eligible costs based on the grant's cost eligibility mapping
 */
function calculateEligibleCosts(
  costs: ProjectCosts,
  eligibleCostsMap: EligibleCostsMap | null
): { total: number; matchedCategories: string[] } {
  if (!eligibleCostsMap) {
    // If no mapping, assume all costs are eligible
    return { total: 0, matchedCategories: [] };
  }

  let total = 0;
  const matchedCategories: string[] = [];

  // Premises
  if (eligibleCostsMap.premises_land_building && costs.premises.landAndBuilding.amount > 0) {
    total += costs.premises.landAndBuilding.amount;
    matchedCategories.push('Land & Building');
  }
  if (eligibleCostsMap.premises_lease_rental && costs.premises.leaseAndRental.amount > 0) {
    total += costs.premises.leaseAndRental.amount;
    matchedCategories.push('Lease & Rental');
  }
  if (eligibleCostsMap.premises_construction && costs.premises.construction.amount > 0) {
    total += costs.premises.construction.amount;
    matchedCategories.push('Construction');
  }

  // Equipment
  if (eligibleCostsMap.equipment_machinery && costs.equipment.equipmentMachinery.amount > 0) {
    total += costs.equipment.equipmentMachinery.amount;
    matchedCategories.push('Equipment & Machinery');
  }
  if (eligibleCostsMap.equipment_furniture && costs.equipment.furnitureFixtures.amount > 0) {
    total += costs.equipment.furnitureFixtures.amount;
    matchedCategories.push('Furniture & Fixtures');
  }

  // Wages
  if (eligibleCostsMap.wages_cost && costs.wages.wageCost.amount > 0) {
    total += costs.wages.wageCost.amount;
    matchedCategories.push('Wage Costs');
  }
  if (eligibleCostsMap.wages_relocation && costs.wages.relocationEmployees.amount > 0) {
    total += costs.wages.relocationEmployees.amount;
    matchedCategories.push('Employee Relocation');
  }

  // Digital
  if (eligibleCostsMap.digital_hardware_software && costs.digital.hardwareSoftware.amount > 0) {
    total += costs.digital.hardwareSoftware.amount;
    matchedCategories.push('Hardware & Software');
  }
  if (eligibleCostsMap.digital_tools && costs.digital.digitalTools.amount > 0) {
    total += costs.digital.digitalTools.amount;
    matchedCategories.push('Digital Tools');
  }

  // Vehicles
  if (eligibleCostsMap.vehicles && costs.vehicles.vehicles.amount > 0) {
    total += costs.vehicles.vehicles.amount;
    matchedCategories.push('Vehicles');
  }

  // Innovation
  if (eligibleCostsMap.innovation_specialised_services && costs.innovation.specialisedServices.amount > 0) {
    total += costs.innovation.specialisedServices.amount;
    matchedCategories.push('Specialised Services');
  }
  if (eligibleCostsMap.innovation_wages && costs.innovation.innovativeWages.amount > 0) {
    total += costs.innovation.innovativeWages.amount;
    matchedCategories.push('Innovation Wages');
  }
  if (eligibleCostsMap.innovation_professional_fees && costs.innovation.professionalFees.amount > 0) {
    total += costs.innovation.professionalFees.amount;
    matchedCategories.push('Professional Fees');
  }
  if (eligibleCostsMap.innovation_rd_expertise && costs.innovation.rdExpertise.amount > 0) {
    total += costs.innovation.rdExpertise.amount;
    matchedCategories.push('R&D Expertise');
  }
  if (eligibleCostsMap.innovation_business_travel && costs.innovation.businessTravel.amount > 0) {
    total += costs.innovation.businessTravel.amount;
    matchedCategories.push('Business Travel');
  }
  if (eligibleCostsMap.innovation_ip_protection && costs.innovation.ipProtection.amount > 0) {
    total += costs.innovation.ipProtection.amount;
    matchedCategories.push('IP Protection');
  }
  if (eligibleCostsMap.innovation_marketing && costs.innovation.marketing.amount > 0) {
    total += costs.innovation.marketing.amount;
    matchedCategories.push('Marketing');
  }
  if (eligibleCostsMap.innovation_certification && costs.innovation.certification.amount > 0) {
    total += costs.innovation.certification.amount;
    matchedCategories.push('Certification');
  }

  return { total, matchedCategories };
}

// ============= Eligibility Filters =============

/**
 * Check if the user's NACE code matches the grant's eligible NACE codes
 */
function matchesNaceCode(userNace: NaceCode | null, eligibleNaceCodes: string[] | null): boolean {
  if (!eligibleNaceCodes || eligibleNaceCodes.length === 0) {
    // No NACE restriction - all codes eligible
    return true;
  }
  if (!userNace) {
    return false;
  }
  return eligibleNaceCodes.includes(userNace);
}

/**
 * Check business size eligibility based on scheme requirements
 * 
 * Size Mapping (standardized):
 *   - "Micro & SMEs" = Micro + Small + Medium (all three)
 *   - sme_only = true → visible to Micro, Small, Medium (isSME check)
 *   - micro_only = true → visible to Micro only
 *   - Neither flag → visible to ALL sizes including Large
 * 
 * Business Development: available to ALL sizes (Micro, Small, Medium) regardless of age.
 */
function checkBusinessSizeEligibility(
  grant: GrantScheme,
  businessSize: BusinessSize
): { eligible: boolean; note: string | null } {
  const isMicro = businessSize === 'micro';
  const isSMEBusiness = isSME(businessSize);

  if (grant.micro_only && !isMicro) {
    return { eligible: false, note: 'This scheme is only available for micro enterprises (≤ 10 employees)' };
  }
  if (grant.sme_only && !isSMEBusiness) {
    return { eligible: false, note: 'This scheme is only available for SMEs (Micro, Small, Medium enterprises)' };
  }
  return { eligible: true, note: null };
}

/**
 * Check startup requirement - Startup Conflict Resolution:
 * 
 * isStartup = (age < 5 years / age === 'startup')
 * 
 * If isStartup is FALSE, ONLY exclude:
 *   - Startup Finance (startup_required = true)
 *   - Business Start (startup_required = true)
 * 
 * DO NOT exclude Business Development or SME Enhance — they are open to ALL ages.
 * Business Development supports both 'Start-up initiatives' AND 'Expansion/Transformation'.
 */
function checkStartupRequirement(
  grant: GrantScheme,
  businessAge: BusinessAge
): { eligible: boolean; note: string | null } {
  const isStartupBusiness = isStartup(businessAge);
  
  // Only exclude if the scheme's startup_required flag is TRUE
  // This should only be set for Startup Finance and Business Start
  if (grant.startup_required && !isStartupBusiness) {
    return { 
      eligible: false, 
      note: 'This scheme is only available for startups (businesses less than 5 years old)' 
    };
  }
  return { eligible: true, note: null };
}

/**
 * Check legal structure eligibility
 * Uses DB-driven allowed_legal_structures array on the grant.
 * If null or empty → all structures allowed.
 */
function checkLegalStructureEligibility(
  grant: GrantScheme,
  legalStructure: LegalStructure
): { eligible: boolean; note: string | null } {
  const allowed = grant.allowed_legal_structures;
  // No restriction configured → all structures eligible
  if (!allowed || allowed.length === 0) {
    return { eligible: true, note: null };
  }
  if (!allowed.includes(legalStructure)) {
    const structureLabel = legalStructure === 'self_employed'
      ? 'Self-Employed (Sole Trader)'
      : legalStructure === 'partnership'
      ? 'Partnership'
      : 'Limited Liability Company (Ltd)';
    return {
      eligible: false,
      note: `This scheme is not available for ${structureLabel} — requires: ${allowed.map(s =>
        s === 'self_employed' ? 'Self-Employed' : s === 'partnership' ? 'Partnership' : 'Ltd'
      ).join(', ')}`
    };
  }
  return { eligible: true, note: null };
}

/**
 * Check De Minimis eligibility
 * If user has exceeded €300k state aid in last 3 years, exclude De Minimis schemes
 */
function checkDeMinimisEligibility(
  grant: GrantScheme,
  hasExceededDeMinimis: boolean
): { eligible: boolean; note: string | null } {
  if (hasExceededDeMinimis && grant.aid_framework === 'de_minimis') {
    return {
      eligible: false,
      note: 'Excluded: You have received > €300,000 in state aid (De Minimis limit exceeded)'
    };
  }
  return { eligible: true, note: null };
}

/**
 * Check minimum project value thresholds
 * - SME Enhance: min project cost €10,000
 * - Invest 2024: min €50,000 (SME) or €500,000 (Large)
 *   Avoids suggesting high-investment grants to small budget projects
 */
function checkMinimumThresholds(
  grant: GrantScheme,
  userData: UserData
): { eligible: boolean; note: string | null } {
  const schemeCode = grant.scheme_code?.toLowerCase() || '';
  const schemeName = grant.scheme_name.toLowerCase();
  
  // SME Enhance minimum project cost threshold
  if (schemeCode.includes('sme-enhance') || schemeName.includes('sme enhance')) {
    if (userData.totalProjectCost < 10000) {
      return {
        eligible: false,
        note: 'SME Enhance requires a minimum project value of €10,000'
      };
    }
  }
  
  // Invest 2024 thresholds — simplified:
  // SME (Micro, Small, Medium): Total Project Cost must be > €50,000
  // Large: Total Project Cost must be > €500,000
  if (schemeCode.includes('invest') || schemeName.includes('invest 2024')) {
    const isSMEBusiness = isSME(userData.businessSize);
    
    if (isSMEBusiness) {
      if (userData.totalProjectCost <= 50000) {
        return {
          eligible: false,
          note: 'Invest 2024 requires a minimum project cost of €50,000 for SMEs'
        };
      }
    } else {
      // Large entities
      if (userData.totalProjectCost <= 500000) {
        return {
          eligible: false,
          note: 'Invest 2024 requires a minimum project cost of €500,000 for large enterprises'
        };
      }
    }
  }
  
  return { eligible: true, note: null };
}

/**
 * Check minimum grant amount threshold
 * SME Enhance requires calculated grant to be at least €10,000
 */
function checkMinimumGrantAmount(
  grant: GrantScheme,
  calculatedGrant: number
): { eligible: boolean; note: string | null } {
  const minGrant = grant.min_grant_amount ?? 0;
  const schemeCode = grant.scheme_code?.toLowerCase() || '';
  const schemeName = grant.scheme_name.toLowerCase();
  
  // SME Enhance has a hard minimum grant of €10,000
  if (schemeCode.includes('sme-enhance') || schemeName.includes('sme enhance')) {
    if (calculatedGrant < 10000) {
      return {
        eligible: false,
        note: 'SME Enhance requires a minimum grant amount of €10,000'
      };
    }
  }
  
  // Check against scheme's specified minimum
  if (minGrant > 0 && calculatedGrant < minGrant) {
    return {
      eligible: false,
      note: `Calculated grant (€${calculatedGrant.toLocaleString()}) is below the minimum of €${minGrant.toLocaleString()}`
    };
  }
  
  return { eligible: true, note: null };
}

// ============= Main Triage Functions =============

/**
 * Evaluate a single grant scheme against user data
 */
function evaluateGrant(grant: GrantScheme, userData: UserData): TriageResult {
  const notes: string[] = [];
  let isEligible = true;
  let exclusionReason: string | undefined;

  // ===== FILTER 0: Registration Status Check =====
  if (userData.registrationStatus === 'no') {
    // Unregistered businesses can only access schemes that explicitly allow 'not_registered'
    const allowed = grant.allowed_registration_statuses;
    if (!allowed || !allowed.includes('not_registered')) {
      isEligible = false;
      exclusionReason = 'This scheme requires a registered or in-formation business';
      notes.push(exclusionReason);
    }
  } else if (userData.registrationStatus === 'in_process') {
    const allowed = grant.allowed_registration_statuses;
    // If the grant specifies allowed statuses and doesn't include 'in_progress', exclude
    if (allowed && allowed.length > 0 && !allowed.includes('in_progress') && !allowed.includes('registered')) {
      isEligible = false;
      exclusionReason = 'This scheme requires a fully registered business';
      notes.push(exclusionReason);
    }
  }

  // ===== FILTER 0b: Sub-Activity Match =====
  if (grant.supported_sub_activities && grant.supported_sub_activities.length > 0 && userData.subActivity) {
    if (!grant.supported_sub_activities.includes(userData.subActivity)) {
      isEligible = false;
      const note = 'Your specific sub-activity is not supported by this scheme';
      exclusionReason = note;
      notes.push(note);
    }
  }

  // ===== FILTER 1b: Legal Structure Check (Hard Filter) =====
  const legalStructureCheck = checkLegalStructureEligibility(grant, userData.legalStructure);
  if (!legalStructureCheck.eligible) {
    isEligible = false;
    exclusionReason = legalStructureCheck.note || undefined;
    if (legalStructureCheck.note) notes.push(legalStructureCheck.note);
  }

  // ===== FILTER 2: De Minimis Check (Hard Filter) =====
  const deMinimisCheck = checkDeMinimisEligibility(grant, userData.hasExceededDeMinimis);
  if (!deMinimisCheck.eligible) {
    isEligible = false;
    exclusionReason = deMinimisCheck.note || undefined;
    if (deMinimisCheck.note) notes.push(deMinimisCheck.note);
  }

  // ===== FILTER 2: Minimum Investment Threshold =====
  const minInvestment = grant.min_investment_required ?? 0;
  if (userData.totalProjectCost < minInvestment) {
    isEligible = false;
    exclusionReason = `Minimum investment required: €${minInvestment.toLocaleString()}`;
    notes.push(exclusionReason);
  }

  // ===== FILTER 3: Scheme-Specific Thresholds =====
  const thresholdCheck = checkMinimumThresholds(grant, userData);
  if (!thresholdCheck.eligible) {
    isEligible = false;
    exclusionReason = thresholdCheck.note || undefined;
    if (thresholdCheck.note) notes.push(thresholdCheck.note);
  }

  // ===== FILTER 4: NACE Code Matching =====
  if (!matchesNaceCode(userData.naceCode, grant.eligible_nace_codes)) {
    isEligible = false;
    const note = 'Industry sector (NACE code) not eligible for this scheme';
    exclusionReason = note;
    notes.push(note);
  }

  // ===== FILTER 5: Business Size =====
  const sizeCheck = checkBusinessSizeEligibility(grant, userData.businessSize);
  if (!sizeCheck.eligible) {
    isEligible = false;
    exclusionReason = sizeCheck.note || undefined;
    if (sizeCheck.note) notes.push(sizeCheck.note);
  }

  // ===== FILTER 6: Startup Requirement =====
  const startupCheck = checkStartupRequirement(grant, userData.businessAge);
  if (!startupCheck.eligible) {
    isEligible = false;
    exclusionReason = startupCheck.note || undefined;
    if (startupCheck.note) notes.push(startupCheck.note);
  }

  // ===== CALCULATE: Eligible Costs & Potential Funding =====
  const { total: totalEligibleCosts, matchedCategories } = calculateEligibleCosts(
    userData.costs,
    grant.eligible_costs as EligibleCostsMap | null
  );

  // Get applicable aid intensity based on business characteristics
  const applicableAidIntensity = getApplicableAidIntensity(
    grant,
    userData.businessSize,
    userData.businessAge,
    userData.projectLocation,
    userData.primaryActivity
  );

  // Calculate potential grant amount
  let potentialGrant = totalEligibleCosts * applicableAidIntensity;

  // ===== CAP: Apply max_grant_amount =====
  if (grant.max_grant_amount && potentialGrant > grant.max_grant_amount) {
    potentialGrant = grant.max_grant_amount;
    notes.push(`Grant capped at maximum of €${grant.max_grant_amount.toLocaleString()}`);
  }

  // ===== FILTER 7: Minimum Grant Amount Check =====
  const minGrantCheck = checkMinimumGrantAmount(grant, potentialGrant);
  if (!minGrantCheck.eligible) {
    isEligible = false;
    exclusionReason = minGrantCheck.note || undefined;
    if (minGrantCheck.note) notes.push(minGrantCheck.note);
  }

  // Calculate match score (0-100)
  const matchScore = isEligible 
    ? Math.min(100, Math.round((matchedCategories.length / 10) * 50 + (applicableAidIntensity * 50)))
    : 0;

  // Add informational notes
  if (isEligible && matchedCategories.length === 0) {
    notes.push('No specific cost categories matched - verify eligible costs with scheme guidelines');
  }
  if (userData.projectLocation === 'gozo' && isEligible) {
    notes.push('Gozo location bonus applied to aid intensity');
  }

  return {
    grantId: grant.id,
    schemeName: grant.scheme_name,
    schemeCode: grant.scheme_code,
    isEligible,
    matchScore,
    totalEligibleCosts,
    applicableAidIntensity,
    estimatedMaxGrant: potentialGrant,
    matchedCostCategories: matchedCategories,
    notes,
    exclusionReason,
  };
}

/**
 * Find the BEST grant (highest funding value) for the user's project
 * Only returns a single result - the highest value eligible grant
 */
export function findBestGrant(userData: UserData, grantsDB: GrantScheme[]): TriageResult | null {
  const eligibleGrants: TriageResult[] = [];

  for (const grant of grantsDB) {
    // Skip inactive grants
    if (grant.is_active === false) continue;

    const result = evaluateGrant(grant, userData);
    
    if (result.isEligible) {
      eligibleGrants.push(result);
    }
  }

  if (eligibleGrants.length === 0) {
    return null;
  }

  // Sort by estimated max grant (descending), then by match score
  eligibleGrants.sort((a, b) => {
    if (b.estimatedMaxGrant !== a.estimatedMaxGrant) {
      return b.estimatedMaxGrant - a.estimatedMaxGrant;
    }
    return b.matchScore - a.matchScore;
  });

  // Return the best match (highest funding value)
  return eligibleGrants[0];
}

/**
 * Get all matching grants ranked by funding value
 * Includes both eligible and ineligible grants with reasons
 */
export function findAllMatchingGrants(userData: UserData, grantsDB: GrantScheme[]): TriageResult[] {
  const results: TriageResult[] = [];

  for (const grant of grantsDB) {
    if (grant.is_active === false) continue;
    
    const result = evaluateGrant(grant, userData);
    results.push(result);
  }

  // Sort by eligibility first, then by estimated grant (descending)
  results.sort((a, b) => {
    if (a.isEligible !== b.isEligible) {
      return a.isEligible ? -1 : 1;
    }
    return b.estimatedMaxGrant - a.estimatedMaxGrant;
  });

  return results;
}

/**
 * Convert ProjectData from context to UserData for the triage engine
 */
export function projectDataToUserData(
  projectData: ProjectData,
  totalCapex: number,
  totalOpex: number
): UserData {
  return {
    totalProjectCost: totalCapex + totalOpex,
    totalCapex,
    totalOpex,
    naceCode: projectData.projectActivities.primaryNace,
    primaryActivity: projectData.projectActivities.primaryActivity,
    subActivity: projectData.projectActivities.subActivity,
    businessSize: projectData.businessBasics.size,
    businessAge: projectData.businessBasics.age,
    projectLocation: projectData.projectLocation,
    legalStructure: projectData.businessBasics.legalStructure,
    costs: projectData.costs,
    hasExceededDeMinimis: projectData.businessBasics.hasExceededDeMinimis,
    registrationStatus: projectData.businessBasics.registrationStatus,
  };
}
