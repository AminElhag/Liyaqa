package com.liyaqa.billing.infrastructure.pdf

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.organization.domain.model.Organization
import com.lowagie.text.Chunk
import com.lowagie.text.Document
import com.lowagie.text.Element
import com.lowagie.text.Font
import com.lowagie.text.FontFactory
import com.lowagie.text.Image
import com.lowagie.text.PageSize
import com.lowagie.text.Paragraph
import com.lowagie.text.Phrase
import com.lowagie.text.pdf.BaseFont
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.awt.Color
import java.io.ByteArrayOutputStream
import java.time.format.DateTimeFormatter
import java.util.Base64
import jakarta.annotation.PostConstruct

/**
 * Service for generating PDF invoices with bilingual support (English/Arabic).
 * Uses Unicode fonts for proper Arabic character rendering.
 */
@Service
class InvoicePdfGenerator {
    private val logger = LoggerFactory.getLogger(InvoicePdfGenerator::class.java)

    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    // Font paths to try for Arabic support (in order of preference)
    private val arabicFontPaths = listOf(
        // macOS fonts
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        // Linux fonts
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        // Windows fonts
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/arialuni.ttf"
    )

    // Fallback to Helvetica if no Arabic font found
    private var baseFont: BaseFont? = null
    private var useUnicodeFont = false

    // Fonts (initialized in init block)
    private lateinit var titleFont: Font
    private lateinit var headerFont: Font
    private lateinit var normalFont: Font
    private lateinit var smallFont: Font
    private lateinit var tableHeaderFont: Font

    @PostConstruct
    fun init() {
        initializeFonts()
    }

    private fun initializeFonts() {
        // Try to find a Unicode font that supports Arabic
        for (fontPath in arabicFontPaths) {
            try {
                val file = java.io.File(fontPath)
                if (file.exists()) {
                    baseFont = BaseFont.createFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED)
                    useUnicodeFont = true
                    logger.info("Using Unicode font for Arabic support: $fontPath")
                    break
                }
            } catch (e: Exception) {
                logger.debug("Font not available: $fontPath")
            }
        }

        if (baseFont != null) {
            // Create fonts using the Unicode base font
            titleFont = Font(baseFont, 18f, Font.BOLD, Color.BLACK)
            headerFont = Font(baseFont, 12f, Font.BOLD, Color.BLACK)
            normalFont = Font(baseFont, 10f, Font.NORMAL, Color.BLACK)
            smallFont = Font(baseFont, 8f, Font.NORMAL, Color.GRAY)
            tableHeaderFont = Font(baseFont, 10f, Font.BOLD, Color.WHITE)
        } else {
            // Fallback to Helvetica (won't render Arabic correctly)
            logger.warn("No Unicode font found for Arabic support. Arabic text may not render correctly.")
            titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18f, Color.BLACK)
            headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12f, Color.BLACK)
            normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10f, Color.BLACK)
            smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8f, Color.GRAY)
            tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, Color.WHITE)
        }
    }

    /**
     * Checks if Arabic text rendering is supported.
     */
    fun isArabicSupported(): Boolean = useUnicodeFont

    /**
     * Creates a cell with proper text direction based on locale.
     */
    private fun createCell(text: String, font: Font, locale: String): PdfPCell {
        val cell = PdfPCell(Phrase(text, font))
        if (locale == "ar") {
            cell.runDirection = PdfWriter.RUN_DIRECTION_RTL
        }
        return cell
    }

    /**
     * Creates a cell without border and with proper text direction.
     */
    private fun createNoBorderCell(text: String, font: Font, locale: String): PdfPCell {
        val cell = createCell(text, font, locale)
        cell.border = PdfPCell.NO_BORDER
        cell.paddingBottom = 5f
        return cell
    }

    /**
     * Generates a PDF invoice.
     *
     * @param invoice The invoice to generate PDF for
     * @param member The member associated with the invoice
     * @param organization The organization (optional, for header)
     * @param locale The locale for text (en or ar)
     * @return ByteArray containing the PDF data
     */
    fun generateInvoicePdf(
        invoice: Invoice,
        member: Member,
        organization: Organization? = null,
        locale: String = "en"
    ): ByteArray {
        val outputStream = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 50f, 50f, 50f, 50f)

        PdfWriter.getInstance(document, outputStream)
        document.open()

        // Header Section
        addHeader(document, invoice, organization, locale)

        // Invoice Details
        addInvoiceDetails(document, invoice, locale)

        // Member Details
        addMemberDetails(document, member, locale)

        // Line Items Table
        addLineItemsTable(document, invoice, locale)

        // Totals Section
        addTotalsSection(document, invoice, locale)

        // Zatca QR Code (if present)
        addZatcaQrCode(document, invoice, locale)

        // Footer
        addFooter(document, locale)

        document.close()

        return outputStream.toByteArray()
    }

    private fun addHeader(document: Document, invoice: Invoice, organization: Organization?, locale: String) {
        val headerTable = PdfPTable(2)
        headerTable.widthPercentage = 100f
        headerTable.setWidths(floatArrayOf(1f, 1f))

        // Left: Organization name or "INVOICE"
        val leftCell = PdfPCell()
        leftCell.border = PdfPCell.NO_BORDER
        leftCell.verticalAlignment = Element.ALIGN_TOP

        val orgName = organization?.name?.get(locale) ?: "Liyaqa"
        leftCell.addElement(Paragraph(orgName, titleFont))

        if (organization?.zatcaInfo != null) {
            val vatNumber = organization.zatcaInfo?.vatRegistrationNumber
            if (vatNumber != null) {
                leftCell.addElement(Paragraph(
                    if (locale == "ar") "الرقم الضريبي: $vatNumber" else "VAT: $vatNumber",
                    smallFont
                ))
            }
        }

        // Right: INVOICE title and number
        val rightCell = PdfPCell()
        rightCell.border = PdfPCell.NO_BORDER
        rightCell.horizontalAlignment = Element.ALIGN_RIGHT
        rightCell.verticalAlignment = Element.ALIGN_TOP

        val invoiceTitle = if (locale == "ar") "فاتورة" else "INVOICE"
        val titleParagraph = Paragraph(invoiceTitle, titleFont)
        titleParagraph.alignment = Element.ALIGN_RIGHT
        rightCell.addElement(titleParagraph)

        val numberParagraph = Paragraph(invoice.invoiceNumber, headerFont)
        numberParagraph.alignment = Element.ALIGN_RIGHT
        rightCell.addElement(numberParagraph)

        headerTable.addCell(leftCell)
        headerTable.addCell(rightCell)

        document.add(headerTable)
        document.add(Chunk.NEWLINE)
    }

    private fun addInvoiceDetails(document: Document, invoice: Invoice, locale: String) {
        val detailsTable = PdfPTable(2)
        detailsTable.widthPercentage = 50f
        detailsTable.horizontalAlignment = Element.ALIGN_LEFT

        val labels = if (locale == "ar") {
            mapOf(
                "status" to "الحالة",
                "issueDate" to "تاريخ الإصدار",
                "dueDate" to "تاريخ الاستحقاق"
            )
        } else {
            mapOf(
                "status" to "Status",
                "issueDate" to "Issue Date",
                "dueDate" to "Due Date"
            )
        }

        // Status
        addDetailRow(detailsTable, labels["status"]!!, invoice.status.name, locale)

        // Issue Date
        invoice.issueDate?.let {
            addDetailRow(detailsTable, labels["issueDate"]!!, it.format(dateFormatter), locale)
        }

        // Due Date
        invoice.dueDate?.let {
            addDetailRow(detailsTable, labels["dueDate"]!!, it.format(dateFormatter), locale)
        }

        document.add(detailsTable)
        document.add(Chunk.NEWLINE)
    }

    private fun addDetailRow(table: PdfPTable, label: String, value: String, locale: String) {
        val labelCell = createNoBorderCell(label, normalFont, locale)
        val valueCell = createNoBorderCell(value, normalFont, locale)

        table.addCell(labelCell)
        table.addCell(valueCell)
    }

    private fun addMemberDetails(document: Document, member: Member, locale: String) {
        val billToLabel = if (locale == "ar") "فاتورة إلى:" else "Bill To:"
        document.add(Paragraph(billToLabel, headerFont))

        document.add(Paragraph(member.fullName.get(locale), normalFont))
        document.add(Paragraph(member.email, normalFont))
        member.phone?.let { document.add(Paragraph(it, normalFont)) }

        document.add(Chunk.NEWLINE)
    }

    private fun addLineItemsTable(document: Document, invoice: Invoice, locale: String) {
        val table = PdfPTable(4)
        table.widthPercentage = 100f
        table.setWidths(floatArrayOf(3f, 1f, 1.5f, 1.5f))

        val headers = if (locale == "ar") {
            listOf("الوصف", "الكمية", "سعر الوحدة", "المجموع")
        } else {
            listOf("Description", "Qty", "Unit Price", "Total")
        }

        // Header row
        headers.forEach { header ->
            val cell = createCell(header, tableHeaderFont, locale)
            cell.backgroundColor = Color(51, 51, 51)
            cell.horizontalAlignment = Element.ALIGN_CENTER
            cell.paddingTop = 8f
            cell.paddingBottom = 8f
            table.addCell(cell)
        }

        // Data rows
        invoice.lineItems.forEach { item ->
            // Description
            val descCell = createCell(item.description.get(locale), normalFont, locale)
            descCell.paddingTop = 5f
            descCell.paddingBottom = 5f
            table.addCell(descCell)

            // Quantity
            val qtyCell = createCell(item.quantity.toString(), normalFont, locale)
            qtyCell.horizontalAlignment = Element.ALIGN_CENTER
            qtyCell.paddingTop = 5f
            qtyCell.paddingBottom = 5f
            table.addCell(qtyCell)

            // Unit Price
            val priceCell = createCell(formatMoney(item.unitPrice.amount, item.unitPrice.currency), normalFont, locale)
            priceCell.horizontalAlignment = Element.ALIGN_RIGHT
            priceCell.paddingTop = 5f
            priceCell.paddingBottom = 5f
            table.addCell(priceCell)

            // Line Total
            val totalCell = createCell(formatMoney(item.lineTotal().amount, item.lineTotal().currency), normalFont, locale)
            totalCell.horizontalAlignment = Element.ALIGN_RIGHT
            totalCell.paddingTop = 5f
            totalCell.paddingBottom = 5f
            table.addCell(totalCell)
        }

        document.add(table)
        document.add(Chunk.NEWLINE)
    }

    private fun addTotalsSection(document: Document, invoice: Invoice, locale: String) {
        val totalsTable = PdfPTable(2)
        totalsTable.widthPercentage = 40f
        totalsTable.horizontalAlignment = Element.ALIGN_RIGHT

        val labels = if (locale == "ar") {
            mapOf(
                "subtotal" to "المجموع الفرعي",
                "vat" to "ضريبة القيمة المضافة (${invoice.vatRate}%)",
                "total" to "الإجمالي",
                "paid" to "المدفوع",
                "balance" to "الرصيد المتبقي"
            )
        } else {
            mapOf(
                "subtotal" to "Subtotal",
                "vat" to "VAT (${invoice.vatRate}%)",
                "total" to "Total",
                "paid" to "Paid",
                "balance" to "Balance Due"
            )
        }

        // Subtotal
        addTotalRow(totalsTable, labels["subtotal"]!!,
            formatMoney(invoice.subtotal.amount, invoice.subtotal.currency), normalFont, locale)

        // VAT
        addTotalRow(totalsTable, labels["vat"]!!,
            formatMoney(invoice.vatAmount.amount, invoice.vatAmount.currency), normalFont, locale)

        // Total (bold)
        addTotalRow(totalsTable, labels["total"]!!,
            formatMoney(invoice.totalAmount.amount, invoice.totalAmount.currency), headerFont, locale)

        // Paid (if any)
        invoice.paidAmount?.let {
            addTotalRow(totalsTable, labels["paid"]!!,
                formatMoney(it.amount, it.currency), normalFont, locale)
        }

        // Balance Due
        val balance = invoice.remainingBalance()
        if (balance.amount.compareTo(java.math.BigDecimal.ZERO) > 0) {
            addTotalRow(totalsTable, labels["balance"]!!,
                formatMoney(balance.amount, balance.currency), headerFont, locale)
        }

        document.add(totalsTable)
    }

    private fun addZatcaQrCode(document: Document, invoice: Invoice, locale: String) {
        // Only add QR code if Zatca data is present
        val qrCodeBase64 = invoice.zatcaQrCode ?: return

        try {
            document.add(Chunk.NEWLINE)

            // Create a table to hold the QR code and label
            val qrTable = PdfPTable(1)
            qrTable.widthPercentage = 100f
            qrTable.horizontalAlignment = Element.ALIGN_RIGHT

            // Decode Base64 to image bytes
            val qrImageBytes = Base64.getDecoder().decode(qrCodeBase64)
            val qrImage = Image.getInstance(qrImageBytes)
            qrImage.scaleToFit(100f, 100f)

            // Create cell with QR image
            val imageCell = PdfPCell(qrImage)
            imageCell.border = PdfPCell.NO_BORDER
            imageCell.horizontalAlignment = Element.ALIGN_RIGHT
            imageCell.paddingTop = 10f

            // Add label cell
            val labelText = if (locale == "ar") "متوافق مع الفاتورة الإلكترونية" else "Zatca Compliant"
            val labelCell = PdfPCell(Phrase(labelText, smallFont))
            labelCell.border = PdfPCell.NO_BORDER
            labelCell.horizontalAlignment = Element.ALIGN_RIGHT
            labelCell.paddingTop = 5f

            qrTable.addCell(imageCell)
            qrTable.addCell(labelCell)

            document.add(qrTable)

            logger.debug("Added Zatca QR code to invoice PDF: ${invoice.invoiceNumber}")
        } catch (e: Exception) {
            logger.error("Failed to add Zatca QR code to PDF: ${e.message}", e)
            // Continue without QR code - don't fail PDF generation
        }
    }

    private fun addTotalRow(table: PdfPTable, label: String, value: String, font: Font, locale: String) {
        val labelCell = createCell(label, font, locale)
        labelCell.border = PdfPCell.NO_BORDER
        labelCell.horizontalAlignment = Element.ALIGN_RIGHT
        labelCell.paddingTop = 5f
        labelCell.paddingBottom = 5f

        val valueCell = createCell(value, font, locale)
        valueCell.border = PdfPCell.NO_BORDER
        valueCell.horizontalAlignment = Element.ALIGN_RIGHT
        valueCell.paddingTop = 5f
        valueCell.paddingBottom = 5f

        table.addCell(labelCell)
        table.addCell(valueCell)
    }

    private fun addFooter(document: Document, locale: String) {
        document.add(Chunk.NEWLINE)
        document.add(Chunk.NEWLINE)

        val thankYou = if (locale == "ar") "شكراً لتعاملكم معنا" else "Thank you for your business"
        val footerParagraph = Paragraph(thankYou, smallFont)
        footerParagraph.alignment = Element.ALIGN_CENTER
        document.add(footerParagraph)

        val poweredBy = Paragraph("Powered by Liyaqa", smallFont)
        poweredBy.alignment = Element.ALIGN_CENTER
        document.add(poweredBy)
    }

    private fun formatMoney(amount: java.math.BigDecimal, currency: String): String {
        return "$currency ${amount.setScale(2, java.math.RoundingMode.HALF_UP)}"
    }
}
