"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  Users,
  Percent,
  Calendar,
  Building2,
  Mail,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@liyaqa/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@liyaqa/shared/components/ui/alert-dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useCorporateAccount,
  useAddCorporateMember,
  useRemoveCorporateMember,
  useActivateCorporateAccount,
  useSuspendCorporateAccount,
  useTerminateCorporateAccount,
  useDeleteCorporateAccount,
} from "@liyaqa/shared/queries/use-corporate-accounts";
import type { AccountStatus, CorporateMemberStatus, CorporateBillingType } from "@liyaqa/shared/types/accounts";

const statusConfig: Record<AccountStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  SUSPENDED: { labelEn: "Suspended", labelAr: "معلق", variant: "secondary" },
  TERMINATED: { labelEn: "Terminated", labelAr: "منتهي", variant: "destructive" },
};

const memberStatusConfig: Record<CorporateMemberStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  INACTIVE: { labelEn: "Inactive", labelAr: "غير نشط", variant: "secondary" },
};

const billingTypeLabels: Record<CorporateBillingType, { en: string; ar: string }> = {
  INVOICE: { en: "Invoice", ar: "فاتورة" },
  PREPAID: { en: "Prepaid", ar: "مدفوع مقدماً" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
};

export default function CorporateAccountDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { data: account, isLoading } = useCorporateAccount(id);
  const addMemberMutation = useAddCorporateMember(id);
  const removeMemberMutation = useRemoveCorporateMember(id);
  const activateMutation = useActivateCorporateAccount();
  const suspendMutation = useSuspendCorporateAccount();
  const terminateMutation = useTerminateCorporateAccount();
  const deleteMutation = useDeleteCorporateAccount();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newPosition, setNewPosition] = useState("");

  const handleAddMember = async () => {
    if (!newMemberId) return;
    try {
      await addMemberMutation.mutateAsync({
        memberId: newMemberId,
        employeeId: newEmployeeId || undefined,
        department: newDepartment || undefined,
        position: newPosition || undefined,
      });
      toast({
        title: locale === "ar" ? "تمت الإضافة" : "Employee Added",
        description: locale === "ar" ? "تم إضافة الموظف بنجاح" : "Employee has been added successfully",
      });
      setAddMemberOpen(false);
      setNewMemberId("");
      setNewEmployeeId("");
      setNewDepartment("");
      setNewPosition("");
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إضافة الموظف" : "Failed to add employee",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Employee Removed",
        description: locale === "ar" ? "تم حذف الموظف بنجاح" : "Employee has been removed",
      });
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف الموظف" : "Failed to remove employee",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (action: "activate" | "suspend" | "terminate") => {
    try {
      if (action === "activate") {
        await activateMutation.mutateAsync(id);
      } else if (action === "suspend") {
        await suspendMutation.mutateAsync(id);
      } else {
        await terminateMutation.mutateAsync(id);
      }
      toast({
        title: locale === "ar" ? "تم التحديث" : "Status Updated",
        description: locale === "ar" ? "تم تحديث حالة الحساب" : "Account status has been updated",
      });
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تحديث الحالة" : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Deleted",
        description: locale === "ar" ? "تم حذف الحساب بنجاح" : "Account has been deleted",
      });
      router.push(`/${locale}/corporate-accounts`);
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف الحساب" : "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {locale === "ar" ? "الحساب غير موجود" : "Account not found"}
        </p>
      </div>
    );
  }

  const statusInfo = statusConfig[account.status];
  const billingLabel = billingTypeLabels[account.billingType];
  const isExpiringSoon = account.contractEndDate &&
    new Date(account.contractEndDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/corporate-accounts`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {locale === "ar" && account.companyNameAr ? account.companyNameAr : account.companyName}
              </h1>
              <Badge variant={statusInfo.variant}>
                {locale === "ar" ? statusInfo.labelAr : statusInfo.labelEn}
              </Badge>
              {isExpiringSoon && (
                <Badge variant="destructive">
                  {locale === "ar" ? "ينتهي قريباً" : "Expiring Soon"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {locale === "ar" && account.companyNameAr ? account.companyName : account.companyNameAr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {account.status === "SUSPENDED" && (
            <Button variant="outline" onClick={() => handleStatusChange("activate")}>
              {locale === "ar" ? "تفعيل" : "Activate"}
            </Button>
          )}
          {account.status === "ACTIVE" && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange("suspend")}>
                {locale === "ar" ? "تعليق" : "Suspend"}
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange("terminate")}>
                {locale === "ar" ? "إنهاء" : "Terminate"}
              </Button>
            </>
          )}
          <Link href={`/${locale}/corporate-accounts/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {locale === "ar" ? "حذف" : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {locale === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {locale === "ar"
                    ? "هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete this account? This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{locale === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {locale === "ar" ? "حذف" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? "الموظفين" : "Employees"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {account.members.length}
                {account.maxMembers ? ` / ${account.maxMembers}` : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? "نسبة الخصم" : "Discount"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{account.discountPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? "نوع الفوترة" : "Billing"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-bold">
                {locale === "ar" ? billingLabel.ar : billingLabel.en}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? "انتهاء العقد" : "Contract End"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-bold">
                {account.contractEndDate
                  ? new Date(account.contractEndDate).toLocaleDateString(
                      locale === "ar" ? "ar-SA" : "en-US"
                    )
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "معلومات الشركة" : "Company Info"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {account.crNumber && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "السجل التجاري" : "CR Number"}
                  </p>
                  <p className="font-medium">{account.crNumber}</p>
                </div>
              </div>
            )}
            {account.vatNumber && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "الرقم الضريبي" : "VAT Number"}
                  </p>
                  <p className="font-medium">{account.vatNumber}</p>
                </div>
              </div>
            )}
            {account.address && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </p>
                  <p className="font-medium">{account.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "معلومات التواصل" : "Contact Info"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {account.contactPerson && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "جهة الاتصال" : "Contact Person"}
                  </p>
                  <p className="font-medium">{account.contactPerson}</p>
                </div>
              </div>
            )}
            {account.contactEmail && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                  </p>
                  <p className="font-medium">{account.contactEmail}</p>
                </div>
              </div>
            )}
            {account.contactPhone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "الهاتف" : "Phone"}
                  </p>
                  <p className="font-medium">{account.contactPhone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{locale === "ar" ? "الموظفين" : "Employees"}</CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "قائمة موظفي الشركة المسجلين"
                  : "Registered company employees"}
              </CardDescription>
            </div>
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button disabled={account.maxMembers ? account.members.length >= account.maxMembers : false}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {locale === "ar" ? "إضافة موظف" : "Add Employee"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {locale === "ar" ? "إضافة موظف جديد" : "Add New Employee"}
                  </DialogTitle>
                  <DialogDescription>
                    {locale === "ar"
                      ? "أدخل معرف العضو ومعلومات الموظف"
                      : "Enter the member ID and employee information"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "معرف العضو *" : "Member ID *"}</Label>
                    <Input
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      placeholder="UUID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "الرقم الوظيفي" : "Employee ID"}</Label>
                    <Input
                      value={newEmployeeId}
                      onChange={(e) => setNewEmployeeId(e.target.value)}
                      placeholder="EMP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "القسم" : "Department"}</Label>
                    <Input
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder={locale === "ar" ? "تقنية المعلومات" : "IT"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "المنصب" : "Position"}</Label>
                    <Input
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      placeholder={locale === "ar" ? "مهندس برمجيات" : "Software Engineer"}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
                    {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {locale === "ar" ? "إضافة" : "Add"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {account.members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {locale === "ar" ? "لا يوجد موظفين مسجلين" : "No employees registered"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "ar" ? "الرقم الوظيفي" : "Employee ID"}</TableHead>
                  <TableHead>{locale === "ar" ? "معرف العضو" : "Member ID"}</TableHead>
                  <TableHead>{locale === "ar" ? "القسم" : "Department"}</TableHead>
                  <TableHead>{locale === "ar" ? "المنصب" : "Position"}</TableHead>
                  <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-right">{locale === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.members.map((member) => {
                  const memberStatus = memberStatusConfig[member.status];

                  return (
                    <TableRow key={member.id}>
                      <TableCell>{member.employeeId || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {member.memberId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{member.department || "-"}</TableCell>
                      <TableCell>{member.position || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={memberStatus.variant}>
                          {locale === "ar" ? memberStatus.labelAr : memberStatus.labelEn}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.memberId)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {account.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "ملاحظات" : "Notes"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{account.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
