"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  exportSummaryToCsv,
  exportRevenueToCsv,
  exportMonthlyRevenueToCsv,
  exportTopClientsToCsv,
  exportDashboardToPdf,
  downloadBlob,
} from "@/lib/api/platform/dashboard";

interface DashboardExportMenuProps {
  timezone?: string;
  disabled?: boolean;
}

/**
 * Export menu component for platform dashboard.
 * Provides options to export dashboard data to CSV and PDF formats.
 */
export function DashboardExportMenu({ timezone = "Asia/Riyadh", disabled = false }: DashboardExportMenuProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const texts = {
    exportButton: locale === "ar" ? "تصدير" : "Export",
    exportMenu: locale === "ar" ? "تصدير البيانات" : "Export Data",
    csvExports: locale === "ar" ? "تصدير CSV" : "CSV Exports",
    pdfExports: locale === "ar" ? "تصدير PDF" : "PDF Exports",

    // CSV options
    summaryCSV: locale === "ar" ? "ملخص الإحصائيات (CSV)" : "Summary Statistics (CSV)",
    revenueCSV: locale === "ar" ? "مقاييس الإيرادات (CSV)" : "Revenue Metrics (CSV)",
    monthlyCSV: locale === "ar" ? "الإيرادات الشهرية (CSV)" : "Monthly Revenue (CSV)",
    clientsCSV: locale === "ar" ? "أفضل العملاء (CSV)" : "Top Clients (CSV)",

    // PDF options
    fullReport: locale === "ar" ? "تقرير كامل (PDF)" : "Complete Report (PDF)",

    // Messages
    exporting: locale === "ar" ? "جاري التصدير..." : "Exporting...",
    successTitle: locale === "ar" ? "تم التصدير بنجاح" : "Export Successful",
    successDesc: locale === "ar" ? "تم تنزيل الملف" : "File downloaded successfully",
    errorTitle: locale === "ar" ? "فشل التصدير" : "Export Failed",
    errorDesc: locale === "ar" ? "حدث خطأ أثناء التصدير" : "An error occurred during export",
  };

  const handleExport = async (
    exportFn: () => Promise<Blob>,
    filename: string,
    description: string
  ) => {
    try {
      setIsExporting(true);
      toast({
        title: texts.exporting,
        description,
      });

      const blob = await exportFn();
      downloadBlob(blob, filename);

      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: texts.errorTitle,
        description: texts.errorDesc,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateFilename = (prefix: string, extension: string) => {
    const date = new Date().toISOString().split("T")[0];
    return `platform_dashboard_${prefix}_${date}.${extension}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className={locale === "ar" ? "mr-2" : "ml-2"}>{texts.exportButton}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{texts.exportMenu}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* CSV Exports */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {texts.csvExports}
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportSummaryToCsv(),
              generateFilename("summary", "csv"),
              texts.summaryCSV
            )
          }
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span className={locale === "ar" ? "mr-2" : "ml-2"}>{texts.summaryCSV}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportRevenueToCsv(timezone),
              generateFilename("revenue", "csv"),
              texts.revenueCSV
            )
          }
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span className={locale === "ar" ? "mr-2" : "ml-2"}>{texts.revenueCSV}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportMonthlyRevenueToCsv(12),
              generateFilename("monthly_revenue", "csv"),
              texts.monthlyCSV
            )
          }
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span className={locale === "ar" ? "mr-2" : "ml-2"}>{texts.monthlyCSV}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportTopClientsToCsv(10),
              generateFilename("top_clients", "csv"),
              texts.clientsCSV
            )
          }
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span className={locale === "ar" ? "mr-2" : "ml-2"}>{texts.clientsCSV}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* PDF Exports */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {texts.pdfExports}
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportDashboardToPdf(timezone),
              generateFilename("report", "pdf"),
              texts.fullReport
            )
          }
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 text-red-600" />
          <span className={locale === "ar" ? "mr-2" : "ml-2"}>{texts.fullReport}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
