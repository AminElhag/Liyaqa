package com.liyaqa.platform.application.services

import com.liyaqa.platform.api.dto.ClientGrowthResponse
import com.liyaqa.platform.api.dto.DealPipelineOverviewResponse
import com.liyaqa.platform.api.dto.MonthlyRevenueResponse
import com.liyaqa.platform.api.dto.PlatformRevenueResponse
import com.liyaqa.platform.api.dto.PlatformSummaryResponse
import com.liyaqa.platform.api.dto.TopClientResponse
import com.liyaqa.shared.infrastructure.export.CsvExportWriter
import com.lowagie.text.*
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.awt.Color
import java.io.ByteArrayOutputStream
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

/**
 * Service for exporting platform dashboard data to CSV and PDF formats.
 *
 * Exports:
 * - Summary statistics to CSV
 * - Revenue breakdown to CSV
 * - Complete dashboard report to PDF
 */
@Service
@Transactional(readOnly = true)
class PlatformDashboardExportService(
    private val dashboardService: PlatformDashboardService,
    private val csvWriter: CsvExportWriter
) {
    private val logger = LoggerFactory.getLogger(PlatformDashboardExportService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    companion object {
        private const val REPORT_TITLE = "Liyaqa Platform Dashboard Report"
        private const val COMPANY_NAME = "Liyaqa Sports Management Platform"
    }

    // ==================== CSV EXPORTS ====================

    /**
     * Exports platform summary statistics to CSV.
     *
     * @return CSV file as ByteArray
     */
    fun exportSummaryToCsv(): ByteArray {
        logger.info("Generating platform summary CSV export")

        val summary = dashboardService.getSummary()

        val headersEn = listOf(
            "Metric", "Value", "Category"
        )
        val headersAr = listOf(
            "المقياس", "القيمة", "الفئة"
        )

        val rows = listOf(
            // Client metrics
            listOf("Total Clients", summary.totalClients.toString(), "Clients"),
            listOf("Active Clients", summary.activeClients.toString(), "Clients"),
            listOf("Pending Clients", summary.pendingClients.toString(), "Clients"),
            listOf("Suspended Clients", summary.suspendedClients.toString(), "Clients"),

            // Subscription metrics
            listOf("Total Subscriptions", summary.totalSubscriptions.toString(), "Subscriptions"),
            listOf("Active Subscriptions", summary.activeSubscriptions.toString(), "Subscriptions"),
            listOf("Trial Subscriptions", summary.trialSubscriptions.toString(), "Subscriptions"),
            listOf("Expiring Subscriptions (30d)", summary.expiringSubscriptions.toString(), "Subscriptions"),

            // Deal metrics
            listOf("Total Deals", summary.totalDeals.toString(), "Sales"),
            listOf("Open Deals", summary.openDeals.toString(), "Sales"),
            listOf("Won Deals (This Month)", summary.wonDealsThisMonth.toString(), "Sales"),
            listOf("Lost Deals (This Month)", summary.lostDealsThisMonth.toString(), "Sales"),

            // Invoice metrics
            listOf("Total Invoices", summary.totalInvoices.toString(), "Billing"),
            listOf("Unpaid Invoices", summary.unpaidInvoices.toString(), "Billing"),
            listOf("Overdue Invoices", summary.overdueInvoices.toString(), "Billing")
        )

        logger.info("Exported ${rows.size} summary metrics")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    /**
     * Exports revenue metrics to CSV.
     *
     * @param timezone Timezone for date calculations
     * @return CSV file as ByteArray
     */
    fun exportRevenueToCsv(timezone: String = "Asia/Riyadh"): ByteArray {
        logger.info("Generating platform revenue CSV export")

        val revenue = dashboardService.getRevenue(timezone)

        val headersEn = listOf(
            "Metric", "Amount (SAR)", "Percentage/Rate"
        )
        val headersAr = listOf(
            "المقياس", "المبلغ (ريال)", "النسبة/المعدل"
        )

        val rows = listOf(
            listOf("Total Revenue", revenue.totalRevenue.toString(), "-"),
            listOf("Revenue This Month", revenue.revenueThisMonth.toString(), "-"),
            listOf("Revenue Last Month", revenue.revenueLastMonth.toString(), "-"),
            listOf("Revenue This Year", revenue.revenueThisYear.toString(), "-"),
            listOf("Monthly Recurring Revenue (MRR)", revenue.monthlyRecurringRevenue.toString(), "-"),
            listOf("Average Revenue Per Client", revenue.averageRevenuePerClient.toString(), "-"),
            listOf("Outstanding Amount", revenue.outstandingAmount.toString(), "-"),
            listOf("Overdue Amount", revenue.overdueAmount.toString(), "-"),
            listOf("Collection Rate", "-", "${revenue.collectionRate}%")
        )

        logger.info("Exported ${rows.size} revenue metrics")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    /**
     * Exports monthly revenue breakdown to CSV.
     *
     * @param months Number of months to include (default: 12)
     * @return CSV file as ByteArray
     */
    fun exportMonthlyRevenueToCsv(months: Int = 12): ByteArray {
        logger.info("Generating monthly revenue CSV export - $months months")

        val monthlyData = dashboardService.getMonthlyRevenue(months)

        val headersEn = listOf(
            "Year", "Month", "Month Name", "Revenue (SAR)", "Invoice Count"
        )
        val headersAr = listOf(
            "السنة", "الشهر", "اسم الشهر", "الإيرادات (ريال)", "عدد الفواتير"
        )

        val rows = monthlyData.map { data ->
            listOf(
                data.year.toString(),
                data.month.toString(),
                data.monthName,
                data.revenue.toString(),
                data.invoiceCount.toString()
            )
        }

        logger.info("Exported ${rows.size} monthly revenue records")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    /**
     * Exports top clients by revenue to CSV.
     *
     * @param limit Number of top clients to include
     * @return CSV file as ByteArray
     */
    fun exportTopClientsToCsv(limit: Int = 10): ByteArray {
        logger.info("Generating top clients CSV export - top $limit")

        val topClients = dashboardService.getTopClients(limit)

        val headersEn = listOf(
            "Organization ID", "Organization Name (EN)", "Organization Name (AR)",
            "Total Revenue (SAR)", "Invoice Count", "Subscription Status"
        )
        val headersAr = listOf(
            "معرف المنظمة", "اسم المنظمة (EN)", "اسم المنظمة (AR)",
            "إجمالي الإيرادات (ريال)", "عدد الفواتير", "حالة الاشتراك"
        )

        val rows = topClients.map { client ->
            listOf(
                client.organizationId.toString(),
                client.organizationNameEn,
                client.organizationNameAr ?: "",
                client.totalRevenue.toString(),
                client.invoiceCount.toString(),
                client.subscriptionStatus
            )
        }

        logger.info("Exported ${rows.size} top clients")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    // ==================== PDF EXPORT ====================

    /**
     * Exports complete dashboard report to PDF.
     *
     * @param timezone Timezone for date calculations
     * @return PDF file as ByteArray
     */
    fun exportDashboardToPdf(timezone: String = "Asia/Riyadh"): ByteArray {
        logger.info("Generating platform dashboard PDF export")

        val baos = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 36f, 36f, 54f, 36f)
        val writer = PdfWriter.getInstance(document, baos)

        document.open()

        // Title and header
        addPdfHeader(document)

        // Summary section
        val summary = dashboardService.getSummary()
        addPdfSection(document, "Summary Statistics", createSummaryTable(summary))

        // Revenue section
        val revenue = dashboardService.getRevenue(timezone)
        addPdfSection(document, "Revenue Metrics", createRevenueTable(revenue))

        // Growth section
        val growth = dashboardService.getClientGrowth()
        addPdfSection(document, "Client Growth", createGrowthTable(growth))

        // Deal pipeline section
        val pipeline = dashboardService.getDealPipeline()
        addPdfSection(document, "Deal Pipeline", createPipelineTable(pipeline))

        // Monthly revenue chart section
        val monthlyData = dashboardService.getMonthlyRevenue(6)
        addPdfSection(document, "Monthly Revenue (Last 6 Months)", createMonthlyRevenueTable(monthlyData))

        // Top clients section
        val topClients = dashboardService.getTopClients(5)
        addPdfSection(document, "Top 5 Clients", createTopClientsTable(topClients))

        // Footer
        addPdfFooter(document)

        document.close()

        logger.info("Generated PDF report - ${baos.size()} bytes")
        return baos.toByteArray()
    }

    // ==================== PDF HELPER METHODS ====================

    private fun addPdfHeader(document: Document) {
        val titleFont = Font(Font.HELVETICA, 20f, Font.BOLD, Color(41, 128, 185))
        val subtitleFont = Font(Font.HELVETICA, 10f, Font.NORMAL, Color.GRAY)

        val title = Paragraph(REPORT_TITLE, titleFont)
        title.alignment = Element.ALIGN_CENTER
        document.add(title)

        val date = Paragraph("Generated: ${LocalDate.now().format(dateFormatter)}", subtitleFont)
        date.alignment = Element.ALIGN_CENTER
        date.spacingAfter = 20f
        document.add(date)

        val company = Paragraph(COMPANY_NAME, subtitleFont)
        company.alignment = Element.ALIGN_CENTER
        company.spacingAfter = 30f
        document.add(company)
    }

    private fun addPdfSection(document: Document, title: String, table: PdfPTable) {
        val sectionFont = Font(Font.HELVETICA, 14f, Font.BOLD, Color(52, 73, 94))
        val sectionTitle = Paragraph(title, sectionFont)
        sectionTitle.spacingBefore = 15f
        sectionTitle.spacingAfter = 10f
        document.add(sectionTitle)
        document.add(table)
    }

    private fun addPdfFooter(document: Document) {
        val footerFont = Font(Font.HELVETICA, 8f, Font.ITALIC, Color.GRAY)
        val footer = Paragraph("\nGenerated by Liyaqa Platform - Internal Use Only", footerFont)
        footer.alignment = Element.ALIGN_CENTER
        footer.spacingBefore = 30f
        document.add(footer)
    }

    private fun createSummaryTable(summary: PlatformSummaryResponse): PdfPTable {
        val table = PdfPTable(3)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(2f, 1f, 1.5f))
        table.setSpacingAfter(10f)

        // Header
        addTableHeader(table, listOf("Metric", "Value", "Category"))

        // Rows
        addTableRow(table, listOf("Total Clients", summary.totalClients.toString(), "Clients"))
        addTableRow(table, listOf("Active Clients", summary.activeClients.toString(), "Clients"))
        addTableRow(table, listOf("Active Subscriptions", summary.activeSubscriptions.toString(), "Subscriptions"))
        addTableRow(table, listOf("Trial Subscriptions", summary.trialSubscriptions.toString(), "Subscriptions"))
        addTableRow(table, listOf("Expiring (30d)", summary.expiringSubscriptions.toString(), "Subscriptions"))
        addTableRow(table, listOf("Open Deals", summary.openDeals.toString(), "Sales"))
        addTableRow(table, listOf("Unpaid Invoices", summary.unpaidInvoices.toString(), "Billing"))
        addTableRow(table, listOf("Overdue Invoices", summary.overdueInvoices.toString(), "Billing"))

        return table
    }

    private fun createRevenueTable(revenue: PlatformRevenueResponse): PdfPTable {
        val table = PdfPTable(2)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(2f, 1.5f))
        table.setSpacingAfter(10f)

        addTableHeader(table, listOf("Metric", "Amount (SAR)"))

        addTableRow(table, listOf("Total Revenue", revenue.totalRevenue.toString()))
        addTableRow(table, listOf("Revenue This Month", revenue.revenueThisMonth.toString()))
        addTableRow(table, listOf("Revenue Last Month", revenue.revenueLastMonth.toString()))
        addTableRow(table, listOf("MRR", revenue.monthlyRecurringRevenue.toString()))
        addTableRow(table, listOf("Avg Per Client", revenue.averageRevenuePerClient.toString()))
        addTableRow(table, listOf("Outstanding", revenue.outstandingAmount.toString()))
        addTableRow(table, listOf("Collection Rate", "${revenue.collectionRate}%"))

        return table
    }

    private fun createGrowthTable(growth: ClientGrowthResponse): PdfPTable {
        val table = PdfPTable(2)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(2f, 1f))
        table.setSpacingAfter(10f)

        addTableHeader(table, listOf("Metric", "Value"))

        addTableRow(table, listOf("New Clients (This Month)", growth.newClientsThisMonth.toString()))
        addTableRow(table, listOf("New Clients (Last Month)", growth.newClientsLastMonth.toString()))
        addTableRow(table, listOf("Churned Clients", growth.churnedClientsThisMonth.toString()))
        addTableRow(table, listOf("Net Growth", growth.netGrowthThisMonth.toString()))
        addTableRow(table, listOf("Growth Rate", "${growth.growthRate}%"))

        return table
    }

    private fun createPipelineTable(pipeline: DealPipelineOverviewResponse): PdfPTable {
        val table = PdfPTable(2)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(2f, 1f))
        table.setSpacingAfter(10f)

        addTableHeader(table, listOf("Stage", "Count"))

        for ((stage, count) in pipeline.counts) {
            addTableRow(table, listOf(stage.name, count.toString()))
        }
        addTableRow(table, listOf("Total Value (${pipeline.currency})", pipeline.totalValue.toString()))

        return table
    }

    private fun createMonthlyRevenueTable(monthlyData: List<MonthlyRevenueResponse>): PdfPTable {
        val table = PdfPTable(3)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(1.5f, 1.5f, 1f))
        table.setSpacingAfter(10f)

        addTableHeader(table, listOf("Month", "Revenue (SAR)", "Invoices"))

        monthlyData.forEach { data ->
            addTableRow(table, listOf(
                "${data.monthName} ${data.year}",
                data.revenue.toString(),
                data.invoiceCount.toString()
            ))
        }

        return table
    }

    private fun createTopClientsTable(topClients: List<TopClientResponse>): PdfPTable {
        val table = PdfPTable(3)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(2f, 1.5f, 1f))
        table.setSpacingAfter(10f)

        addTableHeader(table, listOf("Organization", "Revenue (SAR)", "Invoices"))

        topClients.forEach { client ->
            addTableRow(table, listOf(
                client.organizationNameEn,
                client.totalRevenue.toString(),
                client.invoiceCount.toString()
            ))
        }

        return table
    }

    private fun addTableHeader(table: PdfPTable, headers: List<String>) {
        val headerFont = Font(Font.HELVETICA, 10f, Font.BOLD, Color.WHITE)
        headers.forEach { header ->
            val cell = PdfPCell(Phrase(header, headerFont))
            cell.backgroundColor = Color(52, 73, 94)
            cell.horizontalAlignment = Element.ALIGN_CENTER
            cell.setPadding(8f)
            table.addCell(cell)
        }
    }

    private fun addTableRow(table: PdfPTable, values: List<String>) {
        val cellFont = Font(Font.HELVETICA, 9f, Font.NORMAL, Color.BLACK)
        values.forEach { value ->
            val cell = PdfPCell(Phrase(value, cellFont))
            cell.setPadding(6f)
            table.addCell(cell)
        }
    }

    /**
     * Generates a filename for the export.
     */
    fun generateFilename(exportType: String, extension: String): String {
        val date = LocalDate.now().format(dateFormatter)
        return "platform_dashboard_${exportType}_$date.$extension"
    }
}
