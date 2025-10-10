import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const SignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط';
    } else if (formData.username.length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'البريد الإلكتروني غير متطابق';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else if (passwordStrength < 50) {
      newErrors.password = 'كلمة المرور ضعيفة جداً. استخدم أحرف كبيرة وصغيرة وأرقام ورموز';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    if (!termsAgreed) {
      newErrors.terms = 'يجب الموافقة على الشروط والأحكام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkExistingUsername = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.
      from('profiles').
      select('username_en').
      eq('username_en', formData.username).
      maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        return true; // Allow signup to proceed, auth will handle conflicts
      }

      if (data) {
        setErrors((prev) => ({ ...prev, username: 'اسم المستخدم مستخدم بالفعل' }));
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error checking existing username:', error);
      return true; // Allow signup to proceed
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'خطأ في النموذج',
        description: 'يرجى تصحيح الأخطاء والمحاولة مرة أخرى'
      });
      return;
    }

    setLoading(true);

    try {
      // Check if username exists in profiles table
      const usernameAvailable = await checkExistingUsername();
      if (!usernameAvailable) {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'اسم المستخدم مستخدم',
          description: 'الرجاء اختيار اسم مستخدم آخر'
        });
        return;
      }

      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username_en: formData.username.trim()
          },
          emailRedirectTo: `${window.location.origin}/onauthsuccess`
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast({
            variant: 'destructive',
            title: 'هذا البريد مسجل بالفعل',
            description: 'يمكنك تسجيل الدخول باستخدام حسابك الحالي'
          });
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        throw error;
      }

      if (data.user) {
        // Create profile entry with minimal info
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            username_en: formData.username.trim(),
            email: formData.email.trim(),
            role_id: 1,
            is_active: false,
            created_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Continue anyway as profile will be created on email confirmation
        }

        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب'
        });

        // Clear form
        setFormData({
          username: '',
          email: '',
          confirmEmail: '',
          password: '',
          confirmPassword: ''
        });
        setTermsAgreed(false);

        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء الحساب',
        description: error.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 30) return 'ضعيفة';
    if (passwordStrength < 60) return 'متوسطة';
    return 'قوية';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">إنشاء حساب جديد</h1>
            <p className="text-gray-600">انضم إلى نظام إدارة اشتراطات التصدير</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-right block mb-2">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="text-right"
                placeholder="username_en"
                disabled={loading} />

              {errors.username && <p className="text-red-500 text-sm mt-1 text-right">{errors.username}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="text-right block mb-2">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-right"
                placeholder="example@domain.com"
                disabled={loading} />

              {errors.email && <p className="text-red-500 text-sm mt-1 text-right">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="confirmEmail" className="text-right block mb-2">تأكيد البريد الإلكتروني</Label>
              <Input
                id="confirmEmail"
                type="email"
                required
                value={formData.confirmEmail}
                onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                className="text-right"
                placeholder="example@domain.com"
                disabled={loading} />

              {errors.confirmEmail && <p className="text-red-500 text-sm mt-1 text-right">{errors.confirmEmail}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-right block mb-2">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="text-right"
                placeholder="••••••••"
                disabled={loading} />

              {formData.password &&
              <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">قوة كلمة المرور: {getStrengthText()}</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }} />

                  </div>
                </div>
              }
              {errors.password && <p className="text-red-500 text-sm mt-1 text-right">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-right block mb-2">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="text-right"
                placeholder="••••••••"
                disabled={loading} />

              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 text-right">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="terms"
                checked={termsAgreed}
                onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                disabled={loading} />

              <Label htmlFor="terms" className="text-sm cursor-pointer">
                أوافق على{' '}
                <Link to="/policies" className="text-indigo-600 hover:text-indigo-700 underline">
                  الشروط والأحكام
                </Link>
              </Label>
            </div>
            {errors.terms && <p className="text-red-500 text-sm text-right">{errors.terms}</p>}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white mt-6"
              disabled={loading}>

              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>);

};

export default SignupPage;