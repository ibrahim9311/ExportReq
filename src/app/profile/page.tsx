import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProfileForm from './profile-form';

export default async function ProfilePage() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    console.error("Error fetching profile for edit:", error);
    // This can happen if the profile is not fully created
    redirect('/auth/complete-registration');
  }

  // We also need the user's email from the auth table, which is not in the profiles table
  const userEmail = session.user.email;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">الصفحة الشخصية</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
      </div>

      <ProfileForm profile={profile} email={userEmail || ''} />

    </div>
  );
}