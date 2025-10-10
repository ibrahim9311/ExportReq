import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, FilePlus, FileText, MessageSquare, Edit, Users, User } from 'lucide-react';

interface Profile {
  role_id: number;
  full_name_ar: string;
}

interface NavigationButton {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: number[];
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role_id, full_name_ar')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          navigate('/');
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navigationButtons: NavigationButton[] = [
    {
      label: 'البحث عن الاشتراطات',
      path: '/search',
      icon: <Search className="w-8 h-8" />,
      roles: [1, 2, 3, 4, 5]
    },
    {
      label: 'تسجيل اشتراط جديد',
      path: '/add-requirement',
      icon: <FilePlus className="w-8 h-8" />,
      roles: [2, 3, 4, 5]
    },
    {
      label: 'عرض التسجيلات',
      path: '/view-requirements',
      icon: <FileText className="w-8 h-8" />,
      roles: [2, 3, 4, 5]
    },
    {
      label: 'الاقتراحات',
      path: '/suggestions',
      icon: <MessageSquare className="w-8 h-8" />,
      roles: [2, 3, 4, 5]
    },
    {
      label: 'التعديل على الاشتراطات',
      path: '/edit-requirements',
      icon: <Edit className="w-8 h-8" />,
      roles: [3, 4, 5]
    },
    {
      label: 'إدارة المستخدمين',
      path: '/manage-users',
      icon: <Users className="w-8 h-8" />,
      roles: [4, 5]
    }
  ];

  const hasAccess = (roles: number[]) => {
    return profile && roles.includes(profile.role_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-indigo-900">
              مرحباً، {profile?.full_name_ar || 'مستخدم'}
            </h1>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/profile')} variant="outline" className="gap-2">
                <User className="w-4 h-4" />
                الصفحة الشخصية
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            لوحة التحكم الرئيسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigationButtons.map((button) => 
              hasAccess(button.roles) ? (
                <Card
                  key={button.path}
                  className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white hover:bg-indigo-50 border-2 hover:border-indigo-300"
                  onClick={() => navigate(button.path)}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
                      {button.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {button.label}
                    </h3>
                  </div>
                </Card>
              ) : null
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
