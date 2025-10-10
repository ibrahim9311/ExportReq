import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';

const SignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get reCAPTCHA site key from environment variables
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LfOiuUrAAAAAGsNyqsNSb5PPXGiBKROd9PTnW6G';

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

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (token) {
      // Clear reCAPTCHA error if token is received
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.recaptcha;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط';
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
    } else if (passwordStrength < 50) {
      newErrors.password = 'كلمة المرور ضعيفة جداً';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    if (!recaptchaToken) {
      newErrors.recaptcha = 'يرجى إكمال التحقق من reCAPTCHA';
    }

    if (!termsAgreed) {
      newErrors.terms = 'يجب الموافقة على الشروط والأحكام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkExistingUser = async (): Promise<boolean> => {
    try {
      const { data: existingUsername } = await supabase.
      from('profiles').
      select('username_en').
      eq('username_en', formData.username).
      single();

      if (existingUsername) {
        setErrors((prev) => ({ ...prev, username: 'اسم المستخدم مستخدم بالفعل' }));
        return false;
      }

      const { data: existingEmail } = await supabase.
      from('profiles').
      select('email').
      eq('email', formData.email).
      single();

      if (existingEmail) {
        toast({
          variant: 'destructive',
          title: 'هذا البريد مسجل بالفعل',
          description: 'يمكنك تسجيل الدخول باستخدام حسابك الحالي'
        });
        setTimeout(() => navigate('/'), 2000);
        return false;
      }

      return true;
    } catch (error: any) {
      if (error.code === 'PGRST116') return true;
      console.error('Error checking existing user:', error);
      return true;
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
      const userExists = await checkExistingUser();
      if (!userExists) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username_en: formData.username,
            recaptcha_token: recaptchaToken
          },
          emailRedirectTo: `${window.location.origin}/complete-profile`
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'تم إنشاء الحساب',
          description: 'الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب'
        });

        // Reset reCAPTCHA
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setRecaptchaToken(null);

        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء الحساب',
        description: error.message || 'حدث خطأ أثناء إنشاء الحساب'
      });

      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
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

  // Show warning if reCAPTCHA site key is not configured
  if (!RECAPTCHA_SITE_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">تكوين reCAPTCHA مطلوب</h1>
          <p className="text-gray-600 mb-6" dir="rtl">
            لم يتم تكوين مفتاح موقع Google reCAPTCHA. يرجى إضافة المتغير التالي إلى ملف البيئة الخاص بك:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg text-left">
            <code className="text-sm">VITE_RECAPTCHA_SITE_KEY=your_site_key_here</code>
          </div>
          <p className="text-sm text-gray-500 mt-4" dir="rtl">
            للحصول على مفاتيح reCAPTCHA، قم بزيارة:{' '}
            <a
              href="https://www.google.com/recaptcha/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline">

              Google reCAPTCHA Admin
            </a>
          </p>
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
                placeholder="username_en" />

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
                placeholder="example@domain.com" />

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
                placeholder="example@domain.com" />

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
                placeholder="••••••••" />

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
                placeholder="••••••••" />

              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 text-right">{errors.confirmPassword}</p>}
            </div>

            {/* reCAPTCHA Widget */}
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
                onExpired={() => setRecaptchaToken(null)}
                onErrored={() => {
                  setRecaptchaToken(null);
                  toast({
                    variant: 'destructive',
                    title: 'خطأ في reCAPTCHA',
                    description: 'فشل تحميل reCAPTCHA. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
                  });
                }} />

            </div>
            {errors.recaptcha && <p className="text-red-500 text-sm text-center">{errors.recaptcha}</p>}

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="terms"
                checked={termsAgreed}
                onCheckedChange={(checked) => setTermsAgreed(checked as boolean)} />

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
              disabled={loading || !recaptchaToken}>

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