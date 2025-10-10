import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, Search, History, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExportRequirement {
  id: number;
  user_id: string | null;
  country_id: number | null;
  crop_id: number | null;
  summary_id: number | null;
  full_requirements: string | null;
  publication_number: string | null;
  publication_year: number | null;
  pdf_file_url: string | null;
  notes: string | null;
  created_at: string | null;
}

interface Country {
  id: number;
  name: string;
}

interface Crop {
  id: number;
  name: string;
}

interface ShortRequirement {
  id: number;
  name: string;
}

interface EditLog {
  id: number;
  edit_date: string | null;
  edit_type: string | null;
  notes: string | null;
  user_id: string | null;
}

export default function EditRequirementsPage() {
  const [requirements, setRequirements] = useState<ExportRequirement[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [shortRequirements, setShortRequirements] = useState<ShortRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<ExportRequirement | null>(null);
  const [editLogs, setEditLogs] = useState<EditLog[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    country_id: '',
    crop_id: '',
    full_requirements: '',
    publication_number: '',
    publication_year: '',
    pdf_file_url: '',
    notes: '',
    selectedShortRequirements: [] as number[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load requirements
      const { data: reqData, error: reqError } = await supabase
        .from('export_requirements')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      setRequirements(reqData || []);

      // Load countries
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');

      if (countryError) throw countryError;
      setCountries(countryData || []);

      // Load crops
      const { data: cropData, error: cropError } = await supabase
        .from('crops')
        .select('id, name')
        .order('name');

      if (cropError) throw cropError;
      setCrops(cropData || []);

      // Load short requirements
      const { data: shortReqData, error: shortReqError } = await supabase
        .from('short_requirements')
        .select('id, name')
        .order('name');

      if (shortReqError) throw shortReqError;
      setShortRequirements(shortReqData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = async (requirement: ExportRequirement) => {
    setSelectedRequirement(requirement);
    setIsAddMode(false);

    // Load linked short requirements
    const { data: linkedData } = await supabase
      .from('requirement_short_requirements')
      .select('short_requirement_id')
      .eq('requirement_id', requirement.id);

    const linkedIds = linkedData?.map(item => item.short_requirement_id) || [];

    setFormData({
      country_id: requirement.country_id?.toString() || '',
      crop_id: requirement.crop_id?.toString() || '',
      full_requirements: requirement.full_requirements || '',
      publication_number: requirement.publication_number || '',
      publication_year: requirement.publication_year?.toString() || '',
      pdf_file_url: requirement.pdf_file_url || '',
      notes: requirement.notes || '',
      selectedShortRequirements: linkedIds
    });

    setEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedRequirement(null);
    setIsAddMode(true);
    setFormData({
      country_id: '',
      crop_id: '',
      full_requirements: '',
      publication_number: '',
      publication_year: '',
      pdf_file_url: '',
      notes: '',
      selectedShortRequirements: []
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const requirementData = {
        user_id: user.id,
        country_id: formData.country_id ? parseInt(formData.country_id) : null,
        crop_id: formData.crop_id ? parseInt(formData.crop_id) : null,
        full_requirements: formData.full_requirements,
        publication_number: formData.publication_number,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        pdf_file_url: formData.pdf_file_url,
        notes: formData.notes
      };

      let requirementId: number;

      if (isAddMode) {
        // Add new requirement
        const { data: newReq, error: insertError } = await supabase
          .from('export_requirements')
          .insert([requirementData])
          .select()
          .single();

        if (insertError) throw insertError;
        requirementId = newReq.id;

        // Log creation
        await supabase
          .from('edit_logs')
          .insert([{
            requirement_id: requirementId,
            user_id: user.id,
            edit_date: new Date().toISOString(),
            edit_type: 'CREATE',
            notes: 'Requirement created'
          }]);

      } else if (selectedRequirement) {
        // Update existing requirement
        const { error: updateError } = await supabase
          .from('export_requirements')
          .update(requirementData)
          .eq('id', selectedRequirement.id);

        if (updateError) throw updateError;
        requirementId = selectedRequirement.id;

        // Log update
        await supabase
          .from('edit_logs')
          .insert([{
            requirement_id: requirementId,
            user_id: user.id,
            edit_date: new Date().toISOString(),
            edit_type: 'UPDATE',
            notes: 'Requirement updated'
          }]);
      } else {
        throw new Error('Invalid operation');
      }

      // Update short requirements links
      // Delete existing links
      await supabase
        .from('requirement_short_requirements')
        .delete()
        .eq('requirement_id', requirementId);

      // Insert new links
      if (formData.selectedShortRequirements.length > 0) {
        const links = formData.selectedShortRequirements.map(shortReqId => ({
          requirement_id: requirementId,
          short_requirement_id: shortReqId
        }));

        await supabase
          .from('requirement_short_requirements')
          .insert(links);
      }

      toast({
        title: 'Success',
        description: isAddMode ? 'Requirement added successfully' : 'Requirement updated successfully'
      });

      setEditDialogOpen(false);
      loadData();

    } catch (error: any) {
      console.error('Error saving requirement:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save requirement',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRequirement) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Log deletion
      await supabase
        .from('edit_logs')
        .insert([{
          requirement_id: selectedRequirement.id,
          user_id: user.id,
          edit_date: new Date().toISOString(),
          edit_type: 'DELETE',
          notes: 'Requirement deleted'
        }]);

      // Delete linked short requirements
      await supabase
        .from('requirement_short_requirements')
        .delete()
        .eq('requirement_id', selectedRequirement.id);

      // Delete requirement
      const { error } = await supabase
        .from('export_requirements')
        .delete()
        .eq('id', selectedRequirement.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Requirement deleted successfully'
      });

      setDeleteDialogOpen(false);
      loadData();

    } catch (error: any) {
      console.error('Error deleting requirement:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete requirement',
        variant: 'destructive'
      });
    }
  };

  const showHistory = async (requirement: ExportRequirement) => {
    setSelectedRequirement(requirement);

    try {
      const { data, error } = await supabase
        .from('edit_logs')
        .select('*')
        .eq('requirement_id', requirement.id)
        .order('edit_date', { ascending: false });

      if (error) throw error;
      setEditLogs(data || []);
      setHistoryDialogOpen(true);

    } catch (error: any) {
      console.error('Error loading history:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load history',
        variant: 'destructive'
      });
    }
  };

  const filteredRequirements = requirements.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    return (
      req.full_requirements?.toLowerCase().includes(searchLower) ||
      req.publication_number?.toLowerCase().includes(searchLower) ||
      req.notes?.toLowerCase().includes(searchLower)
    );
  });

  const getCountryName = (id: number | null) => {
    if (!id) return '-';
    const country = countries.find(c => c.id === id);
    return country?.name || '-';
  };

  const getCropName = (id: number | null) => {
    if (!id) return '-';
    const crop = crops.find(c => c.id === id);
    return crop?.name || '-';
  };

  const toggleShortRequirement = (id: number) => {
    setFormData(prev => ({
      ...prev,
      selectedShortRequirements: prev.selectedShortRequirements.includes(id)
        ? prev.selectedShortRequirements.filter(reqId => reqId !== id)
        : [...prev.selectedShortRequirements, id]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Requirements</h1>
              <p className="text-gray-600">Manage export requirements</p>
            </div>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Requirement
            </Button>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Publication #</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequirements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No requirements found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequirements.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.id}</TableCell>
                    <TableCell>{getCountryName(req.country_id)}</TableCell>
                    <TableCell>{getCropName(req.crop_id)}</TableCell>
                    <TableCell>{req.publication_number || '-'}</TableCell>
                    <TableCell>{req.publication_year || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {req.full_requirements || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showHistory(req)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(req)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequirement(req);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit/Add Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isAddMode ? 'Add New Requirement' : 'Edit Requirement'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Select
                    value={formData.country_id}
                    onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Crop</Label>
                  <Select
                    value={formData.crop_id}
                    onValueChange={(value) => setFormData({ ...formData, crop_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map(crop => (
                        <SelectItem key={crop.id} value={crop.id.toString()}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Publication Number</Label>
                  <Input
                    value={formData.publication_number}
                    onChange={(e) => setFormData({ ...formData, publication_number: e.target.value })}
                    placeholder="Enter publication number"
                  />
                </div>

                <div>
                  <Label>Publication Year</Label>
                  <Input
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    placeholder="Enter year"
                  />
                </div>
              </div>

              <div>
                <Label>Full Requirements</Label>
                <Textarea
                  value={formData.full_requirements}
                  onChange={(e) => setFormData({ ...formData, full_requirements: e.target.value })}
                  placeholder="Enter full requirements"
                  rows={5}
                />
              </div>

              <div>
                <Label>PDF File URL</Label>
                <Input
                  value={formData.pdf_file_url}
                  onChange={(e) => setFormData({ ...formData, pdf_file_url: e.target.value })}
                  placeholder="Enter PDF URL"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows={3}
                />
              </div>

              <div>
                <Label className="mb-3 block">Short Requirements</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                  {shortRequirements.map(shortReq => (
                    <div key={shortReq.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`short-${shortReq.id}`}
                        checked={formData.selectedShortRequirements.includes(shortReq.id)}
                        onCheckedChange={() => toggleShortRequirement(shortReq.id)}
                      />
                      <label
                        htmlFor={`short-${shortReq.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {shortReq.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {isAddMode ? 'Add' : 'Save'} Requirement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the requirement
                and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit History</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {editLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No edit history available</p>
              ) : (
                <div className="space-y-2">
                  {editLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{log.edit_type}</span>
                        <span className="text-xs text-gray-500">
                          {log.edit_date ? new Date(log.edit_date).toLocaleString() : '-'}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-600">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
