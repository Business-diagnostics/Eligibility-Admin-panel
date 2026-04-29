import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle2, Clock, Eye, ShieldCheck, Briefcase, MapPin, Layers, Coins, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRIMARY_ACTIVITIES, LEGAL_STRUCTURE_LABELS } from "@/types/eligibility";

const CATEGORY_LABELS: Record<string, string> = {
  premises: "Premises",
  equipment: "Equipment",
  wages: "Wages & Staff",
  digital: "Digital & Technology",
  vehicles: "Vehicles",
  innovation: "Innovation & Advisory",
};

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

interface SuggestedOption {
  option: string;
  grantName: string;
  aidIntensity: number;
  estimatedCoverage: number;
  eligibleCosts: string[];
}

interface Lead {
  id: string;
  full_name: string;
  email: string; // Report delivery email
  business_email?: string | null; // Primary email from step 1
  business_name: string | null;
  business_size: string;
  business_age: string;
  project_location: string;
  primary_nace_code: string | null;
  primary_activity: string | null;
  sub_activity: string | null;
  registration_status: string | null;
  total_project_value: number;
  best_grant_name: string | null;
  best_grant_amount: number;
  best_aid_intensity: number;
  email_sent: boolean;
  created_at: string;
  suggested_options: SuggestedOption[] | null;
  eligible_grants?: any[] | null;
  legal_structure: string | null;
  employee_count: number;
  total_opex: number;
  project_costs: Record<string, any> | null;
  privacy_accepted?: boolean;
  promotional_accepted?: boolean;
  compliance_timestamp?: string;
}

export function ViewLeadsTab() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load leads.",
          variant: "destructive",
        });
      } else {
        setLeads(
          (data || []).map((d: any) => ({
            ...d,
            suggested_options: Array.isArray(d.suggested_options)
              ? d.suggested_options
              : null,
          })),
        );
      }
      setLoading(false);
    };

    fetchLeads();
  }, []);
  
  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setLeads(prev => prev.filter(l => l.id !== id));
      toast({
        title: "Lead Deleted",
        description: "The lead has been permanently removed.",
      });
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the lead.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-MT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-MT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Leads</h2>
        <p className="text-sm text-muted-foreground">
          {leads.length} total lead{leads.length !== 1 ? "s" : ""}
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="form-section text-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">
            No Leads Yet
          </h3>
          <p className="text-muted-foreground">
            Leads will appear here when users submit the eligibility form.
          </p>
        </div>
      ) : (
        <div className="form-section overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted At</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Business Age</TableHead>
                <TableHead>Project Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewDetails(lead)}
                >
                  <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {lead.full_name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.email}
                  </TableCell>
                  <TableCell>
                    {lead.business_name || "-"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {lead.business_age}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {formatCurrency(lead.total_project_value)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                    {lead.email_sent ? (
                      <Badge className="bg-green-600 text-white hover:bg-green-600 text-[10px] border-none">
                        Report Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600">
                        Pending
                      </Badge>
                    )}
                    {lead.privacy_accepted && (
                      <Badge className="text-[10px] bg-blue-600 text-white hover:bg-blue-600 border-none">GDPR ✓</Badge>
                    )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(lead);
                      }}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the lead for {lead.full_name} from the database. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteLead(lead.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Lead Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle className="flex items-center gap-2 text-2xl border-b pb-4">
              <Mail className="h-6 w-6 text-primary" />
              Lead Details: {selectedLead?.full_name}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <ScrollArea className="flex-1 pr-4 mt-2 overflow-y-auto">
              <div className="space-y-8 pb-4">
                {/* Contact & Basics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Contact & Compliance
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Business Email (Primary)</p>
                        <p className="font-medium truncate">{selectedLead.business_email || "Not captured"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Report Delivery Email</p>
                        <p className="font-medium truncate">{selectedLead.email}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Privacy Accepted</p>
                          <p className="text-sm">{selectedLead.privacy_accepted ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Promotional Material</p>
                          <p className="text-sm">{selectedLead.promotional_accepted ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Business Profile
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Business Entity</p>
                        <p className="font-medium">
                          {selectedLead.business_name || "Unspecified"}
                          <Badge variant="outline" className="ml-2 capitalize">
                            {selectedLead.business_size}
                          </Badge>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Legal Structure</p>
                          <p className="text-sm">{LEGAL_STRUCTURE_LABELS[selectedLead.legal_structure as keyof typeof LEGAL_STRUCTURE_LABELS] || selectedLead.legal_structure}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Business Age</p>
                          <p className="text-sm capitalize">{selectedLead.business_age}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Employees</p>
                          <p className="text-sm">{selectedLead.employee_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Registration Status</p>
                          <p className="text-sm capitalize">{selectedLead.registration_status || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Project Location & Industry
                    </h3>
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-semibold capitalize">{selectedLead.project_location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">NACE Code</p>
                          <p className="text-sm font-semibold">{selectedLead.primary_nace_code || "None"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Primary Activity</p>
                        <p className="text-sm font-medium">{selectedLead.primary_activity ? (PRIMARY_ACTIVITIES[selectedLead.primary_activity as keyof typeof PRIMARY_ACTIVITIES] || selectedLead.primary_activity) : "Not Specified"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sub Activity Scope</p>
                        <p className="text-sm">{selectedLead.sub_activity || "No specific sub-activity selected"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Investment Summary
                    </h3>
                    <div className="p-4 border rounded-lg space-y-3 bg-accent/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total CAPEX</p>
                          <p className="text-base font-bold">{formatCurrency(selectedLead.total_project_value - (selectedLead as any).total_opex || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total OPEX</p>
                          <p className="text-base font-bold">{formatCurrency((selectedLead as any).total_opex || 0)}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-accent/20">
                        <p className="text-xs text-muted-foreground">Grand Total Investment</p>
                        <p className="text-xl font-black text-accent">{formatCurrency(selectedLead.total_project_value)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Costs Breakdown */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Full Project Costs Breakdown
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-[11px] h-8">Category</TableHead>
                          <TableHead className="text-[11px] h-8">Expense Item</TableHead>
                          <TableHead className="text-right text-[11px] h-8">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(selectedLead as any).project_costs && Object.entries((selectedLead as any).project_costs as Record<string, any>).map(([catKey, fields]) => {
                          const categoryHasValue = Object.values(fields).some((f: any) => f?.amount > 0);
                          if (!categoryHasValue) return null;

                          return (
                            <React.Fragment key={catKey}>
                              <TableRow className="bg-muted/20">
                                <TableCell colSpan={3} className="py-1.5 font-bold text-xs text-primary">
                                  {CATEGORY_LABELS[catKey] || catKey}
                                </TableCell>
                              </TableRow>
                              {Object.entries(fields as Record<string, any>).map(([fieldKey, item]) => {
                                if (!item || item.amount <= 0) return null;
                                return (
                                  <TableRow key={fieldKey} className="hover:bg-transparent">
                                    <TableCell className="py-1 px-4"></TableCell>
                                    <TableCell className="py-1 text-sm text-muted-foreground">
                                      {COST_LABELS[catKey]?.[fieldKey] || fieldKey}
                                    </TableCell>
                                    <TableCell className="py-1 text-right text-sm font-mono">
                                      {formatCurrency(item.amount)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Suggested Grants Results */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Eligibility Result (Suggested Options)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selectedLead.suggested_options && selectedLead.suggested_options.map((opt, idx) => {
                      let displayName = opt.grantName;
                      if (selectedLead.eligible_grants && Array.isArray(selectedLead.eligible_grants)) {
                        const found = selectedLead.eligible_grants.find((g: any) => g.id === (opt as any).id || g.name === opt.grantName);
                        if (found && found.full_name) displayName = found.full_name;
                      }
                      
                      return (
                        <div key={idx} className="bg-success/5 border border-success/20 p-4 rounded-xl flex flex-col items-center text-center">
                          <p className="text-[10px] font-black uppercase text-success/70 tracking-tighter mb-1">{opt.option}</p>
                          <p className="text-sm font-bold leading-tight mb-2 h-10 overflow-hidden line-clamp-2">{displayName}</p>
                          <div className="mt-auto w-full pt-3 border-t border-success/10">
                            <p className="text-lg font-black text-success">
                              {formatCurrency(opt.estimatedCoverage)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Estimated Coverage</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!selectedLead.suggested_options || selectedLead.suggested_options.length === 0) && (
                      <div className="col-span-full py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground italic">No suitable grants identified for this lead.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
