import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Role {
  id: number;
  name: string;
}

interface UserData {
  id: string;
  username_en: string;
  full_name_ar: string;
  phone_number: string;
  company_name: string;
  email: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  subscription_end_date: string | null;
  created_at: string;
}

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Check admin authorization
  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          variant: 'destructive',
          title: 'غير مصرح',
          description: 'يجب تسجيل الدخول أولاً'
        });
        navigate('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase.
      from('profiles').
      select('role_id').
      eq('id', user.id).
      single();

      if (profileError || !profile) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'لا يمكن التحقق من صلاحياتك'
        });
        navigate('/');
        return;
      }

      // Check if user has role_id 4 or 5
      if (profile.role_id !== 4 && profile.role_id !== 5) {
        toast({
          variant: 'destructive',
          title: 'غير مصرح',
          description: 'هذه الصفحة مخصصة للمسؤولين فقط (صلاحيات محدودة)'
        });
        navigate('/dashboard');
        return;
      }

      // User is authorized, load data
      loadData();
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase.
      from('roles').
      select('*').
      order('name');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Fetch users with related data
      const { data: profilesData, error: profilesError } = await supabase.
      from('profiles').
      select(`
          id,
          username_en,
          full_name_ar,
          phone_number,
          company_name,
          role_id,
          is_active,
          created_at,
          roles(name)
        `).
      order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth emails for each user
      const userIds = profilesData?.map((p) => p.id) || [];
      const usersWithData: UserData[] = [];

      for (const profile of profilesData || []) {
        // Get subscription info
        const { data: subData } = await supabase.
        from('user_subscriptions').
        select('end_date').
        eq('user_id', profile.id).
        order('end_date', { ascending: false }).
        limit(1).
        single();

        // Get email from auth metadata or use a placeholder
        // Note: We can't directly access auth.users, so we'll use the username or a workaround
        usersWithData.push({
          id: profile.id,
          username_en: profile.username_en || '',
          full_name_ar: profile.full_name_ar || '',
          phone_number: profile.phone_number || '',
          company_name: profile.company_name || '',
          email: profile.username_en || 'N/A', // Using username as email placeholder
          role_id: profile.role_id || 0,
          role_name: (profile as any).roles?.name || 'لا يوجد',
          is_active: profile.is_active ?? true,
          subscription_end_date: subData?.end_date || null,
          created_at: profile.created_at || ''
        });
      }

      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحميل البيانات'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((user) =>
      user.username_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name_ar.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role_id === parseInt(roleFilter));
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleEditRole = (user: UserData) => {
    setSelectedUser(user);
    setSelectedRole(user.role_id.toString());
    setEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const { error } = await supabase.
      from('profiles').
      update({ role_id: parseInt(selectedRole) }).
      eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث دور المستخدم بنجاح'
      });

      setEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحديث الدور'
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.
      from('profiles').
      update({ is_active: !currentStatus }).
      eq('id', userId);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} الحساب بنجاح`
      });

      loadData();
    } catch (error: any) {
      console.error('Error toggling active status:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحديث حالة الحساب'
      });
    }
  };

  const getSubscriptionBadge = (endDate: string | null) => {
    if (!endDate) {
      return <Badge variant="secondary">لا يوجد اشتراك</Badge>;
    }

    const end = new Date(endDate);
    const now = new Date();

    if (end < now) {
      return <Badge variant="destructive">منتهي</Badge>;
    }

    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return <Badge variant="destructive">ينتهي قريباً ({daysLeft} أيام)</Badge>;
    }

    return <Badge className="bg-green-600">نشط</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                إدارة المستخدمين
              </h1>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-right block mb-2">
                  البحث
                </Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="ابحث بالاسم أو البريد الإلكتروني"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-right" />

              </div>
              
              <div>
                <Label htmlFor="roleFilter" className="text-right block mb-2">
                  تصفية حسب الدور
                </Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأدوار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأدوار</SelectItem>
                    {roles.map((role) =>
                    <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={loadData}
                  className="w-full bg-indigo-600 hover:bg-indigo-700">

                  تحديث البيانات
                </Button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                المستخدمون ({filteredUsers.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">حالة الاشتراك</TableHead>
                    <TableHead className="text-right">حالة الحساب</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ?
                  <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        لا يوجد مستخدمين
                      </TableCell>
                    </TableRow> :

                  filteredUsers.map((user) =>
                  <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username_en}</TableCell>
                        <TableCell>{user.full_name_ar || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.company_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role_name}</Badge>
                        </TableCell>
                        <TableCell>
                          {getSubscriptionBadge(user.subscription_end_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleToggleActive(user.id, user.is_active)} />

                            <span className="text-sm">
                              {user.is_active ? 'نشط' : 'معطل'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRole(user)}>

                            تعديل الدور
                          </Button>
                        </TableCell>
                      </TableRow>
                  )
                  }
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل دور المستخدم</DialogTitle>
            <DialogDescription className="text-right">
              تعديل دور المستخدم: {selectedUser?.full_name_ar || selectedUser?.username_en}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role" className="text-right block mb-2">
                الدور
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) =>
                  <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveRole} className="bg-indigo-600 hover:bg-indigo-700">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

};

export default AdminUsersPage;