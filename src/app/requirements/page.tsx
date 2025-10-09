import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileCheck, FileX, Edit } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

type PaginatedRequirement = {
  id: number;
  country_name_ar: string;
  crop_name_ar: string;
  short_requirements_agg: string | null;
  publication_number: string | null;
  publication_year: number | null;
  pdf_file_url: string | null;
  country_id: number;
  crop_id: number;
  total_count: number;
};

export default async function RequirementsListPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient();

  // 1. Protect the route and check role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', session.user.id)
    .single();

  const canView = profile && [2, 3, 4, 5].includes(profile.role_id);
  const canEdit = profile && [3, 4, 5].includes(profile.role_id); // صلاحية التعديل للأدوار 3, 4, 5
  if (!canView) { // If user can't even view, redirect them
    redirect('/dashboard'); // Or show an unauthorized page
  }

  // 2. Pagination logic
  const currentPage = Number(searchParams?.page) || 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // 3. Fetch data and count using the new RPC function for better performance
  const { data: requirements, error } = await supabase.rpc('get_requirements_paginated', {
    page_number: currentPage,
    page_size: ITEMS_PER_PAGE,
  });

  if (error) {
    console.error("Error fetching paginated requirements:", error);
  }

  const totalCount = requirements && requirements.length > 0 ? requirements[0].total_count : 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">عرض جميع التسجيلات</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الدولة</TableHead>
              <TableHead>المحصول</TableHead>
              <TableHead>الاشتراطات المختصرة</TableHead>
              <TableHead>رقم المنشور</TableHead>
              <TableHead>سنة النشر</TableHead>
              <TableHead>ملف مرفق؟</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements?.map((req: PaginatedRequirement) => (
              <TableRow key={req.id!}>
                <TableCell>{req.country_name_ar}</TableCell>
                <TableCell>{req.crop_name_ar}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {req.short_requirements_agg}
                </TableCell>
                <TableCell>{req.publication_number || '-'}</TableCell>
                <TableCell>{req.publication_year || '-'}</TableCell>
                <TableCell>
                  {req.pdf_file_url ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <FileCheck className="h-4 w-4" />
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <FileX className="h-4 w-4" />
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="link" size="sm">
                      <Link href={`/search?country=${req.country_id}&crop=${req.crop_id}`}>
                        عرض
                      </Link>
                    </Button>
                    {canEdit && <Button asChild variant="outline" size="sm">
                      <Link href={`/requirements/edit/${req.id}`}>تعديل</Link>
                    </Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && <PaginationItem><PaginationPrevious href={`/requirements?page=${currentPage - 1}`} /></PaginationItem>}
            <PaginationItem><PaginationLink isActive>{currentPage}</PaginationLink></PaginationItem>
            {currentPage < totalPages && <PaginationItem><PaginationNext href={`/requirements?page=${currentPage + 1}`} /></PaginationItem>}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}