import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter: max 3 requests per email per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, maxRequests = 3, windowMs = 3600_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= maxRequests) return true;
  entry.count++;
  return false;
}

interface EligibleGrant {
  id: string;
  name: string;
  maxGrant: number;
  aidIntensity: number;
  matchScore: number;
  eligibleCosts: string[];
}

interface CostItem {
  amount: number;
}

interface ReportRequest {
  fullName: string;
  email: string;
  businessName: string;
  businessSize: string;
  businessAge: string;
  employeeCount: number;
  annualTurnover: number;
  registrationStatus: string;
  hasExceededDeMinimis: boolean;
  projectLocation: string;
  primaryNace: string | null;
  primaryActivity: string | null;
  subActivity: string | null;
  costs: Record<string, Record<string, CostItem>>;
  totalProjectValue: number;
  totalCapex: number;
  totalOpex: number;
  eligibleGrants: EligibleGrant[];
}

// BD Logo as inline SVG string for email embedding
const BD_LOGO_SVG = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 387 82" height="50" width="240"><g><path fill="#0F437E" d="m85.36.003-.217.005v40.711h40.948C126.082 18.234 107.852.003 85.359.003"/><path fill="#365F91" d="M40.785 0C18.295 0 .06 18.227.054 40.719h40.944V.006z"/><path fill="#C6D0DE" d="M40.95 40.72H0v.013C0 63.23 18.239 81.465 40.734 81.465l.216-.005z"/><path fill="#C6D0DE" d="M85.144 40.72H81.9v.016c0 14.418-7.504 27.08-18.806 34.316a40.54 40.54 0 0 0 21.927 6.413l.143-.002h-.005l-.016-.003z"/><path fill="#7991B3" d="M126.088 40.72H85.144v40.74l.024.003h-.003l.192.002c22.495 0 40.731-18.235 40.731-40.729z"/><path fill="#365F91" d="M85.022 0C62.527 0 44.296 18.227 44.287 40.719h40.857V.008l.092-.002z"/><path fill="#0359A0" d="M85.144.009v40.71h.093V.007z"/><path fill="#7991B3" d="M81.901 40.72H40.95v40.74l.22.005a40.53 40.53 0 0 0 21.924-6.413c11.302-7.236 18.807-19.898 18.807-34.316z"/><path fill="#0F437E" d="m41.17.003-.22.005v40.711h40.951C81.89 18.234 63.66.003 41.17.003"/><path fill="#0F437E" d="M144.028 36.27q.476-.002.786-.029c.212-.022.371-.078.493-.177.117-.09.205-.245.252-.451q.076-.312.076-.877V17.239c0-.38-.025-.669-.076-.88q-.072-.316-.266-.453a1 1 0 0 0-.509-.173 8 8 0 0 0-.784-.032v-.311h6.987q1.31 0 2.587.236c.855.155 1.61.438 2.276.843.66.407 1.205.969 1.621 1.674.419.714.624 1.613.624 2.691q-.001 2.073-1.04 3.136c-.693.707-1.665 1.214-2.916 1.5.655.13 1.273.328 1.858.61a5.6 5.6 0 0 1 1.533 1.082q.653.656 1.04 1.55c.258.593.388 1.27.388 2.02q.002 1.655-.641 2.767a5.3 5.3 0 0 1-1.68 1.804 7.1 7.1 0 0 1-2.363.984q-1.323.295-2.663.297h-7.583zm4.164-11.457h2.857q.918 0 1.753-.204a3.9 3.9 0 0 0 1.459-.678 3.25 3.25 0 0 0 .977-1.222q.358-.754.357-1.857-.001-1.127-.427-1.9a3.5 3.5 0 0 0-1.119-1.224 4.6 4.6 0 0 0-1.573-.647 9 9 0 0 0-1.814-.186c-.161 0-.357-.011-.596-.019a6 6 0 0 0-.714.019 3.5 3.5 0 0 0-.668.124.96.96 0 0 0-.492.315zm0 9.549c.098.21.247.363.443.47q.297.155.652.207.356.042.711.042h.622q1.01 0 2.016-.185a5.1 5.1 0 0 0 1.807-.688 3.85 3.85 0 0 0 1.29-1.327c.325-.55.488-1.249.488-2.107 0-.978-.2-1.753-.604-2.338a4.1 4.1 0 0 0-1.542-1.34 6.8 6.8 0 0 0-2.104-.624 17 17 0 0 0-2.268-.159h-1.511z"/><text x="143" y="60" font-family="Arial,sans-serif" font-size="11" fill="#0F437E" font-weight="600">BUSINESS DIAGNOSTICS</text></g></svg>`);


function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const COST_LABELS: Record<string, Record<string, string>> = {
  premises: {
    landAndBuilding: "Land & Building",
    leaseAndRental: "Lease & Rental",
    construction: "Construction",
  },
  equipment: {
    equipmentMachinery: "Equipment & Machinery",
    furnitureFixtures: "Furniture & Fixtures",
  },
  wages: {
    wageCost: "Wage Costs",
    relocationEmployees: "Employee Relocation",
  },
  digital: {
    hardwareSoftware: "Hardware & Software",
    digitalTools: "Digital Tools",
  },
  vehicles: {
    vehicles: "Vehicles",
  },
  innovation: {
    specialisedServices: "Specialised Services",
    innovativeWages: "Innovation Wages",
    professionalFees: "Professional Fees",
    rdExpertise: "R&D Expertise",
    businessTravel: "Business Travel",
    ipProtection: "IP Protection",
    marketing: "Marketing",
    certification: "Certification",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  premises: "Premises",
  equipment: "Equipment",
  wages: "Wages & Staff",
  digital: "Digital & Technology",
  vehicles: "Vehicles",
  innovation: "Innovation & Advisory",
};

const PRIMARY_ACTIVITY_LABELS: Record<string, string> = {
  manufacturing: "Manufacturing & Production",
  technology: "Technology & Digital Solutions",
  research: "Research, Innovation & IP",
  life_sciences: "Life Sciences & Advanced Technologies",
  sustainability: "Sustainability & Environmental Projects",
  industrial: "Industrial & Technical Services",
  creative: "Culture, Creative & Audio-Visual",
  business: "Business Services & Advisory",
  skills: "Skills & Workforce Development",
  retail: "Retail and wholesale",
  construction: "Construction and Finishing",
  hospitality: "Hotels and guesthouse",
};

function generateEmailHTML(data: ReportRequest): string {
  // Build costs breakdown rows
  const costsRows: string[] = [];
  for (const [catId, fields] of Object.entries(data.costs)) {
    const catLabel = CATEGORY_LABELS[catId] || catId;
    const fieldLabels = COST_LABELS[catId] || {};
    let catHasValues = false;
    const fieldRows: string[] = [];

    for (const [fieldKey, item] of Object.entries(fields as Record<string, CostItem>)) {
      if (item && item.amount > 0) {
        catHasValues = true;
        const label = fieldLabels[fieldKey] || fieldKey;
        fieldRows.push(`
          <tr>
            <td style="padding: 6px 16px 6px 32px; color: #374151; font-size: 14px;">${label}</td>
            <td style="padding: 6px 16px; text-align: right; font-weight: 500;">${formatCurrency(item.amount)}</td>
          </tr>`);
      }
    }

    if (catHasValues) {
      costsRows.push(`
        <tr style="background: #f0f4fa;">
          <td colspan="2" style="padding: 10px 16px; font-weight: 700; color: #0F437E; font-size: 14px;">${catLabel}</td>
        </tr>`);
      costsRows.push(...fieldRows);
    }
  }

  // Build per-grant detailed breakdown with covered costs (anonymized as Option 1, 2, etc.)
  function buildGrantDetailRows(): string {
    if (data.eligibleGrants.length === 0) return `
      <div style="text-align: center; padding: 24px; background: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; color: #92400e;">No matching grants found based on your project details. Consider adjusting your project costs or activities.</p>
      </div>`;

    // Sort by estimatedCoverage descending and take top 3
    const ranked = data.eligibleGrants
      .map((grant) => {
        const estimatedCoverage = Math.min(
          data.totalProjectValue * grant.aidIntensity,
          grant.maxGrant
        );
        return { grant, estimatedCoverage };
      })
      .sort((a, b) => b.estimatedCoverage - a.estimatedCoverage)
      .slice(0, 3);

    return ranked.map(({ grant, estimatedCoverage }, i) => {
      // Determine which of the user's entered costs this grant covers
      const coveredCostLabels: string[] = [];
      if (grant.eligibleCosts && grant.eligibleCosts.length > 0) {
        for (const costKey of grant.eligibleCosts) {
          if (CATEGORY_LABELS[costKey]) {
            const catFields = data.costs[costKey] as Record<string, CostItem> | undefined;
            if (catFields && Object.values(catFields).some(f => f && f.amount > 0)) {
              coveredCostLabels.push(CATEGORY_LABELS[costKey]);
            }
          } else {
            for (const [catId, fields] of Object.entries(data.costs)) {
              const catFields = fields as Record<string, CostItem>;
              if (catFields[costKey] && catFields[costKey].amount > 0) {
                const label = (COST_LABELS[catId] || {})[costKey] || costKey;
                if (!coveredCostLabels.includes(label)) coveredCostLabels.push(label);
              }
            }
          }
        }
      }

      // Fallback: show all user cost categories if no specific eligible costs
      if (coveredCostLabels.length === 0) {
        for (const [catId, fields] of Object.entries(data.costs)) {
          const catFields = fields as Record<string, CostItem>;
          if (Object.values(catFields).some(f => f && f.amount > 0)) {
            coveredCostLabels.push(CATEGORY_LABELS[catId] || catId);
          }
        }
      }

      const coveredLine = coveredCostLabels.length > 0
        ? coveredCostLabels.join(", ")
        : "General project costs";

      return `
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1dae8; border-radius: 10px; margin-bottom: 16px; background: #f8fafc;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px;">
              <!-- Option header row -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 600; color: #365F91; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Option ${i + 1}</div>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                    <div style="font-size: 22px; font-weight: 800; color: #0F437E; line-height: 1.1;">${formatCurrency(estimatedCoverage)}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Estimated Coverage</div>
                  </td>
                </tr>
              </table>
              <!-- Details row -->
              <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <tr>
                  <td style="padding-top: 12px; width: 100px; vertical-align: top;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Aid Intensity</div>
                    <div style="font-size: 16px; font-weight: 700; color: #365F91;">${(grant.aidIntensity * 100).toFixed(0)}%</div>
                  </td>
                  <td style="padding-top: 12px; vertical-align: top;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Covers</div>
                    <div style="font-size: 13px; color: #374151; line-height: 1.5;">${coveredLine}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    }).join("");
  }

  const registrationLabel = data.registrationStatus === "yes" ? "Yes" : data.registrationStatus === "in_process" ? "In Process" : "No";
  const sizeLabel = data.businessSize.charAt(0).toUpperCase() + data.businessSize.slice(1);
  const logoDataUri = `data:image/svg+xml,${BD_LOGO_SVG}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #eef1f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0F437E 0%, #365F91 100%); border-radius: 12px 12px 0 0; padding: 28px 32px; text-align: center;">
      <!-- Logo -->
      <div style="margin-bottom: 20px;">
        <img src="${logoDataUri}" alt="Business Diagnostics" style="height: 44px; width: auto; display: inline-block;" />
      </div>
      <h1 style="color: #ffffff; margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">Malta Grants Eligibility Report</h1>
      <p style="color: rgba(198, 208, 222, 0.9); margin: 0; font-size: 13px; letter-spacing: 0.02em;">Powered by — Business Diagnostics</p>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(15,67,126,0.10);">
      
      <!-- Business Details -->
      <h2 style="color: #0F437E; margin: 0 0 16px; font-size: 17px; font-weight: 700; border-left: 3px solid #365F91; padding-left: 10px;">Business Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Business Name</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.businessName || "Not specified"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Size Classification</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${sizeLabel} Enterprise</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Number of Employees</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.employeeCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Annual Turnover</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.annualTurnover > 0 ? formatCurrency(data.annualTurnover) : "Not specified"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Business Age</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.businessAge === "startup" ? "Startup (< 5 years)" : "Established (5+ years)"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Registered in Malta</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${registrationLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Project Location</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; text-transform: capitalize;">${data.projectLocation}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Exceeded De Minimis (€300k)</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.hasExceededDeMinimis ? "Yes" : "No"}</td>
        </tr>
      </table>

      <!-- Industry & Activity -->
      <h2 style="color: #0F437E; margin: 0 0 16px; font-size: 17px; font-weight: 700; border-left: 3px solid #365F91; padding-left: 10px;">Industry & Activity</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">NACE Code</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.primaryNace || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Primary Activity</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.primaryActivity ? (PRIMARY_ACTIVITY_LABELS[data.primaryActivity] || data.primaryActivity) : "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Sub-Activity</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.subActivity || "N/A"}</td>
        </tr>
      </table>

      <!-- Costs Breakdown -->
      <h2 style="color: #0F437E; margin: 0 0 16px; font-size: 17px; font-weight: 700; border-left: 3px solid #365F91; padding-left: 10px;">Project Costs Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 14px;">
        ${costsRows.join("")}
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border-top: 2px solid #0F437E;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Total CAPEX (One-time)</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700;">${formatCurrency(data.totalCapex)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Total OPEX (Annual)</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700;">${formatCurrency(data.totalOpex)}</td>
        </tr>
        <tr style="background: #e8eef7;">
          <td style="padding: 12px 8px; color: #0F437E; font-weight: 700; font-size: 15px;">Total Investment</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 800; color: #0F437E; font-size: 17px;">${formatCurrency(data.totalProjectValue)}</td>
        </tr>
      </table>

      <!-- Funding Coverage Summary -->
      <div style="margin-top: 8px;"></div>
      <h2 style="color: #0F437E; margin: 0 0 8px; font-size: 17px; font-weight: 700; border-left: 3px solid #365F91; padding-left: 10px;">Funding Coverage Summary</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">Based on your project, the top ${Math.min(data.eligibleGrants.length, 3)} funding option${Math.min(data.eligibleGrants.length, 3) !== 1 ? "s" : ""} for your business:</p>
      
      ${buildGrantDetailRows()}

      <!-- Disclaimer -->
      <div style="margin-top: 32px; padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; border-radius: 0 0 8px 8px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 12px; line-height: 1.7;">
          Results shown are indicative only and do not guarantee eligibility or funding approval. Full eligibility depends on additional criteria assessed by the relevant managing authority. Business Diagnostic Ltd accepts no liability for decisions taken based on these results.
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.6;">
          Generated on ${new Date().toLocaleDateString("en-MT")} by Business Diagnostics. Business Diagnostic Ltd is not affiliated with Malta Enterprise, Business Enhance, or any managing authority.
        </p>
        <p style="margin: 10px 0 0;"><a href="https://grant-buddy-malta.lovable.app" style="color: #365F91; font-size: 12px; text-decoration: underline;">View Full Disclaimer</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}


const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse and validate body
    let data: ReportRequest;
    try {
      data = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Input validation
    if (!data.email || !data.fullName) {
      return new Response(JSON.stringify({ error: "Missing required fields: email and fullName" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isValidEmail(data.email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (typeof data.fullName !== "string" || data.fullName.trim().length < 2 || data.fullName.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid full name" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limiting by email (3 requests per hour)
    const rateLimitKey = `email:${data.email.toLowerCase()}`;
    if (isRateLimited(rateLimitKey)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html = generateEmailHTML(data);

    const bestGrant = data.eligibleGrants.length > 0
      ? data.eligibleGrants.reduce((best, g) => g.maxGrant > best.maxGrant ? g : best, data.eligibleGrants[0])
      : null;

    const estimatedCoverage = bestGrant
      ? Math.min(data.totalProjectValue * bestGrant.aidIntensity, bestGrant.maxGrant)
      : 0;

    const { error: emailError } = await resend.emails.send({
      from: "Grants Advisor <onboarding@resend.dev>",
      to: [data.email],
      subject: `Your Grant Eligibility Report - ${estimatedCoverage > 0 ? formatCurrency(estimatedCoverage) + " Potential Funding" : "Results"}`,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw emailError;
    }

    // Update the lead record to mark email as sent
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseClient = createClient(supabaseUrl, supabaseKey);

      await supabaseClient
        .from("leads")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("email", data.email)
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (dbError) {
      console.log("Could not update lead email status:", dbError);
    }

    console.log("Email sent successfully to:", data.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-eligibility-report:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
