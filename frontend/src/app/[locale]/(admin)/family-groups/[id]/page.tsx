"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, UserPlus, Users, Percent, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useFamilyGroup,
  useAddFamilyMember,
  useRemoveFamilyMember,
  useActivateFamilyGroup,
  useSuspendFamilyGroup,
  useDeleteFamilyGroup,
} from "@/queries/use-family-groups";
import type { AccountStatus, FamilyRelationship, FamilyMemberStatus, FamilyBillingType } from "@/types/accounts";

const statusConfig: Record<AccountStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  SUSPENDED: { labelEn: "Suspended", labelAr: "معلق", variant: "secondary" },
  TERMINATED: { labelEn: "Terminated", labelAr: "منتهي", variant: "destructive" },
};

const memberStatusConfig: Record<FamilyMemberStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  INACTIVE: { labelEn: "Inactive", labelAr: "غير نشط", variant: "secondary" },
};

const relationshipLabels: Record<FamilyRelationship, { en: string; ar: string }> = {
  PRIMARY: { en: "Primary", ar: "رئيسي" },
  SPOUSE: { en: "Spouse", ar: "زوج/زوجة" },
  CHILD: { en: "Child", ar: "ابن/ابنة" },
  PARENT: { en: "Parent", ar: "والد/والدة" },
  SIBLING: { en: "Sibling", ar: "أخ/أخت" },
  OTHER: { en: "Other", ar: "أخرى" },
};

const billingTypeLabels: Record<FamilyBillingType, { en: string; ar: string }> = {
  INDIVIDUAL: { en: "Individual Billing", ar: "فواتير فردية" },
  PRIMARY_PAYS_ALL: { en: "Primary Pays All", ar: "الرئيسي يدفع الكل" },
  SPLIT: { en: "Split Billing", ar: "فواتير مقسمة" },
};

export default function FamilyGroupDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { data: group, isLoading } = useFamilyGroup(id);
  const addMemberMutation = useAddFamilyMember(id);
  const removeMemberMutation = useRemoveFamilyMember(id);
  const activateMutation = useActivateFamilyGroup();
  const suspendMutation = useSuspendFamilyGroup();
  const deleteMutation = useDeleteFamilyGroup();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRelationship, setNewMemberRelationship] = useState<FamilyRelationship>("SPOUSE");

  const handleAddMember = async () => {
    if (!newMemberId) return;
    try {
      await addMemberMutation.mutateAsync({
        memberId: newMemberId,
        relationship: newMemberRelationship,
      });
      toast({
        title: locale === "ar" ? "تمت الإضافة" : "Member Added",
        description: locale === "ar" ? "تم إضافة العضو بنجاح" : "Member has been added successfully",
      });
      setAddMemberOpen(false);
      setNewMemberId("");
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إضافة العضو" : "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Member Removed",
        description: locale === "ar" ? "تم حذف العضو بنجاح" : "Member has been removed",
      });
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف العضو" : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (action: "activate" | "suspend") => {
    try {
      if (action === "activate") {
        await activateMutation.mutateAsync(id);
      } else {
        await suspendMutation.mutateAsync(id);
      }
      toast({
        title: locale === "ar" ? "تم التحديث" : "Status Updated",
        description: locale === "ar" ? "تم تحديث حالة المجموعة" : "Group status has been updated",
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
        description: locale === "ar" ? "تم حذف المجموعة بنجاح" : "Group has been deleted",
      });
      router.push(`/${locale}/family-groups`);
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف المجموعة" : "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {locale === "ar" ? "المجموعة غير موجودة" : "Group not found"}
        </p>
      </div>
    );
  }

  const statusInfo = statusConfig[group.status];
  const billingLabel = billingTypeLabels[group.billingType];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/family-groups`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
              <Badge variant={statusInfo.variant}>
                {locale === "ar" ? statusInfo.labelAr : statusInfo.labelEn}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {locale === "ar" ? billingLabel.ar : billingLabel.en}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {group.status === "SUSPENDED" && (
            <Button variant="outline" onClick={() => handleStatusChange("activate")}>
              {locale === "ar" ? "تفعيل" : "Activate"}
            </Button>
          )}
          {group.status === "ACTIVE" && (
            <Button variant="outline" onClick={() => handleStatusChange("suspend")}>
              {locale === "ar" ? "تعليق" : "Suspend"}
            </Button>
          )}
          <Link href={`/${locale}/family-groups/${id}/edit`}>
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
                    ? "هل أنت متأكد من حذف هذه المجموعة؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete this group? This action cannot be undone."}
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? "الأعضاء" : "Members"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {group.members.length} / {group.maxMembers}
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
              <span className="text-2xl font-bold">{group.discountPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "ar" ? "تاريخ الإنشاء" : "Created"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {group.createdAt
                ? new Date(group.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")
                : "-"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{locale === "ar" ? "أعضاء المجموعة" : "Group Members"}</CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "قائمة الأعضاء في هذه المجموعة العائلية"
                  : "Members in this family group"}
              </CardDescription>
            </div>
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button disabled={group.members.length >= group.maxMembers}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {locale === "ar" ? "إضافة عضو" : "Add Member"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {locale === "ar" ? "إضافة عضو جديد" : "Add New Member"}
                  </DialogTitle>
                  <DialogDescription>
                    {locale === "ar"
                      ? "أدخل معرف العضو وعلاقته بالمجموعة"
                      : "Enter the member ID and their relationship"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "معرف العضو" : "Member ID"}</Label>
                    <Input
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      placeholder="UUID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "العلاقة" : "Relationship"}</Label>
                    <Select
                      value={newMemberRelationship}
                      onValueChange={(v) => setNewMemberRelationship(v as FamilyRelationship)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(relationshipLabels)
                          .filter(([key]) => key !== "PRIMARY")
                          .map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {locale === "ar" ? label.ar : label.en}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "ar" ? "معرف العضو" : "Member ID"}</TableHead>
                <TableHead>{locale === "ar" ? "العلاقة" : "Relationship"}</TableHead>
                <TableHead>{locale === "ar" ? "تاريخ الانضمام" : "Joined"}</TableHead>
                <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-right">{locale === "ar" ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.members.map((member) => {
                const relationLabel = relationshipLabels[member.relationship];
                const memberStatus = memberStatusConfig[member.status];
                const isPrimary = member.relationship === "PRIMARY";

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono text-sm">
                      {member.memberId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {locale === "ar" ? relationLabel.ar : relationLabel.en}
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString(
                        locale === "ar" ? "ar-SA" : "en-US"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={memberStatus.variant}>
                        {locale === "ar" ? memberStatus.labelAr : memberStatus.labelEn}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.memberId)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {group.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "ملاحظات" : "Notes"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{group.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
