"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useMembers, useMember, useCreateInvoice } from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import type { Member } from "@liyaqa/shared/types/member";
import type { CreateLineItemRequest } from "@liyaqa/shared/types/billing";

interface LineItem {
  descriptionEn: string;
  descriptionAr: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [notesEn, setNotesEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { descriptionEn: "", descriptionAr: "", quantity: 1, unitPrice: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);

  // Load member if memberId is provided
  const { data: preselectedMember } = useMember(memberId || "", {
    enabled: !!memberId,
  });

  // Search for members
  const { data: members, isLoading: isLoadingMembers } = useMembers(
    { search: search || undefined, status: "ACTIVE", size: 10 },
    { enabled: search.length >= 2 && !selectedMember }
  );

  const createInvoice = useCreateInvoice();

  // Set preselected member
  if (preselectedMember && !selectedMember) {
    setSelectedMember(preselectedMember);
  }

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "فاتورة جديدة" : "New Invoice",
    selectMember: locale === "ar" ? "اختر العضو" : "Select Member",
    searchPlaceholder:
      locale === "ar"
        ? "ابحث بالاسم أو البريد الإلكتروني..."
        : "Search by name or email...",
    searchHint:
      locale === "ar"
        ? "أدخل حرفين على الأقل للبحث"
        : "Enter at least 2 characters to search",
    noResults: locale === "ar" ? "لا توجد نتائج" : "No results found",
    selectedMember: locale === "ar" ? "العضو المختار" : "Selected Member",
    changeMember: locale === "ar" ? "تغيير" : "Change",
    lineItems: locale === "ar" ? "البنود" : "Line Items",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (EN)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (AR)",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    unitPrice: locale === "ar" ? "سعر الوحدة" : "Unit Price",
    addItem: locale === "ar" ? "إضافة بند" : "Add Item",
    invoiceDetails: locale === "ar" ? "تفاصيل الفاتورة" : "Invoice Details",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (EN)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (AR)",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    create: locale === "ar" ? "إنشاء الفاتورة" : "Create Invoice",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { descriptionEn: "", descriptionAr: "", quantity: 1, unitPrice: 0 },
    ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMember) {
      setError(
        locale === "ar" ? "يرجى اختيار عضو" : "Please select a member"
      );
      return;
    }

    // Validate line items
    const validItems = lineItems.filter(
      (item) => item.descriptionEn && item.quantity > 0 && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      setError(
        locale === "ar"
          ? "يرجى إضافة بند واحد على الأقل"
          : "Please add at least one line item"
      );
      return;
    }

    try {
      const invoiceData = {
        memberId: selectedMember.id,
        lineItems: validItems.map((item) => ({
          description: {
            en: item.descriptionEn,
            ar: item.descriptionAr || undefined,
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        dueDate: dueDate || undefined,
        notes:
          notesEn || notesAr
            ? {
                en: notesEn,
                ar: notesAr || undefined,
              }
            : undefined,
      };

      const invoice = await createInvoice.mutateAsync(invoiceData);
      router.push(`/${locale}/invoices/${invoice.id}`);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/invoices`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{texts.title}</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Member Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.selectMember}</CardTitle>
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
                      {texts.changeMember}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={texts.searchPlaceholder}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="ps-9"
                    />
                  </div>

                  {search.length < 2 && (
                    <p className="text-sm text-muted-foreground">
                      {texts.searchHint}
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
                          {texts.noResults}
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

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.invoiceDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">{texts.dueDate}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notesEn">{texts.notesEn}</Label>
                  <Input
                    id="notesEn"
                    value={notesEn}
                    onChange={(e) => setNotesEn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notesAr">{texts.notesAr}</Label>
                  <Input
                    id="notesAr"
                    value={notesAr}
                    onChange={(e) => setNotesAr(e.target.value)}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {locale === "ar" ? "المجموع الفرعي" : "Subtotal"}
                  </span>
                  <span>{subtotal.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {locale === "ar" ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}
                  </span>
                  <span>{vat.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
                  <span>{total.toFixed(2)} SAR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.lineItems}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg"
              >
                <div className="md:col-span-2 space-y-2">
                  <Label>{texts.descriptionEn} *</Label>
                  <Input
                    value={item.descriptionEn}
                    onChange={(e) =>
                      updateLineItem(index, "descriptionEn", e.target.value)
                    }
                    placeholder="Subscription fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{texts.descriptionAr}</Label>
                  <Input
                    value={item.descriptionAr}
                    onChange={(e) =>
                      updateLineItem(index, "descriptionAr", e.target.value)
                    }
                    placeholder="رسوم الاشتراك"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{texts.quantity}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{texts.unitPrice}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLineItem}>
              <Plus className="me-2 h-4 w-4" />
              {texts.addItem}
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/invoices`)}
          >
            {texts.cancel}
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending ? texts.creating : texts.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
