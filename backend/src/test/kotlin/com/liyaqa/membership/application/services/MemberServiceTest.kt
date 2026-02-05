package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.referral.application.services.ReferralCodeService
import com.liyaqa.referral.application.services.ReferralTrackingService
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MemberServiceTest {

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var notificationService: NotificationService

    @Mock
    private lateinit var memberHealthService: MemberHealthService

    @Mock
    private lateinit var agreementService: AgreementService

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var passwordEncoder: PasswordEncoder

    @Mock
    private lateinit var permissionService: PermissionService

    @Mock
    private lateinit var webhookPublisher: WebhookEventPublisher

    @Mock
    private lateinit var referralCodeService: ReferralCodeService

    @Mock
    private lateinit var referralTrackingService: ReferralTrackingService

    @Mock
    private lateinit var refreshTokenRepository: RefreshTokenRepository

    private lateinit var memberService: MemberService

    private lateinit var testMember: Member

    @BeforeEach
    fun setUp() {
        memberService = MemberService(
            memberRepository,
            notificationService,
            memberHealthService,
            agreementService,
            userRepository,
            passwordEncoder,
            permissionService,
            webhookPublisher,
            referralCodeService,
            referralTrackingService,
            refreshTokenRepository
        )

        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE
        )

        // Set up tenant context for tests
        TenantContext.setCurrentTenant(TenantId(testMember.tenantId))
    }

    @AfterEach
    fun tearDown() {
        // Clear tenant context after each test
        TenantContext.clear()
    }

    @Test
    fun `createMember should create new member when email is unique`() {
        // Given
        val command = CreateMemberCommand(
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000"
        )

        whenever(memberRepository.existsByEmail(command.email)) doReturn false
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.createMember(command)

        // Then
        assertNotNull(result)
        assertEquals(command.firstName.en, result.firstName.en)
        assertEquals(command.lastName.en, result.lastName.en)
        assertEquals(command.email, result.email)
        assertEquals(MemberStatus.PENDING, result.status)
        verify(memberRepository).save(any<Member>())
    }

    @Test
    fun `createMember should throw when email already exists`() {
        // Given
        val command = CreateMemberCommand(
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "existing@example.com",
            phone = "+966500000000"
        )

        whenever(memberRepository.existsByEmail(command.email)) doReturn true

        // When/Then
        assertThrows(com.liyaqa.shared.exception.DuplicateFieldException::class.java) {
            memberService.createMember(command)
        }

        verify(memberRepository, never()).save(any<Member>())
    }

    @Test
    fun `createMember should send welcome notification`() {
        // Given
        val command = CreateMemberCommand(
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000"
        )

        whenever(memberRepository.existsByEmail(command.email)) doReturn false
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        memberService.createMember(command)

        // Then
        verify(notificationService).sendMultiChannel(
            memberId = any(),
            email = any(),
            phone = any(),
            type = any(),
            subject = any(),
            body = any(),
            priority = any(),
            referenceId = any(),
            referenceType = any()
        )
    }

    @Test
    fun `getMember should return member when found`() {
        // Given
        val memberId = testMember.id
        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)

        // When
        val result = memberService.getMember(memberId)

        // Then
        assertEquals(testMember, result)
    }

    @Test
    fun `getMember should throw when not found`() {
        // Given
        val memberId = UUID.randomUUID()
        whenever(memberRepository.findById(memberId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            memberService.getMember(memberId)
        }
    }

    @Test
    fun `getMemberByEmail should return member when found`() {
        // Given
        val email = "john.doe@example.com"
        whenever(memberRepository.findByEmail(email)) doReturn Optional.of(testMember)

        // When
        val result = memberService.getMemberByEmail(email)

        // Then
        assertEquals(testMember, result)
    }

    @Test
    fun `getAllMembers should return paginated members`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val members = listOf(testMember)
        val page = PageImpl(members, pageable, 1)

        whenever(memberRepository.findAll(pageable)) doReturn page

        // When
        val result = memberService.getAllMembers(pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testMember, result.content[0])
    }

    @Test
    fun `updateMember should update member fields`() {
        // Given
        val memberId = testMember.id
        val command = UpdateMemberCommand(
            firstName = LocalizedText(en = "Jane", ar = "جين"),
            lastName = LocalizedText(en = "Smith", ar = "سميث"),
            phone = "+966500000001"
        )

        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.updateMember(memberId, command)

        // Then
        assertEquals("Jane", result.firstName.en)
        assertEquals("Smith", result.lastName.en)
        assertEquals("+966500000001", result.phone)
    }

    @Test
    fun `suspendMember should change status to SUSPENDED`() {
        // Given
        val memberId = testMember.id
        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.suspendMember(memberId)

        // Then
        assertEquals(MemberStatus.SUSPENDED, result.status)
    }

    @Test
    fun `activateMember should change status to ACTIVE`() {
        // Given
        val suspendedMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.SUSPENDED
        )

        whenever(memberRepository.findById(suspendedMember.id)) doReturn Optional.of(suspendedMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.activateMember(suspendedMember.id)

        // Then
        assertEquals(MemberStatus.ACTIVE, result.status)
    }

    @Test
    fun `freezeMember should change status to FROZEN`() {
        // Given
        val memberId = testMember.id
        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.freezeMember(memberId)

        // Then
        assertEquals(MemberStatus.FROZEN, result.status)
    }

    @Test
    fun `unfreezeMember should change status back to ACTIVE`() {
        // Given
        val frozenMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.FROZEN
        )

        whenever(memberRepository.findById(frozenMember.id)) doReturn Optional.of(frozenMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.unfreezeMember(frozenMember.id)

        // Then
        assertEquals(MemberStatus.ACTIVE, result.status)
    }

    @Test
    fun `cancelMember should change status to CANCELLED`() {
        // Given
        val memberId = testMember.id
        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { invocation ->
            invocation.getArgument<Member>(0)
        }

        // When
        val result = memberService.cancelMember(memberId)

        // Then
        assertEquals(MemberStatus.CANCELLED, result.status)
    }

    @Test
    fun `deleteMember should delete member`() {
        // Given
        val memberId = testMember.id
        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)

        // When
        memberService.deleteMember(memberId)

        // Then
        verify(memberRepository).deleteById(memberId)
    }

    @Test
    fun `countMembers should return total count`() {
        // Given
        whenever(memberRepository.count()) doReturn 100L

        // When
        val result = memberService.countMembers()

        // Then
        assertEquals(100L, result)
    }

    @Test
    fun `searchMembers should apply filters correctly`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val members = listOf(testMember)
        val page = PageImpl(members, pageable, 1)

        whenever(memberRepository.search(
            "John",
            MemberStatus.ACTIVE,
            LocalDate.of(2024, 1, 1),
            LocalDate.of(2024, 12, 31),
            pageable
        )) doReturn page

        // When
        val result = memberService.searchMembers(
            search = "John",
            status = MemberStatus.ACTIVE,
            joinedAfter = LocalDate.of(2024, 1, 1),
            joinedBefore = LocalDate.of(2024, 12, 31),
            pageable = pageable
        )

        // Then
        assertEquals(1, result.totalElements)
    }
}
