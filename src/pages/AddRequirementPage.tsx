import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const requirementSchema = z.object({
  country_id: z.string().min(1, 'يرجى اختيار الدولة'),
  crop_id: z.string().min(1, 'يرجى اختيار المحصول'),
  full_requirements: z.string().min(10, 'يرجى إدخال تفاصيل الاشتراطات (10 أحرف على الأقل)'),
  publication_number: z.string().optional(),
  publication_year: z.string().optional(),
  pdf_file_url: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
  notes: z.string().optional()
});

type RequirementFormData = z.infer<typeof requirementSchema>;

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

interface ShortRequirement {
  id: number;
  name: string;
}

const AddRequirementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [shortRequirements, setShortRequirements] = useState<ShortRequirement[]>([]);
  const [selectedShortReqs, setSelectedShortReqs] = useState<number[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openCountry, setOpenCountry] = useState(false);
  const [openCrop, setOpenCrop] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema)
  });

  const countryId = watch('country_id');
  const cropId = watch('crop_id');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [countriesRes, cropsRes, shortReqsRes] = await Promise.all([
      supabase.from('countries').select('*').order('name_ar'),
      supabase.from('crops').select('*').order('name_ar'),
      supabase.from('short_requirements').select('*').order('name')]
      );

      if (countriesRes.error) throw countriesRes.error;
      if (cropsRes.error) throw cropsRes.error;
      if (shortReqsRes.error) throw shortReqsRes.error;

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
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: RequirementFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول أولاً',
          variant: 'destructive'
        });
        navigate('/login');
        return;
      }

      // Insert export requirement
      const { data: requirement, error: reqError } = await supabase.
      from('export_requirements').
      insert({
        user_id: user.id,
        country_id: parseInt(data.country_id),
        crop_id: parseInt(data.crop_id),
        full_requirements: data.full_requirements,
        publication_number: data.publication_number || null,
        publication_year: data.publication_year ? parseInt(data.publication_year) : null,
        pdf_file_url: data.pdf_file_url || null,
        notes: data.notes || null,
        created_at: new Date().toISOString()
      }).
      select().
      single();

      if (reqError) throw reqError;

      // Link short requirements if any selected
      if (selectedShortReqs.length > 0) {
        const links = selectedShortReqs.map((shortReqId) => ({
          requirement_id: requirement.id,
          short_requirement_id: shortReqId
        }));

        const { error: linkError } = await supabase.
        from('requirement_short_requirements').
        insert(links);

        if (linkError) throw linkError;
      }

      toast({
        title: 'نجح',
        description: 'تم إضافة الاشتراط بنجاح'
      });

      navigate('/view-requirements');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة الاشتراط',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShortReq = (id: number) => {
    setSelectedShortReqs((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getCountryName = (id: string | undefined) => {
    if (!id) return 'اختر الدولة';
    const country = countries.find((c) => c.id === parseInt(id));
    return country?.name_ar || 'اختر الدولة';
  };

  const getCropName = (id: string | undefined) => {
    if (!id) return 'اختر المحصول';
    const crop = crops.find((c) => c.id === parseInt(id));
    return crop?.name_ar || 'اختر المحصول';
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">تسجيل اشتراط جديد</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/view-requirements')} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                عرض التسجيلات
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                لوحة التحكم
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Country Selection */}
            <div className="space-y-2">
              <Label htmlFor="country_id">الدولة *</Label>
              <Popover open={openCountry} onOpenChange={setOpenCountry}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountry}
                    className={cn("w-full justify-between", errors.country_id && 'border-red-500')}
                    disabled={loadingData}>
                    {getCountryName(countryId)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن دولة..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) =>
                        <CommandItem
                          key={country.id}
                          value={country.name_ar}
                          onSelect={() => {
                            setValue('country_id', country.id.toString());
                            setOpenCountry(false);
                          }}>
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                countryId === country.id.toString() ? 'opacity-100' : 'opacity-0'
                              )} />
                            {country.name_ar}
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.country_id && <p className="text-sm text-red-500">{errors.country_id.message}</p>}
            </div>

            {/* Crop Selection */}
            <div className="space-y-2">
              <Label htmlFor="crop_id">المحصول *</Label>
              <Popover open={openCrop} onOpenChange={setOpenCrop}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCrop}
                    className={cn("w-full justify-between", errors.crop_id && 'border-red-500')}
                    disabled={loadingData}>
                    {getCropName(cropId)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن محصول..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup>
                        {crops.map((crop) =>
                        <CommandItem
                          key={crop.id}
                          value={crop.name_ar}
                          onSelect={() => {
                            setValue('crop_id', crop.id.toString());
                            setOpenCrop(false);
                          }}>
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                cropId === crop.id.toString() ? 'opacity-100' : 'opacity-0'
                              )} />
                            {crop.name_ar}
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.crop_id && <p className="text-sm text-red-500">{errors.crop_id.message}</p>}
            </div>

            {/* Full Requirements */}
            <div className="space-y-2">
              <Label htmlFor="full_requirements">تفاصيل الاشتراطات *</Label>
              <Textarea
                id="full_requirements"
                {...register('full_requirements')}
                placeholder="أدخل تفاصيل الاشتراطات الكاملة"
                rows={6}
                className={errors.full_requirements ? 'border-red-500' : ''} />

              {errors.full_requirements && <p className="text-sm text-red-500">{errors.full_requirements.message}</p>}
            </div>

            {/* Publication Number */}
            <div className="space-y-2">
              <Label htmlFor="publication_number">رقم النشرة</Label>
              <Input
                id="publication_number"
                {...register('publication_number')}
                placeholder="أدخل رقم النشرة" />

            </div>

            {/* Publication Year */}
            <div className="space-y-2">
              <Label htmlFor="publication_year">سنة النشر</Label>
              <Input
                id="publication_year"
                type="number"
                {...register('publication_year')}
                placeholder="مثال: 2024" />

            </div>

            {/* PDF URL */}
            <div className="space-y-2">
              <Label htmlFor="pdf_file_url">رابط ملف PDF</Label>
              <Input
                id="pdf_file_url"
                type="url"
                {...register('pdf_file_url')}
                placeholder="https://example.com/file.pdf"
                className={errors.pdf_file_url ? 'border-red-500' : ''} />

              {errors.pdf_file_url && <p className="text-sm text-red-500">{errors.pdf_file_url.message}</p>}
            </div>

            {/* Short Requirements */}
            <div className="space-y-2">
              <Label>الاشتراطات المختصرة</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {shortRequirements.map((shortReq) =>
                <div key={shortReq.id} className="flex items-center gap-2">
                    <Checkbox
                    id={`short-${shortReq.id}`}
                    checked={selectedShortReqs.includes(shortReq.id)}
                    onCheckedChange={() => toggleShortReq(shortReq.id)} />

                    <Label htmlFor={`short-${shortReq.id}`} className="cursor-pointer font-normal">
                      {shortReq.name}
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="أضف أي ملاحظات إضافية"
                rows={3} />

            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ?
                <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </> :

                <>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة الاشتراط
                  </>
                }
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>);

};

export default AddRequirementPage;