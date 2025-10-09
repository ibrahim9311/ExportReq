'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ShadCN UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("فشل تسجيل الدخول", {
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      });
    } else {
      toast.success("تم تسجيل الدخول بنجاح!");
      // Redirect to the central page (dashboard)
      router.push('/dashboard');
      router.refresh(); // To update server components with user session
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">تسجيل الدخول</h1>
            <p className="text-balance text-muted-foreground">
              أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link
                  href="/auth/forgot-password"
                  className="mr-auto inline-block text-sm underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ليس لديك حساب؟{" "}
            <Link href="/auth/signup" className="underline">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {/* يمكنك وضع صورة ترحيبية هنا */}
        <div className="flex h-full w-full items-center justify-center bg-gray-200">
          <h1 className="text-4xl font-bold text-gray-500">[شعار أو صورة الموقع]</h1>
        </div>
      </div>
    </div>
  );
}