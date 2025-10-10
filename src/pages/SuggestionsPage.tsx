import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Filter, Star, User, Calendar, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Feedback {
  id: number;
  user_id: string;
  comment_text: string;
  created_at: string;
  notes: string;
  profiles?: {
    full_name_ar: string;
  };
}

interface Profile {
  role_id: number;
  full_name_ar: string;
}

const SuggestionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [adminResponse, setAdminResponse] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  // Form state
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    comment_text: '',
    priority: '2'
  });

  useEffect(() => {
    loadData();
  }, [navigate, filterStatus]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.id);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role_id, full_name_ar')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch feedback based on role
      await loadFeedback(user.id, profileData?.role_id || 1);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async (uid: string, roleId: number) => {
    try {
      let query = supabase
        .from('feedback')
        .select(`
          *,
          profiles (full_name_ar)
        `)
        .order('created_at', { ascending: false });

      // Users see only their feedback, admins see all
      if (roleId < 4) {
        query = query.eq('user_id', uid);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFeedbackList(data || []);
    } catch (error: any) {
      console.error('Error loading feedback:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحميل الاقتراحات'
      });
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedback.comment_text.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى كتابة نص الاقتراح'
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([{
          user_id: userId,
          comment_text: newFeedback.comment_text,
          notes: `الأولوية: ${getPriorityLabel(newFeedback.priority)}`
        }]);

      if (error) throw error;

      toast({
        title: 'تم إرسال الاقتراح بنجاح',
        description: 'شكراً لك على مشاركتنا رأيك'
      });

      setNewFeedback({ title: '', comment_text: '', priority: '2' });
      await loadFeedback(userId, profile?.role_id || 1);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال الاقتراح'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminResponse = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return;

    try {
      const currentNotes = selectedFeedback.notes || '';
      const updatedNotes = currentNotes + '\n\n--- رد الإدارة ---\n' + adminResponse;

      const { error } = await supabase
        .from('feedback')
        .update({ notes: updatedNotes })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({
        title: 'تم إضافة الرد بنجاح',
        description: 'تم حفظ ردك على الاقتراح'
      });

      setAdminResponse('');
      setSelectedFeedback(null);
      await loadFeedback(userId, profile?.role_id || 1);
    } catch (error: any) {
      console.error('Error adding response:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إضافة الرد'
      });
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      '1': 'منخفضة',
      '2': 'متوسطة',
      '3': 'عالية'
    };
    return labels[priority] || 'متوسطة';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      '1': 'bg-green-100 text-green-800',
      '2': 'bg-yellow-100 text-yellow-800',
      '3': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractPriority = (notes: string) => {
    if (!notes) return '2';
    if (notes.includes('منخفضة')) return '1';
    if (notes.includes('عالية')) return '3';
    return '2';
  };

  const isAdmin = profile && profile.role_id >= 4;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
                  الاقتراحات والملاحظات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  شاركنا آراءك واقتراحاتك لتحسين النظام
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="submit" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submit">إضافة اقتراح</TabsTrigger>
              <TabsTrigger value="view">عرض الاقتراحات</TabsTrigger>
            </TabsList>

            {/* Submit Feedback Tab */}
            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    إرسال اقتراح أو ملاحظة جديدة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitFeedback} className="space-y-6">
                    <div>
                      <Label htmlFor="priority">الأولوية</Label>
                      <Select
                        value={newFeedback.priority}
                        onValueChange={(value) => setNewFeedback({ ...newFeedback, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الأولوية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-green-600" />
                              <span>منخفضة</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="2">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-600" />
                              <span>متوسطة</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="3">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-red-600" />
                              <span>عالية</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="comment">الاقتراح أو الملاحظة</Label>
                      <Textarea
                        id="comment"
                        value={newFeedback.comment_text}
                        onChange={(e) => setNewFeedback({ ...newFeedback, comment_text: e.target.value })}
                        placeholder="اكتب اقتراحك أو ملاحظتك بالتفصيل..."
                        rows={6}
                        className="resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 ml-2" />
                          إرسال الاقتراح
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* View Feedback Tab */}
            <TabsContent value="view">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {isAdmin ? 'جميع الاقتراحات' : 'اقتراحاتي'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{feedbackList.length} اقتراح</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {feedbackList.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">لا توجد اقتراحات حالياً</p>
                      <p className="text-sm text-gray-500 mt-2">كن أول من يضيف اقتراح!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbackList.map((feedback) => (
                        <Dialog key={feedback.id}>
                          <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={getPriorityColor(extractPriority(feedback.notes))}>
                                        <Star className="w-3 h-3 ml-1" />
                                        {getPriorityLabel(extractPriority(feedback.notes))}
                                      </Badge>
                                      {isAdmin && feedback.profiles && (
                                        <Badge variant="outline">
                                          <User className="w-3 h-3 ml-1" />
                                          {feedback.profiles.full_name_ar}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-gray-800 line-clamp-2">{feedback.comment_text}</p>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(feedback.created_at)}
                                      </span>
                                      {feedback.notes && feedback.notes.includes('رد الإدارة') && (
                                        <Badge variant="default" className="text-xs">
                                          <CheckCircle className="w-3 h-3 ml-1" />
                                          تم الرد
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    عرض التفاصيل
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl" dir="rtl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                تفاصيل الاقتراح
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(extractPriority(feedback.notes))}>
                                  <Star className="w-3 h-3 ml-1" />
                                  الأولوية: {getPriorityLabel(extractPriority(feedback.notes))}
                                </Badge>
                                {isAdmin && feedback.profiles && (
                                  <Badge variant="outline">
                                    <User className="w-3 h-3 ml-1" />
                                    {feedback.profiles.full_name_ar}
                                  </Badge>
                                )}
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">الاقتراح:</p>
                                <p className="text-gray-800 whitespace-pre-wrap">{feedback.comment_text}</p>
                              </div>

                              <div className="text-sm text-gray-500">
                                <Calendar className="w-4 h-4 inline ml-1" />
                                {formatDate(feedback.created_at)}
                              </div>

                              {feedback.notes && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <p className="text-sm text-blue-800 font-semibold mb-2">الملاحظات والردود:</p>
                                  <p className="text-gray-800 whitespace-pre-wrap text-sm">{feedback.notes}</p>
                                </div>
                              )}

                              {isAdmin && (
                                <div className="border-t pt-4 mt-4">
                                  <Label htmlFor="admin-response">إضافة رد</Label>
                                  <Textarea
                                    id="admin-response"
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder="اكتب ردك على الاقتراح..."
                                    rows={4}
                                    className="mt-2"
                                  />
                                  <Button
                                    onClick={() => {
                                      setSelectedFeedback(feedback);
                                      handleAdminResponse();
                                    }}
                                    className="mt-3 w-full"
                                    disabled={!adminResponse.trim()}
                                  >
                                    <Send className="w-4 h-4 ml-2" />
                                    إرسال الرد
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SuggestionsPage;