'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type ShortRequirement = { id: number; name: string };

interface NewRequirementFormProps {
    countries: ComboboxOption[];
    crops: ComboboxOption[];
    shortRequirements: ShortRequirement[];
}

export function NewRequirementForm({ countries, crops, shortRequirements }: NewRequirementFormProps) {
    const supabase = createClient();
    const router = useRouter();

    // Form state
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedCrop, setSelectedCrop] = useState<string>('');
    const [selectedShortReqs, setSelectedShortReqs] = useState<number[]>([]);
    const [fullRequirements, setFullRequirements] = useState('');
    const [publicationNumber, setPublicationNumber] = useState('');
    const [publicationYear, setPublicationYear] = useState<number | ''>('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        let uploadedFilePath: string | null = null;

        if (pdfFile) {
            const filePath = `public/${Date.now()}-${pdfFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('requirements-files')
                .upload(filePath, pdfFile);

            if (uploadError) {
                toast.error('فشل رفع الملف', { description: uploadError.message });
                setIsSubmitting(false);
                return;
            }

            uploadedFilePath = filePath;
            const { data: urlData } = supabase.storage
                .from('requirements-files')
                .getPublicUrl(filePath);
            pdfUrl = urlData.publicUrl;
        }

        // 2. Call the RPC function to insert everything atomically
        const { error: rpcError } = await supabase.rpc('create_requirement_with_shorts', {
            p_country_id: parseInt(selectedCountry),
            p_crop_id: parseInt(selectedCrop),
            p_full_requirements: fullRequirements,
            p_publication_number: publicationNumber,
            p_publication_year: publicationYear === '' ? null : publicationYear,
            p_pdf_file_url: pdfUrl,
            p_short_req_ids: selectedShortReqs,
        });

        if (rpcError) {
            if (uploadedFilePath) {
                await supabase.storage.from('requirements-files').remove([uploadedFilePath]);
                toast.warning("تم التراجع عن رفع الملف بسبب فشل الحفظ.");
            }

            if (rpcError.message.includes('duplicate key value violates unique constraint "export_requirements_country_id_crop_id_key"')) {
                toast.error('فشل الحفظ: اشتراط مكرر', {
                    description: 'يوجد بالفعل اشتراط مسجل لنفس الدولة والمحصول.',
                });
            } else {
                toast.error('فشل حفظ الاشتراط', { description: rpcError.message });
            }
            setIsSubmitting(false);
            return;
        }

        toast.success('تم حفظ الاشتراط بنجاح!');
        router.push('/requirements');
        router.refresh();
        setIsSubmitting(false);
    };

    return (
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
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="pub-number">رقم المنشور</Label>
                        <Input id="pub-number" value={publicationNumber} onChange={e => setPublicationNumber(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pub-year">سنة النشر</Label>
                        <Input id="pub-year" type="number" value={publicationYear} onChange={e => {
                            const value = e.target.value;
                            setPublicationYear(value === '' ? '' : parseInt(value, 10));
                        }} />
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
    );
}