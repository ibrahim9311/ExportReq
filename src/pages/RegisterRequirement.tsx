import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, LogOut, Upload, X, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
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
  requirement_text: string;
}

export default function RegisterRequirement() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form state
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cropId, setCropId] = useState<number | null>(null);
  const [selectedShortReqs, setSelectedShortReqs] = useState<number[]>([]);
  const [fullRequirements, setFullRequirements] = useState('');
  const [publicationNumber, setPublicationNumber] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Popover states
  const [countryOpen, setCountryOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        navigate('/');
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (!profile || ![2, 3, 4, 5].includes(profile.role_id)) {
        toast({
          title: 'غير مصرح',
          description: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      setUserId(user.id);
      setIsAuthorized(true);
    };

    checkAuth();
  }, [navigate]);

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async (): Promise<Country[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('countries')
        .select('id, name_ar')
        .order('name_ar');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthorized && !!supabase
  });

  // Fetch crops
  const { data: crops = [] } = useQuery({
    queryKey: ['crops'],
    queryFn: async (): Promise<Crop[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('crops')
        .select('id, name_ar')
        .order('name_ar');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthorized && !!supabase
  });

  // Fetch short requirements
  const { data: shortRequirements = [] } = useQuery({
    queryKey: ['shortRequirements'],
    queryFn: async (): Promise<ShortRequirement[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('short_requirements')
        .select('id, requirement_text')
        .order('id');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthorized && !!supabase
  });

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      navigate('/');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تسجيل الخروج',
        variant: 'destructive'
      });
    }
  };

  // File upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
      }
    }
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = async (registerAnother: boolean = false) => {
    // Validation
    if (!countryId || !cropId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار الدولة والمحصول',
        variant: 'destructive'
      });
      return;
    }

    if (!fullRequirements.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال المتطلبات الكاملة',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase || !userId) {
        throw new Error('غير مصرح به');
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from('export_requirements')
        .select('id')
        .eq('country_id', countryId)
        .eq('crop_id', cropId)
        .single();

      if (existing) {
        toast({
          title: 'تحذير',
          description: 'هذا المتطلب مسجل بالفعل',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Upload file if exists
      let fileUrl = null;
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `requirements/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      // Insert export requirement
      const { data: newRequirement, error: insertError } = await supabase
        .from('export_requirements')
        .insert({
          country_id: countryId,
          crop_id: cropId,
          full_requirements: fullRequirements,
          publication_number: publicationNumber || null,
          publication_year: publicationYear ? parseInt(publicationYear) : null,
          pdf_file_url: fileUrl,
          user_id: userId
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Insert short requirements junction
      if (selectedShortReqs.length > 0 && newRequirement) {
        const junctionData = selectedShortReqs.map(reqId => ({
          requirement_id: newRequirement.id,
          short_requirement_id: reqId
        }));

        const { error: junctionError } = await supabase
          .from('requirement_short_requirements')
          .insert(junctionData);

        if (junctionError) throw junctionError;
      }

      toast({
        title: 'نجح',
        description: 'تم تسجيل المتطلب بنجاح',
      });

      if (registerAnother) {
        // Reset form
        setCountryId(null);
        setCropId(null);
        setSelectedShortReqs([]);
        setFullRequirements('');
        setPublicationNumber('');
        setPublicationYear('');
        setUploadedFile(null);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حفظ المتطلب',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShortReq = (id: number) => {
    setSelectedShortReqs(prev =>
      prev.includes(id)
        ? prev.filter(reqId => reqId !== id)
        : [...prev, id]
    );
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedCountry = countries.find(c => c.id === countryId);
  const selectedCrop = crops.find(c => c.id === cropId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800">
              تسجيل متطلب جديد
            </h1>
            
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
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">بيانات المتطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Country Select */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-base font-semibold">
                الدولة <span className="text-red-500">*</span>
              </Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full justify-between"
                  >
                    {selectedCountry ? selectedCountry.name_ar : 'اختر الدولة...'}
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن دولة..." />
                    <CommandEmpty>لم يتم العثور على دولة</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {countries.map((country) => (
                        <CommandItem
                          key={country.id}
                          value={country.name_ar}
                          onSelect={() => {
                            setCountryId(country.id);
                            setCountryOpen(false);
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
              <Label htmlFor="crop" className="text-base font-semibold">
                المحصول <span className="text-red-500">*</span>
              </Label>
              <Popover open={cropOpen} onOpenChange={setCropOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cropOpen}
                    className="w-full justify-between"
                  >
                    {selectedCrop ? selectedCrop.name_ar : 'اختر المحصول...'}
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن محصول..." />
                    <CommandEmpty>لم يتم العثور على محصول</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {crops.map((crop) => (
                        <CommandItem
                          key={crop.id}
                          value={crop.name_ar}
                          onSelect={() => {
                            setCropId(crop.id);
                            setCropOpen(false);
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

            {/* Short Requirements */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">المتطلبات المختصرة</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto bg-slate-50">
                {shortRequirements.map((req) => (
                  <div key={req.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`req-${req.id}`}
                      checked={selectedShortReqs.includes(req.id)}
                      onCheckedChange={() => toggleShortReq(req.id)}
                    />
                    <Label
                      htmlFor={`req-${req.id}`}
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      {req.requirement_text}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Requirements */}
            <div className="space-y-2">
              <Label htmlFor="fullReq" className="text-base font-semibold">
                المتطلبات الكاملة <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="fullReq"
                value={fullRequirements}
                onChange={(e) => setFullRequirements(e.target.value)}
                placeholder="أدخل النص الكامل للمتطلبات..."
                className="min-h-32"
              />
            </div>

            {/* Publication Number */}
            <div className="space-y-2">
              <Label htmlFor="pubNumber" className="text-base font-semibold">
                رقم النشرة
              </Label>
              <Input
                id="pubNumber"
                type="text"
                value={publicationNumber}
                onChange={(e) => setPublicationNumber(e.target.value)}
                placeholder="أدخل رقم النشرة..."
              />
            </div>

            {/* Publication Year */}
            <div className="space-y-2">
              <Label htmlFor="pubYear" className="text-base font-semibold">
                سنة النشر
              </Label>
              <Input
                id="pubYear"
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                placeholder="أدخل سنة النشر..."
                min="1900"
                max="2100"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                رفع ملف PDF أو صورة
              </Label>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 mb-2">
                    {isDragActive
                      ? 'أفلت الملف هنا...'
                      : 'اسحب وأفلت الملف هنا، أو انقر للاختيار'}
                  </p>
                  <p className="text-sm text-slate-500">
                    PDF أو صور (JPG, PNG)
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1"
              >
                تسجيل آخر
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
