package com.liyaqa.membership.api

import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for MemberController endpoints.
 * Tests member service operations.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MemberControllerIntegrationTest {

    @Autowired
    private lateinit var memberService: MemberService

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var organizationRepository: OrganizationRepository

    @Autowired
    private lateinit var clubRepository: ClubRepository

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        // Setup organization and club
        testOrganization = Organization(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC,
            status = OrganizationStatus.ACTIVE
        )
        testOrganization = organizationRepository.save(testOrganization)

        testClub = Club(
            id = UUID.randomUUID(),
            organizationId = testOrganization.id,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
            status = ClubStatus.ACTIVE
        )
        testClub = clubRepository.save(testClub)
        testTenantId = testClub.id

        TenantContext.setCurrentTenant(TenantId(testTenantId))

        // Create some test members
        repeat(5) { i ->
            val member = Member(
                id = UUID.randomUUID(),
                firstName = "Member$i",
                lastName = "Test",
                email = "member$i.${UUID.randomUUID()}@example.com",
                status = MemberStatus.ACTIVE
            )
            setTenantId(member, testTenantId)
            memberRepository.save(member)
        }
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore
        }
    }

    @Test
    fun `getAllMembers returns paginated list`() {
        val members = memberService.getAllMembers(PageRequest.of(0, 10))

        assertNotNull(members)
        assertEquals(5, members.totalElements)
        assertEquals(5, members.content.size)
    }

    @Test
    fun `searchMembers with search filter returns filtered results`() {
        // Create a member with unique name
        val member = Member(
            id = UUID.randomUUID(),
            firstName = "UniqueSearchName",
            lastName = "UniqueLastName",
            email = "unique.search.${UUID.randomUUID()}@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(member, testTenantId)
        memberRepository.save(member)

        val members = memberService.searchMembers(
            search = "UniqueSearchName",
            status = null,
            joinedAfter = null,
            joinedBefore = null,
            pageable = PageRequest.of(0, 10)
        )

        assertNotNull(members)
        assertTrue(members.content.isNotEmpty())
        assertTrue(members.content.any { it.firstName == "UniqueSearchName" })
    }

    @Test
    fun `searchMembers with status filter returns filtered results`() {
        // Create a suspended member
        val suspendedMember = Member(
            id = UUID.randomUUID(),
            firstName = "Suspended",
            lastName = "Member",
            email = "suspended.${UUID.randomUUID()}@example.com",
            status = MemberStatus.SUSPENDED
        )
        setTenantId(suspendedMember, testTenantId)
        memberRepository.save(suspendedMember)

        val activeMembers = memberService.searchMembers(
            search = null,
            status = MemberStatus.ACTIVE,
            joinedAfter = null,
            joinedBefore = null,
            pageable = PageRequest.of(0, 100)
        )

        assertNotNull(activeMembers)
        assertTrue(activeMembers.content.all { it.status == MemberStatus.ACTIVE })
    }

    @Test
    fun `createMember with valid data creates member`() {
        val command = CreateMemberCommand(
            firstName = "New",
            lastName = "Member",
            email = "newmember.${UUID.randomUUID()}@example.com",
            phone = "+966500000001"
        )

        val createdMember = memberService.createMember(command)

        assertNotNull(createdMember)
        assertEquals("New", createdMember.firstName)
        assertEquals("Member", createdMember.lastName)
        assertEquals(MemberStatus.ACTIVE, createdMember.status)
    }

    @Test
    fun `getMemberById returns member when exists`() {
        val member = Member(
            id = UUID.randomUUID(),
            firstName = "GetById",
            lastName = "Test",
            email = "getbyid.${UUID.randomUUID()}@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(member, testTenantId)
        val savedMember = memberRepository.save(member)

        val foundMember = memberService.getMember(savedMember.id)

        assertNotNull(foundMember)
        assertEquals(savedMember.id, foundMember.id)
        assertEquals("GetById", foundMember.firstName)
    }

    @Test
    fun `getMemberById throws exception when not found`() {
        val nonExistentId = UUID.randomUUID()

        val exception = org.junit.jupiter.api.assertThrows<NoSuchElementException> {
            memberService.getMember(nonExistentId)
        }

        assertNotNull(exception)
    }

    @Test
    fun `member count is correct after creation via repository`() {
        val initialCount = memberService.getAllMembers(PageRequest.of(0, 100)).totalElements

        // Create a new member directly via repository (bypassing notification service)
        val member = Member(
            id = UUID.randomUUID(),
            firstName = "Count",
            lastName = "Test",
            email = "count.test.${UUID.randomUUID()}@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(member, testTenantId)
        memberRepository.save(member)

        val newCount = memberService.getAllMembers(PageRequest.of(0, 100)).totalElements

        assertEquals(initialCount + 1, newCount)
    }
}
