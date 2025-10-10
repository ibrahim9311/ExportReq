import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { ArrowRight, User, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns-jalali';
import { SuggestionsFilters } from './SuggestionsFilters';

type PageProps = {
  searchParams: {
    country?: string;
    crop?: string;
    sortBy?: string;
  };
};

export default async function SuggestionsPage({ searchParams }: PageProps) {
  const supabase = createClient();

  // 1. Protect the route and check role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', session.user.id)
    .single();

  const canView = profile && [2, 3, 4, 5].includes(profile.role_id);
  if (!canView) {
    redirect('/dashboard');
  }

  // 2. Fetch data for filters
  const [
    { data: countriesData },
    { data: cropsData },
  ] = await Promise.all([
    supabase.from('countries').select('id, name_ar').order('name_ar'),
    supabase.from('crops').select('id, name_ar').order('name_ar'),
  ]);

  const countries = countriesData?.map(c => ({ value: c.id.toString(), label: c.name_ar })) || [];
  const crops = cropsData?.map(c => ({ value: c.id.toString(), label: c.name_ar })) || [];

  // 3. Build and execute the main query with filters and sorting
  const { country, crop, sortBy } = searchParams;
  const [sortColumn, sortOrder] = sortBy?.split('.') || ['created_at', 'desc'];

  let query = supabase
    .from('feedback')
    .select(`
      id,
      comment_text,
      created_at,
      profiles!inner ( full_name_ar, username_en ),
      export_requirements (
        id,
        countries!inner ( id, name_ar ),
        crops!inner ( id, name_ar )
      )
    `)
    .order(sortColumn, { ascending: sortOrder === 'asc' });

  // Apply filters. Note: Supabase requires a foreign table for this syntax.
  // The filter is applied on the `export_requirements` table through the `feedback` table.
  if (country) {
    query = query.eq('export_requirements.country_id', country);
  }
  if (crop) {
    query = query.eq('export_requirements.crop_id', crop);
  }

  const { data: feedbacks, error } = await query;

  if (error) {
    console.error("Error fetching feedback:", error);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">الاقتراحات والملاحظات</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
      </div>

      <SuggestionsFilters countries={countries} crops={crops} />

      <div className="grid gap-6">
        {feedbacks && feedbacks.length > 0 ? (
          feedbacks.map(fb => (
            <Card key={fb.id}>
              <CardHeader>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {fb.profiles.full_name_ar || fb.profiles.username_en}
                  </span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(fb.created_at), 'yyyy/MM/dd - HH:mm')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{fb.comment_text}</p>
              </CardContent>
              <CardFooter className="bg-muted/50 p-3 text-sm">
                <Link href={`/search?country=${fb.export_requirements?.countries?.id}&crop=${fb.export_requirements?.crops?.id}`} className="flex items-center gap-1 hover:underline">
                  <Target size={14} /> ملاحظة على اشتراط: {fb.export_requirements?.countries?.name_ar} - {fb.export_requirements?.crops?.name_ar}
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground mt-8">لا توجد اقتراحات أو ملاحظات حالياً.</p>
        )}
      </div>
    </div>
  );
}
