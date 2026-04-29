import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  LogOut,
  Euro,
  Settings,
  Users,
  BarChart3,
  Building2,
} from "lucide-react";
import { ManageGrantsTab } from "@/components/admin/ManageGrantsTab";
import { ViewLeadsTab } from "@/components/admin/ViewLeadsTab";
import { CoreExpenseMappingTab } from "@/components/admin/CoreExpenseMappingTab";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { PrimaryIndustryTab } from "@/components/admin/PrimaryIndustryTab";
import type { Session } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/admin/login");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
      if (!session) {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (checkingAuth || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg">
              <img src="/favicon.svg" alt="Admin Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-black">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto w-full max-w-4xl justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="grants" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              Manage Grants
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              View Leads
            </TabsTrigger>
            <TabsTrigger value="expense-rules" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              Expense Rules
            </TabsTrigger>
            <TabsTrigger value="industries" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="h-4 w-4" />
              Primary Industry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <DashboardAnalytics />
          </TabsContent>

          <TabsContent value="grants">
            <ManageGrantsTab />
          </TabsContent>

          <TabsContent value="leads">
            <ViewLeadsTab />
          </TabsContent>

          <TabsContent value="expense-rules">
            <CoreExpenseMappingTab />
          </TabsContent>

          <TabsContent value="industries">
            <PrimaryIndustryTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
