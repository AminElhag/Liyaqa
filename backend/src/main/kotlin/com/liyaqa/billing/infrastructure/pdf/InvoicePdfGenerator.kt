package com.liyaqa.billing.infrastructure.pdf

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.organization.domain.model.Organization
import com.lowagie.text.Chunk
import com.lowagie.text.Document
import com.lowagie.text.Element
import com.lowagie.text.Font
import com.lowagie.text.FontFactory
import com.lowagie.text.PageSize
import com.lowagie.text.Paragraph
import com.lowagie.text.Phrase
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import org.springframework.stereotype.Service
import java.awt.Color
import java.io.ByteArrayOutputStream
import java.time.format.DateTimeFormatter

/**
 * Service for generating PDF invoices.
 */
@Service
class InvoicePdfGenerator {

    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    // Fonts
    private val titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18f, Color.BLACK)
    private val headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12f, Color.BLACK)
    private val normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10f, Color.BLACK)
    private val smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8f, Color.GRAY)
    private val tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, Color.WHITE)

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
        addDetailRow(detailsTable, labels["status"]!!, invoice.status.name)

        // Issue Date
        invoice.issueDate?.let {
            addDetailRow(detailsTable, labels["issueDate"]!!, it.format(dateFormatter))
        }

        // Due Date
        invoice.dueDate?.let {
            addDetailRow(detailsTable, labels["dueDate"]!!, it.format(dateFormatter))
        }

        document.add(detailsTable)
        document.add(Chunk.NEWLINE)
    }

    private fun addDetailRow(table: PdfPTable, label: String, value: String) {
        val labelCell = PdfPCell(Phrase(label, normalFont))
        labelCell.border = PdfPCell.NO_BORDER
        labelCell.paddingBottom = 5f

        val valueCell = PdfPCell(Phrase(value, normalFont))
        valueCell.border = PdfPCell.NO_BORDER
        valueCell.paddingBottom = 5f

        table.addCell(labelCell)
        table.addCell(valueCell)
    }

    private fun addMemberDetails(document: Document, member: Member, locale: String) {
        val billToLabel = if (locale == "ar") "فاتورة إلى:" else "Bill To:"
        document.add(Paragraph(billToLabel, headerFont))

        document.add(Paragraph(member.fullName, normalFont))
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
            val cell = PdfPCell(Phrase(header, tableHeaderFont))
            cell.backgroundColor = Color(51, 51, 51)
            cell.horizontalAlignment = Element.ALIGN_CENTER
            cell.paddingTop = 8f
            cell.paddingBottom = 8f
            table.addCell(cell)
        }

        // Data rows
        invoice.lineItems.forEach { item ->
            // Description
            val descCell = PdfPCell(Phrase(item.description.get(locale), normalFont))
            descCell.paddingTop = 5f
            descCell.paddingBottom = 5f
            table.addCell(descCell)

            // Quantity
            val qtyCell = PdfPCell(Phrase(item.quantity.toString(), normalFont))
            qtyCell.horizontalAlignment = Element.ALIGN_CENTER
            qtyCell.paddingTop = 5f
            qtyCell.paddingBottom = 5f
            table.addCell(qtyCell)

            // Unit Price
            val priceCell = PdfPCell(Phrase(formatMoney(item.unitPrice.amount, item.unitPrice.currency), normalFont))
            priceCell.horizontalAlignment = Element.ALIGN_RIGHT
            priceCell.paddingTop = 5f
            priceCell.paddingBottom = 5f
            table.addCell(priceCell)

            // Line Total
            val totalCell = PdfPCell(Phrase(formatMoney(item.lineTotal().amount, item.lineTotal().currency), normalFont))
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
            formatMoney(invoice.subtotal.amount, invoice.subtotal.currency), normalFont)

        // VAT
        addTotalRow(totalsTable, labels["vat"]!!,
            formatMoney(invoice.vatAmount.amount, invoice.vatAmount.currency), normalFont)

        // Total (bold)
        addTotalRow(totalsTable, labels["total"]!!,
            formatMoney(invoice.totalAmount.amount, invoice.totalAmount.currency), headerFont)

        // Paid (if any)
        invoice.paidAmount?.let {
            addTotalRow(totalsTable, labels["paid"]!!,
                formatMoney(it.amount, it.currency), normalFont)
        }

        // Balance Due
        val balance = invoice.remainingBalance()
        if (balance.amount.compareTo(java.math.BigDecimal.ZERO) > 0) {
            addTotalRow(totalsTable, labels["balance"]!!,
                formatMoney(balance.amount, balance.currency), headerFont)
        }

        document.add(totalsTable)
    }

    private fun addTotalRow(table: PdfPTable, label: String, value: String, font: Font) {
        val labelCell = PdfPCell(Phrase(label, font))
        labelCell.border = PdfPCell.NO_BORDER
        labelCell.horizontalAlignment = Element.ALIGN_RIGHT
        labelCell.paddingTop = 5f
        labelCell.paddingBottom = 5f

        val valueCell = PdfPCell(Phrase(value, font))
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
