import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Loader2, Edit2, Save, X, ArrowRight, User } from 'lucide-react';

interface Role {
  id: number;
  name: string;
}

interface Country {
  id: number;
  name_ar: string;
}

interface Profile {
  id: string;
  username_en: string;
  full_name_ar: string;
  phone_number: string;
  birth_date: string;
  company_name: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [formData, setFormData] = useState({
    full_name_ar: '',
    phone_number: '',
    birth_date: '',
    company_name: '',
    role_id: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchRolesAndCountries();
  }, []);

  const fetchRolesAndCountries = async () => {
    try {
      const { data: rolesData } = await supabase.
      from('roles').
      select('id, name').
      order('name');

      const { data: countriesData } = await supabase.
      from('countries').
      select('id, name_ar').
      order('name_ar');

      if (rolesData) setRoles(rolesData);
      if (countriesData) setCountries(countriesData);
    } catch (error) {
      console.error('Error fetching roles and countries:', error);
    }
  };

  const fetchProfile = async () => {
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

      const { data: profileData, error } = await supabase.
      from('profiles').
      select('*').
      eq('id', user.id).
      single();

      if (error) throw error;

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name_ar: profileData.full_name_ar || '',
          phone_number: profileData.phone_number || '',
          birth_date: profileData.birth_date || '',
          company_name: profileData.company_name || '',
          role_id: profileData.role_id?.toString() || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحميل بيانات الملف الشخصي'
      });
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    if (!profile) return;

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.
      from('profiles').
      update({
        full_name_ar: formData.full_name_ar.trim(),
        phone_number: formData.phone_number.trim(),
        birth_date: formData.birth_date,
        company_name: formData.company_name.trim(),
        role_id: parseInt(formData.role_id)
      }).
      eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث بياناتك الشخصية'
      });

      setEditing(false);
      await fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: error.message || 'فشل تحديث البيانات'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name_ar: profile.full_name_ar || '',
        phone_number: profile.phone_number || '',
        birth_date: profile.birth_date || '',
        company_name: profile.company_name || '',
        role_id: profile.role_id?.toString() || ''
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>);

  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full p-8 text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-indigo-900">لم يتم العثور على البيانات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">لم يتم العثور على ملفك الشخصي</p>
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>);

  }

  const roleName = roles.find((r) => r.id === profile.role_id)?.name || 'غير محدد';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">الملف الشخصي</CardTitle>
                  <CardDescription className="text-indigo-100">إدارة معلوماتك الشخصية</CardDescription>
                </div>
              </div>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="sm"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">المعلومات الأساسية</h3>
              {!editing ?
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  تعديل البيانات
                </Button> :

              <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving} className="gap-2">
                    <X className="w-4 h-4" />
                    إلغاء
                  </Button>
                </div>
              }
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-right block mb-2 text-gray-700">الاسم الكامل</Label>
                  {editing ?
                  <Input
                    type="text"
                    value={formData.full_name_ar}
                    onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                    className="text-right"
                    placeholder="أدخل اسمك الكامل" /> :


                  <div className="p-3 bg-gray-50 rounded-lg text-right">
                      {profile.full_name_ar || 'غير محدد'}
                    </div>
                  }
                </div>

                <div>
                  <Label className="text-right block mb-2 text-gray-700">اسم المستخدم</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-right text-gray-500">
                    {profile.username_en}
                  </div>
                </div>

                <div>
                  <Label className="text-right block mb-2 text-gray-700">رقم الهاتف</Label>
                  {editing ?
                  <Input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="text-right"
                    placeholder="05xxxxxxxx" /> :


                  <div className="p-3 bg-gray-50 rounded-lg text-right">
                      {profile.phone_number || 'غير محدد'}
                    </div>
                  }
                </div>

                <div>
                  <Label className="text-right block mb-2 text-gray-700">تاريخ الميلاد</Label>
                  {editing ?
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="text-right" /> :


                  <div className="p-3 bg-gray-50 rounded-lg text-right">
                      {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </div>
                  }
                </div>

                <div>
                  <Label className="text-right block mb-2 text-gray-700">اسم الشركة</Label>
                  {editing ?
                  <Input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="text-right"
                    placeholder="أدخل اسم الشركة" /> :


                  <div className="p-3 bg-gray-50 rounded-lg text-right">
                      {profile.company_name || 'غير محدد'}
                    </div>
                  }
                </div>

                <div>
                  <Label className="text-right block mb-2 text-gray-700">الدور الوظيفي</Label>
                  {editing ?
                  <Select
                    value={formData.role_id}
                    onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الدور الوظيفي" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) =>
                      <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                      )}
                      </SelectContent>
                    </Select> :

                  <div className="p-3 bg-gray-50 rounded-lg text-right">
                      {roleName}
                    </div>
                  }
                </div>
              </div>

              <div className="pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">الحالة:</span>
                    <span className={`font-semibold ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {profile.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">تاريخ التسجيل:</span>
                    <span className="font-semibold text-gray-700">
                      {new Date(profile.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

};

export default ProfilePage;