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
  MoreHorizontal,
  User,
  UserCircle,
  Plus,
  Wallet,
  History,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { PhotoUploadDialog } from "@/components/admin/photo-upload-dialog";
import { MemberProfileHero } from "@/components/admin/member-profile-hero";
import { MemberStatsGrid } from "@/components/admin/member-stats-grid";
import { SubscriptionCard } from "@/components/admin/subscription-card";
import { WalletBalanceCard } from "@/components/admin/wallet-balance-card";
import { WalletTransactionsTable } from "@/components/admin/wallet-transactions-table";
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
    delete: locale === "ar" ? "حذف" : "Delete",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
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
    if (
      confirm(
        locale === "ar"
          ? "هل أنت متأكد من حذف هذا العضو؟"
          : "Are you sure you want to delete this member?"
      )
    ) {
      deleteMember.mutate(member.id, {
        onSuccess: () => router.push(`/${locale}/members`),
      });
    }
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {texts.actions}
              <MoreHorizontal className="ms-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/members/${member.id}/edit`}>
                <Edit className="me-2 h-4 w-4" />
                {texts.edit}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {member.status === "ACTIVE" ? (
              <DropdownMenuItem onClick={() => suspendMember.mutate(member.id)}>
                <UserCircle className="me-2 h-4 w-4" />
                {texts.suspend}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => activateMember.mutate(member.id)}>
                <UserCircle className="me-2 h-4 w-4" />
                {texts.activate}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {texts.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

        {/* Recent Transactions */}
        <Card>
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
      </div>

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
    </div>
  );
}
