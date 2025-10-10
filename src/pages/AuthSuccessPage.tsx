import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري التحقق من حسابك...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('فشل التحقق من الجلسة');
      }

      if (!session) {
        setStatus('error');
        setMessage('لم يتم العثور على جلسة صالحة');
        return;
      }

      const user = session.user;

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase.
      from('profiles').
      select('*').
      eq('id', user.id).
      single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      }

      // If profile doesn't exist, create it
      if (!profile) {
        const { error: insertError } = await supabase.
        from('profiles').
        insert([{
          id: user.id,
          username_en: user.user_metadata?.username_en || '',
          email: user.email,
          role_id: 1,
          is_active: true,
          created_at: new Date().toISOString()
        }]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Don't fail here, continue to profile completion
        }
      } else if (!profile.is_active) {
        // Activate the profile
        await supabase.
        from('profiles').
        update({ is_active: true }).
        eq('id', user.id);
      }

      setStatus('success');
      setMessage('تم تأكيد حسابك بنجاح!');

      toast({
        title: 'تم تأكيد الحساب',
        description: 'سيتم توجيهك لإكمال بياناتك'
      });

      // Redirect to complete profile if not completed, otherwise dashboard
      setTimeout(() => {
        if (profile && profile.full_name_ar) {
          navigate('/dashboard');
        } else {
          navigate('/complete-profile');
        }
      }, 2000);

    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'حدث خطأ أثناء التحقق من حسابك');

      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل التحقق من الحساب'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            {status === 'loading' &&
            <>
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">جاري التحقق</h1>
                <p className="text-gray-600">{message}</p>
              </>
            }

            {status === 'success' &&
            <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h1>
                <p className="text-gray-600">{message}</p>
              </>
            }

            {status === 'error' &&
            <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">حدث خطأ</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <Button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">

                  العودة إلى تسجيل الدخول
                </Button>
              </>
            }
          </div>
        </div>
      </motion.div>
    </div>);

};

export default AuthSuccessPage;