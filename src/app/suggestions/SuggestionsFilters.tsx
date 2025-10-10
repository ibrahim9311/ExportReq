'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

type Option = {
  value: string;
  label: string;
};

interface SuggestionsFiltersProps {
  countries: Option[];
  crops: Option[];
}

export function SuggestionsFilters({ countries, crops }: SuggestionsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const country = searchParams.get('country') ?? '';
  const crop = searchParams.get('crop') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'created_at.desc';

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: 'country' | 'crop' | 'sortBy', value: string) => {
    router.push(pathname + '?' + createQueryString({ [key]: value }));
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasFilters = !!(country || crop || sortBy !== 'created_at.desc');

  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-wrap items-center gap-4">
        <Select value={country} onValueChange={(value) => handleFilterChange('country', value)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="فلترة بالدولة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الدول</SelectItem>
            {countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={crop} onValueChange={(value) => handleFilterChange('crop', value)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="فلترة بالمحصول" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل المحاصيل</SelectItem>
            {crops.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="ترتيب حسب" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at.desc">الأحدث أولاً</SelectItem>
            <SelectItem value="created_at.asc">الأقدم أولاً</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && <Button variant="ghost" onClick={handleReset}>إعادة تعيين</Button>}
      </CardContent>
    </Card>
  );
}