import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface PrimaryIndustry {
  id: string;
  name: string;
  created_at: string;
}

export function PrimaryIndustryTab() {
  const { toast } = useToast();
  const [industries, setIndustries] = useState<PrimaryIndustry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<PrimaryIndustry | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchIndustries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('primary_industries')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load primary industries. Please ensure the table exists in Supabase.',
        variant: 'destructive',
      });
    } else {
      setIndustries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);

    try {
      if (editingIndustry) {
        const { error } = await supabase
          .from('primary_industries')
          .update({ name: newName.trim() })
          .eq('id', editingIndustry.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Industry updated successfully.' });
      } else {
        const { error } = await supabase
          .from('primary_industries')
          .insert({ name: newName.trim() });
        if (error) throw error;
        toast({ title: 'Success', description: 'Industry added successfully.' });
      }
      setIsDialogOpen(false);
      fetchIndustries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save industry.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this industry?')) return;

    const { error } = await supabase
      .from('primary_industries')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete industry.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Industry deleted successfully.' });
      fetchIndustries();
    }
  };

  const openAddDialog = () => {
    setEditingIndustry(null);
    setNewName('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (industry: PrimaryIndustry) => {
    setEditingIndustry(industry);
    setNewName(industry.name);
    setIsDialogOpen(true);
  };

  const filteredIndustries = industries.filter(i => {
    const words = searchTerm.toLowerCase().split(' ').filter(Boolean);
    const target = i.name.toLowerCase();
    return words.every(word => target.includes(word));
  });

  if (loading && industries.length === 0) {
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
          <h2 className="font-display text-xl font-bold">Primary Industries</h2>
          <p className="text-sm text-muted-foreground">Manage the list of industries shown in the website dropdown.</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Industry
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="form-section">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Industry Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIndustries.map((industry) => (
              <TableRow key={industry.id}>
                <TableCell className="font-medium">{industry.name}</TableCell>
                <TableCell className="flex space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(industry)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(industry.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredIndustries.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  No industries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndustry ? 'Edit Industry' : 'Add New Industry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Industry Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Manufacturing & Production"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !newName.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingIndustry ? 'Save Changes' : 'Add Industry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
