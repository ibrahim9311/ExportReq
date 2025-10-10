'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ShortRequirement = { id: number; name: string };

// Define a more specific type for the fetched data
type RequirementData = {
  country_id: number;
  crop_id: number;
  full_requirements: string | null;
  publication_number: string | null;
  publication_year: number | null;
  pdf_file_url: string | null;
  requirement_short_requirements: { short_requirement_id: number }[];
  // Supabase can return a single object or an array for relations
  countries: { name_ar: string } | { name_ar: string }[];
  crops: { name_ar: string } | { name_ar: string }[];
};


export default function EditRequirementPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const requirementId = params.id as string;

  // Data lists
  const [countryName, setCountryName] = useState('');
  const [cropName, setCropName] = useState('');
  const [shortRequirements, setShortRequirements] = useState<ShortRequirement[]>([]);

  // Form state
  const [selectedShortReqs, setSelectedShortReqs] = useState<number[]>([]);
  const [fullRequirements, setFullRequirements] = useState('');
  const [publicationNumber, setPublicationNumber] = useState('');
  const [publicationYear, setPublicationYear] = useState<number | ''>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch lists and existing requirement data in parallel
      const { data: shortReqsData } = await supabase.from('short_requirements').select('id, name').order('name');
      if (shortReqsData) setShortRequirements(shortReqsData);

      const { data, error } = await supabase
          .from('export_requirements')
          .select(`
              country_id, crop_id, full_requirements, publication_number, publication_year, pdf_file_url, 
              requirement_short_requirements(short_requirement_id), 
              countries!inner ( name_ar ), 
              crops!inner ( name_ar )
          `)
          .eq('id', requirementId)
          .single();

      const requirementData = data as RequirementData | null;

      // Populate form with existing data
      if (requirementData) {
        setFullRequirements(requirementData.full_requirements || '');
        setPublicationNumber(requirementData.publication_number || '');
        setPublicationYear(requirementData.publication_year || '');
        setExistingPdfUrl(requirementData.pdf_file_url);
        setSelectedShortReqs(requirementData.requirement_short_requirements.map(r => r.short_requirement_id));
        
        // Type-safe access to related data
        const country = Array.isArray(requirementData.countries) ? requirementData.countries[0] : requirementData.countries;
        const crop = Array.isArray(requirementData.crops) ? requirementData.crops[0] : requirementData.crops;
        setCountryName(country?.name_ar || '');
        setCropName(crop?.name_ar || '');
      } else if (error) {
        toast.error("خطأ في جلب البيانات", { description: "لم يتم العثور على الاشتراط المطلوب." });
        router.push('/requirements');
      }

      setLoading(false);
    };
    fetchData();
  }, [supabase, requirementId, router]);

  const handleShortReqChange = (id: number) => {
    setSelectedShortReqs(prev =>
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  };

  const handleRemovePdf = async () => {
    if (!existingPdfUrl) return;
    
    const fileName = existingPdfUrl.split('/').pop();
    if (!fileName) return;

    // Optimistically update UI
    setExistingPdfUrl(null);

    // No need to delete from storage immediately. The RPC function will set the URL to null.
    // If you want to clean up storage, you'd do it after a successful DB update.
    toast.info("سيتم إزالة الملف عند الحفظ.");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    let newPdfUrl = existingPdfUrl;
    let uploadedFilePath: string | null = null;

    // 1. Upload new PDF if selected
    if (pdfFile) {
      const filePath = `public/${Date.now()}-${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('requirements-files')
        .upload(filePath, pdfFile);

      if (uploadError) {
        toast.error('فشل رفع الملف الجديد', { description: uploadError.message });
        setIsSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('requirements-files').getPublicUrl(filePath);
      newPdfUrl = urlData.publicUrl;
      uploadedFilePath = filePath;
    }

    // 2. Call the RPC function to update everything atomically
    const { error: rpcError } = await supabase.rpc('update_requirement_with_shorts', {
      req_id: parseInt(requirementId),      
      p_full_requirements: fullRequirements,
      p_publication_number: publicationNumber,
      p_publication_year: publicationYear === '' ? null : publicationYear,
      p_pdf_file_url: newPdfUrl,
      p_short_req_ids: selectedShortReqs,
    });

    if (rpcError) {
      // If DB update fails, delete the newly uploaded file to prevent orphaned files
      if (uploadedFilePath) {
        await supabase.storage.from('requirements-files').remove([uploadedFilePath]);
        toast.warning("تم التراجع عن رفع الملف بسبب فشل التحديث.");
      }

      toast.error('فشل تحديث الاشتراط', { description: rpcError.message });
      setIsSubmitting(false);
      return;
    }

    toast.success('تم تحديث الاشتراط بنجاح!');
    router.push('/requirements');
    router.refresh();
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري تحميل بيانات الاشتراط...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">تعديل الاشتراط</h1>
        <Button asChild variant="outline">
          <Link href="/requirements">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة لقائمة التسجيلات
          </Link>
        </Button>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader><CardTitle>بيانات الاشتراط الأساسية</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label>الدولة</Label>
              <Input value={countryName} readOnly disabled />
            </div>
            <div className="grid gap-2">
              <Label>المحصول</Label>
              <Input value={cropName} readOnly disabled />
            </div>
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
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="grid gap-2">
              <Label htmlFor="pub-number">رقم المنشور</Label>
              <Input id="pub-number" value={publicationNumber} onChange={e => setPublicationNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pub-year">سنة النشر</Label>
              <Input id="pub-year" type="number" value={publicationYear ?? ''} onChange={e => {
                const value = e.target.value;
                setPublicationYear(value === '' ? '' : parseInt(value, 10));
              }} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="pdf-file">تغيير/إضافة ملف المنشور (PDF)</Label>
              <Input id="pdf-file" type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)} />
              {existingPdfUrl && !pdfFile && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2 p-2 border rounded-md">
                  <span>
                    يوجد ملف مرفق حالياً. <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="underline">عرض الملف</a>
                  </span>
                  <Button type="button" variant="destructive" size="sm" onClick={handleRemovePdf}>إزالة الملف</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                حفظ التعديلات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد حفظ التعديلات</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من أنك تريد حفظ التغييرات التي قمت بها على هذا الاشتراط؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : "تأكيد الحفظ"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
}