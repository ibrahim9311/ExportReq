import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import SearchClient from './search-client';
import { ComboboxOption } from '@/components/ui/combobox';

async function getInitialData(supabase: any) {
    const [
        { data: countriesData },
        { data: cropsData },
    ] = await Promise.all([
        supabase.from('countries').select('id, name_ar').order('name_ar'),
        supabase.from('crops').select('id, name_ar').order('name_ar'),
    ]);

    const countries: ComboboxOption[] = countriesData?.map((c: any) => ({ value: c.id.toString(), label: c.name_ar })) || [];
    const crops: ComboboxOption[] = cropsData?.map((c: any) => ({ value: c.id.toString(), label: c.name_ar })) || [];

    return { countries, crops };
}

export default async function SearchPage() {
    const cookieStore = cookies();
    const supabase = createClient();

    const { countries, crops } = await getInitialData(supabase);

    return (
        <SearchClient initialCountries={countries} initialCrops={crops} />
    );
}