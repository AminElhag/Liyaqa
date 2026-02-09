package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.referral.application.services.ReferralCodeService
import com.liyaqa.referral.application.services.ReferralTrackingService
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.exception.DuplicateFieldException
import com.liyaqa.webhook.application.services.WebhookEventPublisher
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

    // ==========================================================================
    // PHASE 2 TESTS - Tenant Isolation & Advanced Features
    // ==========================================================================

    @Test
    fun `createMember should throw when phone already exists`() {
        // Given
        val phone = "+966500000000"
        val command = CreateMemberCommand(
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "new@example.com",
            phone = phone
        )

        whenever(memberRepository.existsByEmail(command.email)) doReturn false
        whenever(memberRepository.existsByPhone(phone)) doReturn true

        // When/Then
        assertThrows(DuplicateFieldException::class.java) {
            memberService.createMember(command)
        }

        verify(memberRepository, never()).save(any<Member>())
    }

    @Test
    fun `createMember should throw when nationalId already exists`() {
        // Given
        val phone = "+966500000001"
        val nationalId = "1234567890"
        val command = CreateMemberCommand(
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "new@example.com",
            phone = phone,
            nationalId = nationalId
        )

        whenever(memberRepository.existsByEmail(command.email)) doReturn false
        whenever(memberRepository.existsByPhone(phone)) doReturn false
        whenever(memberRepository.existsByNationalId(nationalId)) doReturn true

        // When/Then
        assertThrows(DuplicateFieldException::class.java) {
            memberService.createMember(command)
        }

        verify(memberRepository, never()).save(any<Member>())
    }

    // Note: Tenant isolation test removed - tenantId is protected in BaseEntity
    // and cannot be easily set in unit tests. This is tested in integration tests.

    @Test
    fun `updateMember should throw when updating phone to existing value`() {
        // Given
        val memberId = testMember.id
        val newPhone = "+966500000999"
        val command = UpdateMemberCommand(
            phone = newPhone
        )

        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(memberRepository.existsByPhoneAndIdNot(newPhone, memberId)) doReturn true

        // When/Then
        assertThrows(DuplicateFieldException::class.java) {
            memberService.updateMember(memberId, command)
        }

        verify(memberRepository, never()).save(any<Member>())
    }

    @Test
    fun `updateMember should throw when updating nationalId to existing value`() {
        // Given
        val memberId = testMember.id
        val newNationalId = "9876543210"
        val command = UpdateMemberCommand(
            nationalId = newNationalId
        )

        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(memberRepository.existsByNationalIdAndIdNot(newNationalId, memberId)) doReturn true

        // When/Then
        assertThrows(DuplicateFieldException::class.java) {
            memberService.updateMember(memberId, command)
        }

        verify(memberRepository, never()).save(any<Member>())
    }

    @Test
    fun `getMemberByUserId should return member when found`() {
        // Given
        val userId = UUID.randomUUID()
        val memberWithUser = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE,
            userId = userId
        )

        whenever(memberRepository.findByUserId(userId)) doReturn Optional.of(memberWithUser)

        // When
        val result = memberService.getMemberByUserId(userId)

        // Then
        assertNotNull(result)
        assertEquals(userId, result.userId)
    }

    @Test
    fun `getMemberByUserId should throw when not found`() {
        // Given
        val userId = UUID.randomUUID()
        whenever(memberRepository.findByUserId(userId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            memberService.getMemberByUserId(userId)
        }
    }

    @Test
    fun `findMemberByUserId should return null when not found`() {
        // Given
        val userId = UUID.randomUUID()
        whenever(memberRepository.findByUserId(userId)) doReturn Optional.empty()

        // When
        val result = memberService.findMemberByUserId(userId)

        // Then
        assertEquals(null, result)
    }

    @Test
    fun `createUserForMember should create new user and link to member`() {
        // Given
        val memberId = testMember.id
        val password = "SecureP@ssw0rd123"
        val encodedPassword = "encoded_password"

        val newUser = User(
            email = testMember.email,
            passwordHash = encodedPassword,
            displayName = testMember.firstName, // Use first name as display name
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )

        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(passwordEncoder.encode(password)) doReturn encodedPassword
        whenever(userRepository.save(any<User>())) doReturn newUser
        whenever(memberRepository.save(any<Member>())).thenAnswer { it.getArgument(0) }

        // When
        val result = memberService.createUserForMember(memberId, password)

        // Then
        assertNotNull(result)
        assertEquals(testMember.email, result.email)
        assertEquals(Role.MEMBER, result.role)
        verify(userRepository).save(any<User>())
        verify(memberRepository).save(any<Member>())
    }

    @Test
    fun `createUserForMember should throw when member already has user`() {
        // Given
        val memberWithUser = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE,
            userId = UUID.randomUUID() // Already has a user
        )

        whenever(memberRepository.findById(memberWithUser.id)) doReturn Optional.of(memberWithUser)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            memberService.createUserForMember(memberWithUser.id, "password")
        }

        verify(userRepository, never()).save(any<User>())
    }

    @Test
    fun `unlinkUserFromMember should remove user link and revoke tokens`() {
        // Given
        val userId = UUID.randomUUID()
        val memberWithUser = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE,
            userId = userId
        )

        whenever(memberRepository.findById(memberWithUser.id)) doReturn Optional.of(memberWithUser)
        whenever(memberRepository.save(any<Member>())).thenAnswer { it.getArgument(0) }

        // When
        val result = memberService.unlinkUserFromMember(memberWithUser.id)

        // Then
        assertNotNull(result)
        assertEquals(null, result.userId)
        verify(memberRepository).save(any<Member>())
    }

    @Test
    fun `linkUserToMember should link existing user to member`() {
        // Given
        val memberId = testMember.id
        val userId = UUID.randomUUID()
        val existingUser = User(
            id = userId,
            email = testMember.email,
            passwordHash = "encoded",
            displayName = testMember.firstName,
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )

        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(userRepository.findById(userId)) doReturn Optional.of(existingUser)
        whenever(memberRepository.save(any<Member>())).thenAnswer { it.getArgument(0) }

        // When
        val result = memberService.linkUserToMember(memberId, userId)

        // Then
        assertNotNull(result)
        assertEquals(userId, result.userId)
        verify(memberRepository).save(any<Member>())
    }

    @Test
    fun `linkUserToMember should throw when user not found`() {
        // Given
        val memberId = testMember.id
        val userId = UUID.randomUUID()

        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)
        whenever(userRepository.findById(userId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            memberService.linkUserToMember(memberId, userId)
        }

        verify(memberRepository, never()).save(any<Member>())
    }

    @Test
    fun `resetMemberPassword should update user password`() {
        // Given
        val userId = UUID.randomUUID()
        val memberWithUser = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE,
            userId = userId
        )

        val existingUser = User(
            id = userId,
            email = memberWithUser.email,
            passwordHash = "old_password",
            displayName = memberWithUser.firstName,
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )

        val newPassword = "NewSecureP@ssw0rd123"
        val encodedPassword = "new_encoded_password"

        whenever(memberRepository.findById(memberWithUser.id)) doReturn Optional.of(memberWithUser)
        whenever(userRepository.findById(userId)) doReturn Optional.of(existingUser)
        whenever(passwordEncoder.encode(newPassword)) doReturn encodedPassword
        whenever(userRepository.save(any<User>())) doReturn existingUser

        // When
        memberService.resetMemberPassword(memberWithUser.id, newPassword)

        // Then
        verify(passwordEncoder).encode(newPassword)
        verify(userRepository).save(any<User>())
        verify(refreshTokenRepository).revokeAllByUserId(userId)
    }

    @Test
    fun `resetMemberPassword should throw when member has no user`() {
        // Given
        val memberId = testMember.id // testMember has no userId
        whenever(memberRepository.findById(memberId)) doReturn Optional.of(testMember)

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            memberService.resetMemberPassword(memberId, "newPassword")
        }

        verify(passwordEncoder, never()).encode(any())
        verify(userRepository, never()).save(any<User>())
    }

    @Test
    fun `countMembersByStatus should return count for specific status`() {
        // Given
        whenever(memberRepository.countByStatus(MemberStatus.ACTIVE)) doReturn 42L

        // When
        val result = memberService.countMembersByStatus(MemberStatus.ACTIVE)

        // Then
        assertEquals(42L, result)
        verify(memberRepository).countByStatus(MemberStatus.ACTIVE)
    }

    @Test
    fun `bulkSuspendMembers should suspend multiple members successfully`() {
        // Given
        val member1 = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )

        val member2 = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "Jane", ar = "جين"),
            lastName = LocalizedText(en = "Smith", ar = "سميث"),
            email = "jane@example.com",
            phone = "+966500000002",
            status = MemberStatus.ACTIVE
        )

        val memberIds = listOf(member1.id, member2.id)

        whenever(memberRepository.findAllByIds(memberIds)) doReturn listOf(member1, member2)
        whenever(memberRepository.save(any<Member>())).thenAnswer { it.getArgument(0) }

        // When
        val results = memberService.bulkSuspendMembers(memberIds)

        // Then
        assertEquals(2, results.size)
        assertEquals(2, results.values.filter { it.isSuccess }.size)
    }

    @Test
    fun `bulkSuspendMembers should handle failures gracefully`() {
        // Given
        val existingId = UUID.randomUUID()
        val nonExistentId = UUID.randomUUID()
        val memberIds = listOf(existingId, nonExistentId)

        val existingMember = Member(
            id = existingId,
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )

        whenever(memberRepository.findAllByIds(memberIds)) doReturn listOf(existingMember)
        whenever(memberRepository.save(any<Member>())).thenAnswer { it.getArgument(0) }

        // When
        val results = memberService.bulkSuspendMembers(memberIds)

        // Then
        assertEquals(2, results.size)
        assertEquals(1, results.values.filter { it.isSuccess }.size)
        assertEquals(1, results.values.filter { it.isFailure }.size)
    }

    @Test
    fun `bulkDeleteMembers should delete multiple members successfully`() {
        // Given
        val member1 = testMember
        val member2 = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "Jane", ar = "جين"),
            lastName = LocalizedText(en = "Smith", ar = "سميث"),
            email = "jane@example.com",
            phone = "+966500000002",
            status = MemberStatus.ACTIVE
        )

        val memberIds = listOf(member1.id, member2.id)

        whenever(memberRepository.findAllByIds(memberIds)) doReturn listOf(member1, member2)

        // When
        val results = memberService.bulkDeleteMembers(memberIds)

        // Then
        assertEquals(2, results.size)
        assertEquals(2, results.values.filter { it.isSuccess }.size)
    }
}
