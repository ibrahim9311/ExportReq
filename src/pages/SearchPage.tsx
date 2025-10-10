import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, LogOut, Search, RotateCcw, MessageSquarePlus, FileText, Download } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Country {
  id: number;
  name_ar: string;
}

interface Crop {
  id: number;
  name_ar: string;
}

interface ShortRequirement {
  short_requirement: string;
}

interface ExportRequirement {
  id: number;
  country_id: number;
  crop_id: number;
  full_requirements: string;
  publication_number: string;
  publication_year: number;
  pdf_file?: string;
  countries: { name_ar: string };
  crops: { name_ar: string };
  short_requirements: ShortRequirement[];
}

export default function SearchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cropId, setCropId] = useState<number | null>(null);
  const [openCountry, setOpenCountry] = useState(false);
  const [openCrop, setOpenCrop] = useState(false);
  const [searchResults, setSearchResults] = useState<ExportRequirement[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);

  // Check if Supabase is configured
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md" dir="rtl">
          <CardHeader>
            <CardTitle className="text-yellow-600">تكوين مطلوب</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              يرجى تكوين متغيرات البيئة الخاصة بـ Supabase للمتابعة
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async (): Promise<Country[]> => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name_ar')
        .order('name_ar');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch crops
  const { data: crops = [] } = useQuery({
    queryKey: ['crops'],
    queryFn: async (): Promise<Crop[]> => {
      const { data, error } = await supabase
        .from('crops')
        .select('id, name_ar')
        .order('name_ar');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('غير مصرح به');
      return user;
    }
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      if (!countryId || !cropId) {
        throw new Error('يرجى اختيار الدولة والمحصول');
      }

      const { data, error } = await supabase
        .from('export_requirements')
        .select(`
          id,
          country_id,
          crop_id,
          full_requirements,
          publication_number,
          publication_year,
          pdf_file,
          countries!inner(name_ar),
          crops!inner(name_ar),
          short_requirements!requirement_id(short_requirement)
        `)
        .eq('country_id', countryId)
        .eq('crop_id', cropId);

      if (error) throw error;
      return data as unknown as ExportRequirement[];
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setHasSearched(true);
      toast({
        title: 'تم البحث بنجاح',
        description: `تم العثور على ${data.length} نتيجة`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في البحث',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async ({ requirementId, feedback }: { requirementId: number; feedback: string }) => {
      if (!currentUser) throw new Error('يجب تسجيل الدخول');
      if (!feedback.trim()) throw new Error('يرجى إدخال نص الملاحظة');

      const { error } = await supabase
        .from('feedback')
        .insert({
          requirement_id: requirementId,
          user_id: currentUser.id,
          feedback_text: feedback,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم إضافة الملاحظة بنجاح',
        description: 'شكراً لمساهمتك',
      });
      setFeedbackText('');
      setOpenFeedbackDialog(false);
      setSelectedRequirementId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في إضافة الملاحظة',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'تم تسجيل الخروج بنجاح',
        description: 'إلى اللقاء!',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تسجيل الخروج',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    searchMutation.mutate();
  };

  const handleReset = () => {
    setCountryId(null);
    setCropId(null);
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleAddFeedback = (requirementId: number) => {
    setSelectedRequirementId(requirementId);
    setOpenFeedbackDialog(true);
  };

  const submitFeedback = () => {
    if (selectedRequirementId) {
      feedbackMutation.mutate({
        requirementId: selectedRequirementId,
        feedback: feedbackText,
      });
    }
  };

  const selectedCountry = countries.find(c => c.id === countryId);
  const selectedCrop = crops.find(c => c.id === cropId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800">
                البحث عن متطلبات التصدير
              </h1>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-6 h-6" />
              نموذج البحث
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Country Select */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-700">الدولة</Label>
                <Popover open={openCountry} onOpenChange={setOpenCountry}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCountry}
                      className="w-full justify-between h-12 text-base"
                    >
                      {selectedCountry ? selectedCountry.name_ar : 'اختر الدولة...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ابحث عن الدولة..." />
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {countries.map((country) => (
                          <CommandItem
                            key={country.id}
                            value={country.name_ar}
                            onSelect={() => {
                              setCountryId(country.id);
                              setOpenCountry(false);
                            }}
                          >
                            {country.name_ar}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Crop Select */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-700">المحصول</Label>
                <Popover open={openCrop} onOpenChange={setOpenCrop}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCrop}
                      className="w-full justify-between h-12 text-base"
                    >
                      {selectedCrop ? selectedCrop.name_ar : 'اختر المحصول...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ابحث عن المحصول..." />
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {crops.map((crop) => (
                          <CommandItem
                            key={crop.id}
                            value={crop.name_ar}
                            onSelect={() => {
                              setCropId(crop.id);
                              setOpenCrop(false);
                            }}
                          >
                            {crop.name_ar}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSearch}
                disabled={!countryId || !cropId || searchMutation.isPending}
                className="flex-1 h-12 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {searchMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 ml-2" />
                    بحث
                  </>
                )}
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                className="h-12 px-6 text-base"
              >
                <RotateCcw className="w-5 h-5 ml-2" />
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                نتائج البحث ({searchResults.length})
              </h2>
            </div>

            {searchResults.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">
                    لم يتم العثور على نتائج
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    جرب معايير بحث أخرى
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {searchResults.map((result) => (
                  <Card key={result.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl text-slate-800 mb-2">
                            {result.countries.name_ar} - {result.crops.name_ar}
                          </CardTitle>
                          <p className="text-sm text-slate-600">
                            رقم النشر: {result.publication_number} | السنة: {result.publication_year}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddFeedback(result.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <MessageSquarePlus className="w-4 h-4" />
                          إضافة ملاحظة
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Short Requirements */}
                      {result.short_requirements && result.short_requirements.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            المتطلبات المختصرة:
                          </h3>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
                            {result.short_requirements.map((req, idx) => (
                              <li key={idx}>{req.short_requirement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Full Requirements */}
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          المتطلبات الكاملة:
                        </h3>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg">
                          {result.full_requirements}
                        </p>
                      </div>

                      {/* PDF Link */}
                      {result.pdf_file && (
                        <div className="pt-4 border-t">
                          <Button
                            onClick={() => window.open(result.pdf_file, '_blank')}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            تحميل ملف PDF
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Feedback Dialog */}
      <Dialog open={openFeedbackDialog} onOpenChange={setOpenFeedbackDialog}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">إضافة ملاحظة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-base">
                الملاحظة أو الاقتراح
              </Label>
              <Textarea
                id="feedback"
                placeholder="اكتب ملاحظتك هنا..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[150px] text-base"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitFeedback}
                disabled={!feedbackText.trim() || feedbackMutation.isPending}
                className="flex-1"
              >
                {feedbackMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ الملاحظة'
                )}
              </Button>
              <Button
                onClick={() => {
                  setOpenFeedbackDialog(false);
                  setFeedbackText('');
                  setSelectedRequirementId(null);
                }}
                variant="outline"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
