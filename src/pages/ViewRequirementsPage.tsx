import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Plus, Pencil, Trash2, Search, ArrowUpDown, FileText, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Requirement {
  id: number;
  country_id: number;
  crop_id: number;
  full_requirements: string;
  publication_number: string | null;
  publication_year: number | null;
  pdf_file_url: string | null;
  notes: string | null;
  created_at: string;
  countries: {name_ar: string;} | null;
  crops: {name_ar: string;} | null;
}

interface Country {
  id: number;
  name_ar: string;
}

interface Crop {
  id: number;
  name_ar: string;
}

interface ShortRequirement {
  id: number;
  name: string;
}

const ViewRequirementsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [countries, setCountries] = useState<Country[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [shortRequirements, setShortRequirements] = useState<ShortRequirement[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [editForm, setEditForm] = useState({
    country_id: '',
    crop_id: '',
    full_requirements: '',
    publication_number: '',
    publication_year: '',
    pdf_file_url: '',
    notes: ''
  });
  const [selectedShortReqs, setSelectedShortReqs] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [requirements, searchTerm, filterCountry, filterCrop, sortField, sortDirection]);

  const fetchData = async () => {
    try {
      const [reqsRes, countriesRes, cropsRes, shortReqsRes] = await Promise.all([
      supabase.
      from('export_requirements').
      select(`
            *,
            countries(name_ar),
            crops(name_ar)
          `).
      order('created_at', { ascending: false }),
      supabase.from('countries').select('id, name_ar').order('name_ar'),
      supabase.from('crops').select('id, name_ar').order('name_ar'),
      supabase.from('short_requirements').select('*').order('name')]
      );

      if (reqsRes.error) throw reqsRes.error;
      if (countriesRes.error) throw countriesRes.error;
      if (cropsRes.error) throw cropsRes.error;
      if (shortReqsRes.error) throw shortReqsRes.error;

      setRequirements(reqsRes.data || []);
      setCountries(countriesRes.data || []);
      setCrops(cropsRes.data || []);
      setShortRequirements(shortReqsRes.data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تحميل البيانات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...requirements];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((req) =>
      req.full_requirements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.countries?.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.crops?.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.publication_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (filterCountry !== 'all') {
      filtered = filtered.filter((req) => req.country_id === parseInt(filterCountry));
    }

    // Crop filter
    if (filterCrop !== 'all') {
      filtered = filtered.filter((req) => req.crop_id === parseInt(filterCrop));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof Requirement];
      let bVal: any = b[sortField as keyof Requirement];

      if (sortField === 'countries') {
        aVal = a.countries?.name_ar || '';
        bVal = b.countries?.name_ar || '';
      } else if (sortField === 'crops') {
        aVal = a.crops?.name_ar || '';
        bVal = b.crops?.name_ar || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRequirements(filtered);
  };

  const handleEdit = async (req: Requirement) => {
    setSelectedReq(req);
    setEditForm({
      country_id: req.country_id.toString(),
      crop_id: req.crop_id.toString(),
      full_requirements: req.full_requirements || '',
      publication_number: req.publication_number || '',
      publication_year: req.publication_year?.toString() || '',
      pdf_file_url: req.pdf_file_url || '',
      notes: req.notes || ''
    });

    // Fetch linked short requirements
    const { data, error } = await supabase.
    from('requirement_short_requirements').
    select('short_requirement_id').
    eq('requirement_id', req.id);

    if (!error && data) {
      setSelectedShortReqs(data.map((d) => d.short_requirement_id));
    } else {
      setSelectedShortReqs([]);
    }

    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReq) return;

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.
      from('export_requirements').
      update({
        country_id: parseInt(editForm.country_id),
        crop_id: parseInt(editForm.crop_id),
        full_requirements: editForm.full_requirements,
        publication_number: editForm.publication_number || null,
        publication_year: editForm.publication_year ? parseInt(editForm.publication_year) : null,
        pdf_file_url: editForm.pdf_file_url || null,
        notes: editForm.notes || null
      }).
      eq('id', selectedReq.id);

      if (updateError) throw updateError;

      // Update short requirements links
      // First delete existing
      await supabase.
      from('requirement_short_requirements').
      delete().
      eq('requirement_id', selectedReq.id);

      // Insert new ones
      if (selectedShortReqs.length > 0) {
        const links = selectedShortReqs.map((shortReqId) => ({
          requirement_id: selectedReq.id,
          short_requirement_id: shortReqId
        }));

        const { error: linkError } = await supabase.
        from('requirement_short_requirements').
        insert(links);

        if (linkError) throw linkError;
      }

      toast({
        title: 'نجح',
        description: 'تم تحديث الاشتراط بنجاح'
      });

      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الاشتراط',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReq) return;

    try {
      // Delete linked short requirements first
      await supabase.
      from('requirement_short_requirements').
      delete().
      eq('requirement_id', selectedReq.id);

      // Delete the requirement
      const { error } = await supabase.
      from('export_requirements').
      delete().
      eq('id', selectedReq.id);

      if (error) throw error;

      toast({
        title: 'نجح',
        description: 'تم حذف الاشتراط بنجاح'
      });

      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف الاشتراط',
        variant: 'destructive'
      });
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleShortReq = (id: number) => {
    setSelectedShortReqs((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">عرض التسجيلات</h1>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/add-requirement')} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة اشتراط
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10" />

            </div>
            
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger>
                <SelectValue placeholder="الدولة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدول</SelectItem>
                {countries.map((country) =>
                <SelectItem key={country.id} value={country.id.toString()}>
                    {country.name_ar}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger>
                <SelectValue placeholder="المحصول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المحاصيل</SelectItem>
                {crops.map((crop) =>
                <SelectItem key={crop.id} value={crop.id.toString()}>
                    {crop.name_ar}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterCountry('all');
                setFilterCrop('all');
              }}
              className="gap-2">

              <Filter className="w-4 h-4" />
              مسح الفلاتر
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => toggleSort('countries')} className="gap-1 p-0 h-auto">
                        الدولة
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => toggleSort('crops')} className="gap-1 p-0 h-auto">
                        المحصول
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">تفاصيل الاشتراطات</TableHead>
                    <TableHead className="text-right">رقم النشرة</TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => toggleSort('publication_year')} className="gap-1 p-0 h-auto">
                        السنة
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">ملف PDF</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.length === 0 ?
                  <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        لا توجد تسجيلات
                      </TableCell>
                    </TableRow> :

                  filteredRequirements.map((req) =>
                  <TableRow key={req.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{req.countries?.name_ar || '-'}</TableCell>
                        <TableCell>{req.crops?.name_ar || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={req.full_requirements}>
                          {req.full_requirements?.substring(0, 100)}
                          {(req.full_requirements?.length || 0) > 100 && '...'}
                        </TableCell>
                        <TableCell>{req.publication_number || '-'}</TableCell>
                        <TableCell>{req.publication_year || '-'}</TableCell>
                        <TableCell>
                          {req.pdf_file_url ?
                      <a
                        href={req.pdf_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1">

                              <FileText className="w-4 h-4" />
                              عرض
                            </a> :

                      '-'
                      }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(req)}
                          className="gap-1">

                              <Pencil className="w-3 h-3" />
                              تعديل
                            </Button>
                            <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedReq(req);
                            setDeleteDialogOpen(true);
                          }}
                          className="gap-1">

                              <Trash2 className="w-3 h-3" />
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                  )
                  }
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            عدد النتائج: {filteredRequirements.length} من أصل {requirements.length}
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الاشتراط</DialogTitle>
            <DialogDescription>قم بتعديل بيانات الاشتراط</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الدولة</Label>
              <Select value={editForm.country_id} onValueChange={(val) => setEditForm({ ...editForm, country_id: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) =>
                  <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name_ar}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المحصول</Label>
              <Select value={editForm.crop_id} onValueChange={(val) => setEditForm({ ...editForm, crop_id: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) =>
                  <SelectItem key={crop.id} value={crop.id.toString()}>
                      {crop.name_ar}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تفاصيل الاشتراطات</Label>
              <Textarea
                value={editForm.full_requirements}
                onChange={(e) => setEditForm({ ...editForm, full_requirements: e.target.value })}
                rows={5} />

            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم النشرة</Label>
                <Input
                  value={editForm.publication_number}
                  onChange={(e) => setEditForm({ ...editForm, publication_number: e.target.value })} />

              </div>

              <div className="space-y-2">
                <Label>سنة النشر</Label>
                <Input
                  type="number"
                  value={editForm.publication_year}
                  onChange={(e) => setEditForm({ ...editForm, publication_year: e.target.value })} />

              </div>
            </div>

            <div className="space-y-2">
              <Label>رابط ملف PDF</Label>
              <Input
                type="url"
                value={editForm.pdf_file_url}
                onChange={(e) => setEditForm({ ...editForm, pdf_file_url: e.target.value })} />

            </div>

            <div className="space-y-2">
              <Label>الاشتراطات المختصرة</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {shortRequirements.map((shortReq) =>
                <div key={shortReq.id} className="flex items-center gap-2">
                    <Checkbox
                    id={`edit-short-${shortReq.id}`}
                    checked={selectedShortReqs.includes(shortReq.id)}
                    onCheckedChange={() => toggleShortReq(shortReq.id)} />

                    <Label htmlFor={`edit-short-${shortReq.id}`} className="cursor-pointer font-normal">
                      {shortReq.name}
                    </Label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3} />

            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ?
              <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </> :

              'حفظ التعديلات'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الاشتراط؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};

export default ViewRequirementsPage;