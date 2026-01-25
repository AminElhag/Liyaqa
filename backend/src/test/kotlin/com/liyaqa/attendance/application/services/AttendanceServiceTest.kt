package com.liyaqa.attendance.application.services

import com.liyaqa.attendance.application.commands.CheckInCommand
import com.liyaqa.attendance.application.commands.CheckOutCommand
import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.attendance.domain.model.AttendanceStatus
import com.liyaqa.attendance.domain.model.CheckInMethod
import com.liyaqa.attendance.domain.ports.AttendanceRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AttendanceServiceTest {

    @Mock
    private lateinit var attendanceRepository: AttendanceRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var locationRepository: LocationRepository

    @Mock
    private lateinit var webhookPublisher: WebhookEventPublisher

    private lateinit var attendanceService: AttendanceService

    private lateinit var testMember: Member
    private lateinit var testLocation: Location
    private lateinit var testSubscription: Subscription
    private lateinit var testAttendanceRecord: AttendanceRecord

    @BeforeEach
    fun setUp() {
        attendanceService = AttendanceService(
            attendanceRepository,
            memberRepository,
            subscriptionRepository,
            locationRepository,
            webhookPublisher
        )

        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE
        )

        testLocation = Location(
            id = UUID.randomUUID(),
            clubId = UUID.randomUUID(),
            name = LocalizedText(en = "Main Branch", ar = "الفرع الرئيسي"),
            status = LocationStatus.ACTIVE
        )

        testSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )

        testAttendanceRecord = AttendanceRecord(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            status = AttendanceStatus.CHECKED_IN
        )
    }

    @Test
    fun `checkIn should create attendance record when valid`() {
        // Given
        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(subscriptionRepository.findActiveByMemberId(testMember.id)) doReturn Optional.of(testSubscription)
        whenever(attendanceRepository.existsActiveCheckIn(testMember.id)) doReturn false
        whenever(subscriptionRepository.save(any<Subscription>())) doReturn testSubscription
        whenever(attendanceRepository.save(any<AttendanceRecord>())).thenAnswer { invocation ->
            invocation.getArgument<AttendanceRecord>(0)
        }

        // When
        val result = attendanceService.checkIn(command)

        // Then
        assertNotNull(result)
        assertEquals(testMember.id, result.memberId)
        assertEquals(testLocation.id, result.locationId)
        assertEquals(AttendanceStatus.CHECKED_IN, result.status)
    }

    @Test
    fun `checkIn should throw when member not found`() {
        // Given
        val nonExistentMemberId = UUID.randomUUID()
        val command = CheckInCommand(
            memberId = nonExistentMemberId,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(nonExistentMemberId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn should throw when member is not active`() {
        // Given
        val suspendedMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "Suspended", ar = "معلق"),
            lastName = LocalizedText(en = "Member", ar = "عضو"),
            email = "suspended@example.com",
            phone = "+966500000001",
            status = MemberStatus.SUSPENDED
        )

        val command = CheckInCommand(
            memberId = suspendedMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(suspendedMember.id)) doReturn Optional.of(suspendedMember)

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn should throw when location not found`() {
        // Given
        val nonExistentLocationId = UUID.randomUUID()
        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = nonExistentLocationId,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(locationRepository.findById(nonExistentLocationId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn should throw when location is not active`() {
        // Given
        val closedLocation = Location(
            id = UUID.randomUUID(),
            clubId = UUID.randomUUID(),
            name = LocalizedText(en = "Closed Branch", ar = "فرع مغلق"),
            status = LocationStatus.PERMANENTLY_CLOSED
        )

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = closedLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(locationRepository.findById(closedLocation.id)) doReturn Optional.of(closedLocation)

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn should throw when no active subscription`() {
        // Given
        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(subscriptionRepository.findActiveByMemberId(testMember.id)) doReturn Optional.empty()

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn should throw when already checked in`() {
        // Given
        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(subscriptionRepository.findActiveByMemberId(testMember.id)) doReturn Optional.of(testSubscription)
        whenever(attendanceRepository.existsActiveCheckIn(testMember.id)) doReturn true

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn should throw when no classes remaining`() {
        // Given
        val noClassesSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 0
        )

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(subscriptionRepository.findActiveByMemberId(testMember.id)) doReturn Optional.of(noClassesSubscription)
        whenever(attendanceRepository.existsActiveCheckIn(testMember.id)) doReturn false

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkOut should update attendance record`() {
        // Given
        val command = CheckOutCommand(memberId = testMember.id)

        whenever(attendanceRepository.findCurrentCheckIn(testMember.id)) doReturn Optional.of(testAttendanceRecord)
        whenever(attendanceRepository.save(any<AttendanceRecord>())).thenAnswer { invocation ->
            invocation.getArgument<AttendanceRecord>(0)
        }

        // When
        val result = attendanceService.checkOut(command)

        // Then
        assertEquals(AttendanceStatus.CHECKED_OUT, result.status)
        assertNotNull(result.checkOutTime)
    }

    @Test
    fun `checkOut should throw when no active check-in`() {
        // Given
        val command = CheckOutCommand(memberId = testMember.id)

        whenever(attendanceRepository.findCurrentCheckIn(testMember.id)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            attendanceService.checkOut(command)
        }
    }

    @Test
    fun `getCurrentCheckIn should return current check-in when exists`() {
        // Given
        whenever(attendanceRepository.findCurrentCheckIn(testMember.id)) doReturn Optional.of(testAttendanceRecord)

        // When
        val result = attendanceService.getCurrentCheckIn(testMember.id)

        // Then
        assertNotNull(result)
        assertEquals(testAttendanceRecord, result)
    }

    @Test
    fun `getCurrentCheckIn should return null when no check-in`() {
        // Given
        whenever(attendanceRepository.findCurrentCheckIn(testMember.id)) doReturn Optional.empty()

        // When
        val result = attendanceService.getCurrentCheckIn(testMember.id)

        // Then
        assertNull(result)
    }

    @Test
    fun `getAttendanceByMember should return paginated records`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val records = listOf(testAttendanceRecord)
        val page = PageImpl(records, pageable, 1)

        whenever(attendanceRepository.findByMemberId(testMember.id, pageable)) doReturn page

        // When
        val result = attendanceService.getAttendanceByMember(testMember.id, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `getTodayCheckInCount should return count`() {
        // Given
        whenever(attendanceRepository.countByCheckInTimeBetween(any(), any())) doReturn 50L

        // When
        val result = attendanceService.getTodayCheckInCount()

        // Then
        assertEquals(50L, result)
    }

    @Test
    fun `getCurrentlyCheckedInCount should return count`() {
        // Given
        whenever(attendanceRepository.countCurrentlyCheckedIn()) doReturn 25L

        // When
        val result = attendanceService.getCurrentlyCheckedInCount()

        // Then
        assertEquals(25L, result)
    }

    @Test
    fun `getMemberTotalVisits should return count`() {
        // Given
        whenever(attendanceRepository.countByMemberId(testMember.id)) doReturn 100L

        // When
        val result = attendanceService.getMemberTotalVisits(testMember.id)

        // Then
        assertEquals(100L, result)
    }
}
