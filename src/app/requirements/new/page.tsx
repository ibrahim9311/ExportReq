'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Upload } from 'lucide-react';

import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type ShortRequirement = { id: number; name: string };

export default function NewRequirementPage() {
  const supabase = createClient();
  const router = useRouter();

  // Data lists
  const [countries, setCountries] = useState<ComboboxOption[]>([]);
  const [crops, setCrops] = useState<ComboboxOption[]>([]);
  const [shortRequirements, setShortRequirements] = useState<ShortRequirement[]>([]);

  // Form state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedShortReqs, setSelectedShortReqs] = useState<number[]>([]);
  const [fullRequirements, setFullRequirements] = useState('');
  const [publicationNumber, setPublicationNumber] = useState('');
  const [publicationYear, setPublicationYear] = useState<number | ''>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch countries, crops, and short_requirements in parallel
      const [
        { data: countriesData },
        { data: cropsData },
        { data: shortReqsData },
      ] = await Promise.all([
        supabase.from('countries').select('id, name_ar').order('name_ar'),
        supabase.from('crops').select('id, name_ar').order('name_ar'),
        supabase.from('short_requirements').select('id, name').order('name'),
      ]);

      if (countriesData) setCountries(countriesData.map(c => ({ value: c.id.toString(), label: c.name_ar })));
      if (cropsData) setCrops(cropsData.map(c => ({ value: c.id.toString(), label: c.name_ar })));
      if (shortReqsData) setShortRequirements(shortReqsData);

      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleShortReqChange = (id: number) => {
    setSelectedShortReqs(prev =>
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Upload PDF file if it exists
    let pdfUrl = null;
    if (pdfFile) {
      const filePath = `public/${Date.now()}-${pdfFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('requirements-files') // Make sure this bucket exists and is public
        .upload(filePath, pdfFile);

      if (uploadError) {
        toast.error('فشل رفع الملف', { description: uploadError.message });
        setIsSubmitting(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('requirements-files')
        .getPublicUrl(filePath);
      pdfUrl = urlData.publicUrl;
    }

    // 2. Insert the main requirement
    const { data: newRequirement, error: insertError } = await supabase
      .from('export_requirements')
      .insert({
        country_id: parseInt(selectedCountry),
        crop_id: parseInt(selectedCrop),
        full_requirements: fullRequirements,
        publication_number: publicationNumber,
        publication_year: publicationYear || null,
        pdf_file_url: pdfUrl,
        // user_id will be set by RLS policy or a trigger if needed
      })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        toast.error('فشل الحفظ: اشتراط مكرر', {
          description: 'يوجد بالفعل اشتراط مسجل لنفس الدولة والمحصول.',
        });
      } else {
        toast.error('فشل حفظ الاشتراط', { description: insertError.message });
      }
      setIsSubmitting(false);
      return;
    }

    // 3. Link short requirements
    if (newRequirement && selectedShortReqs.length > 0) {
      const links = selectedShortReqs.map(shortId => ({
        requirement_id: newRequirement.id,
        short_requirement_id: shortId,
      }));
      const { error: linkError } = await supabase
        .from('requirement_short_requirements')
        .insert(links);

      if (linkError) {
        toast.warning('تم حفظ الاشتراط ولكن فشل ربط الاشتراطات المختصرة.', {
          description: linkError.message,
        });
      }
    }

    toast.success('تم حفظ الاشتراط بنجاح!');
    router.push('/dashboard'); // Or to the new requirement's page
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">تسجيل اشتراط جديد</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>بيانات الاشتراط الأساسية</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Combobox options={countries} value={selectedCountry} onChange={setSelectedCountry} placeholder="اختر الدولة..." searchPlaceholder="ابحث عن دولة..." emptyPlaceholder="لم يتم العثور." />
            <Combobox options={crops} value={selectedCrop} onChange={setSelectedCrop} placeholder="اختر المحصول..." searchPlaceholder="ابحث عن محصول..." emptyPlaceholder="لم يتم العثور." />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>تفاصيل الاشتراطات</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div>
              <Label className="text-lg font-semibold">الاشتراطات المختصرة</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2 p-4 border rounded-md">
                {shortRequirements.map(req => (
                  <div key={req.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`short-req-${req.id}`}
                      checked={selectedShortReqs.includes(req.id)}
                      onCheckedChange={() => handleShortReqChange(req.id)}
                    />
                    <label htmlFor={`short-req-${req.id}`} className="text-sm font-medium leading-none cursor-pointer">
                      {req.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full-reqs" className="text-lg font-semibold">الاشتراطات الكاملة</Label>
              <Textarea id="full-reqs" rows={8} value={fullRequirements} onChange={e => setFullRequirements(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>بيانات المنشور (اختياري)</CardTitle>
            <CardDescription>يمكنك إضافة هذه البيانات الآن أو تعديلها لاحقاً.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="grid gap-2">
              <Label htmlFor="pub-number">رقم المنشور</Label>
              <Input id="pub-number" value={publicationNumber} onChange={e => setPublicationNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pub-year">سنة النشر</Label>
              <Input id="pub-year" type="number" value={publicationYear} onChange={e => setPublicationYear(parseInt(e.target.value) || '')} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="pdf-file">ملف المنشور (PDF)</Label>
              <Input id="pdf-file" type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting || !selectedCountry || !selectedCrop}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ الاشتراط
          </Button>
        </div>
      </form>
    </div>
  );
}