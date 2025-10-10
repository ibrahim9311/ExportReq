import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    emailOrUsername: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.emailOrUsername.trim() || !credentials.password.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول'
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.emailOrUsername.trim(),
        password: credentials.password
      });

      if (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'بيانات الدخول غير صحيحة';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'يرجى تأكيد بريدك الإلكتروني أولاً';
        } else if (error.message.includes('Email link is invalid')) {
          errorMessage = 'رابط البريد الإلكتروني غير صالح';
        }

        toast({
          variant: 'destructive',
          title: 'خطأ في تسجيل الدخول',
          description: errorMessage
        });
        return;
      }

      if (data.user) {
        // Check if user has completed profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name_ar, role_id')
          .eq('id', data.user.id)
          .single();

        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك في نظام إدارة اشتراطات التصدير'
        });

        // Redirect based on profile completion
        if (profile && profile.full_name_ar) {
          navigate('/dashboard');
        } else {
          navigate('/complete-profile');
        }
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تسجيل الدخول'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3">

              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ExportReq - نظام إدارة اشتراطات التصدير
              </h1>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-right space-y-6">

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">

              مرحباً بك في
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                نظام إدارة اشتراطات التصدير
              </span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed">

              نظام متكامل لإدارة وتتبع اشتراطات التصدير بكل سهولة وكفاءة
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-4 justify-center md:justify-end">

              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600">✓</span>
                </div>
                <span>إدارة فعالة</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">✓</span>
                </div>
                <span>تتبع دقيق</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-pink-600">✓</span>
                </div>
                <span>أمان عالي</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}>

            <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">تسجيل الدخول</h3>
                <p className="text-gray-600">أدخل بياناتك للوصول إلى حسابك</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="emailOrUsername" className="text-right block mb-2">
                    البريد الإلكتروني أو اسم المستخدم
                  </Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    required
                    value={credentials.emailOrUsername}
                    onChange={(e) => setCredentials({ ...credentials, emailOrUsername: e.target.value })}
                    className="text-right"
                    placeholder="أدخل البريد الإلكتروني" />

                </div>

                <div>
                  <Label htmlFor="password" className="text-right block mb-2">
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="text-right"
                    placeholder="أدخل كلمة المرور" />

                </div>

                <div className="text-left">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline">

                    نسيت كلمة السر؟
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading}>

                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-4">ليس لديك حساب؟</p>
                <Link to="/signup">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50">

                    إنشاء حساب جديد
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mr-auto">
              <span className="text-white text-2xl">📋</span>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2 text-right">إدارة الاشتراطات</h4>
            <p className="text-gray-600 text-right">
              إدارة شاملة لجميع اشتراطات التصدير بطريقة منظمة وفعالة
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mr-auto">
              <span className="text-white text-2xl">📊</span>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2 text-right">تقارير تفصيلية</h4>
            <p className="text-gray-600 text-right">
              تقارير دقيقة وتحليلات شاملة لمتابعة الأداء
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 mr-auto">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2 text-right">أمان متقدم</h4>
            <p className="text-gray-600 text-right">
              حماية قصوى لبياناتك مع أعلى معايير الأمان
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 py-8 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} ExportReq. جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>);

};

export default HomePage;