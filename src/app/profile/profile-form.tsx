'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Profile = {
  id: string;
  username_en: string;
  full_name_ar: string | null;
  phone_number: string | null;
  birth_date: string | null;
  company_name: string | null;
  role_id: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

interface ProfileFormProps {
  profile: Profile;
  email: string;
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name_ar || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '');
  const [birthDate, setBirthDate] = useState(profile.birth_date || '');
  const [companyName, setCompanyName] = useState(profile.company_name || '');

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name_ar: fullName,
        phone_number: phoneNumber,
        birth_date: birthDate || null,
        company_name: companyName,
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('فشل تحديث البيانات', { description: error.message });
    } else {
      toast.success('تم تحديث بياناتك بنجاح');
      router.refresh(); // Refresh the page to show new data if needed
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleUpdate}>
      <Card>
        <CardHeader>
          <CardTitle>بيانات الحساب</CardTitle>
          <CardDescription>يمكنك تعديل بياناتك الشخصية من هنا.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input id="username" value={profile.username_en} readOnly disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" value={email} readOnly disabled />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
              <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthDate">تاريخ الميلاد</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="companyName">اسم المنشأة</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
          <Button asChild variant="secondary">
            <Link href="/profile/change-password">تغيير كلمة المرور</Link>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}