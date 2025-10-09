'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, FileText, Calendar, Hash, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Country = { id: number; name_ar: string };
type Crop = { id: number; name_ar: string };
type RequirementResult = {
  id: number;
  full_requirements: string;
  publication_number: string;
  publication_year: number;
  pdf_file_url: string;
  requirement_short_requirements: {
    short_requirements: {
      name: string;
    } | null;
  }[];
};

interface SearchClientProps {
    initialCountries: ComboboxOption[];
    initialCrops: ComboboxOption[];
}

export default function SearchClient({ initialCountries, initialCrops }: SearchClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data lists
  const [countries, setCountries] = useState<ComboboxOption[]>(initialCountries);
  const [crops, setCrops] = useState<ComboboxOption[]>(initialCrops);

  // Form state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false); // Will be handled by Suspense in the future
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<RequirementResult | null | 'not_found'>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    // Auto-search if query params exist
    const countryQuery = searchParams.get('country');
    const cropQuery = searchParams.get('crop');
    if (countryQuery && cropQuery) {
      setSelectedCountry(countryQuery);
      setSelectedCrop(cropQuery);
      handleSearch(countryQuery, cropQuery);
    }

  }, []); // Run only once on mount

  const handleSearch = async (countryId?: string, cropId?: string) => {
    const finalCountryId = countryId || selectedCountry;
    const finalCropId = cropId || selectedCrop;
    if (!finalCountryId || !finalCropId) {
      alert('الرجاء اختيار الدولة والمحصول');
      return;
    }
    setSearching(true);
    setSearchResult(null);

    const { data, error } = await supabase
      .from('export_requirements')
      .select(`
        id,
        full_requirements,
        publication_number,
        publication_year,
        pdf_file_url,
        requirement_short_requirements (
          short_requirements ( name )
        )
      `)
      .eq('country_id', finalCountryId)
      .eq('crop_id', finalCropId)
      .single();

    if (data) {
      setSearchResult(data as RequirementResult);
    } else {
      setSearchResult('not_found');
    }
    setSearching(false);
  };

  const handleReset = () => {
    setSelectedCountry('');
    setSelectedCrop('');
    setSearchResult(null);
    router.push('/search'); // Clear URL params
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !searchResult || typeof searchResult === 'string') return;

    setIsSubmittingFeedback(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("يجب تسجيل الدخول لتقديم ملاحظة.");
      setIsSubmittingFeedback(false);
      return;
    }

    const { error } = await supabase.from('feedback').insert({
      requirement_id: searchResult.id,
      user_id: user.id,
      comment_text: feedbackText,
    });

    if (error) {
      toast.error("فشل إرسال الملاحظة", { description: error.message });
    } else {
      toast.success("شكراً لك! تم إرسال ملاحظتك بنجاح.");
      document.getElementById('close-feedback-dialog')?.click();
      setFeedbackText('');
    }
    setIsSubmittingFeedback(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">البحث عن الاشتراطات</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
      </div>

      {initialCountries.length === 0 || initialCrops.length === 0 ? (
        <div className="text-center mt-8">جاري تحميل بيانات البحث...</div>
      ) : (
      <>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Combobox
              options={countries}
              value={selectedCountry}
              onChange={setSelectedCountry}
              placeholder="اختر الدولة..."
              searchPlaceholder="ابحث عن دولة..."
              emptyPlaceholder="لم يتم العثور على الدولة."
            />
            <Combobox
              options={crops}
              value={selectedCrop}
              onChange={setSelectedCrop}
              placeholder="اختر المحصول..."
              searchPlaceholder="ابحث عن محصول..."
              emptyPlaceholder="لم يتم العثور على المحصول."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleSearch()} disabled={searching || !selectedCountry || !selectedCrop}>
              {searching && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              بحث
            </Button>
            <Button onClick={handleReset} variant="ghost">إعادة البحث</Button>
          </div>
        </CardContent>
      </Card>

      {searching && <div className="text-center mt-8">جاري البحث...</div>}

      {searchResult === 'not_found' && (
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle>لا توجد نتائج</CardTitle>
            <CardDescription>لم يتم العثور على اشتراطات مطابقة لبحثك. يمكنك إضافة اقتراح أو ملحوظة.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {searchResult && typeof searchResult !== 'string' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>نتائج البحث</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><Hash size={14} /> رقم المنشور: {searchResult.publication_number || 'غير محدد'}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> سنة النشر: {searchResult.publication_year || 'غير محدد'}</span>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">الاشتراطات المختصرة:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {searchResult.requirement_short_requirements.map((sr, i) => (
                <Badge key={i} variant="secondary">{sr.short_requirements?.name}</Badge>
              ))}
            </div>
            <h3 className="font-semibold mb-2">الاشتراطات الكاملة:</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{searchResult.full_requirements}</p>
            {searchResult.pdf_file_url && (
              <Button asChild className="mt-4">
                <a href={searchResult.pdf_file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="ml-2 h-4 w-4" />
                  عرض الملف المرفق
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  );
}