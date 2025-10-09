'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect handles the session update after the user clicks the link.
    // Supabase JS SDK automatically handles the code exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // The user is now in a password recovery state.
        // We don't need to do anything special here, just allow them to set a new password.
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور غير متطابقة.');
      return;
    }
    if (newPassword.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      toast.error('فشل إعادة التعيين', { description: updateError.message });
    } else {
      toast.success('تم تحديث كلمة المرور بنجاح!');
      router.push('/dashboard');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-center">أدخل كلمة المرور الجديدة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}