import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PostgrestError } from '@supabase/supabase-js';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, User, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns-jalali';

type Feedback = {
  id: number;
  comment_text: string;
  created_at: string;
  profiles: {
    full_name_ar: string | null;
    username_en: string;
  } | null;
  export_requirements: {
    id: number;
    countries: { id: number; name_ar: string } | null;
    crops: { id: number; name_ar: string } | null;
  } | null;
};

export default async function SuggestionsPage() {
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

  // 2. Fetch feedback data
  const { data: feedbacks, error } = await supabase
    .from('feedback')
    .select(`
      id,
      comment_text,
      created_at,
      profiles ( full_name_ar, username_en ),
      export_requirements (
        id,
        countries ( id, name_ar ),
        crops ( id, name_ar )
      )
    `)
    .order('created_at', { ascending: false }) as { data: Feedback[] | null, error: PostgrestError | null };

  if (error) {
    console.error("Error fetching feedback:", error);
    // Optionally show an error message
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

      <div className="grid gap-6">
        {feedbacks && feedbacks.length > 0 ? (
          feedbacks.map(fb => (
            <Card key={fb.id}>
              <CardHeader>
                <CardDescription className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1"><User size={14} /> {fb.profiles?.full_name_ar || fb.profiles?.username_en}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(fb.created_at), 'yyyy/MM/dd - HH:mm')}</span>
                </CardDescription>
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
