import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  Briefcase,
} from "lucide-react";
import {
  PRIMARY_ACTIVITIES,
  SUB_ACTIVITIES,
  type PrimaryActivity,
} from "@/types/eligibility";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "../ui/dialog";

// This matches the COST_CATEGORIES in ManageGrantsTab.tsx but for selection
const COST_CATEGORIES = [
  {
    key: "premises_land_building",
    label: "Land & Building",
    group: "Premises",
  },
  { key: "premises_lease_rental", label: "Lease & Rental", group: "Premises" },
  { key: "premises_construction", label: "Construction", group: "Premises" },
  {
    key: "equipment_machinery",
    label: "Equipment & Machinery",
    group: "Equipment",
  },
  {
    key: "equipment_furniture",
    label: "Furniture & Fixtures",
    group: "Equipment",
  },
  { key: "wages_cost", label: "Wage Costs", group: "Wages" },
  { key: "wages_relocation", label: "Employee Relocation", group: "Wages" },
  {
    key: "digital_hardware_software",
    label: "Hardware & Software",
    group: "Digital",
  },
  { key: "digital_tools", label: "Digital Tools", group: "Digital" },
  { key: "vehicles", label: "Vehicles", group: "Vehicles" },
  {
    key: "innovation_specialised_services",
    label: "Specialised Services",
    group: "Innovation",
  },
  { key: "innovation_wages", label: "Innovation Wages", group: "Innovation" },
  {
    key: "innovation_professional_fees",
    label: "Professional Fees",
    group: "Innovation",
  },
  {
    key: "innovation_rd_expertise",
    label: "R&D Expertise",
    group: "Innovation",
  },
  {
    key: "innovation_business_travel",
    label: "Business Travel",
    group: "Innovation",
  },
  {
    key: "innovation_ip_protection",
    label: "IP Protection",
    group: "Innovation",
  },
  { key: "innovation_marketing", label: "Marketing", group: "Innovation" },
  {
    key: "innovation_certification",
    label: "Certification",
    group: "Innovation",
  },
];

interface CoreExpenseRule {
  id: string;
  primary_activity: string;
  sub_activity: string | null;
  required_cost_category: string; // Stores comma-separated values
  min_value: number;
}

export function CoreExpenseMappingTab() {
  const { toast } = useToast();
  const [rules, setRules] = useState<CoreExpenseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newRule, setNewRule] = useState<Partial<CoreExpenseRule>>({
    primary_activity: "",
    sub_activity: "",
    required_cost_category: "",
    min_value: 1,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_core_expense_rules")
      .select("*")
      .order("primary_activity");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load rules. Ensure table exists.",
        variant: "destructive",
      });
    } else {
      setRules(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async () => {
    const costCategoryString = selectedCategories.join(",");

    if (
      !newRule.primary_activity ||
      !newRule.sub_activity ||
      selectedCategories.length === 0
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please select activity, sub-activity and at least one cost category.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const ruleToSave = {
      ...newRule,
      required_cost_category: costCategoryString,
    };

    const { error } = await supabase
      .from("activity_core_expense_rules")
      .insert([ruleToSave]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Rule created successfully." });
      setIsDialogOpen(false);
      setNewRule({
        primary_activity: "",
        sub_activity: "",
        required_cost_category: "",
        min_value: 1,
      });
      setSelectedCategories([]);
      fetchRules();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("activity_core_expense_rules")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Rule removed." });
      fetchRules();
    }
  };

  const getLabelForActivity = (activity: string) => {
    return PRIMARY_ACTIVITIES[activity as PrimaryActivity] || activity;
  };

  const getLabelForCost = (cost: string) => {
    if (!cost) return "-";
    const keys = cost.split(",");
    if (keys.length > 1) {
      return (
        <div className="flex flex-wrap gap-1">
          {keys.map((k, i) => (
            <Badge key={k} variant="secondary" className="text-[10px]">
              {COST_CATEGORIES.find((c) => c.key === k)?.label || k}
              {i < keys.length - 1 && (
                <span className="ml-1 text-muted-foreground">OR</span>
              )}
            </Badge>
          ))}
        </div>
      );
    }
    return COST_CATEGORIES.find((c) => c.key === cost)?.label || cost;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">
            Core Expense Mapping
          </h2>
          <p className="text-sm text-muted-foreground">
            Define mandatory cost categories for specific business activities.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="form-section overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Primary Activity</TableHead>
              <TableHead>Sub Activity</TableHead>
              <TableHead>Required Categories (OR)</TableHead>
              <TableHead>Min Threshold</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No rules defined yet.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-sm">
                    {getLabelForActivity(rule.primary_activity)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rule.sub_activity || "-"}
                  </TableCell>
                  <TableCell>
                    {getLabelForCost(rule.required_cost_category)}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    €{rule.min_value.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rule.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Primary Activity
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newRule.primary_activity}
                  onChange={(e) => {
                    const activity = e.target.value;
                    setNewRule({
                      ...newRule,
                      primary_activity: activity,
                      sub_activity: "",
                    });
                  }}
                >
                  <option value="">Select Activity...</option>
                  {Object.entries(PRIMARY_ACTIVITIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  Sub Project Activity
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newRule.sub_activity || ""}
                  disabled={!newRule.primary_activity}
                  onChange={(e) =>
                    setNewRule({ ...newRule, sub_activity: e.target.value })
                  }
                >
                  <option value="">Select Sub-Activity...</option>
                  {newRule.primary_activity &&
                    SUB_ACTIVITIES[
                      newRule.primary_activity as PrimaryActivity
                    ]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center justify-between">
                Required Cost Categories (Choose 1 or more for OR condition)
                <Badge variant="outline" className="font-normal text-[10px]">
                  {selectedCategories.length} selected
                </Badge>
              </Label>
              <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/20">
                <div className="grid grid-cols-1 gap-3">
                  {COST_CATEGORIES.map((cat) => (
                    <div
                      key={cat.key}
                      className="flex items-center space-x-3 group"
                    >
                      <Checkbox
                        id={`cat-${cat.key}`}
                        checked={selectedCategories.includes(cat.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([
                              ...selectedCategories,
                              cat.key,
                            ]);
                          } else {
                            setSelectedCategories(
                              selectedCategories.filter((id) => id !== cat.key),
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`cat-${cat.key}`}
                        className="text-sm font-normal cursor-pointer group-hover:text-primary transition-colors"
                      >
                        <span className="text-muted-foreground mr-1">
                          [{cat.group}]
                        </span>
                        {cat.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <Label>Minimum Threshold (€)</Label>
              <Input
                type="number"
                value={newRule.min_value}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    min_value: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
