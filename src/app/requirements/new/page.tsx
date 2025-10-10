import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewRequirementForm } from './NewRequirementForm';
import { unstable_cache as cache } from 'next/cache';

type ComboboxOption = { value: string; label: string };
type ShortRequirement = { id: number; name: string };

const getCachedInitialData = cache(async () => {
    const supabase = createClient();
    const [
        { data: countriesData },
        { data: cropsData },
        { data: shortReqsData },
    ] = await Promise.all([
        supabase.from('countries').select('id, name_ar').order('name_ar'),
        supabase.from('crops').select('id, name_ar').order('name_ar'),
        supabase.from('short_requirements').select('id, name').order('name'),
    ]);

    const countries: ComboboxOption[] = countriesData?.map(c => ({ value: c.id.toString(), label: c.name_ar })) || [];
    const crops: ComboboxOption[] = cropsData?.map(c => ({ value: c.id.toString(), label: c.name_ar })) || [];
    const shortRequirements: ShortRequirement[] = shortReqsData || [];

    return { countries, crops, shortRequirements };
}, ['new-requirement-initial-data'], { revalidate: 3600 }); // Cache for 1 hour

export default async function NewRequirementPage() {
    const { countries, crops, shortRequirements } = await getCachedInitialData();

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
            <NewRequirementForm
                countries={countries}
                crops={crops}
                shortRequirements={shortRequirements}
            />
        </div>
    );
}