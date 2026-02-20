import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, TrendingUp, Award, Download, CalendarDays, Factory } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  business_name: string | null;
  business_size: string;
  business_age: string;
  registration_status: string | null;
  primary_nace_code: string | null;
  primary_activity: string | null;
  sub_activity: string | null;
  project_location: string | null;
  total_project_value: number;
  total_capex: number | null;
  total_opex: number | null;
  best_grant_name: string | null;
  best_grant_amount: number;
  best_aid_intensity: number;
  email_sent: boolean;
  created_at: string;
  eligible_grants: any;
  suggested_options: any;
  project_costs: any;
  legal_structure: string | null;
}

const CHART_COLORS = [
  'hsl(213, 78%, 28%)',
  'hsl(198, 93%, 59%)',
  'hsl(213, 44%, 39%)',
  'hsl(152, 69%, 31%)',
  'hsl(25, 95%, 53%)',
  'hsl(213, 24%, 55%)',
  'hsl(215, 20%, 65%)',
  'hsl(0, 72%, 50%)',
];

type DateRange = '7' | '30' | '90' | 'all';

export function DashboardAnalytics() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [naceFilter, setNaceFilter] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLeads(data as unknown as Lead[]);
      }
      setLoading(false);
    };
    fetchLeads();
  }, []);

  const uniqueNaceCodes = useMemo(() => {
    const codes = new Set<string>();
    leads.forEach(l => { if (l.primary_nace_code) codes.add(l.primary_nace_code); });
    return Array.from(codes).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(l => new Date(l.created_at) >= cutoff);
    }

    if (naceFilter !== 'all') {
      result = result.filter(l => l.primary_nace_code === naceFilter);
    }

    return result;
  }, [leads, dateRange, naceFilter]);

  // KPIs
  const totalLeads = filteredLeads.length;
  const leadsThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return filteredLeads.filter(l => new Date(l.created_at) >= weekAgo).length;
  }, [filteredLeads]);

  const mostSuggestedGrant = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach(l => {
      if (l.best_grant_name) {
        counts[l.best_grant_name] = (counts[l.best_grant_name] || 0) + 1;
      }
    });
    let max = 0, name = '—';
    Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; name = k; } });
    return { name, count: max };
  }, [filteredLeads]);

  // Chart data: Leads by Grant Scheme
  const grantChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach(l => {
      if (l.best_grant_name) {
        counts[l.best_grant_name] = (counts[l.best_grant_name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, count, fullName: name }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // Chart data: Leads by Registration Status
  const registrationChartData = useMemo(() => {
    const counts: Record<string, number> = { 'Yes': 0, 'In Progress': 0, 'No': 0 };
    filteredLeads.forEach(l => {
      const status = l.registration_status;
      if (status === 'yes' || status === 'registered') counts['Yes']++;
      else if (status === 'in_process' || status === 'in_progress') counts['In Progress']++;
      else if (status === 'no' || status === 'not_registered') counts['No']++;
      else counts['Yes']++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // CSV export
  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as any[];
      const headers = [
        'Name', 'Email', 'Business Name', 'Business Size', 'Business Age',
        'Registration Status', 'NACE Code', 'Primary Activity', 'Sub Activity',
        'Location', 'Total Project Value', 'Best Grant', 'Best Grant Amount',
        'Best Aid Intensity', 'Email Sent', 'Date',
      ];

      const csvRows = rows.map(r => [
        r.full_name, r.email, r.business_name || '', r.business_size, r.business_age,
        r.registration_status || '', r.primary_nace_code || '', r.primary_activity || '',
        r.sub_activity || '', r.project_location || '', r.total_project_value || 0,
        r.best_grant_name || '', r.best_grant_amount || 0,
        r.best_aid_intensity ? `${(r.best_aid_intensity * 100).toFixed(0)}%` : '',
        r.email_sent ? 'Yes' : 'No',
        new Date(r.created_at).toLocaleDateString('en-MT'),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

      const csv = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
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
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="flex h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-muted-foreground" />
          <select
            value={naceFilter}
            onChange={(e) => setNaceFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Industries</option>
            {uniqueNaceCodes.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leadsThisWeek}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Suggested Grant</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{mostSuggestedGrant.name}</div>
            {mostSuggestedGrant.count > 0 && (
              <Badge variant="secondary" className="mt-1">{mostSuggestedGrant.count} leads</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads by Grant Scheme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Grant Scheme</CardTitle>
          </CardHeader>
          <CardContent>
            {grantChartData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={grantChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, _name: string, props: any) => [value, props.payload.fullName]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {grantChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leads by Registration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Registration Status</CardTitle>
          </CardHeader>
          <CardContent>
            {registrationChartData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={registrationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {registrationChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
