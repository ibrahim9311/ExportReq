import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import UserManagementClient from './user-management-client';

export default async function ManageUsersPage() {
  const cookieStore = cookies();
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

  const canManage = profile && [4, 5].includes(profile.role_id);
  if (!canManage) {
    redirect('/dashboard'); // Or show an unauthorized page
  }

  // 2. Fetch initial data (all roles) to pass to the client component
  const { data: roles } = await supabase.from('roles').select('id, name');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
      </div>

      <UserManagementClient allRoles={roles || []} />

    </div>
  );
}