package com.liyaqa.platform.analytics.service

import com.liyaqa.platform.analytics.exception.UnsupportedExportFormatException
import com.liyaqa.platform.analytics.model.ExportFormat
import com.liyaqa.platform.analytics.model.ReportType
import com.liyaqa.shared.infrastructure.export.CsvExportWriter
import com.lowagie.text.Document
import com.lowagie.text.Element
import com.lowagie.text.Font
import com.lowagie.text.PageSize
import com.lowagie.text.Paragraph
import com.lowagie.text.Phrase
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

@Service
@Transactional(readOnly = true)
class AnalyticsExportService(
    private val analyticsService: PlatformAnalyticsService,
    private val churnService: ChurnAnalyticsService,
    private val csvWriter: CsvExportWriter
) {
    private val logger = LoggerFactory.getLogger(AnalyticsExportService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    fun export(type: ReportType, format: ExportFormat): ByteArray {
        logger.info("Generating analytics export: type={}, format={}", type, format)
        return when (format) {
            ExportFormat.CSV -> exportToCsv(type)
            ExportFormat.PDF -> exportToPdf(type)
        }
    }

    fun generateFilename(type: ReportType, format: ExportFormat): String {
        val date = LocalDate.now().format(dateFormatter)
        val ext = format.name.lowercase()
        return "analytics_${type.name.lowercase()}_$date.$ext"
    }

    // ==================== CSV ====================

    private fun exportToCsv(type: ReportType): ByteArray {
        return when (type) {
            ReportType.REVENUE -> exportRevenueCsv()
            ReportType.CHURN -> exportChurnCsv()
            ReportType.GROWTH -> exportGrowthCsv()
            ReportType.FULL -> exportFullCsv()
        }
    }

    private fun exportRevenueCsv(): ByteArray {
        val dashboard = analyticsService.getDashboard()
        val headersEn = listOf("Metric", "Value")
        val headersAr = listOf("المقياس", "القيمة")

        val rows = mutableListOf<List<Any?>>()
        rows.add(listOf("Total Revenue (SAR)", dashboard.overview.totalRevenueSAR.toString()))
        rows.add(listOf("MRR (SAR)", dashboard.overview.mrr.toString()))
        rows.add(listOf("ARR (SAR)", dashboard.overview.arr.toString()))
        rows.add(listOf("Avg Revenue Per Tenant (SAR)", dashboard.overview.averageRevenuePerTenant.toString()))
        rows.add(listOf("Revenue Growth %", dashboard.overview.revenueGrowthPercent.toString()))
        rows.add(listOf("", ""))
        rows.add(listOf("Plan", "Revenue (SAR)"))
        for (rb in dashboard.revenueBreakdown) {
            rows.add(listOf(rb.planName, rb.revenueSAR.toString()))
        }

        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    private fun exportChurnCsv(): ByteArray {
        val churn = churnService.getChurnAnalysis()
        val headersEn = listOf("Metric", "Value")
        val headersAr = listOf("المقياس", "القيمة")

        val rows = mutableListOf<List<Any?>>()
        rows.add(listOf("Churn Rate (30d)", "${churn.churnRate30d}%"))
        rows.add(listOf("Churn Rate (90d)", "${churn.churnRate90d}%"))
        rows.add(listOf("Churn Rate (YTD)", "${churn.churnRateYTD}%"))
        rows.add(listOf("", ""))
        rows.add(listOf("Churn Reason", "Count"))
        for (r in churn.churnReasons) {
            rows.add(listOf(r.reason, r.count.toString()))
        }
        rows.add(listOf("", ""))
        rows.add(listOf("At-Risk Tenant", "Risk Score"))
        for (t in churn.atRiskTenants) {
            rows.add(listOf(t.name, t.riskScore.toString()))
        }

        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    private fun exportGrowthCsv(): ByteArray {
        val dashboard = analyticsService.getDashboard()
        val headersEn = listOf("Month", "New Tenants", "Churned Tenants", "Net Growth")
        val headersAr = listOf("الشهر", "عملاء جدد", "عملاء مغادرون", "النمو الصافي")

        val rows = dashboard.tenantGrowth.map { g ->
            listOf<Any?>(g.month.toString(), g.newTenants.toString(), g.churnedTenants.toString(), g.netGrowth.toString())
        }

        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    private fun exportFullCsv(): ByteArray {
        val dashboard = analyticsService.getDashboard()
        val churn = churnService.getChurnAnalysis()
        val headersEn = listOf("Section", "Metric", "Value")
        val headersAr = listOf("القسم", "المقياس", "القيمة")

        val rows = mutableListOf<List<Any?>>()

        // Overview
        rows.add(listOf("Overview", "Total Tenants", dashboard.overview.totalTenants.toString()))
        rows.add(listOf("Overview", "Active Tenants", dashboard.overview.activeTenants.toString()))
        rows.add(listOf("Overview", "Trial Tenants", dashboard.overview.trialTenants.toString()))
        rows.add(listOf("Overview", "Churned Tenants", dashboard.overview.churnedTenants.toString()))
        rows.add(listOf("Overview", "Total End Users", dashboard.overview.totalEndUsers.toString()))
        rows.add(listOf("Revenue", "Total Revenue (SAR)", dashboard.overview.totalRevenueSAR.toString()))
        rows.add(listOf("Revenue", "MRR (SAR)", dashboard.overview.mrr.toString()))
        rows.add(listOf("Revenue", "ARR (SAR)", dashboard.overview.arr.toString()))
        rows.add(listOf("Revenue", "Revenue Growth %", dashboard.overview.revenueGrowthPercent.toString()))

        // Revenue by plan
        for (rb in dashboard.revenueBreakdown) {
            rows.add(listOf("Revenue by Plan", rb.planName, rb.revenueSAR.toString()))
        }

        // Growth
        for (g in dashboard.tenantGrowth) {
            rows.add(listOf("Growth", "${g.month} New", g.newTenants.toString()))
            rows.add(listOf("Growth", "${g.month} Churned", g.churnedTenants.toString()))
            rows.add(listOf("Growth", "${g.month} Net", g.netGrowth.toString()))
        }

        // Geographic
        for (geo in dashboard.geographicDistribution) {
            rows.add(listOf("Geographic", geo.city, geo.tenantCount.toString()))
        }

        // Churn
        rows.add(listOf("Churn", "30d Rate", "${churn.churnRate30d}%"))
        rows.add(listOf("Churn", "90d Rate", "${churn.churnRate90d}%"))
        rows.add(listOf("Churn", "YTD Rate", "${churn.churnRateYTD}%"))
        for (r in churn.churnReasons) {
            rows.add(listOf("Churn Reasons", r.reason, r.count.toString()))
        }

        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    // ==================== PDF ====================

    private fun exportToPdf(type: ReportType): ByteArray {
        val baos = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 36f, 36f, 54f, 36f)
        PdfWriter.getInstance(document, baos)
        document.open()

        addPdfHeader(document, type)

        when (type) {
            ReportType.REVENUE -> addRevenueSection(document)
            ReportType.CHURN -> addChurnSection(document)
            ReportType.GROWTH -> addGrowthSection(document)
            ReportType.FULL -> {
                addRevenueSection(document)
                addGrowthSection(document)
                addChurnSection(document)
            }
        }

        addPdfFooter(document)
        document.close()

        return baos.toByteArray()
    }

    private fun addRevenueSection(document: Document) {
        val dashboard = analyticsService.getDashboard()
        val table = PdfPTable(2)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(2f, 1.5f))
        table.setSpacingAfter(10f)

        addTableHeader(table, listOf("Metric", "Value"))
        addTableRow(table, listOf("Total Revenue (SAR)", dashboard.overview.totalRevenueSAR.toString()))
        addTableRow(table, listOf("MRR (SAR)", dashboard.overview.mrr.toString()))
        addTableRow(table, listOf("ARR (SAR)", dashboard.overview.arr.toString()))
        addTableRow(table, listOf("Avg Revenue Per Tenant", dashboard.overview.averageRevenuePerTenant.toString()))
        addTableRow(table, listOf("Revenue Growth %", "${dashboard.overview.revenueGrowthPercent}%"))

        addPdfSection(document, "Revenue Overview", table)

        if (dashboard.revenueBreakdown.isNotEmpty()) {
            val planTable = PdfPTable(3)
            planTable.widthPercentage = 100f
            planTable.setWidths(floatArrayOf(2f, 1f, 1.5f))
            planTable.setSpacingAfter(10f)

            addTableHeader(planTable, listOf("Plan", "Tenants", "Revenue (SAR)"))
            for (rb in dashboard.revenueBreakdown) {
                addTableRow(planTable, listOf(rb.planName, rb.tenantCount.toString(), rb.revenueSAR.toString()))
            }
            addPdfSection(document, "Revenue by Plan", planTable)
        }
    }

    private fun addGrowthSection(document: Document) {
        val dashboard = analyticsService.getDashboard()

        if (dashboard.tenantGrowth.isNotEmpty()) {
            val table = PdfPTable(4)
            table.widthPercentage = 100f
            table.setWidths(floatArrayOf(1.5f, 1f, 1f, 1f))
            table.setSpacingAfter(10f)

            addTableHeader(table, listOf("Month", "New", "Churned", "Net Growth"))
            for (g in dashboard.tenantGrowth) {
                addTableRow(table, listOf(g.month.toString(), g.newTenants.toString(), g.churnedTenants.toString(), g.netGrowth.toString()))
            }
            addPdfSection(document, "Tenant Growth (12 Months)", table)
        }

        if (dashboard.geographicDistribution.isNotEmpty()) {
            val geoTable = PdfPTable(2)
            geoTable.widthPercentage = 100f
            geoTable.setWidths(floatArrayOf(2f, 1f))
            geoTable.setSpacingAfter(10f)

            addTableHeader(geoTable, listOf("City", "Tenant Count"))
            for (geo in dashboard.geographicDistribution) {
                addTableRow(geoTable, listOf(geo.city, geo.tenantCount.toString()))
            }
            addPdfSection(document, "Geographic Distribution", geoTable)
        }
    }

    private fun addChurnSection(document: Document) {
        val churn = churnService.getChurnAnalysis()

        val rateTable = PdfPTable(2)
        rateTable.widthPercentage = 100f
        rateTable.setWidths(floatArrayOf(2f, 1f))
        rateTable.setSpacingAfter(10f)

        addTableHeader(rateTable, listOf("Period", "Churn Rate"))
        addTableRow(rateTable, listOf("30 Days", "${churn.churnRate30d}%"))
        addTableRow(rateTable, listOf("90 Days", "${churn.churnRate90d}%"))
        addTableRow(rateTable, listOf("Year to Date", "${churn.churnRateYTD}%"))
        addPdfSection(document, "Churn Analysis", rateTable)

        if (churn.churnReasons.isNotEmpty()) {
            val reasonTable = PdfPTable(3)
            reasonTable.widthPercentage = 100f
            reasonTable.setWidths(floatArrayOf(2f, 1f, 1f))
            reasonTable.setSpacingAfter(10f)

            addTableHeader(reasonTable, listOf("Reason", "Count", "Percentage"))
            for (r in churn.churnReasons) {
                addTableRow(reasonTable, listOf(r.reason, r.count.toString(), "${r.percentage}%"))
            }
            addPdfSection(document, "Churn Reasons", reasonTable)
        }

        if (churn.atRiskTenants.isNotEmpty()) {
            val riskTable = PdfPTable(3)
            riskTable.widthPercentage = 100f
            riskTable.setWidths(floatArrayOf(2f, 1f, 2f))
            riskTable.setSpacingAfter(10f)

            addTableHeader(riskTable, listOf("Tenant", "Score", "Risk Factors"))
            for (t in churn.atRiskTenants) {
                addTableRow(riskTable, listOf(t.name, t.riskScore.toString(), t.riskFactors.joinToString(", ")))
            }
            addPdfSection(document, "At-Risk Tenants", riskTable)
        }
    }

    // ==================== PDF Helpers ====================

    private fun addPdfHeader(document: Document, type: ReportType) {
        val titleFont = Font(Font.HELVETICA, 20f, Font.BOLD, Color(41, 128, 185))
        val subtitleFont = Font(Font.HELVETICA, 10f, Font.NORMAL, Color.GRAY)

        val title = Paragraph("Liyaqa Platform Analytics - ${type.name} Report", titleFont)
        title.alignment = Element.ALIGN_CENTER
        document.add(title)

        val date = Paragraph("Generated: ${LocalDate.now().format(dateFormatter)}", subtitleFont)
        date.alignment = Element.ALIGN_CENTER
        date.spacingAfter = 30f
        document.add(date)
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
}
