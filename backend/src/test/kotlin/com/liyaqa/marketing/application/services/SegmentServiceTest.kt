package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.application.commands.AddSegmentMembersCommand
import com.liyaqa.marketing.application.commands.CreateSegmentCommand
import com.liyaqa.marketing.application.commands.RemoveSegmentMemberCommand
import com.liyaqa.marketing.application.commands.UpdateSegmentCommand
import com.liyaqa.marketing.domain.model.Segment
import com.liyaqa.marketing.domain.model.SegmentCriteria
import com.liyaqa.marketing.domain.model.SegmentMember
import com.liyaqa.marketing.domain.model.SegmentType
import com.liyaqa.marketing.domain.ports.SegmentMemberRepository
import com.liyaqa.marketing.domain.ports.SegmentRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SegmentServiceTest {

    @Mock
    private lateinit var segmentRepository: SegmentRepository

    @Mock
    private lateinit var segmentMemberRepository: SegmentMemberRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    private lateinit var segmentService: SegmentService

    private lateinit var testSegment: Segment
    private lateinit var testMember: Member

    @BeforeEach
    fun setUp() {
        segmentService = SegmentService(
            segmentRepository,
            segmentMemberRepository,
            memberRepository,
            subscriptionRepository
        )

        testSegment = Segment.createDynamic(
            name = "Active Members",
            description = "All active members",
            criteria = SegmentCriteria(memberStatuses = listOf("ACTIVE"))
        )

        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE
        )
    }

    // ==================== CREATE SEGMENT ====================

    @Test
    fun `createSegment should create dynamic segment`() {
        // Given
        val command = CreateSegmentCommand(
            name = "Active Members",
            description = "All active members",
            segmentType = SegmentType.DYNAMIC,
            criteria = SegmentCriteria(memberStatuses = listOf("ACTIVE"))
        )

        whenever(segmentRepository.save(any<Segment>())).thenAnswer { invocation ->
            invocation.getArgument<Segment>(0)
        }
        whenever(segmentRepository.findById(any<UUID>())) doReturn Optional.of(testSegment)
        whenever(memberRepository.search(anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(), any())).thenReturn(
            PageImpl(emptyList(), PageRequest.of(0, 1), 0)
        )

        // When
        val result = segmentService.createSegment(command)

        // Then
        assertNotNull(result)
        assertEquals(command.name, result.name)
        assertEquals(SegmentType.DYNAMIC, result.segmentType)
        assertNotNull(result.criteria)
    }

    @Test
    fun `createSegment should create static segment`() {
        // Given
        val command = CreateSegmentCommand(
            name = "VIP Members",
            description = "Hand-picked VIP members",
            segmentType = SegmentType.STATIC,
            criteria = null
        )

        whenever(segmentRepository.save(any<Segment>())).thenAnswer { invocation ->
            invocation.getArgument<Segment>(0)
        }

        // When
        val result = segmentService.createSegment(command)

        // Then
        assertNotNull(result)
        assertEquals(SegmentType.STATIC, result.segmentType)
        assertTrue(result.isStatic())
    }

    // ==================== GET SEGMENT ====================

    @Test
    fun `getSegment should return segment when found`() {
        // Given
        val segmentId = testSegment.id
        whenever(segmentRepository.findById(segmentId)) doReturn Optional.of(testSegment)

        // When
        val result = segmentService.getSegment(segmentId)

        // Then
        assertEquals(testSegment, result)
    }

    @Test
    fun `getSegment should throw when not found`() {
        // Given
        val segmentId = UUID.randomUUID()
        whenever(segmentRepository.findById(segmentId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            segmentService.getSegment(segmentId)
        }
    }

    // ==================== LIST SEGMENTS ====================

    @Test
    fun `listSegments should return paginated segments`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val segments = listOf(testSegment)
        val page = PageImpl(segments, pageable, 1)

        whenever(segmentRepository.findAll(pageable)) doReturn page

        // When
        val result = segmentService.listSegments(pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testSegment, result.content[0])
    }

    @Test
    fun `searchSegments should filter by search term`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val segments = listOf(testSegment)
        val page = PageImpl(segments, pageable, 1)

        whenever(segmentRepository.search("Active", null, pageable)) doReturn page

        // When
        val result = segmentService.searchSegments("Active", null, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }

    // ==================== UPDATE SEGMENT ====================

    @Test
    fun `updateSegment should update segment fields`() {
        // Given
        val segmentId = testSegment.id
        val command = UpdateSegmentCommand(
            name = "Updated Name",
            description = "Updated description",
            criteria = SegmentCriteria(memberStatuses = listOf("ACTIVE", "INACTIVE"))
        )

        whenever(segmentRepository.findById(segmentId)) doReturn Optional.of(testSegment)
        whenever(segmentRepository.save(any<Segment>())).thenAnswer { invocation ->
            invocation.getArgument<Segment>(0)
        }
        whenever(memberRepository.search(anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(), any())).thenReturn(
            PageImpl(emptyList(), PageRequest.of(0, 1), 0)
        )

        // When
        val result = segmentService.updateSegment(segmentId, command)

        // Then
        assertEquals("Updated Name", result.name)
        assertEquals("Updated description", result.description)
    }

    // ==================== DELETE SEGMENT ====================

    @Test
    fun `deleteSegment should delete segment and members`() {
        // Given
        val segmentId = testSegment.id
        whenever(segmentRepository.findById(segmentId)) doReturn Optional.of(testSegment)

        // When
        segmentService.deleteSegment(segmentId)

        // Then
        verify(segmentMemberRepository).deleteBySegmentId(segmentId)
        verify(segmentRepository).deleteById(segmentId)
    }

    // ==================== STATIC SEGMENT MEMBERS ====================

    @Test
    fun `addMembers should add members to static segment`() {
        // Given
        val staticSegment = Segment.createStatic(
            name = "VIP Members",
            description = "VIP members"
        )
        val memberId = testMember.id
        val command = AddSegmentMembersCommand(
            segmentId = staticSegment.id,
            memberIds = listOf(memberId)
        )

        whenever(segmentRepository.findById(staticSegment.id)) doReturn Optional.of(staticSegment)
        whenever(segmentMemberRepository.existsBySegmentIdAndMemberId(staticSegment.id, memberId)) doReturn false
        whenever(segmentMemberRepository.save(any<SegmentMember>())).thenAnswer { invocation ->
            invocation.getArgument<SegmentMember>(0)
        }
        whenever(segmentMemberRepository.countBySegmentId(staticSegment.id)) doReturn 1L
        whenever(segmentRepository.save(any<Segment>())).thenAnswer { invocation ->
            invocation.getArgument<Segment>(0)
        }

        // When
        val result = segmentService.addMembers(command)

        // Then
        assertEquals(1, result)
        verify(segmentMemberRepository).save(any<SegmentMember>())
    }

    @Test
    fun `addMembers should throw when segment is dynamic`() {
        // Given
        val segmentId = testSegment.id // testSegment is dynamic
        val memberId = testMember.id
        val command = AddSegmentMembersCommand(
            segmentId = segmentId,
            memberIds = listOf(memberId)
        )

        whenever(segmentRepository.findById(segmentId)) doReturn Optional.of(testSegment)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            segmentService.addMembers(command)
        }

        verify(segmentMemberRepository, never()).save(any())
    }

    @Test
    fun `removeMember should remove member from static segment`() {
        // Given
        val staticSegment = Segment.createStatic(
            name = "VIP Members",
            description = "VIP members"
        )
        val memberId = testMember.id
        val command = RemoveSegmentMemberCommand(
            segmentId = staticSegment.id,
            memberId = memberId
        )

        whenever(segmentRepository.findById(staticSegment.id)) doReturn Optional.of(staticSegment)
        whenever(segmentMemberRepository.countBySegmentId(staticSegment.id)) doReturn 0L
        whenever(segmentRepository.save(any<Segment>())).thenAnswer { invocation ->
            invocation.getArgument<Segment>(0)
        }

        // When
        segmentService.removeMember(command)

        // Then
        verify(segmentMemberRepository).deleteBySegmentIdAndMemberId(staticSegment.id, memberId)
    }

    // ==================== RECALCULATE SEGMENT ====================

    @Test
    fun `recalculateSegmentCount should update member count for dynamic segment`() {
        // Given
        val segmentId = testSegment.id
        val pageable = PageRequest.of(0, 1)
        val members = listOf(testMember)
        val page = PageImpl(members, pageable, 1)

        whenever(segmentRepository.findById(segmentId)) doReturn Optional.of(testSegment)
        whenever(memberRepository.search(anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(), any())).thenReturn(page)
        whenever(segmentRepository.save(any<Segment>())).thenAnswer { invocation ->
            invocation.getArgument<Segment>(0)
        }

        // When
        val result = segmentService.recalculateSegmentCount(segmentId)

        // Then
        assertEquals(1, result)
    }

    // ==================== PREVIEW MEMBERS ====================

    @Test
    fun `previewMembers should return members for dynamic segment`() {
        // Given
        val segmentId = testSegment.id
        val pageable = PageRequest.of(0, 10)
        val members = listOf(testMember)
        val page = PageImpl(members, pageable, 1)

        whenever(segmentRepository.findById(segmentId)) doReturn Optional.of(testSegment)
        whenever(memberRepository.search(anyOrNull(), anyOrNull(), anyOrNull(), anyOrNull(), any())).thenReturn(page)

        // When
        val result = segmentService.previewMembers(segmentId, pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testMember, result.content[0])
    }

    @Test
    fun `previewMembers should throw when segment is static`() {
        // Given
        val staticSegment = Segment.createStatic(
            name = "VIP Members",
            description = "VIP members"
        )
        val pageable = PageRequest.of(0, 10)

        whenever(segmentRepository.findById(staticSegment.id)) doReturn Optional.of(staticSegment)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            segmentService.previewMembers(staticSegment.id, pageable)
        }
    }

    // ==================== SEGMENT TYPE CHECKS ====================

    @Test
    fun `segment isStatic should return true for static segment`() {
        // Given
        val staticSegment = Segment.createStatic(
            name = "Static Segment",
            description = "A static segment"
        )

        // Then
        assertTrue(staticSegment.isStatic())
        assertFalse(staticSegment.isDynamic())
    }

    @Test
    fun `segment isDynamic should return true for dynamic segment`() {
        // Then
        assertTrue(testSegment.isDynamic())
        assertFalse(testSegment.isStatic())
    }
}
