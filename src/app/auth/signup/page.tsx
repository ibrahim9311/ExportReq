// d:\export_req\new_project\export-req-app\app\auth\signup\page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Client-side Validation ---
    if (email !== confirmEmail) {
      setError("البريد الإلكتروني غير متطابق.");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة.");
      return;
    }
    if (password.length < 6) {
      setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
      return;
    }
    if (!agreedToTerms) {
        setError("يجب الموافقة على شروط وسياسات الموقع.");
        return;
    }

    setLoading(true);

    // --- Advanced Validation: Check if username exists ---
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('username_en')
      .eq('username_en', username)
      .single();

    if (existingProfile) {
      setError("اسم المستخدم هذا محجوز بالفعل. الرجاء اختيار اسم آخر.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This data will be available in the trigger function
        data: {
          username_en: username,
        },
        // This is the URL the user will be redirected to after clicking the confirmation link
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("هذا البريد الإلكتروني مسجل بالفعل. هل تريد تسجيل الدخول؟");
      } else {
        setError(signUpError.message);
      }
    } else if (data.user) {
        // Show a success message
        toast.success("نجاح!", {
          description: "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. الرجاء التحقق من بريدك لإكمال التسجيل.",
          duration: 5000,
        })
        // Optionally, clear the form
        setUsername('');
        setEmail('');
        setConfirmEmail('');
        setPassword('');
        setConfirmPassword('');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-center">
            أدخل بياناتك بالأسفل لإنشاء حسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم (باللغة الإنجليزية)</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-email">تأكيد البريد الإلكتروني</Label>
              <Input id="confirm-email" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            {/* Placeholder for reCAPTCHA */}
            <div className="p-3 text-center bg-gray-200 rounded-md text-sm text-gray-600">
                [سيتم إضافة reCAPTCHA هنا]
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
                <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                <label htmlFor="terms" className="text-sm font-medium leading-none">
                    أوافق على <Link href="/policies" className="underline">شروط وسياسات الموقع</Link>
                </label>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="underline">
              تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
