'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // If no user is logged in, redirect to login page
        toast.error("الرجاء تسجيل الدخول أولاً.");
        router.push('/'); // Redirect to login page which is the root
      }
      setLoading(false);
    };

    checkUser();
  }, [supabase, router]);

  const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name_ar: fullName,
        phone_number: phoneNumber,
        birth_date: birthDate || null, // Handle empty date
        company_name: companyName,
      })
      .eq('id', user.id);

    if (error) {
      toast.error("حدث خطأ أثناء تحديث الملف الشخصي:", {
        description: error.message,
      });
    } else {
      toast.success("اكتمل ملفك الشخصي بنجاح!");
      // Redirect to the central page (dashboard)
      router.push('/dashboard');
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">إكمال التسجيل</CardTitle>
          <CardDescription className="text-center">
            مرحباً بك! الرجاء إكمال بيانات ملفك الشخصي.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">الاسم الكامل (باللغة العربية)</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
              <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthDate">تاريخ الميلاد</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyName">اسم المنشأة (اختياري)</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ والانتقال للوحة التحكم'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}