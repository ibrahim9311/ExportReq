import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name_ar: '',
    phone_number: '',
    birth_date: '',
    company_name: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'غير مصرح',
          description: 'يجب تسجيل الدخول أولاً'
        });
        navigate('/');
        return;
      }

      const { data: profile } = await supabase.
      from('profiles').
      select('full_name_ar').
      eq('user_id', user.id).
      single();

      if (profile?.full_name_ar) {
        toast({
          title: 'تم إكمال الملف الشخصي بالفعل',
          description: 'سيتم توجيهك إلى لوحة التحكم'
        });
        navigate('/dashboard');
        return;
      }

      setUserId(user.id);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لم يتم العثور على معرف المستخدم'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not found');
      }

      const { error } = await supabase.
      from('profiles').
      upsert({
        user_id: userId,
        email: user.email,
        username_en: user.user_metadata?.username_en || '',
        full_name_ar: formData.full_name_ar,
        phone_number: formData.phone_number,
        birth_date: formData.birth_date,
        company_name: formData.company_name,
        role_id: 1
      }, {
        onConflict: 'user_id'
      });

      if (error) throw error;

      toast({
        title: 'تم إكمال الملف الشخصي بنجاح',
        description: 'سيتم توجيهك إلى لوحة التحكم'
      });

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في حفظ البيانات',
        description: error.message || 'حدث خطأ أثناء حفظ البيانات'
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">إكمال الملف الشخصي</h1>
            <p className="text-gray-600">يرجى إدخال بياناتك لإكمال التسجيل</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="full_name_ar" className="text-right block mb-2">الاسم الكامل</Label>
              <Input
                id="full_name_ar"
                type="text"
                required
                value={formData.full_name_ar}
                onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                className="text-right"
                placeholder="أدخل اسمك الكامل بالعربية" />

            </div>

            <div>
              <Label htmlFor="phone_number" className="text-right block mb-2">رقم الهاتف</Label>
              <Input
                id="phone_number"
                type="tel"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="text-right"
                placeholder="05xxxxxxxx" />

            </div>

            <div>
              <Label htmlFor="birth_date" className="text-right block mb-2">تاريخ الميلاد</Label>
              <Input
                id="birth_date"
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="text-right" />

            </div>

            <div>
              <Label htmlFor="company_name" className="text-right block mb-2">اسم الشركة</Label>
              <Input
                id="company_name"
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="text-right"
                placeholder="أدخل اسم شركتك" />

            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white mt-6"
              disabled={loading}>

              {loading ? 'جاري الحفظ...' : 'حفظ وإكمال التسجيل'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>);

};

export default CompleteProfilePage;