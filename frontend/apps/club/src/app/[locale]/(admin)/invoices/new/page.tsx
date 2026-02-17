"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Search, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useMembers,
  useMember,
  useCreateInvoice,
  useIssueInvoice,
  useInvoiceCatalog,
} from "@liyaqa/shared/queries";
import { formatCurrency } from "@liyaqa/shared/utils";
import type { Member } from "@liyaqa/shared/types/member";
import type { LineItemType, InvoiceTypeCode, CatalogItem } from "@liyaqa/shared/types/billing";

interface LineItem {
  descriptionEn: string;
  descriptionAr: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  itemType: LineItemType;
}

export default function NewInvoicePage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [invoiceTypeCode, setInvoiceTypeCode] = useState<InvoiceTypeCode>("SIMPLIFIED");
  const [notesEn, setNotesEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { descriptionEn: "", descriptionAr: "", quantity: 1, unitPrice: 0, taxRate: 15, itemType: "OTHER" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Load member if memberId is provided
  const { data: preselectedMember } = useMember(memberId || "", {
    enabled: !!memberId,
  });

  // Search for members
  const { data: members, isLoading: isLoadingMembers } = useMembers(
    { search: search || undefined, status: "ACTIVE", size: 10 },
    { enabled: search.length >= 2 && !selectedMember }
  );

  // Catalog
  const { data: catalogItems, isLoading: isLoadingCatalog } = useInvoiceCatalog();

  const createInvoice = useCreateInvoice();
  const issueInvoice = useIssueInvoice();

  // Set preselected member
  if (preselectedMember && !selectedMember) {
    setSelectedMember(preselectedMember);
  }

  const t = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "فاتورة جديدة" : "New Invoice",
    selectMember: locale === "ar" ? "اختر العضو" : "Select Member",
    searchPlaceholder: locale === "ar" ? "ابحث بالاسم أو البريد الإلكتروني..." : "Search by name or email...",
    searchHint: locale === "ar" ? "أدخل حرفين على الأقل للبحث" : "Enter at least 2 characters to search",
    noResults: locale === "ar" ? "لا توجد نتائج" : "No results found",
    changeMember: locale === "ar" ? "تغيير" : "Change",
    lineItems: locale === "ar" ? "بنود الفاتورة" : "Line Items",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (EN)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (AR)",
    quantity: locale === "ar" ? "الكمية" : "Qty",
    unitPrice: locale === "ar" ? "سعر الوحدة" : "Unit Price",
    taxRate: locale === "ar" ? "الضريبة %" : "Tax %",
    addItem: locale === "ar" ? "إضافة بند" : "Add Item",
    fromCatalog: locale === "ar" ? "من الكتالوج" : "From Catalog",
    customItem: locale === "ar" ? "بند مخصص" : "Custom Item",
    invoiceDetails: locale === "ar" ? "تفاصيل الفاتورة" : "Invoice Details",
    invoiceType: locale === "ar" ? "نوع الفاتورة" : "Invoice Type",
    simplified: locale === "ar" ? "مبسطة (B2C)" : "Simplified (B2C)",
    standard: locale === "ar" ? "قياسية (B2B)" : "Standard (B2B)",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (EN)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (AR)",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    saveAsDraft: locale === "ar" ? "حفظ كمسودة" : "Save as Draft",
    saveAndIssue: locale === "ar" ? "حفظ وإصدار" : "Save & Issue",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    subtotal: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
    vat: locale === "ar" ? "ضريبة القيمة المضافة" : "VAT",
    total: locale === "ar" ? "الإجمالي" : "Total",
    catalog: locale === "ar" ? "الكتالوج" : "Catalog",
    plans: locale === "ar" ? "الخطط" : "Plans",
    classPacks: locale === "ar" ? "باقات الحصص" : "Class Packs",
    products: locale === "ar" ? "المنتجات" : "Products",
    noCatalogItems: locale === "ar" ? "لا توجد عناصر" : "No items available",
    memberRequired: locale === "ar" ? "يرجى اختيار عضو" : "Please select a member",
    lineItemRequired: locale === "ar" ? "يرجى إضافة بند واحد على الأقل" : "Please add at least one line item",
    lineTotal: locale === "ar" ? "إجمالي البند" : "Line Total",
    itemType: locale === "ar" ? "النوع" : "Type",
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { descriptionEn: "", descriptionAr: "", quantity: 1, unitPrice: 0, taxRate: 15, itemType: "OTHER" },
    ]);
  };

  const addCatalogItem = (item: CatalogItem) => {
    setLineItems([
      ...lineItems,
      {
        descriptionEn: item.name.en,
        descriptionAr: item.name.ar || "",
        quantity: 1,
        unitPrice: item.price.amount,
        taxRate: item.taxRate,
        itemType: item.itemType,
      },
    ]);
    setCatalogOpen(false);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleSubmit = async (shouldIssue: boolean) => {
    setError(null);

    if (!selectedMember) {
      setError(t.memberRequired);
      return;
    }

    const validItems = lineItems.filter(
      (item) => item.descriptionEn && item.quantity > 0 && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      setError(t.lineItemRequired);
      return;
    }

    try {
      const invoice = await createInvoice.mutateAsync({
        memberId: selectedMember.id,
        lineItems: validItems.map((item) => ({
          descriptionEn: item.descriptionEn,
          descriptionAr: item.descriptionAr || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemType: item.itemType,
          taxRate: item.taxRate,
        })),
        notesEn: notesEn || undefined,
        notesAr: notesAr || undefined,
        invoiceTypeCode,
      });

      if (shouldIssue) {
        await issueInvoice.mutateAsync(invoice.id);
      }

      router.push(`/${locale}/invoices/${invoice.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  // Compute totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatTotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100,
    0
  );
  const total = subtotal + vatTotal;

  // Group catalog items
  const catalogPlans = catalogItems?.filter((i) => i.itemType === "SUBSCRIPTION") || [];
  const catalogPacks = catalogItems?.filter((i) => i.itemType === "CLASS_PACKAGE") || [];
  const catalogProducts = catalogItems?.filter((i) => i.itemType === "MERCHANDISE") || [];

  const isPending = createInvoice.isPending || issueInvoice.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/invoices`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Member Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t.selectMember}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMember ? (
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      <LocalizedText text={selectedMember.firstName} />{" "}
                      <LocalizedText text={selectedMember.lastName} />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMember(null)}
                  >
                    {t.changeMember}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ps-9"
                  />
                </div>

                {search.length < 2 && (
                  <p className="text-sm text-muted-foreground">
                    {t.searchHint}
                  </p>
                )}

                {search.length >= 2 && isLoadingMembers && (
                  <div className="py-4 flex justify-center">
                    <Loading />
                  </div>
                )}

                {search.length >= 2 && !isLoadingMembers && members?.content && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {members.content.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t.noResults}
                      </p>
                    ) : (
                      members.content.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => {
                            setSelectedMember(member);
                            setSearch("");
                          }}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        >
                          <p className="font-medium">
                            <LocalizedText text={member.firstName} />{" "}
                            <LocalizedText text={member.lastName} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details + Totals */}
        <Card>
          <CardHeader>
            <CardTitle>{t.invoiceDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t.invoiceType}</Label>
              <Select
                value={invoiceTypeCode}
                onValueChange={(v) => setInvoiceTypeCode(v as InvoiceTypeCode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMPLIFIED">{t.simplified}</SelectItem>
                  <SelectItem value="STANDARD">{t.standard}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notesEn">{t.notesEn}</Label>
                <Input
                  id="notesEn"
                  value={notesEn}
                  onChange={(e) => setNotesEn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notesAr">{t.notesAr}</Label>
                <Input
                  id="notesAr"
                  value={notesAr}
                  onChange={(e) => setNotesAr(e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.subtotal}</span>
                <span>{formatCurrency(subtotal, "SAR", locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.vat}</span>
                <span>{formatCurrency(vatTotal, "SAR", locale)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{t.total}</span>
                <span>{formatCurrency(total, "SAR", locale)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.lineItems}</CardTitle>
          <div className="flex gap-2">
            <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Package className="me-2 h-4 w-4" />
                  {t.fromCatalog}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.catalog}</DialogTitle>
                </DialogHeader>
                {isLoadingCatalog ? (
                  <div className="py-8 flex justify-center">
                    <Loading />
                  </div>
                ) : (
                  <Tabs defaultValue="plans">
                    <TabsList className="w-full">
                      <TabsTrigger value="plans" className="flex-1">{t.plans}</TabsTrigger>
                      <TabsTrigger value="packs" className="flex-1">{t.classPacks}</TabsTrigger>
                      <TabsTrigger value="products" className="flex-1">{t.products}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="plans" className="max-h-64 overflow-y-auto space-y-2">
                      {catalogPlans.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t.noCatalogItems}</p>
                      ) : (
                        catalogPlans.map((item) => (
                          <CatalogRow key={item.id} item={item} locale={locale} onSelect={addCatalogItem} />
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="packs" className="max-h-64 overflow-y-auto space-y-2">
                      {catalogPacks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t.noCatalogItems}</p>
                      ) : (
                        catalogPacks.map((item) => (
                          <CatalogRow key={item.id} item={item} locale={locale} onSelect={addCatalogItem} />
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="products" className="max-h-64 overflow-y-auto space-y-2">
                      {catalogProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t.noCatalogItems}</p>
                      ) : (
                        catalogProducts.map((item) => (
                          <CatalogRow key={item.id} item={item} locale={locale} onSelect={addCatalogItem} />
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="me-2 h-4 w-4" />
              {t.customItem}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg"
            >
              <div className="md:col-span-2 space-y-2">
                <Label>{t.descriptionEn} *</Label>
                <Input
                  value={item.descriptionEn}
                  onChange={(e) => updateLineItem(index, "descriptionEn", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.descriptionAr}</Label>
                <Input
                  value={item.descriptionAr}
                  onChange={(e) => updateLineItem(index, "descriptionAr", e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.quantity}</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.unitPrice}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.taxRate}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={item.taxRate}
                  onChange={(e) => updateLineItem(index, "taxRate", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 text-end">
                  <p className="text-xs text-muted-foreground">{t.lineTotal}</p>
                  <p className="font-medium">
                    {formatCurrency(item.quantity * item.unitPrice, "SAR", locale)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/invoices`)}
        >
          {t.cancel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => handleSubmit(false)}
        >
          {isPending ? t.creating : t.saveAsDraft}
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => handleSubmit(true)}
        >
          {isPending ? t.creating : t.saveAndIssue}
        </Button>
      </div>
    </div>
  );
}

function CatalogRow({
  item,
  locale,
  onSelect,
}: {
  item: CatalogItem;
  locale: string;
  onSelect: (item: CatalogItem) => void;
}) {
  return (
    <div
      onClick={() => onSelect(item)}
      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 flex items-center justify-between"
    >
      <div>
        <p className="font-medium">
          <LocalizedText text={item.name} />
        </p>
        {item.description && (
          <p className="text-sm text-muted-foreground">
            <LocalizedText text={item.description} />
          </p>
        )}
      </div>
      <p className="font-medium text-primary">
        {formatCurrency(item.price.amount, item.price.currency, locale)}
      </p>
    </div>
  );
}
