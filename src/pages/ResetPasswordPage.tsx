import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage } from
'@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
});

type FormData = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'حدث خطأ أثناء إعادة تعيين كلمة المرور';

      if (error.message?.includes('token') || error.message?.includes('Token')) {
        errorMessage = 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية';
      } else if (error.message?.includes('session') || error.message?.includes('Session')) {
        errorMessage = 'الجلسة غير صالحة. يرجى طلب رابط جديد لإعادة تعيين كلمة المرور';
      } else if (error.message?.includes('same password')) {
        errorMessage = 'كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة';
      }

      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-gray-600">
            أدخل كلمة مرور جديدة لحسابك
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) =>
              <FormItem>
                  <FormLabel className="text-gray-700">كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <Input
                    type="password"
                    placeholder="أدخل كلمة المرور الجديدة (8 أحرف على الأقل)"
                    className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                    {...field} />

                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              } />


            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) =>
              <FormItem>
                  <FormLabel className="text-gray-700">تأكيد كلمة المرور</FormLabel>
                  <FormControl>
                    <Input
                    type="password"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                    {...field} />

                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              } />


            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={loading}>

              {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">

            العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    </div>);

}