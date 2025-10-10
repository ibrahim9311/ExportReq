import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, FileText, Filter, X, Download, Calendar, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious } from
'@/components/ui/pagination';

interface Country {
  id: number;
  name_ar: string;
  name_en: string | null;
}

interface Crop {
  id: number;
  name_ar: string;
  name_en: string | null;
}

interface Requirement {
  id: number;
  country_id: number | null;
  crop_id: number | null;
  full_requirements: string | null;
  publication_number: string | null;
  publication_year: number | null;
  pdf_file_url: string | null;
  created_at: string | null;
  notes: string | null;
  countries?: Country;
  crops?: Crop;
}

interface Summary {
  id: number;
  summary_text: string | null;
  notes: string | null;
}

const ITEMS_PER_PAGE = 12;

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<'requirements' | 'summaries'>('requirements');
  const [keyword, setKeyword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [countries, setCountries] = useState<Country[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Requirement | Summary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Load countries and crops on mount
  useEffect(() => {
    loadFilters();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchType, selectedCountry, selectedCrop, keyword]);

  // Perform search when filters or page changes
  useEffect(() => {
    performSearch();
  }, [searchType, selectedCountry, selectedCrop, keyword, currentPage]);

  const loadFilters = async () => {
    try {
      const [countriesRes, cropsRes] = await Promise.all([
      supabase.from('countries').select('*').order('name_ar'),
      supabase.from('crops').select('*').order('name_ar')]
      );

      if (countriesRes.error) throw countriesRes.error;
      if (cropsRes.error) throw cropsRes.error;

      setCountries(countriesRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تحميل خيارات البحث',
        variant: 'destructive'
      });
    } finally {
      setLoadingFilters(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      if (searchType === 'requirements') {
        await searchRequirements();
      } else {
        await searchSummaries();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل البحث',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const searchRequirements = async () => {
    let query = supabase.
    from('export_requirements').
    select('*, countries(*), crops(*)', { count: 'exact' });

    // Apply filters
    if (selectedCountry !== 'all') {
      query = query.eq('country_id', parseInt(selectedCountry));
    }
    if (selectedCrop !== 'all') {
      query = query.eq('crop_id', parseInt(selectedCrop));
    }
    if (keyword.trim()) {
      query = query.or(
        `full_requirements.ilike.%${keyword}%,publication_number.ilike.%${keyword}%,notes.ilike.%${keyword}%`
      );
    }

    // Apply pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    setRequirements(data || []);
    setTotalItems(count || 0);
  };

  const searchSummaries = async () => {
    let query = supabase.
    from('summaries').
    select('*', { count: 'exact' });

    if (keyword.trim()) {
      query = query.or(`summary_text.ilike.%${keyword}%,notes.ilike.%${keyword}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    setSummaries(data || []);
    setTotalItems(count || 0);
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedCountry('all');
    setSelectedCrop('all');
  };

  const openDetails = (item: Requirement | Summary) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />

          </PaginationItem>
          {pages.map((page) =>
          <PaginationItem key={page}>
              <PaginationLink
              onClick={() => setCurrentPage(page)}
              isActive={currentPage === page}
              className="cursor-pointer">

                {page}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />

          </PaginationItem>
        </PaginationContent>
      </Pagination>);

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Back to Main Menu Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-colors"
          >
            <Home className="w-4 h-4" />
            العودة إلى القائمة الرئيسية
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-2">البحث في الاشتراطات</h1>
          <p className="text-gray-600">ابحث عن الاشتراطات والملخصات حسب الدولة والمحصول</p>
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              فلاتر البحث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Keyword Search */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-2 block">البحث بالكلمات المفتاحية</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="ابحث هنا..."
                    className="pr-10" />

                </div>
              </div>

              {/* Country Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">الدولة</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loadingFilters}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الدول" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الدول</SelectItem>
                    {countries.map((country) =>
                    <SelectItem key={country.id} value={country.id.toString()}>
                        {country.name_ar}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Crop Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">المحصول</label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop} disabled={loadingFilters}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المحاصيل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المحاصيل</SelectItem>
                    {crops.map((crop) =>
                    <SelectItem key={crop.id} value={crop.id.toString()}>
                        {crop.name_ar}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(keyword || selectedCountry !== 'all' || selectedCrop !== 'all') &&
            <div className="mt-4">
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </Button>
              </div>
            }
          </CardContent>
        </Card>

        {/* Search Type Tabs */}
        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="requirements">الاشتراطات</TabsTrigger>
            <TabsTrigger value="summaries">الملخصات</TabsTrigger>
          </TabsList>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="mt-6">
            {loading ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) =>
              <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
              )}
              </div> :
            requirements.length === 0 ?
            <Alert>
                <AlertDescription>لا توجد نتائج مطابقة لعملية البحث</AlertDescription>
              </Alert> :

            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requirements.map((req) =>
                <Card
                  key={req.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openDetails(req)}>

                      <CardHeader>
                        <CardTitle className="text-lg flex items-start gap-2">
                          <FileText className="w-5 h-5 mt-1 flex-shrink-0 text-indigo-600" />
                          <span className="line-clamp-2">
                            {req.countries?.name_ar || 'غير محدد'} - {req.crops?.name_ar || 'غير محدد'}
                          </span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {req.publication_number &&
                      <span className="text-xs">رقم النشر: {req.publication_number}</span>
                      }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {req.full_requirements || 'لا يوجد وصف'}
                        </p>
                        {req.publication_year &&
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {req.publication_year}
                          </div>
                    }
                      </CardContent>
                    </Card>
                )}
                </div>
                {renderPagination()}
              </>
            }
          </TabsContent>

          {/* Summaries Tab */}
          <TabsContent value="summaries" className="mt-6">
            {loading ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) =>
              <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
              )}
              </div> :
            summaries.length === 0 ?
            <Alert>
                <AlertDescription>لا توجد نتائج مطابقة لعملية البحث</AlertDescription>
              </Alert> :

            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summaries.map((summary) =>
                <Card
                  key={summary.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openDetails(summary)}>

                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          ملخص #{summary.id}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-4">
                          {summary.summary_text || 'لا يوجد نص'}
                        </p>
                      </CardContent>
                    </Card>
                )}
                </div>
                {renderPagination()}
              </>
            }
          </TabsContent>
        </Tabs>

        {/* Results Count */}
        <div className="text-center text-sm text-gray-600 mt-4">
          عدد النتائج: {totalItems}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedItem && 'countries' in selectedItem ?
              `${selectedItem.countries?.name_ar || 'غير محدد'} - ${selectedItem.crops?.name_ar || 'غير محدد'}` :
              `ملخص #${selectedItem?.id}`}
            </DialogTitle>
            <DialogDescription>تفاصيل كاملة</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedItem && 'countries' in selectedItem ?
            // Requirement Details
            <>
                {selectedItem.publication_number &&
              <div>
                    <h3 className="font-semibold mb-1">رقم النشر</h3>
                    <p className="text-gray-600">{selectedItem.publication_number}</p>
                  </div>
              }
                {selectedItem.publication_year &&
              <div>
                    <h3 className="font-semibold mb-1">سنة النشر</h3>
                    <p className="text-gray-600">{selectedItem.publication_year}</p>
                  </div>
              }
                {selectedItem.full_requirements &&
              <div>
                    <h3 className="font-semibold mb-1">الاشتراطات الكاملة</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedItem.full_requirements}</p>
                  </div>
              }
                {selectedItem.notes &&
              <div>
                    <h3 className="font-semibold mb-1">ملاحظات</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedItem.notes}</p>
                  </div>
              }
                {selectedItem.pdf_file_url &&
              <div>
                    <Button
                  onClick={() => window.open(selectedItem.pdf_file_url!, '_blank')}
                  className="gap-2">

                      <Download className="w-4 h-4" />
                      تحميل ملف PDF
                    </Button>
                  </div>
              }
                {selectedItem.created_at &&
              <div className="text-sm text-gray-500 pt-4 border-t">
                    تاريخ الإضافة: {new Date(selectedItem.created_at).toLocaleDateString('ar-SA')}
                  </div>
              }
              </> :

            // Summary Details
            selectedItem &&
            <>
                  {'summary_text' in selectedItem && selectedItem.summary_text &&
              <div>
                      <h3 className="font-semibold mb-1">نص الملخص</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedItem.summary_text}</p>
                    </div>
              }
                  {'notes' in selectedItem && selectedItem.notes &&
              <div>
                      <h3 className="font-semibold mb-1">ملاحظات</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedItem.notes}</p>
                    </div>
              }
                </>

            }
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default SearchPage;