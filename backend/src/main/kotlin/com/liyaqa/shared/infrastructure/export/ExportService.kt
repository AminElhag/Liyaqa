package com.liyaqa.shared.infrastructure.export

import com.liyaqa.attendance.domain.ports.AttendanceRepository
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

/**
 * Service for generating CSV exports of various reports.
 *
 * Supported exports:
 * - Members: List of all members with their details
 * - Subscriptions: List of subscriptions with member and plan info
 * - Invoices: List of invoices within a date range
 * - Attendance: Attendance records within a date range
 * - Bookings: Class bookings within a date range
 */
@Service
@Transactional(readOnly = true)
class ExportService(
    private val csvWriter: CsvExportWriter,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val membershipPlanRepository: MembershipPlanRepository,
    private val invoiceRepository: InvoiceRepository,
    private val attendanceRepository: AttendanceRepository,
    private val bookingRepository: ClassBookingRepository,
    private val sessionRepository: ClassSessionRepository,
    private val gymClassRepository: GymClassRepository
) {
    private val logger = LoggerFactory.getLogger(ExportService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    companion object {
        private const val MAX_EXPORT_ROWS = 10000
    }

    // ==================== MEMBERS EXPORT ====================

    /**
     * Exports members to CSV.
     *
     * @param status Optional filter by member status
     * @param joinedAfter Optional filter for members joined after this date
     * @param joinedBefore Optional filter for members joined before this date
     * @return CSV file as ByteArray
     */
    fun exportMembers(
        status: MemberStatus? = null,
        joinedAfter: LocalDate? = null,
        joinedBefore: LocalDate? = null
    ): ByteArray {
        logger.info("Generating members export - status: $status, joinedAfter: $joinedAfter, joinedBefore: $joinedBefore")

        val headersEn = listOf(
            "ID", "First Name", "Last Name", "Full Name", "Email", "Phone",
            "Status", "Date of Birth", "Join Date", "Notes"
        )
        val headersAr = listOf(
            "المعرف", "الاسم الأول", "الاسم الأخير", "الاسم الكامل", "البريد الإلكتروني", "الهاتف",
            "الحالة", "تاريخ الميلاد", "تاريخ الانضمام", "ملاحظات"
        )

        val members = memberRepository.search(
            search = null,
            status = status,
            joinedAfter = joinedAfter,
            joinedBefore = joinedBefore,
            pageable = PageRequest.of(0, MAX_EXPORT_ROWS)
        )

        val rows = members.content.map { member ->
            listOf(
                member.id.toString(),
                member.firstName,
                member.lastName,
                member.fullName,
                member.email,
                member.phone ?: "",
                member.status.name,
                member.dateOfBirth?.format(dateFormatter) ?: "",
                member.createdAt.atZone(ZoneId.systemDefault()).toLocalDate().format(dateFormatter),
                member.notes ?: ""
            )
        }

        logger.info("Exported ${rows.size} members")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    // ==================== SUBSCRIPTIONS EXPORT ====================

    /**
     * Exports subscriptions to CSV with member and plan details.
     *
     * @param status Optional filter by subscription status
     * @param planId Optional filter by plan ID
     * @param expiringBefore Optional filter for subscriptions expiring before this date
     * @return CSV file as ByteArray
     */
    fun exportSubscriptions(
        status: SubscriptionStatus? = null,
        planId: UUID? = null,
        expiringBefore: LocalDate? = null
    ): ByteArray {
        logger.info("Generating subscriptions export - status: $status, planId: $planId, expiringBefore: $expiringBefore")

        val headersEn = listOf(
            "ID", "Member ID", "Member Name", "Member Email", "Plan ID", "Plan Name",
            "Status", "Start Date", "End Date", "Classes Remaining", "Paid Amount",
            "Auto Renew", "Freeze Days Remaining", "Created Date"
        )
        val headersAr = listOf(
            "المعرف", "معرف العضو", "اسم العضو", "بريد العضو", "معرف الخطة", "اسم الخطة",
            "الحالة", "تاريخ البدء", "تاريخ الانتهاء", "الحصص المتبقية", "المبلغ المدفوع",
            "تجديد تلقائي", "أيام التجميد المتبقية", "تاريخ الإنشاء"
        )

        val subscriptions = subscriptionRepository.search(
            planId = planId,
            status = status,
            expiringBefore = expiringBefore,
            pageable = PageRequest.of(0, MAX_EXPORT_ROWS)
        )

        // Pre-fetch members and plans for efficiency
        val memberIds = subscriptions.content.map { it.memberId }.distinct()
        val planIds = subscriptions.content.map { it.planId }.distinct()

        val membersMap = memberIds.mapNotNull { id ->
            memberRepository.findById(id).orElse(null)?.let { id to it }
        }.toMap()

        val plansMap = planIds.mapNotNull { id ->
            membershipPlanRepository.findById(id).orElse(null)?.let { id to it }
        }.toMap()

        val rows = subscriptions.content.map { sub ->
            val member = membersMap[sub.memberId]
            val plan = plansMap[sub.planId]

            listOf(
                sub.id.toString(),
                sub.memberId.toString(),
                member?.fullName ?: "",
                member?.email ?: "",
                sub.planId.toString(),
                plan?.name?.en ?: "",
                sub.status.name,
                sub.startDate.format(dateFormatter),
                sub.endDate.format(dateFormatter),
                sub.classesRemaining?.toString() ?: "Unlimited",
                sub.paidAmount?.let { "${it.amount} ${it.currency}" } ?: "",
                sub.autoRenew,
                sub.freezeDaysRemaining.toString(),
                sub.createdAt.atZone(ZoneId.systemDefault()).toLocalDate().format(dateFormatter)
            )
        }

        logger.info("Exported ${rows.size} subscriptions")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    // ==================== INVOICES EXPORT ====================

    /**
     * Exports invoices to CSV.
     *
     * @param status Optional filter by invoice status
     * @param dateFrom Optional filter for invoices issued from this date
     * @param dateTo Optional filter for invoices issued until this date
     * @return CSV file as ByteArray
     */
    fun exportInvoices(
        status: InvoiceStatus? = null,
        dateFrom: LocalDate? = null,
        dateTo: LocalDate? = null
    ): ByteArray {
        logger.info("Generating invoices export - status: $status, dateFrom: $dateFrom, dateTo: $dateTo")

        val headersEn = listOf(
            "Invoice Number", "Member ID", "Member Name", "Member Email",
            "Status", "Issue Date", "Due Date", "Paid Date",
            "Subtotal", "VAT Rate", "VAT Amount", "Total", "Currency"
        )
        val headersAr = listOf(
            "رقم الفاتورة", "معرف العضو", "اسم العضو", "بريد العضو",
            "الحالة", "تاريخ الإصدار", "تاريخ الاستحقاق", "تاريخ الدفع",
            "المبلغ الفرعي", "نسبة الضريبة", "مبلغ الضريبة", "الإجمالي", "العملة"
        )

        val invoices = invoiceRepository.search(
            search = null,
            status = status,
            memberId = null,
            dateFrom = dateFrom,
            dateTo = dateTo,
            pageable = PageRequest.of(0, MAX_EXPORT_ROWS)
        )

        // Pre-fetch members
        val memberIds = invoices.content.map { it.memberId }.distinct()
        val membersMap = memberIds.mapNotNull { id ->
            memberRepository.findById(id).orElse(null)?.let { id to it }
        }.toMap()

        val rows = invoices.content.map { invoice ->
            val member = membersMap[invoice.memberId]

            listOf(
                invoice.invoiceNumber,
                invoice.memberId.toString(),
                member?.fullName ?: "",
                member?.email ?: "",
                invoice.status.name,
                invoice.issueDate?.format(dateFormatter) ?: "",
                invoice.dueDate?.format(dateFormatter) ?: "",
                invoice.paidDate?.format(dateFormatter) ?: "",
                invoice.subtotal.amount.toString(),
                "${invoice.vatRate}%",
                invoice.vatAmount.amount.toString(),
                invoice.totalAmount.amount.toString(),
                invoice.totalAmount.currency
            )
        }

        logger.info("Exported ${rows.size} invoices")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    // ==================== ATTENDANCE EXPORT ====================

    /**
     * Exports attendance records to CSV.
     *
     * @param locationId Optional filter by location
     * @param dateFrom Start date for the export range
     * @param dateTo End date for the export range
     * @return CSV file as ByteArray
     */
    fun exportAttendance(
        locationId: UUID? = null,
        dateFrom: LocalDate,
        dateTo: LocalDate
    ): ByteArray {
        logger.info("Generating attendance export - locationId: $locationId, dateFrom: $dateFrom, dateTo: $dateTo")

        val headersEn = listOf(
            "ID", "Member ID", "Member Name", "Member Email", "Location ID",
            "Check-in Time", "Check-out Time", "Check-in Method", "Status", "Notes"
        )
        val headersAr = listOf(
            "المعرف", "معرف العضو", "اسم العضو", "بريد العضو", "معرف الموقع",
            "وقت الدخول", "وقت الخروج", "طريقة الدخول", "الحالة", "ملاحظات"
        )

        val startInstant = dateFrom.atStartOfDay(ZoneId.systemDefault()).toInstant()
        val endInstant = dateTo.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()

        val records = attendanceRepository.findByCheckInTimeBetween(
            start = startInstant,
            end = endInstant,
            pageable = PageRequest.of(0, MAX_EXPORT_ROWS)
        ).let { page ->
            if (locationId != null) {
                page.content.filter { it.locationId == locationId }
            } else {
                page.content
            }
        }

        // Pre-fetch members
        val memberIds = records.map { it.memberId }.distinct()
        val membersMap = memberIds.mapNotNull { id ->
            memberRepository.findById(id).orElse(null)?.let { id to it }
        }.toMap()

        val rows = records.map { record ->
            val member = membersMap[record.memberId]
            val checkInLocal = record.checkInTime.atZone(ZoneId.systemDefault())
            val checkOutLocal = record.checkOutTime?.atZone(ZoneId.systemDefault())

            listOf(
                record.id.toString(),
                record.memberId.toString(),
                member?.fullName ?: "",
                member?.email ?: "",
                record.locationId.toString(),
                checkInLocal.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                checkOutLocal?.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) ?: "",
                record.checkInMethod.name,
                record.status.name,
                record.notes ?: ""
            )
        }

        logger.info("Exported ${rows.size} attendance records")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    // ==================== BOOKINGS EXPORT ====================

    /**
     * Exports class bookings to CSV.
     *
     * @param classId Optional filter by gym class
     * @param status Optional filter by booking status
     * @param dateFrom Start date for the export range
     * @param dateTo End date for the export range
     * @return CSV file as ByteArray
     */
    fun exportBookings(
        classId: UUID? = null,
        status: BookingStatus? = null,
        dateFrom: LocalDate,
        dateTo: LocalDate
    ): ByteArray {
        logger.info("Generating bookings export - classId: $classId, status: $status, dateFrom: $dateFrom, dateTo: $dateTo")

        val headersEn = listOf(
            "ID", "Member ID", "Member Name", "Member Email",
            "Session ID", "Session Date", "Class Name",
            "Status", "Booked At", "Checked In At", "Waitlist Position", "Notes"
        )
        val headersAr = listOf(
            "المعرف", "معرف العضو", "اسم العضو", "بريد العضو",
            "معرف الجلسة", "تاريخ الجلسة", "اسم الحصة",
            "الحالة", "وقت الحجز", "وقت الدخول", "موقع الانتظار", "ملاحظات"
        )

        // Get sessions in date range
        val sessions = sessionRepository.findBySessionDateBetween(dateFrom, dateTo, PageRequest.of(0, MAX_EXPORT_ROWS))
            .let { page ->
                if (classId != null) {
                    page.content.filter { it.gymClassId == classId }
                } else {
                    page.content
                }
            }

        val sessionIds = sessions.map { it.id }
        val sessionsMap = sessions.associateBy { it.id }

        // Get gym classes for names
        val gymClassIds = sessions.map { it.gymClassId }.distinct()
        val gymClassesMap = gymClassIds.mapNotNull { id ->
            gymClassRepository.findById(id).orElse(null)?.let { id to it }
        }.toMap()

        // Get all bookings for these sessions
        val allBookings = sessionIds.flatMap { sessionId ->
            bookingRepository.findBySessionId(sessionId)
        }.let { bookings ->
            if (status != null) {
                bookings.filter { it.status == status }
            } else {
                bookings
            }
        }

        // Pre-fetch members
        val memberIds = allBookings.map { it.memberId }.distinct()
        val membersMap = memberIds.mapNotNull { id ->
            memberRepository.findById(id).orElse(null)?.let { id to it }
        }.toMap()

        val rows = allBookings.map { booking ->
            val member = membersMap[booking.memberId]
            val session = sessionsMap[booking.sessionId]
            val gymClass = session?.let { gymClassesMap[it.gymClassId] }
            val bookedAtLocal = booking.bookedAt.atZone(ZoneId.systemDefault())
            val checkedInAtLocal = booking.checkedInAt?.atZone(ZoneId.systemDefault())

            listOf(
                booking.id.toString(),
                booking.memberId.toString(),
                member?.fullName ?: "",
                member?.email ?: "",
                booking.sessionId.toString(),
                session?.sessionDate?.format(dateFormatter) ?: "",
                gymClass?.name?.en ?: "",
                booking.status.name,
                bookedAtLocal.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                checkedInAtLocal?.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) ?: "",
                booking.waitlistPosition?.toString() ?: "",
                booking.notes ?: ""
            )
        }

        logger.info("Exported ${rows.size} bookings")
        return csvWriter.writeWithBilingualHeaders(headersEn, headersAr, rows)
    }

    /**
     * Generates a filename for the export.
     */
    fun generateFilename(exportType: ExportType): String {
        val date = LocalDate.now().format(dateFormatter)
        return "${exportType.filenamePrefix}_$date.csv"
    }
}
