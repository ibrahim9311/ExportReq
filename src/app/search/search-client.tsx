'use client';

import { useState, useEffect, useCallback, FC } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, FileText, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ComboboxOption = {
  value: string;
  label: string;
};

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

const SearchClient: FC<SearchClientProps> = ({ initialCountries, initialCrops }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Data lists

  // Form state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  // UI state
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<RequirementResult | null | 'not_found'>(null);

  const handleSearch = useCallback(async (countryId?: string, cropId?: string) => {
    const finalCountryId = countryId || selectedCountry;
    const finalCropId = cropId || selectedCrop;

    if (!finalCountryId || !finalCropId) {
      return;
    }

    // Update URL without reloading
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('country', finalCountryId);
    current.set('crop', finalCropId);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: false });

    setSearching(true);
    setSearchResult(null);

    try {
      const { data } = await supabase
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
        // Fix: Remove 'any' usage for ESLint compliance
        type SupabaseShortReq = { short_requirements: { name: string }[] | { name: string } | null };
        const fixedData: RequirementResult = {
          ...data,
          requirement_short_requirements: (data.requirement_short_requirements || []).map((item: SupabaseShortReq) => {
            if (Array.isArray(item.short_requirements)) {
              const first = item.short_requirements[0];
              return {
                short_requirements: first && typeof first.name === "string"
                  ? { name: first.name }
                  : null,
              };
            }
            return {
              short_requirements: item.short_requirements && typeof item.short_requirements.name === "string"
                ? { name: item.short_requirements.name }
                : null,
            };
          }),
        };
        setSearchResult(fixedData);
      } else {
        setSearchResult('not_found');
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult('not_found'); // Or handle error state differently
    }
    setSearching(false);
  }, [selectedCountry, selectedCrop, supabase, searchParams, router, pathname]);

  useEffect(() => {
    // Auto-search if query params exist
    const countryQuery = searchParams.get('country');
    const cropQuery = searchParams.get('crop');
    if (countryQuery && cropQuery) {
      setSelectedCountry(countryQuery);
      setSelectedCrop(cropQuery);
      // We call handleSearch inside a useCallback to avoid re-creating it on every render
      // but we need to call it here with the initial values from the URL.
      // The dependency array ensures this only runs when the URL params change.
      handleSearch(countryQuery, cropQuery); 
    }
  }, [searchParams, handleSearch]);

  const handleReset = () => {
    setSelectedCountry('');
    setSelectedCrop('');
    setSearchResult(null);
    router.push('/search'); // Clear URL params
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
                options={initialCountries}
                value={selectedCountry}
                onChange={setSelectedCountry}
                placeholder="اختر الدولة..."
                searchPlaceholder="ابحث عن دولة..."
                emptyPlaceholder="لم يتم العثور على الدولة."
              />
              <Combobox
                options={initialCrops}
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

export default SearchClient;