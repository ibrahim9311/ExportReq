import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full p-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-900 mb-4">الصفحة الشخصية</h1>
        <p className="text-6xl mb-6">⏳</p>
        <p className="text-xl text-gray-600 mb-8">قريباً</p>
        <Button onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للوحة التحكم
        </Button>
      </Card>
    </div>);

};

export default ProfilePage;