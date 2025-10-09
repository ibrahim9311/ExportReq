'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // --- Client-side Validation ---
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.');
      return;
    }

    setIsSubmitting(true);

    // Supabase requires re-authentication to change a password for security reasons.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
        toast.error('خطأ غير متوقع', { description: 'لا يمكن تحديد المستخدم الحالي.' });
        setIsSubmitting(false);
        return;
    }

    // 1. Re-authenticate with the old password. This verifies the user knows the old password.
    const { error: reauthError } = await supabase.auth.reauthenticate();
    if (reauthError) {
        // While reauthenticate() is the official way, it can be tricky.
        // A simpler, effective check is to try signing in with the old password.
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: oldPassword,
        });

        if (signInError) {
            toast.error('فشل التحقق', { description: 'كلمة المرور القديمة غير صحيحة.' });
            setIsSubmitting(false);
            return;
        }
    }

    // 2. If re-authentication is successful, update the password.
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast.error('فشل تحديث كلمة المرور', { description: updateError.message });
    } else {
      toast.success('تم تغيير كلمة المرور بنجاح!');
      router.push('/profile');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">تغيير كلمة المرور</h1>
        <Button asChild variant="outline">
          <Link href="/profile">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للملف الشخصي
          </Link>
        </Button>
      </div>
      <form onSubmit={handleChangePassword}>
        <Card>
          <CardHeader>
            <CardTitle>تحديث كلمة المرور</CardTitle>
            <CardDescription>أدخل كلمة المرور القديمة والجديدة.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="old-password">كلمة المرور القديمة</Label>
              <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ كلمة المرور الجديدة
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}