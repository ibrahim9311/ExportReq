import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import SearchClient from './search-client';
import { ComboboxOption } from '@/components/ui/combobox';

type Country = { id: number; name_ar: string };
type Crop = { id: number; name_ar: string };

async function getInitialData(supabase: SupabaseClient) {
    const [
        { data: countriesData },
        { data: cropsData },
    ] = await Promise.all([
        supabase.from('countries').select('id, name_ar').order('name_ar').returns<Country[]>(),
        supabase.from('crops').select('id, name_ar').order('name_ar').returns<Crop[]>(),
    ]);

    const countries: ComboboxOption[] = countriesData?.map((c) => ({ value: c.id.toString(), label: c.name_ar })) || [];
    const crops: ComboboxOption[] = cropsData?.map((c) => ({ value: c.id.toString(), label: c.name_ar })) || [];

    return { countries, crops };
}

export default async function SearchPage() {
    const supabase = createClient();

    const { countries, crops } = await getInitialData(supabase);

    return (
        <SearchClient initialCountries={countries} initialCrops={crops} />
    );
}
