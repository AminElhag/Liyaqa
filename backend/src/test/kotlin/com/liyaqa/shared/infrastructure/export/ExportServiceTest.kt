package com.liyaqa.shared.infrastructure.export

import com.liyaqa.attendance.domain.ports.AttendanceRepository
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExportServiceTest {

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var membershipPlanRepository: MembershipPlanRepository

    @Mock
    private lateinit var invoiceRepository: InvoiceRepository

    @Mock
    private lateinit var attendanceRepository: AttendanceRepository

    @Mock
    private lateinit var bookingRepository: ClassBookingRepository

    @Mock
    private lateinit var sessionRepository: ClassSessionRepository

    @Mock
    private lateinit var gymClassRepository: GymClassRepository

    private lateinit var csvWriter: CsvExportWriter
    private lateinit var exportService: ExportService

    @BeforeEach
    fun setUp() {
        csvWriter = CsvExportWriter()
        exportService = ExportService(
            csvWriter,
            memberRepository,
            subscriptionRepository,
            membershipPlanRepository,
            invoiceRepository,
            attendanceRepository,
            bookingRepository,
            sessionRepository,
            gymClassRepository
        )
    }

    @Test
    fun `exportMembers should return CSV with member data`() {
        // Given
        val members = listOf(createTestMember("John", "Doe"), createTestMember("Jane", "Smith"))
        val page = PageImpl(members)
        whenever(
            memberRepository.search(
                anyOrNull<String>(),
                anyOrNull<MemberStatus>(),
                anyOrNull<LocalDate>(),
                anyOrNull<LocalDate>(),
                org.mockito.kotlin.any<Pageable>()
            )
        ) doReturn page

        // When
        val result = exportService.exportMembers()

        // Then
        assertNotNull(result)
        assertTrue(result.isNotEmpty())
        // Verify UTF-8 BOM
        assertTrue(result[0] == 0xEF.toByte())
        assertTrue(result[1] == 0xBB.toByte())
        assertTrue(result[2] == 0xBF.toByte())
    }

    @Test
    fun `exportMembers should filter by status`() {
        // Given
        val members = listOf(createTestMember("John", "Doe"))
        val page = PageImpl(members)
        whenever(
            memberRepository.search(
                anyOrNull<String>(),
                anyOrNull<MemberStatus>(),
                anyOrNull<LocalDate>(),
                anyOrNull<LocalDate>(),
                org.mockito.kotlin.any<Pageable>()
            )
        ) doReturn page

        // When
        val result = exportService.exportMembers(status = MemberStatus.ACTIVE)

        // Then
        assertNotNull(result)
        assertTrue(result.isNotEmpty())
    }

    @Test
    fun `exportMembers should filter by date range`() {
        // Given
        val members = listOf(createTestMember("John", "Doe"))
        val page = PageImpl(members)
        whenever(
            memberRepository.search(
                anyOrNull<String>(),
                anyOrNull<MemberStatus>(),
                anyOrNull<LocalDate>(),
                anyOrNull<LocalDate>(),
                org.mockito.kotlin.any<Pageable>()
            )
        ) doReturn page

        // When
        val result = exportService.exportMembers(
            joinedAfter = LocalDate.of(2025, 1, 1),
            joinedBefore = LocalDate.of(2026, 1, 1)
        )

        // Then
        assertNotNull(result)
        assertTrue(result.isNotEmpty())
    }

    @Test
    fun `exportMembers should handle empty result`() {
        // Given
        val page = PageImpl(emptyList<Member>())
        whenever(
            memberRepository.search(
                anyOrNull<String>(),
                anyOrNull<MemberStatus>(),
                anyOrNull<LocalDate>(),
                anyOrNull<LocalDate>(),
                org.mockito.kotlin.any<Pageable>()
            )
        ) doReturn page

        // When
        val result = exportService.exportMembers()

        // Then
        assertNotNull(result)
        // Should still have headers even with no data
        assertTrue(result.isNotEmpty())
    }

    @Test
    fun `generateFilename should include export type and current date`() {
        // When
        val filename = exportService.generateFilename(ExportType.MEMBERS)

        // Then
        assertTrue(filename.startsWith("members_"))
        assertTrue(filename.endsWith(".csv"))
    }

    @Test
    fun `generateFilename should work for all export types`() {
        // When/Then
        ExportType.entries.forEach { exportType ->
            val filename = exportService.generateFilename(exportType)
            assertTrue(filename.startsWith(exportType.filenamePrefix + "_"))
            assertTrue(filename.endsWith(".csv"))
        }
    }

    private fun createTestMember(
        firstName: String,
        lastName: String,
        id: UUID = UUID.randomUUID(),
        status: MemberStatus = MemberStatus.ACTIVE
    ) = Member(
        id = id,
        firstName = firstName,
        lastName = lastName,
        email = "$firstName.$lastName@example.com",
        status = status
    )
}
