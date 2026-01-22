"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { createMember } from "@/lib/api/members";
import type { CreateMemberRequest } from "@/types/member";

interface ParsedMember {
  row: number;
  firstNameEn: string;
  firstNameAr: string;
  lastNameEn: string;
  lastNameAr: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  errors: string[];
  status: "pending" | "importing" | "success" | "failed";
  errorMessage?: string;
}

export default function MembersImportPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  const texts = {
    title: locale === "ar" ? "استيراد الأعضاء" : "Import Members",
    description:
      locale === "ar"
        ? "استيراد أعضاء جدد من ملف CSV"
        : "Import new members from a CSV file",
    back: locale === "ar" ? "العودة للأعضاء" : "Back to Members",
    uploadCsv: locale === "ar" ? "تحميل ملف CSV" : "Upload CSV File",
    dropzone:
      locale === "ar"
        ? "اسحب وأفلت ملف CSV هنا، أو انقر للاختيار"
        : "Drag and drop a CSV file here, or click to select",
    csvFormat: locale === "ar" ? "تنسيق الملف" : "File Format",
    requiredFields: locale === "ar" ? "الحقول المطلوبة" : "Required Fields",
    optionalFields: locale === "ar" ? "الحقول الاختيارية" : "Optional Fields",
    preview: locale === "ar" ? "معاينة البيانات" : "Data Preview",
    row: locale === "ar" ? "الصف" : "Row",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    status: locale === "ar" ? "الحالة" : "Status",
    errors: locale === "ar" ? "الأخطاء" : "Errors",
    valid: locale === "ar" ? "صالح" : "Valid",
    invalid: locale === "ar" ? "غير صالح" : "Invalid",
    importing: locale === "ar" ? "جاري الاستيراد" : "Importing",
    success: locale === "ar" ? "ناجح" : "Success",
    failed: locale === "ar" ? "فاشل" : "Failed",
    pending: locale === "ar" ? "في الانتظار" : "Pending",
    startImport: locale === "ar" ? "بدء الاستيراد" : "Start Import",
    importProgress: locale === "ar" ? "تقدم الاستيراد" : "Import Progress",
    importComplete: locale === "ar" ? "اكتمل الاستيراد" : "Import Complete",
    successCount: locale === "ar" ? "نجاح" : "Success",
    failedCount: locale === "ar" ? "فشل" : "Failed",
    clearData: locale === "ar" ? "مسح البيانات" : "Clear Data",
    downloadTemplate:
      locale === "ar" ? "تحميل القالب" : "Download Template",
    noValidMembers:
      locale === "ar"
        ? "لا يوجد أعضاء صالحين للاستيراد"
        : "No valid members to import",
    invalidFile:
      locale === "ar"
        ? "ملف غير صالح. يرجى تحميل ملف CSV."
        : "Invalid file. Please upload a CSV file.",
    parseError:
      locale === "ar"
        ? "خطأ في قراءة الملف"
        : "Error parsing file",
    requiredFieldMissing:
      locale === "ar" ? "حقل مطلوب مفقود" : "Required field missing",
    invalidEmail:
      locale === "ar" ? "بريد إلكتروني غير صالح" : "Invalid email",
    invalidPhone:
      locale === "ar" ? "رقم هاتف غير صالح" : "Invalid phone number",
  };

  const validateMember = (member: Partial<ParsedMember>): string[] => {
    const errors: string[] = [];

    if (!member.firstNameEn?.trim()) {
      errors.push(`${texts.requiredFieldMissing}: firstNameEn`);
    }
    if (!member.lastNameEn?.trim()) {
      errors.push(`${texts.requiredFieldMissing}: lastNameEn`);
    }
    if (!member.email?.trim()) {
      errors.push(`${texts.requiredFieldMissing}: email`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      errors.push(texts.invalidEmail);
    }
    if (!member.phone?.trim()) {
      errors.push(`${texts.requiredFieldMissing}: phone`);
    } else if (!/^\+?[\d\s-]{8,}$/.test(member.phone)) {
      errors.push(texts.invalidPhone);
    }

    return errors;
  };

  const parseCSV = (content: string): ParsedMember[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const members: ParsedMember[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const memberData: Record<string, string> = {};

      headers.forEach((header, index) => {
        memberData[header] = values[index] || "";
      });

      const member: ParsedMember = {
        row: i + 1,
        firstNameEn: memberData["firstname_en"] || memberData["firstname"] || "",
        firstNameAr: memberData["firstname_ar"] || "",
        lastNameEn: memberData["lastname_en"] || memberData["lastname"] || "",
        lastNameAr: memberData["lastname_ar"] || "",
        email: memberData["email"] || "",
        phone: memberData["phone"] || "",
        gender: memberData["gender"] || undefined,
        dateOfBirth: memberData["dateofbirth"] || memberData["dob"] || undefined,
        errors: [],
        status: "pending",
      };

      member.errors = validateMember(member);
      members.push(member);
    }

    return members;
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: texts.invalidFile,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);
        setParsedMembers(parsed);
        setImportStats({ success: 0, failed: 0 });
        setImportProgress(0);
      } catch {
        toast({
          title: locale === "ar" ? "خطأ" : "Error",
          description: texts.parseError,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => {
    const template = `firstName_en,firstName_ar,lastName_en,lastName_ar,email,phone,gender,dateOfBirth
John,,Doe,,john@example.com,+966555555555,MALE,1990-01-15
,,,,,,FEMALE,`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const startImport = async () => {
    const validMembers = parsedMembers.filter((m) => m.errors.length === 0);
    if (validMembers.length === 0) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: texts.noValidMembers,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < parsedMembers.length; i++) {
      const member = parsedMembers[i];

      // Skip invalid members
      if (member.errors.length > 0) {
        continue;
      }

      // Update status to importing
      setParsedMembers((prev) =>
        prev.map((m, idx) =>
          idx === i ? { ...m, status: "importing" as const } : m
        )
      );

      try {
        const request: CreateMemberRequest = {
          firstName: {
            en: member.firstNameEn,
            ar: member.firstNameAr || undefined,
          },
          lastName: {
            en: member.lastNameEn,
            ar: member.lastNameAr || undefined,
          },
          email: member.email,
          phone: member.phone,
          gender: member.gender as "MALE" | "FEMALE" | undefined,
          dateOfBirth: member.dateOfBirth || undefined,
        };

        await createMember(request);

        setParsedMembers((prev) =>
          prev.map((m, idx) =>
            idx === i ? { ...m, status: "success" as const } : m
          )
        );
        successCount++;
      } catch (error) {
        setParsedMembers((prev) =>
          prev.map((m, idx) =>
            idx === i
              ? {
                  ...m,
                  status: "failed" as const,
                  errorMessage:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : m
          )
        );
        failedCount++;
      }

      setImportProgress(((i + 1) / parsedMembers.length) * 100);
      setImportStats({ success: successCount, failed: failedCount });
    }

    setIsImporting(false);
    toast({
      title: texts.importComplete,
      description: `${texts.successCount}: ${successCount}, ${texts.failedCount}: ${failedCount}`,
    });
  };

  const clearData = () => {
    setParsedMembers([]);
    setImportProgress(0);
    setImportStats({ success: 0, failed: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = parsedMembers.filter((m) => m.errors.length === 0).length;
  const invalidCount = parsedMembers.filter((m) => m.errors.length > 0).length;

  const getStatusBadge = (member: ParsedMember) => {
    if (member.errors.length > 0) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 me-1" />
          {texts.invalid}
        </Badge>
      );
    }

    switch (member.status) {
      case "importing":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 me-1 animate-spin" />
            {texts.importing}
          </Badge>
        );
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 me-1" />
            {texts.success}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 me-1" />
            {texts.failed}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <CheckCircle2 className="h-3 w-3 me-1" />
            {texts.valid}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/members`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="me-2 h-4 w-4" />
          {texts.downloadTemplate}
        </Button>
      </div>

      {/* Upload Area */}
      {parsedMembers.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {texts.uploadCsv}
            </CardTitle>
            <CardDescription>
              {texts.requiredFields}: firstName_en, lastName_en, email, phone
              <br />
              {texts.optionalFields}: firstName_ar, lastName_ar, gender,
              dateOfBirth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">{texts.dropzone}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview & Import */}
      {parsedMembers.length > 0 && (
        <>
          {/* Stats & Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{parsedMembers.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "الإجمالي" : "Total"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {validCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {texts.valid}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {invalidCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {texts.invalid}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearData}>
                    {texts.clearData}
                  </Button>
                  <Button
                    onClick={startImport}
                    disabled={isImporting || validCount === 0}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {texts.importing}
                      </>
                    ) : (
                      texts.startImport
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress */}
              {importProgress > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{texts.importProgress}</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      {texts.successCount}: {importStats.success}
                    </span>
                    <span className="text-red-600">
                      {texts.failedCount}: {importStats.failed}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.preview}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">{texts.row}</TableHead>
                      <TableHead>{texts.name}</TableHead>
                      <TableHead>{texts.email}</TableHead>
                      <TableHead>{texts.phone}</TableHead>
                      <TableHead>{texts.status}</TableHead>
                      <TableHead>{texts.errors}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedMembers.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>{member.row}</TableCell>
                        <TableCell>
                          {member.firstNameEn} {member.lastNameEn}
                          {member.firstNameAr && (
                            <span className="text-muted-foreground ms-2">
                              ({member.firstNameAr} {member.lastNameAr})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.phone}</TableCell>
                        <TableCell>{getStatusBadge(member)}</TableCell>
                        <TableCell>
                          {member.errors.length > 0 && (
                            <div className="text-xs text-destructive">
                              {member.errors.map((e, i) => (
                                <div key={i}>{e}</div>
                              ))}
                            </div>
                          )}
                          {member.errorMessage && (
                            <div className="text-xs text-destructive">
                              {member.errorMessage}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
