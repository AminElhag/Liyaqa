"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Building2,
  Home,
  Star,
  Shield,
  Timer,
  Crown,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loading, Spinner } from "@/components/ui/spinner";
import {
  useMembershipCategories,
  useCreateMembershipCategory,
  useUpdateMembershipCategory,
  useDeleteMembershipCategory,
  useCategoryUsageStats,
} from "@/queries/use-admin-contracts";
import { MembershipCategory, MembershipCategoryType, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/contract";
import { UUID } from "@/types/api";
import { toast } from "sonner";

interface CategoryFormData {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  categoryType: MembershipCategoryType;
  minimumAge: string;
  maximumAge: string;
  requiresVerification: boolean;
  verificationDocumentType: string;
  maxFamilyMembers: string;
  defaultDiscountPercentage: string;
}

export default function MembershipCategoriesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MembershipCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<UUID | null>(null);

  // Queries
  const { data: categories, isLoading } = useMembershipCategories();

  // Mutations
  const createMutation = useCreateMembershipCategory();
  const updateMutation = useUpdateMembershipCategory();
  const deleteMutation = useDeleteMembershipCategory();

  // Usage stats for delete confirmation
  const { data: usageStats } = useCategoryUsageStats(deletingCategoryId);

  // Form
  const form = useForm<CategoryFormData>({
    defaultValues: {
      nameEn: "",
      nameAr: "",
      descriptionEn: "",
      descriptionAr: "",
      categoryType: "INDIVIDUAL",
      minimumAge: "",
      maximumAge: "",
      requiresVerification: false,
      verificationDocumentType: "",
      maxFamilyMembers: "",
      defaultDiscountPercentage: "0",
    },
  });

  const openCreateDialog = () => {
    form.reset({
      nameEn: "",
      nameAr: "",
      descriptionEn: "",
      descriptionAr: "",
      categoryType: "INDIVIDUAL",
      minimumAge: "",
      maximumAge: "",
      requiresVerification: false,
      verificationDocumentType: "",
      maxFamilyMembers: "",
      defaultDiscountPercentage: "0",
    });
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const openEditDialog = (category: MembershipCategory) => {
    form.reset({
      nameEn: category.nameEn,
      nameAr: category.nameAr || "",
      descriptionEn: category.descriptionEn || "",
      descriptionAr: category.descriptionAr || "",
      categoryType: category.categoryType,
      minimumAge: category.minimumAge?.toString() || "",
      maximumAge: category.maximumAge?.toString() || "",
      requiresVerification: category.requiresVerification,
      verificationDocumentType: category.verificationDocumentType || "",
      maxFamilyMembers: category.maxFamilyMembers?.toString() || "",
      defaultDiscountPercentage: category.defaultDiscountPercentage?.toString() || "0",
    });
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        const updateRequest: UpdateCategoryRequest = {
          name: { en: data.nameEn, ar: data.nameAr || undefined },
          description: data.descriptionEn ? { en: data.descriptionEn, ar: data.descriptionAr || undefined } : undefined,
          categoryType: data.categoryType,
          minimumAge: data.minimumAge ? parseInt(data.minimumAge) : undefined,
          maximumAge: data.maximumAge ? parseInt(data.maximumAge) : undefined,
          requiresVerification: data.requiresVerification,
          verificationDocumentType: data.verificationDocumentType || undefined,
          maxFamilyMembers: data.maxFamilyMembers ? parseInt(data.maxFamilyMembers) : undefined,
          defaultDiscountPercentage: data.defaultDiscountPercentage
            ? parseFloat(data.defaultDiscountPercentage)
            : undefined,
        };
        await updateMutation.mutateAsync({ id: editingCategory.id, data: updateRequest });
        toast.success(isArabic ? "تم تحديث الفئة" : "Category updated");
      } else {
        const createRequest: CreateCategoryRequest = {
          name: { en: data.nameEn, ar: data.nameAr || undefined },
          description: data.descriptionEn ? { en: data.descriptionEn, ar: data.descriptionAr || undefined } : undefined,
          categoryType: data.categoryType,
          minimumAge: data.minimumAge ? parseInt(data.minimumAge) : undefined,
          maximumAge: data.maximumAge ? parseInt(data.maximumAge) : undefined,
          requiresVerification: data.requiresVerification,
          verificationDocumentType: data.verificationDocumentType || undefined,
          maxFamilyMembers: data.maxFamilyMembers ? parseInt(data.maxFamilyMembers) : undefined,
          defaultDiscountPercentage: data.defaultDiscountPercentage
            ? parseFloat(data.defaultDiscountPercentage)
            : undefined,
        };
        await createMutation.mutateAsync(createRequest);
        toast.success(isArabic ? "تم إنشاء الفئة" : "Category created");
      }
      setDialogOpen(false);
    } catch {
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deletingCategoryId) return;
    try {
      await deleteMutation.mutateAsync(deletingCategoryId);
      toast.success(isArabic ? "تم حذف الفئة" : "Category deleted");
      setDeletingCategoryId(null);
    } catch {
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    }
  };

  const getCategoryIcon = (type: MembershipCategoryType) => {
    const icons: Record<MembershipCategoryType, React.ReactNode> = {
      INDIVIDUAL: <Users className="h-4 w-4" />,
      FAMILY: <Home className="h-4 w-4" />,
      CORPORATE: <Building2 className="h-4 w-4" />,
      STUDENT: <GraduationCap className="h-4 w-4" />,
      SENIOR: <Star className="h-4 w-4" />,
      MILITARY: <Shield className="h-4 w-4" />,
      STAFF: <Users className="h-4 w-4" />,
      TRIAL: <Timer className="h-4 w-4" />,
      VIP: <Crown className="h-4 w-4" />,
    };
    return icons[type];
  };

  const getCategoryLabel = (type: MembershipCategoryType) => {
    const labels: Record<MembershipCategoryType, { en: string; ar: string }> = {
      INDIVIDUAL: { en: "Individual", ar: "فردي" },
      FAMILY: { en: "Family", ar: "عائلي" },
      CORPORATE: { en: "Corporate", ar: "شركات" },
      STUDENT: { en: "Student", ar: "طالب" },
      SENIOR: { en: "Senior", ar: "كبار السن" },
      MILITARY: { en: "Military", ar: "عسكري" },
      STAFF: { en: "Staff", ar: "موظفين" },
      TRIAL: { en: "Trial", ar: "تجريبي" },
      VIP: { en: "VIP", ar: "كبار الشخصيات" },
    };
    return isArabic ? labels[type].ar : labels[type].en;
  };

  const texts = {
    title: isArabic ? "فئات العضوية" : "Membership Categories",
    description: isArabic
      ? "إعداد فئات العضوية المختلفة مثل الفردية والعائلية والشركات"
      : "Configure membership categories like individual, family, and corporate",
    addCategory: isArabic ? "إضافة فئة" : "Add Category",
    name: isArabic ? "الاسم" : "Name",
    type: isArabic ? "النوع" : "Type",
    ageRange: isArabic ? "الفئة العمرية" : "Age Range",
    discount: isArabic ? "الخصم" : "Discount",
    verification: isArabic ? "التحقق" : "Verification",
    status: isArabic ? "الحالة" : "Status",
    actions: isArabic ? "الإجراءات" : "Actions",
    active: isArabic ? "نشط" : "Active",
    inactive: isArabic ? "غير نشط" : "Inactive",
    required: isArabic ? "مطلوب" : "Required",
    noCategories: isArabic ? "لا توجد فئات" : "No categories configured",
    createCategory: isArabic ? "إنشاء فئة جديدة" : "Create Category",
    editCategory: isArabic ? "تعديل الفئة" : "Edit Category",
    createDesc: isArabic
      ? "قم بإنشاء فئة عضوية جديدة مع الخصومات والمتطلبات"
      : "Create a new membership category with discounts and requirements",
    nameEn: isArabic ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: isArabic ? "الاسم (عربي)" : "Name (Arabic)",
    descriptionEn: isArabic ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: isArabic ? "الوصف (عربي)" : "Description (Arabic)",
    categoryType: isArabic ? "نوع الفئة" : "Category Type",
    minAge: isArabic ? "الحد الأدنى للعمر" : "Minimum Age",
    maxAge: isArabic ? "الحد الأقصى للعمر" : "Maximum Age",
    requiresVerification: isArabic ? "يتطلب التحقق" : "Requires Verification",
    documentType: isArabic ? "نوع المستند" : "Document Type",
    maxFamily: isArabic ? "أقصى عدد أفراد الأسرة" : "Max Family Members",
    defaultDiscount: isArabic ? "نسبة الخصم الافتراضية (%)" : "Default Discount (%)",
    save: isArabic ? "حفظ" : "Save",
    cancel: isArabic ? "إلغاء" : "Cancel",
    delete: isArabic ? "حذف" : "Delete",
    deleteTitle: isArabic ? "حذف الفئة؟" : "Delete Category?",
    deleteDesc: isArabic
      ? "هل أنت متأكد من حذف هذه الفئة؟ لن يتأثر الأعضاء الحاليون."
      : "Are you sure you want to delete this category? Existing members won't be affected.",
    deleteWarning: isArabic
      ? "تحذير: هذه الفئة مستخدمة من قبل أعضاء أو خطط. لا يمكن حذفها حتى تتم إزالة جميع الارتباطات."
      : "Warning: This category is in use by members or plans. It cannot be deleted until all associations are removed.",
    membersUsing: isArabic ? "أعضاء يستخدمون هذه الفئة" : "members using this category",
    plansUsing: isArabic ? "خطط تستخدم هذه الفئة" : "plans using this category",
    years: isArabic ? "سنة" : "years",
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{texts.title}</CardTitle>
                <CardDescription>{texts.description}</CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 me-2" />
              {texts.addCategory}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!categories?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noCategories}</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 me-2" />
                {texts.addCategory}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{texts.name}</TableHead>
                    <TableHead>{texts.type}</TableHead>
                    <TableHead>{texts.ageRange}</TableHead>
                    <TableHead>{texts.discount}</TableHead>
                    <TableHead>{texts.verification}</TableHead>
                    <TableHead>{texts.status}</TableHead>
                    <TableHead className="text-right">{texts.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{category.nameEn}</p>
                          {category.nameAr && (
                            <p className="text-sm text-muted-foreground">{category.nameAr}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {getCategoryIcon(category.categoryType)}
                          {getCategoryLabel(category.categoryType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.minimumAge || category.maximumAge ? (
                          <span className="text-sm">
                            {category.minimumAge ?? 0} - {category.maximumAge ?? "∞"} {texts.years}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {category.defaultDiscountPercentage > 0 ? (
                          <Badge variant="secondary">
                            {category.defaultDiscountPercentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {category.requiresVerification ? (
                          <Badge variant="outline" className="text-orange-600">
                            {texts.required}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? texts.active : texts.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCategoryId(category.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? texts.editCategory : texts.createCategory}
            </DialogTitle>
            <DialogDescription>{texts.createDesc}</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{texts.nameEn}</Label>
                <Input
                  {...form.register("nameEn", { required: true })}
                  placeholder="e.g., Student"
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.nameAr}</Label>
                <Input
                  {...form.register("nameAr")}
                  placeholder="e.g., طالب"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{texts.categoryType}</Label>
              <Select
                value={form.watch("categoryType")}
                onValueChange={(v) => form.setValue("categoryType", v as MembershipCategoryType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["INDIVIDUAL", "FAMILY", "CORPORATE", "STUDENT", "SENIOR", "MILITARY", "STAFF", "TRIAL", "VIP"] as MembershipCategoryType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(type)}
                        {getCategoryLabel(type)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{texts.descriptionEn}</Label>
                <Textarea
                  {...form.register("descriptionEn")}
                  placeholder={isArabic ? "وصف الفئة بالإنجليزية" : "Describe this category in English"}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.descriptionAr}</Label>
                <Textarea
                  {...form.register("descriptionAr")}
                  placeholder={isArabic ? "وصف الفئة بالعربية" : "Describe this category in Arabic"}
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{texts.minAge}</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("minimumAge")}
                  placeholder="e.g., 18"
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.maxAge}</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("maximumAge")}
                  placeholder="e.g., 25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{texts.defaultDiscount}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...form.register("defaultDiscountPercentage")}
                placeholder="e.g., 30"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{texts.requiresVerification}</Label>
              <Switch
                checked={form.watch("requiresVerification")}
                onCheckedChange={(v) => form.setValue("requiresVerification", v)}
              />
            </div>

            {form.watch("requiresVerification") && (
              <div className="space-y-2">
                <Label>{texts.documentType}</Label>
                <Input
                  {...form.register("verificationDocumentType")}
                  placeholder="e.g., Student ID, Military ID"
                />
              </div>
            )}

            {form.watch("categoryType") === "FAMILY" && (
              <div className="space-y-2">
                <Label>{texts.maxFamily}</Label>
                <Input
                  type="number"
                  min="2"
                  {...form.register("maxFamilyMembers")}
                  placeholder="e.g., 5"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={isSaving || !form.watch("nameEn")}>
                {isSaving && <Spinner className="h-4 w-4 me-2" />}
                {texts.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingCategoryId !== null}
        onOpenChange={() => setDeletingCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {usageStats && (usageStats.totalMembers > 0 || usageStats.plansUsingCategory > 0) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{texts.deleteWarning}</span>
                  </div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {usageStats.totalMembers > 0 && (
                      <li>{usageStats.totalMembers} {texts.membersUsing}</li>
                    )}
                    {usageStats.plansUsingCategory > 0 && (
                      <li>{usageStats.plansUsingCategory} {texts.plansUsing}</li>
                    )}
                  </ul>
                </div>
              ) : (
                texts.deleteDesc
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {texts.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                (usageStats && (usageStats.totalMembers > 0 || usageStats.plansUsingCategory > 0))
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Spinner className="h-4 w-4 me-2" />}
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
