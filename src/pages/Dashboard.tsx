import { useQuery } from '@tanstack/react-query';
import { supabase, UserProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  FileEdit, 
  Eye, 
  Lightbulb, 
  Edit3, 
  Users, 
  LogOut, 
  User 
} from 'lucide-react';

interface NavButton {
  label: string;
  path: string;
  roles: number[];
  icon: React.ReactNode;
  color: string;
}

const navigationButtons: NavButton[] = [
  {
    label: 'البحث عن متطلبات',
    path: '/search',
    roles: [1, 2, 3, 4, 5],
    icon: <Search className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600'
  },
  {
    label: 'تسجيل متطلب جديد',
    path: '/register-requirement',
    roles: [2, 3, 4, 5],
    icon: <FileEdit className="w-6 h-6" />,
    color: 'from-green-500 to-green-600'
  },
  {
    label: 'عرض التسجيلات',
    path: '/view-registrations',
    roles: [2, 3, 4, 5],
    icon: <Eye className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600'
  },
  {
    label: 'الاقتراحات',
    path: '/suggestions',
    roles: [2, 3, 4, 5],
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    label: 'تعديل المتطلبات',
    path: '/edit-requirements',
    roles: [3, 4, 5],
    icon: <Edit3 className="w-6 h-6" />,
    color: 'from-orange-500 to-orange-600'
  },
  {
    label: 'إدارة المستخدمين',
    path: '/user-management',
    roles: [4, 5],
    icon: <Users className="w-6 h-6" />,
    color: 'from-red-500 to-red-600'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<UserProfile> => {
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('غير مصرح به');
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, role_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!data) throw new Error('الملف الشخصي غير موجود');

      return data;
    },
    enabled: !!supabase
  });

  const handleLogout = async () => {
    try {
      if (!supabase) {
        navigate('/');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'تم تسجيل الخروج بنجاح',
        description: 'إلى اللقاء!'
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تسجيل الخروج',
        variant: 'destructive'
      });
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md" dir="rtl">
          <CardHeader>
            <CardTitle className="text-yellow-600">تكوين مطلوب</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              يرجى تكوين متغيرات البيئة الخاصة بـ Supabase للمتابعة
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center" dir="rtl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md" dir="rtl">
          <CardHeader>
            <CardTitle className="text-red-600">خطأ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">فشل تحميل بيانات المستخدم</p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visibleButtons = navigationButtons.filter(btn => 
    btn.roles.includes(profile.role_id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {profile.first_name?.charAt(0) || 'م'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  مرحباً، {profile.first_name || 'المستخدم'}
                </h1>
                <p className="text-sm text-slate-600">لوحة التحكم الرئيسية</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                الملف الشخصي
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            لوحة التحكم
          </h2>
          <p className="text-slate-600">
            اختر الخدمة المطلوبة من الخيارات أدناه
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleButtons.map((button) => (
            <Card 
              key={button.path}
              className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 hover:border-blue-300 overflow-hidden"
              onClick={() => navigate(button.path)}
            >
              <div className={`h-2 bg-gradient-to-r ${button.color}`} />
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${button.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {button.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {button.label}
                  </h3>
                  <div className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {visibleButtons.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-slate-600 text-lg">
                لا توجد خدمات متاحة لدورك الحالي
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
