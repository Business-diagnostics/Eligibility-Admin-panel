import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, CheckCircle2, Clock } from 'lucide-react';

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
  email: string;
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
}

export function ViewLeadsTab() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Error', description: 'Failed to load leads.', variant: 'destructive' });
      } else {
        setLeads((data || []).map((d: any) => ({
          ...d,
          suggested_options: Array.isArray(d.suggested_options) ? d.suggested_options : null,
        })));
      }
      setLoading(false);
    };

    fetchLeads();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          {leads.length} total lead{leads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="form-section text-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No Leads Yet</h3>
          <p className="text-muted-foreground">Leads will appear here when users submit the eligibility form.</p>
        </div>
      ) : (
        <div className="form-section overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Project Value</TableHead>
                <TableHead>Suggested Funding Options</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell>
                    <div>
                      <span className="capitalize">{lead.business_size}</span>
                      {lead.business_name && (
                        <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                      )}
                      {lead.registration_status && (
                        <p className="text-xs text-muted-foreground capitalize">{lead.registration_status === 'in_process' ? 'In Progress' : lead.registration_status}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{lead.project_location}</TableCell>
                  <TableCell>
                    <div>
                      {lead.primary_activity && <span className="text-sm capitalize">{lead.primary_activity.replace(/_/g, ' ')}</span>}
                      {lead.sub_activity && <p className="text-xs text-muted-foreground">{lead.sub_activity}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(lead.total_project_value)}</TableCell>
                  <TableCell>
                    {lead.suggested_options && lead.suggested_options.length > 0 ? (
                      <div className="space-y-1.5 min-w-[200px]">
                        {lead.suggested_options.map((opt, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-primary">{opt.option}:</span>{' '}
                            <span className="text-muted-foreground">{opt.grantName}</span>
                            <br />
                            <span className="text-foreground">{(opt.aidIntensity * 100).toFixed(0)}% — {formatCurrency(opt.estimatedCoverage)}</span>
                            {opt.eligibleCosts?.length > 0 && (
                              <span className="text-muted-foreground"> · {opt.eligibleCosts.join(', ')}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.email_sent ? (
                      <Badge variant="outline" className="badge-eligible gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(lead.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
