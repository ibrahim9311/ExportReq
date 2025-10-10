import { createClient } from '@/lib/supabase/server';
import { unstable_cache as cache } from 'next/cache';
import SearchClient from './search-client';
import { ComboboxOption } from '@/components/ui/combobox';

type Country = { id: number; name_ar: string };
type Crop = { id: number; name_ar: string };

const getCachedInitialData = cache(async () => {
    const supabase = await createClient();
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
}, ['search-initial-data'], { revalidate: 3600 }); // Cache for 1 hour

export default async function SearchPage() {
    const { countries, crops } = await getCachedInitialData();

    return (
        <SearchClient initialCountries={countries} initialCrops={crops} />
    );
}
