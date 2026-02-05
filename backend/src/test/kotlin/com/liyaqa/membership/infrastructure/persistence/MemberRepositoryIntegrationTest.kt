package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.config.TestContainersConfiguration
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for MemberRepository.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestContainersConfiguration::class)
@Transactional
class MemberRepositoryIntegrationTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        testTenantId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun createTestMember(
        firstName: String = "John",
        lastName: String = "Doe",
        email: String = "john.doe.${UUID.randomUUID()}@example.com",
        status: MemberStatus = MemberStatus.ACTIVE
    ): Member {
        val member = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = firstName, ar = firstName),
            lastName = LocalizedText(en = lastName, ar = lastName),
            email = email,
            phone = "+966500000001",
            status = status
        )
        member.javaClass.superclass.getDeclaredField("tenantId").apply {
            isAccessible = true
            set(member, testTenantId)
        }
        return member
    }

    @Test
    fun `save new member persists to database with timestamps`() {
        val member = createTestMember()
        val savedMember = memberRepository.save(member)

        val foundMember = memberRepository.findById(savedMember.id)
        assertTrue(foundMember.isPresent)
        assertEquals(member.firstName.en, foundMember.get().firstName.en)
        assertNotNull(foundMember.get().createdAt)
    }

    @Test
    fun `findById returns member when exists`() {
        val member = createTestMember()
        memberRepository.save(member)

        val found = memberRepository.findById(member.id)
        assertTrue(found.isPresent)
        assertEquals(member.email, found.get().email)
    }

    @Test
    fun `findById returns empty when not exists`() {
        val found = memberRepository.findById(UUID.randomUUID())
        assertFalse(found.isPresent)
    }

    @Test
    fun `search by firstName returns matching members`() {
        // Use unique names to avoid conflicts with other tests
        val uniqueSuffix = UUID.randomUUID().toString().take(8)
        memberRepository.save(createTestMember(firstName = "SearchTarget$uniqueSuffix", lastName = "Smith"))
        memberRepository.save(createTestMember(firstName = "Jane$uniqueSuffix", lastName = "Doe"))

        val result = memberRepository.search("SearchTarget$uniqueSuffix", null, null, null, PageRequest.of(0, 10))
        assertTrue(result.totalElements >= 1, "Expected at least 1 result for unique search term")
        assertTrue(result.content.any { it.firstName.en == "SearchTarget$uniqueSuffix" })
    }

    @Test
    fun `existsByEmail returns true for existing email`() {
        val email = "unique.email@example.com"
        memberRepository.save(createTestMember(email = email))
        assertTrue(memberRepository.existsByEmail(email))
    }

    @Test
    fun `existsByEmail returns false for non-existent email`() {
        assertFalse(memberRepository.existsByEmail("nonexistent@example.com"))
    }
}
