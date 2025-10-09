'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type Role = { id: number; name: string };
type Profile = {
  id: string;
  username_en: string;
  full_name_ar: string;
  email: string; // This will come from auth.users
  phone_number: string;
  role_id: number;
  is_active: boolean;
  company_name: string;
};

export default function UserManagementClient({ allRoles }: { allRoles: Role[] }) {
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for the edit dialog
  const [editRole, setEditRole] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchResults([]);

    // This is a complex query. We need to fetch users from auth and join with profiles.
    // A database function would be more efficient, but this works for now.
    const { data: users, error } = await supabase.rpc('search_users', { keyword: searchTerm });

    if (error) {
      toast.error('خطأ في البحث', { description: error.message });
    } else {
      setSearchResults(users as Profile[]);
    }
    setSearching(false);
  };

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setEditRole(user.role_id.toString());
    setEditIsActive(user.is_active);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        role_id: parseInt(editRole),
        is_active: editIsActive,
      })
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('فشل حفظ التعديلات', { description: error.message });
    } else {
      toast.success('تم حفظ التعديلات بنجاح');
      // Update the local state to reflect changes immediately
      setSearchResults(prev =>
        prev.map(user =>
          user.id === selectedUser.id
            ? { ...user, role_id: parseInt(editRole), is_active: editIsActive }
            : user
        )
      );
      // Find the close button and click it to close the dialog
      document.getElementById('close-dialog-btn')?.click();
    }
    setIsSaving(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Input
              placeholder="ابحث بالاسم، اسم المستخدم، أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>نتائج البحث</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name_ar || '-'}</TableCell>
                    <TableCell>{user.username_en}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{allRoles.find(r => r.id === user.role_id)?.name || 'غير محدد'}</TableCell>
                    <TableCell>{user.is_active ? 'فعال' : 'غير فعال'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                            تعديل
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل بيانات المستخدم: {selectedUser?.full_name_ar}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="role" className="text-right">الدور</Label>
                              <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="اختر دوراً" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allRoles.filter(r => r.id !== 5).map(role => ( // Prevent assigning role 5
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="active" className="text-right">حالة التفعيل</Label>
                              <Switch id="active" checked={editIsActive} onCheckedChange={setEditIsActive} className="col-span-3" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                              حفظ التغييرات
                            </Button>
                            <DialogClose asChild>
                               <Button id="close-dialog-btn" variant="outline">إلغاء</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}