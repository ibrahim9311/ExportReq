import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface Role {
  id: number;
  name: string;
}

interface Country {
  id: number;
  name_ar: string;
}

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [formData, setFormData] = useState({
    full_name_ar: '',
    phone_number: '',
    birth_date: '',
    company_name: '',
    role_id: '',
    country_id: ''
  });

  useEffect(() => {
    checkAuth();
    fetchRolesAndCountries();
  }, []);

  const fetchRolesAndCountries = async () => {
    try {
      const { data: rolesData } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');
      
      const { data: countriesData } = await supabase
        .from('countries')
        .select('id, name_ar')
        .order('name_ar');

      if (rolesData) setRoles(rolesData);
      if (countriesData) setCountries(countriesData);
    } catch (error) {
      console.error('Error fetching roles and countries:', error);
    }
  };

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name_ar')
        .eq('id', user.id)
        .single();

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

  const validateForm = () => {
    if (!formData.full_name_ar.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال الاسم الكامل'
      });
      return false;
    }

    if (!formData.phone_number.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال رقم الهاتف'
      });
      return false;
    }

    const phoneRegex = /^(05|5)\d{8}$/;
    if (!phoneRegex.test(formData.phone_number.replace(/\s/g, ''))) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
      });
      return false;
    }

    if (!formData.birth_date) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال تاريخ الميلاد'
      });
      return false;
    }

    if (!formData.company_name.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال اسم الشركة'
      });
      return false;
    }

    if (!formData.role_id) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء اختيار الدور الوظيفي'
      });
      return false;
    }

    return true;
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not found');
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username_en: user.user_metadata?.username_en || user.email?.split('@')[0] || '',
          full_name_ar: formData.full_name_ar.trim(),
          phone_number: formData.phone_number.trim(),
          birth_date: formData.birth_date,
          company_name: formData.company_name.trim(),
          role_id: parseInt(formData.role_id),
          is_active: true,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: 'تم إكمال الملف الشخصي بنجاح',
        description: 'سيتم توجيهك إلى لوحة التحكم'
      });

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
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
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">إكمال الملف الشخصي</h1>
            <p className="text-gray-600">يرجى إدخال بياناتك لإكمال التسجيل</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="full_name_ar" className="text-right block mb-2">
                  الاسم الكامل <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name_ar"
                  type="text"
                  required
                  value={formData.full_name_ar}
                  onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                  className="text-right"
                  placeholder="أدخل اسمك الكامل بالعربية"
                />
              </div>

              <div>
                <Label htmlFor="phone_number" className="text-right block mb-2">
                  رقم الهاتف <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="text-right"
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div>
                <Label htmlFor="birth_date" className="text-right block mb-2">
                  تاريخ الميلاد <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  required
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="company_name" className="text-right block mb-2">
                  اسم الشركة <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="text-right"
                  placeholder="أدخل اسم شركتك"
                />
              </div>

              <div>
                <Label htmlFor="role_id" className="text-right block mb-2">
                  الدور الوظيفي <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                  required>
                  <SelectTrigger id="role_id" className="text-right">
                    <SelectValue placeholder="اختر الدور الوظيفي" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="country_id" className="text-right block mb-2">
                  الدولة (اختياري)
                </Label>
                <Select
                  value={formData.country_id}
                  onValueChange={(value) => setFormData({ ...formData, country_id: value })}>
                  <SelectTrigger id="country_id" className="text-right">
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id.toString()}>
                        {country.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white mt-6"
              disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {loading ? 'جاري الحفظ...' : 'حفظ وإكمال التسجيل'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteProfilePage;