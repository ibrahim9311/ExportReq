import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FilePlus, FileText, MessageSquare, Edit, Users, User, Calendar, Package, TrendingUp, Activity, CheckCircle2, Clock } from 'lucide-react';

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

interface Subscription {
  package_name: string;
  end_date: string;
  start_date: string;
  is_active: boolean;
}

interface Stats {
  totalRequirements: number;
  recentEdits: number;
  activeSubscription: boolean;
}

interface Activity {
  id: number;
  edit_type: string;
  edit_date: string;
  notes: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalRequirements: 0, recentEdits: 0, activeSubscription: false });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase.
        from('profiles').
        select('role_id, full_name_ar').
        eq('id', user.id).
        single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          navigate('/');
          return;
        }

        setProfile(profileData);

        // Fetch subscription status
        const { data: subscriptionData } = await supabase.
        from('user_subscriptions').
        select(`
            start_date,
            end_date,
            packages (name)
          `).
        eq('user_id', user.id).
        order('end_date', { ascending: false }).
        limit(1).
        single();

        if (subscriptionData) {
          const endDate = new Date(subscriptionData.end_date);
          const today = new Date();
          const isActive = endDate >= today;

          setSubscription({
            package_name: subscriptionData.packages?.name || 'غير محدد',
            end_date: subscriptionData.end_date,
            start_date: subscriptionData.start_date,
            is_active: isActive
          });
        }

        // Fetch requirements count
        const { count: requirementsCount } = await supabase.
        from('export_requirements').
        select('*', { count: 'exact', head: true }).
        eq('user_id', user.id);

        // Fetch recent edits count (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: editsCount } = await supabase.
        from('edit_logs').
        select('*', { count: 'exact', head: true }).
        eq('user_id', user.id).
        gte('edit_date', sevenDaysAgo.toISOString());

        // Fetch recent activities
        const { data: activitiesData } = await supabase.
        from('edit_logs').
        select('id, edit_type, edit_date, notes').
        eq('user_id', user.id).
        order('edit_date', { ascending: false }).
        limit(5);

        setStats({
          totalRequirements: requirementsCount || 0,
          recentEdits: editsCount || 0,
          activeSubscription: subscription?.is_active || false
        });

        setRecentActivities(activitiesData || []);

      } catch (error) {
        console.error('Error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navigationButtons: NavigationButton[] = [
  {
    label: 'البحث عن الاشتراطات',
    path: '/search',
    icon: <Search className="w-6 h-6" />,
    roles: [1, 2, 3, 4, 5]
  },
  {
    label: 'تسجيل اشتراط جديد',
    path: '/add-requirement',
    icon: <FilePlus className="w-6 h-6" />,
    roles: [2, 3, 4, 5]
  },
  {
    label: 'عرض التسجيلات',
    path: '/view-requirements',
    icon: <FileText className="w-6 h-6" />,
    roles: [2, 3, 4, 5]
  },
  {
    label: 'الاقتراحات',
    path: '/suggestions',
    icon: <MessageSquare className="w-6 h-6" />,
    roles: [2, 3, 4, 5]
  },
  {
    label: 'التعديل على الاشتراطات',
    path: '/edit-requirements',
    icon: <Edit className="w-6 h-6" />,
    roles: [3, 4, 5]
  },
  {
    label: 'إدارة المستخدمين',
    path: '/admin/users',
    icon: <Users className="w-6 h-6" />,
    roles: [4, 5]
  }];


  const hasAccess = (roles: number[]) => {
    return profile && roles.includes(profile.role_id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) =>
            <Skeleton key={i} className="h-32" />
            )}
          </div>
        </main>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
                مرحباً، {profile?.full_name_ar || 'مستخدم'}
              </h1>
              {subscription &&
              <div className="mt-2 flex items-center gap-2">
                  <Badge variant={subscription.is_active ? 'default' : 'secondary'} className="text-sm">
                    {subscription.is_active ? <CheckCircle2 className="w-3 h-3 ml-1" /> : <Clock className="w-3 h-3 ml-1" />}
                    {subscription.is_active ? 'اشتراك نشط' : 'اشتراك منتهي'}
                  </Badge>
                </div>
              }
            </div>
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  إجمالي الاشتراطات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats.totalRequirements}</p>
                <p className="text-sm text-blue-100 mt-1">اشتراط مسجل</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  التعديلات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats.recentEdits}</p>
                <p className="text-sm text-green-100 mt-1">خلال 7 أيام</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${subscription?.is_active ? 'from-purple-500 to-purple-600' : 'from-gray-500 to-gray-600'} text-white`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  حالة الاشتراك
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ?
                <>
                    <p className="text-xl font-bold">{subscription.package_name}</p>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      ينتهي: {formatDate(subscription.end_date)}
                    </p>
                  </> :

                <p className="text-lg">لا توجد اشتراكات</p>
                }
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activities */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  النشاطات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ?
                <div className="space-y-4">
                    {recentActivities.map((activity) =>
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-indigo-100 rounded-full">
                          <Edit className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{activity.edit_type || 'تعديل'}</span>
                            <span className="text-sm text-gray-500">{getTimeAgo(activity.edit_date)}</span>
                          </div>
                          {activity.notes &&
                      <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>
                      }
                        </div>
                      </div>
                  )}
                  </div> :

                <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>لا توجد نشاطات حديثة</p>
                  </div>
                }
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">الدور</p>
                  <p className="font-semibold text-gray-800">
                    {profile?.role_id === 1 && 'عضو'}
                    {profile?.role_id === 2 && 'مسجل'}
                    {profile?.role_id === 3 && 'محرر'}
                    {profile?.role_id === 4 && 'مدير'}
                    {profile?.role_id === 5 && 'مدير عام'}
                  </p>
                </div>
                
                {subscription &&
                <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">تاريخ بدء الاشتراك</p>
                    <p className="font-semibold text-gray-800">{formatDate(subscription.start_date)}</p>
                  </div>
                }

                <Button
                  onClick={() => navigate('/search')}
                  className="w-full"
                  variant="outline">

                  <Search className="w-4 h-4 ml-2" />
                  ابدأ البحث
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Cards */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">الإجراءات السريعة</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {navigationButtons.map((button) =>
              hasAccess(button.roles) ?
              <Card
                key={button.path}
                className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white hover:bg-indigo-50 border-2 hover:border-indigo-300 group"
                onClick={() => navigate(button.path)}>

                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {button.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {button.label}
                      </h3>
                    </div>
                  </Card> :
              null
              )}
            </div>
          </div>
        </div>
      </main>
    </div>);

};

export default DashboardPage;