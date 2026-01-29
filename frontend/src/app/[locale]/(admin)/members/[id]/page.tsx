"use client";

import { use, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  CreditCard,
  User,
  UserCircle,
  UserPlus,
  Plus,
  Wallet,
  History,
  Key,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { PhotoUploadDialog } from "@/components/admin/photo-upload-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { CreateUserAccountDialog } from "@/components/admin/create-user-account-dialog";
import { MemberProfileHero } from "@/components/admin/member-profile-hero";
import { MemberStatsGrid } from "@/components/admin/member-stats-grid";
import { SubscriptionCard } from "@/components/admin/subscription-card";
import { WalletBalanceCard } from "@/components/admin/wallet-balance-card";
import { WalletTransactionsTable } from "@/components/admin/wallet-transactions-table";
import { MemberClassPacksCard } from "@/components/admin/member-class-packs-card";
import {
  useMember,
  useDeleteMember,
  useSuspendMember,
  useActivateMember,
  useMemberSubscriptions,
  useCreateInvoiceFromSubscription,
} from "@/queries";
import { useWallet, useWalletTransactions } from "@/queries/use-wallet";
import { FreezeSubscriptionDialog } from "@/components/dialogs/freeze-subscription-dialog";
import { AddCreditDialog } from "@/components/dialogs/add-credit-dialog";
import { AdjustBalanceDialog } from "@/components/dialogs/adjust-balance-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Subscription } from "@/types/member";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();

  const { data: member, isLoading, error } = useMember(id);
  const { data: subscriptions } = useMemberSubscriptions(id);

  // Wallet data
  const { data: wallet, isLoading: walletLoading } = useWallet(id);
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [transactionsSize, setTransactionsSize] = useState(5);
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(
    id,
    { page: transactionsPage, size: transactionsSize }
  );

  const deleteMember = useDeleteMember();
  const suspendMember = useSuspendMember();
  const activateMember = useActivateMember();

  // Photo upload dialog state
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Freeze subscription dialog state
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Wallet dialog states
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [adjustBalanceDialogOpen, setAdjustBalanceDialogOpen] = useState(false);

  // Reset password dialog state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  // Create user account dialog state
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Toast and invoice mutation
  const { toast } = useToast();
  const createInvoice = useCreateInvoiceFromSubscription();

  // Handlers for subscription actions
  const handleFreeze = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFreezeDialogOpen(true);
  };

  const handleCreateInvoice = (subscription: Subscription) => {
    createInvoice.mutate(subscription.id, {
      onSuccess: (invoice) => {
        toast({
          title: locale === "ar" ? "تم إنشاء الفاتورة" : "Invoice Created",
          description: locale === "ar"
            ? `تم إنشاء الفاتورة رقم ${invoice.invoiceNumber}`
            : `Invoice ${invoice.invoiceNumber} created successfully`,
        });
        router.push(`/${locale}/invoices/${invoice.id}`);
      },
      onError: (error) => {
        toast({
          title: locale === "ar" ? "خطأ" : "Error",
          description: error instanceof Error ? error.message : "Failed to create invoice",
          variant: "destructive",
        });
      },
    });
  };

  const texts = {
    back: locale === "ar" ? "العودة للأعضاء" : "Back to Members",
    edit: locale === "ar" ? "تعديل" : "Edit",
    resetPassword:
      locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    createUserAccount:
      locale === "ar" ? "إنشاء حساب مستخدم" : "Create User Account",
    delete: locale === "ar" ? "حذف" : "Delete",
    deleteTitle: locale === "ar" ? "حذف العضو؟" : "Delete Member?",
    deleteDescription:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذا العضو؟ سيتم حذف جميع بياناته بشكل دائم."
        : "Are you sure you want to delete this member? All their data will be permanently removed.",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    contactInfo: locale === "ar" ? "معلومات التواصل" : "Contact Information",
    emergencyContact:
      locale === "ar" ? "جهة اتصال الطوارئ" : "Emergency Contact",
    subscriptions: locale === "ar" ? "الاشتراكات" : "Subscriptions",
    noSubscriptions:
      locale === "ar" ? "لا توجد اشتراكات" : "No subscriptions",
    addSubscription:
      locale === "ar" ? "إضافة اشتراك" : "Add Subscription",
    joinDate: locale === "ar" ? "تاريخ الانضمام" : "Join Date",
    dateOfBirth: locale === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    gender: locale === "ar" ? "الجنس" : "Gender",
    male: locale === "ar" ? "ذكر" : "Male",
    female: locale === "ar" ? "أنثى" : "Female",
    address: locale === "ar" ? "العنوان" : "Address",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notFound: locale === "ar" ? "لم يتم العثور على العضو" : "Member not found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل البيانات"
        : "Error loading member data",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    name: locale === "ar" ? "الاسم" : "Name",
    walletTransactions: locale === "ar" ? "سجل المعاملات" : "Transaction History",
    noTransactions: locale === "ar" ? "لا توجد معاملات" : "No transactions yet",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (error || !member) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-destructive">{error ? texts.error : texts.notFound}</p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/members`}>{texts.back}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = () => {
    deleteMember.mutate(member.id, {
      onSuccess: () => router.push(`/${locale}/members`),
    });
    setDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/members`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>

        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* Edit - Primary Action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild>
                  <Link href={`/${locale}/members/${member.id}/edit`}>
                    <Edit className="h-4 w-4 sm:me-2" />
                    <span className="hidden sm:inline">{texts.edit}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">{texts.edit}</TooltipContent>
            </Tooltip>

            {/* Account Action - Conditional */}
            {!member.userId ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setCreateUserOpen(true)}>
                    <UserPlus className="h-4 w-4 sm:me-2" />
                    <span className="hidden sm:inline">{texts.createUserAccount}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">{texts.createUserAccount}</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setResetPasswordOpen(true)}>
                    <Key className="h-4 w-4 sm:me-2" />
                    <span className="hidden sm:inline">{texts.resetPassword}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">{texts.resetPassword}</TooltipContent>
              </Tooltip>
            )}

            {/* Status Action - Conditional */}
            {member.status === "ACTIVE" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => suspendMember.mutate(member.id)}
                    disabled={suspendMember.isPending}
                  >
                    <UserCircle className="h-4 w-4 sm:me-2" />
                    <span className="hidden sm:inline">{texts.suspend}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">{texts.suspend}</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => activateMember.mutate(member.id)}
                    disabled={activateMember.isPending}
                  >
                    <UserCircle className="h-4 w-4 sm:me-2" />
                    <span className="hidden sm:inline">{texts.activate}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">{texts.activate}</TooltipContent>
              </Tooltip>
            )}

            {/* Delete Action - Destructive */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 sm:me-2" />
                  <span className="hidden sm:inline">{texts.delete}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">{texts.delete}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Profile Hero */}
      <div className="animate-fade-in-up">
        <MemberProfileHero
          member={member}
          onPhotoUpload={() => setPhotoDialogOpen(true)}
          locale={locale}
        />
      </div>

      {/* Stats Grid */}
      <div className="animate-fade-in-up animation-delay-100">
        <MemberStatsGrid
          member={member}
          subscriptions={subscriptions}
          locale={locale}
        />
      </div>

      {/* Wallet Section */}
      <div className="grid gap-6 md:grid-cols-2 animate-fade-in-up animation-delay-150">
        {/* Wallet Balance Card */}
        <WalletBalanceCard
          wallet={wallet}
          isLoading={walletLoading}
          locale={locale}
          onAddCredit={() => setAddCreditDialogOpen(true)}
          onAdjustBalance={() => setAdjustBalanceDialogOpen(true)}
        />

        {/* Class Packs Card */}
        <MemberClassPacksCard memberId={member.id} locale={locale} />
      </div>

      {/* Wallet Transactions */}
      <Card className="animate-fade-in-up animation-delay-175">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            {texts.walletTransactions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsData && transactionsData.content.length > 0 ? (
            <WalletTransactionsTable
              transactions={transactionsData.content}
              isLoading={transactionsLoading}
              locale={locale}
              pageIndex={transactionsPage}
              pageSize={transactionsSize}
              totalPages={transactionsData.totalPages}
              totalElements={transactionsData.totalElements}
              onPageChange={setTransactionsPage}
              onPageSizeChange={setTransactionsSize}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>{texts.noTransactions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact & Emergency Cards */}
      <div className="grid gap-6 md:grid-cols-2 animate-fade-in-up animation-delay-200">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              {texts.contactInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{texts.email}</p>
                <p className="truncate">{member.email}</p>
              </div>
            </div>

            {member.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.phone}</p>
                  <p>{member.phone}</p>
                </div>
              </div>
            )}

            {member.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {texts.dateOfBirth}
                  </p>
                  <p>{formatDate(member.dateOfBirth, locale)}</p>
                </div>
              </div>
            )}

            {member.gender && (
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.gender}</p>
                  <p>{member.gender === "MALE" ? texts.male : texts.female}</p>
                </div>
              </div>
            )}

            {member.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{texts.address}</p>
                  <p className="truncate">
                    {member.address.formatted ||
                      [
                        member.address.street,
                        member.address.city,
                        member.address.country,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                      "-"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {(member.emergencyContactName || member.emergencyContactPhone) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5" />
                {texts.emergencyContact}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.emergencyContactName && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.name}</p>
                    <p>{member.emergencyContactName}</p>
                  </div>
                </div>
              )}
              {member.emergencyContactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.phone}</p>
                    <p>{member.emergencyContactPhone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes (if no emergency contact, show notes in the second column) */}
        {!member.emergencyContactName &&
          !member.emergencyContactPhone &&
          member.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{texts.notes}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  <LocalizedText text={member.notes} />
                </p>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Notes (if shown separately when emergency contact exists) */}
      {(member.emergencyContactName || member.emergencyContactPhone) &&
        member.notes && (
          <Card className="animate-fade-in-up animation-delay-300">
            <CardHeader>
              <CardTitle className="text-lg">{texts.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <LocalizedText text={member.notes} />
              </p>
            </CardContent>
          </Card>
        )}

      {/* Subscriptions */}
      <Card className="animate-fade-in-up animation-delay-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            {texts.subscriptions}
          </CardTitle>
          <Button asChild size="sm">
            <Link href={`/${locale}/members/${member.id}/subscription/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.addSubscription}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {Array.isArray(subscriptions) && subscriptions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  locale={locale}
                  onFreeze={handleFreeze}
                  onCreateInvoice={handleCreateInvoice}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noSubscriptions}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={`/${locale}/members/${member.id}/subscription/new`}>
                  <Plus className="me-2 h-4 w-4" />
                  {texts.addSubscription}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Upload Dialog */}
      <PhotoUploadDialog
        memberId={member.id}
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
      />

      {/* Freeze Subscription Dialog */}
      {selectedSubscription && (
        <FreezeSubscriptionDialog
          open={freezeDialogOpen}
          onOpenChange={(open) => {
            setFreezeDialogOpen(open);
            if (!open) setSelectedSubscription(null);
          }}
          subscriptionId={selectedSubscription.id}
          memberId={member.id}
        />
      )}

      {/* Add Credit Dialog */}
      <AddCreditDialog
        open={addCreditDialogOpen}
        onOpenChange={setAddCreditDialogOpen}
        memberId={member.id}
      />

      {/* Adjust Balance Dialog */}
      <AdjustBalanceDialog
        open={adjustBalanceDialogOpen}
        onOpenChange={setAdjustBalanceDialogOpen}
        memberId={member.id}
        currentBalance={wallet?.balance.amount ?? 0}
      />

      {/* Reset Password Dialog */}
      {member.userId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          memberId={member.id}
          memberName={member.fullName.en ?? member.fullName.ar ?? undefined}
        />
      )}

      {/* Create User Account Dialog */}
      {!member.userId && (
        <CreateUserAccountDialog
          open={createUserOpen}
          onOpenChange={setCreateUserOpen}
          memberId={member.id}
          memberName={member.fullName.en ?? member.fullName.ar ?? undefined}
          memberEmail={member.email}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {texts.deleteDescription}
              <span className="block mt-2 font-medium text-foreground">
                {member.fullName.en ?? member.fullName.ar}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
