import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Pencil, Plus, Power } from 'lucide-react';
import { NACE_CODES, PRIMARY_ACTIVITIES, SUB_ACTIVITIES, type NaceCode, type PrimaryActivity } from '@/types/eligibility';
import type { EligibleCostsMap } from '@/lib/triageEngine';

const LEGAL_STRUCTURES = [
  { value: 'self_employed', label: 'Self-Employed (Sole Trader)' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'limited_company', label: 'Limited Liability Company (Ltd)' },
];

const REGISTRATION_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_registered', label: 'Not Registered' },
];

interface GrantScheme {
  id: string;
  scheme_name: string;
  scheme_code: string | null;
  description: string | null;
  is_active: boolean | null;
  standard_aid_intensity: number | null;
  sme_aid_intensity: number | null;
  sme_gozo_aid_intensity: number | null;
  large_entity_aid_intensity: number | null;
  large_entity_gozo_aid_intensity: number | null;
  hospitality_aid_intensity: number | null;
  startup_aid_intensity: number | null;
  max_grant_amount: number | null;
  min_investment_required: number | null;
  max_investment_allowed: number | null;
  startup_required: boolean | null;
  micro_only: boolean | null;
  sme_only: boolean | null;
  aid_framework: string | null;
  is_cash_grant: boolean | null;
  is_refundable_grant: boolean | null;
  is_tax_credit: boolean | null;
  eligible_nace_codes: string[] | null;
  eligible_activities: string[] | null;
  eligible_costs: EligibleCostsMap | null;
  allowed_legal_structures: string[] | null;
  supported_sub_activities: string[] | null;
  allowed_registration_statuses: string[] | null;
}

const EMPTY_GRANT: GrantScheme = {
  id: '',
  scheme_name: '',
  scheme_code: '',
  description: '',
  is_active: true,
  standard_aid_intensity: 0.5,
  sme_aid_intensity: null,
  sme_gozo_aid_intensity: null,
  large_entity_aid_intensity: null,
  large_entity_gozo_aid_intensity: null,
  hospitality_aid_intensity: null,
  startup_aid_intensity: null,
  max_grant_amount: null,
  min_investment_required: 0,
  max_investment_allowed: null,
  startup_required: false,
  micro_only: false,
  sme_only: false,
  aid_framework: 'de_minimis',
  is_cash_grant: true,
  is_refundable_grant: false,
  is_tax_credit: false,
  eligible_nace_codes: [],
  eligible_activities: [],
  eligible_costs: {},
  allowed_legal_structures: [],
  supported_sub_activities: [],
  allowed_registration_statuses: [],
};

const COST_CATEGORIES: { key: keyof EligibleCostsMap; label: string; group: string }[] = [
  { key: 'premises_land_building', label: 'Land & Building', group: 'Premises' },
  { key: 'premises_lease_rental', label: 'Lease & Rental', group: 'Premises' },
  { key: 'premises_construction', label: 'Construction', group: 'Premises' },
  { key: 'equipment_machinery', label: 'Equipment & Machinery', group: 'Equipment' },
  { key: 'equipment_furniture', label: 'Furniture & Fixtures', group: 'Equipment' },
  { key: 'wages_cost', label: 'Wage Costs', group: 'Wages' },
  { key: 'wages_relocation', label: 'Employee Relocation', group: 'Wages' },
  { key: 'digital_hardware_software', label: 'Hardware & Software', group: 'Digital' },
  { key: 'digital_tools', label: 'Digital Tools', group: 'Digital' },
  { key: 'vehicles', label: 'Vehicles', group: 'Vehicles' },
  { key: 'innovation_specialised_services', label: 'Specialised Services', group: 'Innovation' },
  { key: 'innovation_wages', label: 'Innovation Wages', group: 'Innovation' },
  { key: 'innovation_professional_fees', label: 'Professional Fees', group: 'Innovation' },
  { key: 'innovation_rd_expertise', label: 'R&D Expertise', group: 'Innovation' },
  { key: 'innovation_business_travel', label: 'Business Travel', group: 'Innovation' },
  { key: 'innovation_ip_protection', label: 'IP Protection', group: 'Innovation' },
  { key: 'innovation_marketing', label: 'Marketing', group: 'Innovation' },
  { key: 'innovation_certification', label: 'Certification', group: 'Innovation' },
];

export function ManageGrantsTab() {
  const { toast } = useToast();
  const [grants, setGrants] = useState<GrantScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGrant, setEditGrant] = useState<GrantScheme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchGrants = async () => {
    const { data, error } = await supabase
      .from('grant_schemes')
      .select('*')
      .order('scheme_name');

    if (error) {
      toast({ title: 'Error', description: 'Failed to load grants.', variant: 'destructive' });
    } else {
      setGrants((data || []) as unknown as GrantScheme[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGrants(); }, []);

  const handleToggleActive = async (grant: GrantScheme) => {
    const { error } = await supabase
      .from('grant_schemes')
      .update({ is_active: !grant.is_active })
      .eq('id', grant.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update grant status.', variant: 'destructive' });
    } else {
      setGrants(prev => prev.map(g => g.id === grant.id ? { ...g, is_active: !g.is_active } : g));
      toast({ title: 'Updated', description: `${grant.scheme_name} ${!grant.is_active ? 'activated' : 'deactivated'}.` });
    }
  };

  const handleEdit = (grant: GrantScheme) => {
    setEditGrant({
      ...grant,
      eligible_nace_codes: grant.eligible_nace_codes || [],
      eligible_activities: grant.eligible_activities || [],
      eligible_costs: (grant.eligible_costs as EligibleCostsMap) || {},
      allowed_legal_structures: grant.allowed_legal_structures || [],
      supported_sub_activities: grant.supported_sub_activities || [],
      allowed_registration_statuses: grant.allowed_registration_statuses || [],
    });
    setIsDialogOpen(true);
  };

  const handleNewGrant = () => {
    setEditGrant({ ...EMPTY_GRANT });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editGrant) return;
    setSaving(true);

    try {
      const { id, ...rest } = editGrant;
      const payload = { ...rest, eligible_costs: rest.eligible_costs as unknown as Record<string, unknown> };

      if (id) {
        const { error } = await supabase.from('grant_schemes').update(payload as any).eq('id', id);
        if (error) throw error;
        toast({ title: 'Saved', description: `${editGrant.scheme_name} updated.` });
      } else {
        const { error } = await supabase.from('grant_schemes').insert(payload as any);
        if (error) throw error;
        toast({ title: 'Created', description: `${editGrant.scheme_name} added.` });
      }

      setIsDialogOpen(false);
      fetchGrants();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof GrantScheme>(key: K, value: GrantScheme[K]) => {
    if (!editGrant) return;
    setEditGrant({ ...editGrant, [key]: value });
  };

  const toggleNaceCode = (code: string) => {
    if (!editGrant) return;
    const codes = editGrant.eligible_nace_codes || [];
    const updated = codes.includes(code) ? codes.filter(c => c !== code) : [...codes, code];
    updateField('eligible_nace_codes', updated);
  };

  const toggleActivity = (activity: string) => {
    if (!editGrant) return;
    const activities = editGrant.eligible_activities || [];
    const updated = activities.includes(activity) ? activities.filter(a => a !== activity) : [...activities, activity];
    updateField('eligible_activities', updated);
  };

  const toggleLegalStructure = (value: string) => {
    if (!editGrant) return;
    const current = editGrant.allowed_legal_structures || [];
    const updated = current.includes(value) ? current.filter(s => s !== value) : [...current, value];
    updateField('allowed_legal_structures', updated);
  };

  const toggleCost = (key: keyof EligibleCostsMap) => {
    if (!editGrant) return;
    const costs = editGrant.eligible_costs || {};
    updateField('eligible_costs', { ...costs, [key]: !costs[key] } as EligibleCostsMap);
  };

  const toggleSubActivity = (activity: string) => {
    if (!editGrant) return;
    const current = editGrant.supported_sub_activities || [];
    const updated = current.includes(activity) ? current.filter(a => a !== activity) : [...current, activity];
    updateField('supported_sub_activities', updated);
  };

  const toggleRegistrationStatus = (value: string) => {
    if (!editGrant) return;
    const current = editGrant.allowed_registration_statuses || [];
    const updated = current.includes(value) ? current.filter(s => s !== value) : [...current, value];
    updateField('allowed_registration_statuses', updated);
  };

  const selectAllNace = () => {
    if (!editGrant) return;
    const allCodes = Object.keys(NACE_CODES);
    const allSelected = editGrant.eligible_nace_codes?.length === allCodes.length;
    updateField('eligible_nace_codes', allSelected ? [] : allCodes);
  };

  const selectAllActivities = () => {
    if (!editGrant) return;
    const allKeys = Object.keys(PRIMARY_ACTIVITIES);
    const allSelected = editGrant.eligible_activities?.length === allKeys.length;
    updateField('eligible_activities', allSelected ? [] : allKeys);
  };

  const selectAllCosts = () => {
    if (!editGrant) return;
    const currentCosts = editGrant.eligible_costs || {};
    const allEnabled = COST_CATEGORIES.every(c => currentCosts[c.key]);
    const newCosts: EligibleCostsMap = {};
    COST_CATEGORIES.forEach(c => { newCosts[c.key] = !allEnabled; });
    updateField('eligible_costs', newCosts);
  };

  const formatPercent = (val: number | null) => val == null ? '—' : `${(val * 100).toFixed(0)}%`;
  const formatCurrency = (val: number | null) => val == null ? '—' : `€${val.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Grant Schemes</h2>
          <p className="text-sm text-muted-foreground">Manage aid intensities, eligible industries, costs, and active status.</p>
        </div>
        <Button onClick={handleNewGrant} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Grant
        </Button>
      </div>

      <div className="form-section overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scheme</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Aid %</TableHead>
              <TableHead>Max Grant</TableHead>
              <TableHead>NACE</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.map((grant) => (
              <TableRow key={grant.id} className={!grant.is_active ? 'opacity-50' : ''}>
                <TableCell className="font-medium">{grant.scheme_name}</TableCell>
                <TableCell className="text-muted-foreground">{grant.scheme_code || '—'}</TableCell>
                <TableCell>{formatPercent(grant.standard_aid_intensity)}</TableCell>
                <TableCell>{formatCurrency(grant.max_grant_amount)}</TableCell>
                <TableCell>
                  {grant.eligible_nace_codes?.length
                    ? <Badge variant="secondary">{grant.eligible_nace_codes.length} codes</Badge>
                    : <span className="text-muted-foreground text-xs">All</span>}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(grant)}
                    className={`gap-1 ${grant.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    <Power className="h-4 w-4" />
                    {grant.is_active ? 'Active' : 'Inactive'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(grant)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editGrant?.id ? 'Edit Grant Scheme' : 'Add New Grant Scheme'}</DialogTitle>
          </DialogHeader>

          {editGrant && (
            <Accordion type="multiple" defaultValue={['basic', 'aid', 'limits', 'flags', 'legal_structure', 'registration', 'nace', 'activities', 'sub_activities', 'costs']} className="space-y-2">
              {/* Basic Info */}
              <AccordionItem value="basic">
                <AccordionTrigger className="font-display font-semibold">Basic Information</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Scheme Name *</Label>
                      <Input value={editGrant.scheme_name} onChange={(e) => updateField('scheme_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Scheme Code</Label>
                      <Input value={editGrant.scheme_code || ''} onChange={(e) => updateField('scheme_code', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={editGrant.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={3} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Aid Framework</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editGrant.aid_framework || ''} onChange={(e) => updateField('aid_framework', e.target.value || null)}>
                        <option value="">None</option>
                        <option value="de_minimis">De Minimis</option>
                        <option value="gber">GBER</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grant Type</Label>
                      <div className="flex flex-wrap gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={editGrant.is_cash_grant ?? false} onCheckedChange={(c) => updateField('is_cash_grant', !!c)} />
                          Cash Grant
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={editGrant.is_tax_credit ?? false} onCheckedChange={(c) => updateField('is_tax_credit', !!c)} />
                          Tax Credit
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={editGrant.is_refundable_grant ?? false} onCheckedChange={(c) => updateField('is_refundable_grant', !!c)} />
                          Refundable
                        </label>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Aid Intensities */}
              <AccordionItem value="aid">
                <AccordionTrigger className="font-display font-semibold">Aid Intensities</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {([
                      ['standard_aid_intensity', 'Standard (%)'],
                      ['sme_aid_intensity', 'SME (%)'],
                      ['sme_gozo_aid_intensity', 'SME Gozo (%)'],
                      ['large_entity_aid_intensity', 'Large Entity (%)'],
                      ['large_entity_gozo_aid_intensity', 'Large Gozo (%)'],
                      ['hospitality_aid_intensity', 'Hospitality (%)'],
                      ['startup_aid_intensity', 'Startup (%)'],
                    ] as [keyof GrantScheme, string][]).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <Label>{label}</Label>
                        <Input type="number" step="0.01" min="0" max="1"
                          value={(editGrant[key] as number) ?? ''}
                          onChange={(e) => updateField(key, parseFloat(e.target.value) || null)}
                          placeholder="e.g. 0.50" />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Investment Limits */}
              <AccordionItem value="limits">
                <AccordionTrigger className="font-display font-semibold">Investment Limits</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Max Grant (€)</Label>
                      <Input type="number" value={editGrant.max_grant_amount ?? ''} onChange={(e) => updateField('max_grant_amount', parseFloat(e.target.value) || null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Investment (€)</Label>
                      <Input type="number" value={editGrant.min_investment_required ?? ''} onChange={(e) => updateField('min_investment_required', parseFloat(e.target.value) || null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Investment (€)</Label>
                      <Input type="number" value={editGrant.max_investment_allowed ?? ''} onChange={(e) => updateField('max_investment_allowed', parseFloat(e.target.value) || null)} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Eligibility Flags */}
              <AccordionItem value="flags">
                <AccordionTrigger className="font-display font-semibold">Eligibility Flags</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    {([
                      ['is_active', 'Active'],
                      ['startup_required', 'Startup Required'],
                      ['micro_only', 'Micro Only'],
                      ['sme_only', 'SME Only'],
                    ] as [keyof GrantScheme, string][]).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <Label>{label}</Label>
                        <Switch checked={(editGrant[key] as boolean) ?? false} onCheckedChange={(c) => updateField(key, c)} />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Legal Structure Eligibility */}
              <AccordionItem value="legal_structure">
                <AccordionTrigger className="font-display font-semibold">
                  Legal Structure Eligibility
                  {editGrant.allowed_legal_structures && editGrant.allowed_legal_structures.length > 0 ? (
                    <Badge variant="secondary" className="ml-2">{editGrant.allowed_legal_structures.length} allowed</Badge>
                  ) : (
                    <span className="ml-2 text-xs text-muted-foreground">All structures (none = all allowed)</span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select which legal structures are eligible for this grant. Leave all unchecked to allow all structures.
                  </p>
                  <div className="flex flex-col gap-2 border rounded-lg p-3">
                    {LEGAL_STRUCTURES.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                        <Checkbox
                          checked={editGrant.allowed_legal_structures?.includes(value) ?? false}
                          onCheckedChange={() => toggleLegalStructure(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Registration Requirements */}
              <AccordionItem value="registration">
                <AccordionTrigger className="font-display font-semibold">
                  Registration Requirements
                  {editGrant.allowed_registration_statuses && editGrant.allowed_registration_statuses.length > 0 ? (
                    <Badge variant="secondary" className="ml-2">{editGrant.allowed_registration_statuses.length} selected</Badge>
                  ) : (
                    <span className="ml-2 text-xs text-muted-foreground">All statuses (none = all allowed)</span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select which registration statuses are eligible. Leave all unchecked to allow all statuses.
                  </p>
                  <div className="flex flex-col gap-2 border rounded-lg p-3">
                    {REGISTRATION_STATUS_OPTIONS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                        <Checkbox
                          checked={editGrant.allowed_registration_statuses?.includes(value) ?? false}
                          onCheckedChange={() => toggleRegistrationStatus(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Eligible NACE Codes */}
              <AccordionItem value="nace">
                <AccordionTrigger className="font-display font-semibold">
                  Eligible Industries (NACE)
                  {editGrant.eligible_nace_codes?.length ? (
                    <Badge variant="secondary" className="ml-2">{editGrant.eligible_nace_codes.length} selected</Badge>
                  ) : (
                    <span className="ml-2 text-xs text-muted-foreground">All (none selected = all eligible)</span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllNace}>
                      {editGrant.eligible_nace_codes?.length === Object.keys(NACE_CODES).length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-xs text-muted-foreground">Leave empty = all industries eligible</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {(Object.entries(NACE_CODES) as [NaceCode, string][]).map(([code, description]) => (
                      <label key={code} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                        <Checkbox
                          checked={editGrant.eligible_nace_codes?.includes(code) ?? false}
                          onCheckedChange={() => toggleNaceCode(code)}
                          className="mt-0.5"
                        />
                        <span><strong>{code}</strong> – {description}</span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Eligible Activities */}
              <AccordionItem value="activities">
                <AccordionTrigger className="font-display font-semibold">
                  Eligible Activities
                  {editGrant.eligible_activities?.length ? (
                    <Badge variant="secondary" className="ml-2">{editGrant.eligible_activities.length} selected</Badge>
                  ) : (
                    <span className="ml-2 text-xs text-muted-foreground">All</span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllActivities}>
                      {editGrant.eligible_activities?.length === Object.keys(PRIMARY_ACTIVITIES).length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-xs text-muted-foreground">Leave empty = all activities eligible</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 border rounded-lg p-3">
                    {(Object.entries(PRIMARY_ACTIVITIES) as [PrimaryActivity, string][]).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                        <Checkbox
                          checked={editGrant.eligible_activities?.includes(key) ?? false}
                          onCheckedChange={() => toggleActivity(key)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Supported Sub-Activities */}
              <AccordionItem value="sub_activities">
                <AccordionTrigger className="font-display font-semibold">
                  Supported Sub-Activities
                  {editGrant.supported_sub_activities && editGrant.supported_sub_activities.length > 0 ? (
                    <Badge variant="secondary" className="ml-2">{editGrant.supported_sub_activities.length} selected</Badge>
                  ) : (
                    <span className="ml-2 text-xs text-muted-foreground">All (none = all sub-activities eligible)</span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select specific sub-activities this grant supports. Leave all unchecked to allow all sub-activities.
                  </p>
                  <div className="space-y-4 max-h-80 overflow-y-auto border rounded-lg p-3">
                    {(Object.entries(SUB_ACTIVITIES) as [PrimaryActivity, string[]][]).map(([primaryKey, subs]) => (
                      <div key={primaryKey}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {PRIMARY_ACTIVITIES[primaryKey]}
                        </p>
                        <div className="grid gap-1 md:grid-cols-2">
                          {subs.map((sub) => (
                            <label key={sub} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                              <Checkbox
                                checked={editGrant.supported_sub_activities?.includes(sub) ?? false}
                                onCheckedChange={() => toggleSubActivity(sub)}
                              />
                              {sub}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Eligible Costs */}
              <AccordionItem value="costs">
                <AccordionTrigger className="font-display font-semibold">
                  Eligible Cost Categories
                  <Badge variant="secondary" className="ml-2">
                    {COST_CATEGORIES.filter(c => editGrant.eligible_costs?.[c.key]).length} / {COST_CATEGORIES.length}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <Button variant="outline" size="sm" onClick={selectAllCosts}>
                    {COST_CATEGORIES.every(c => editGrant.eligible_costs?.[c.key]) ? 'Deselect All' : 'Select All'}
                  </Button>
                  <div className="space-y-4">
                    {['Premises', 'Equipment', 'Wages', 'Digital', 'Vehicles', 'Innovation'].map((group) => (
                      <div key={group}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {COST_CATEGORIES.filter(c => c.group === group).map((cat) => (
                            <label key={cat.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                              <Checkbox
                                checked={editGrant.eligible_costs?.[cat.key] ?? false}
                                onCheckedChange={() => toggleCost(cat.key)}
                              />
                              {cat.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {editGrant && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editGrant.id ? 'Save Changes' : 'Create Grant'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
