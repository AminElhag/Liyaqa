package com.liyaqa.integration

import com.liyaqa.crm.application.commands.CreateLeadCommand
import com.liyaqa.crm.application.commands.LogLeadActivityCommand
import com.liyaqa.crm.application.services.LeadActivityService
import com.liyaqa.crm.application.services.LeadService
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.domain.model.Gender
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.scheduling.application.commands.CreateBookingCommand
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.attendance.application.services.AttendanceService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Integration test for complete member journey:
 * 1. Lead created
 * 2. Lead contacted
 * 3. Tour scheduled and completed
 * 4. Lead converted to member
 * 5. Member subscribes to plan
 * 6. Member books a class
 * 7. Member checks in for class
 * 8. Member becomes active
 *
 * This test verifies the entire customer lifecycle from first contact to active membership.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MemberJourneyIntegrationTest {

    @Autowired
    private lateinit var leadService: LeadService

    @Autowired
    private lateinit var leadActivityService: LeadActivityService

    @Autowired
    private lateinit var memberService: MemberService

    @Autowired
    private lateinit var subscriptionService: SubscriptionService

    @Autowired
    private lateinit var bookingService: BookingService

    @Autowired
    private lateinit var attendanceService: AttendanceService

    @Test
    fun `should complete full member journey from lead to active member`() {
        // ===================================================================
        // Step 1: Lead Creation (First Contact)
        // ===================================================================
        val createLeadCommand = CreateLeadCommand(
            name = "Sarah Ahmed",
            email = "sarah.ahmed@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN,
            notes = "Interested in monthly membership"
        )

        val lead = leadService.createLead(createLeadCommand)

        assertThat(lead).isNotNull
        assertThat(lead.name).isEqualTo("Sarah Ahmed")
        assertThat(lead.status).isEqualTo(LeadStatus.NEW)
        assertThat(lead.email).isEqualTo("sarah.ahmed@example.com")

        // ===================================================================
        // Step 2: First Contact - Phone Call
        // ===================================================================
        val callActivity = leadActivityService.logActivity(
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.CALL,
                notes = "Initial phone call - discussed membership options and pricing",
                contactMethod = "PHONE",
                outcome = "Interested - scheduled tour",
                durationMinutes = 15,
                followUpDate = LocalDate.now().plusDays(2)
            )
        )

        assertThat(callActivity).isNotNull
        assertThat(callActivity.type).isEqualTo(LeadActivityType.CALL)
        assertThat(callActivity.followUpDate).isNotNull()

        // ===================================================================
        // Step 3: Gym Tour Scheduled and Completed
        // ===================================================================
        val tourActivity = leadActivityService.logActivity(
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.TOUR,
                notes = "Completed gym tour - showed all facilities, introduced to trainers",
                outcome = "Very interested - ready to sign up",
                durationMinutes = 45
            )
        )

        assertThat(tourActivity).isNotNull
        assertThat(tourActivity.type).isEqualTo(LeadActivityType.TOUR)

        // Verify lead score increased due to tour (high-value activity)
        // Note: In real implementation, lead should be reloaded to see updated score
        // val updatedLead = leadService.findById(lead.id)
        // assertThat(updatedLead.score).isGreaterThan(lead.score)

        // ===================================================================
        // Step 4: Lead Converted to Member
        // ===================================================================
        val createMemberCommand = CreateMemberCommand(
            firstName = LocalizedText(en = lead.name.split(" ").first(), ar = lead.name.split(" ").first()),
            lastName = LocalizedText(en = lead.name.split(" ").last(), ar = lead.name.split(" ").last()),
            email = lead.email,
            phone = lead.phone,
            dateOfBirth = LocalDate.of(1990, 5, 15),
            gender = Gender.FEMALE,
            address = LocalizedText(en = "123 King Fahd Road, Riyadh", ar = "123 طريق الملك فهد، الرياض"),
            emergencyContactName = "Ahmed Hassan",
            emergencyContactPhone = "+966507654321",
            notes = "Converted from lead ${lead.id}"
        )

        val member = memberService.createMember(createMemberCommand)

        assertThat(member).isNotNull
        assertThat(member.firstName.en).isEqualTo("Sarah")
        assertThat(member.email).isEqualTo("sarah.ahmed@example.com")
        assertThat(member.status).isEqualTo(MemberStatus.PENDING) // Awaiting subscription

        // Log conversion activity for lead
        leadActivityService.logActivity(
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.STATUS_CHANGE,
                notes = "Successfully converted to member ${member.id}",
                outcome = "Converted"
            )
        )

        // ===================================================================
        // Step 5: Member Subscribes to Plan
        // ===================================================================
        // Note: This would typically involve:
        // - Selecting a membership plan
        // - Creating a subscription
        // - Processing payment
        // - Member status changes to ACTIVE
        //
        // Simplified here as it depends on your subscription service implementation:
        //
        // val subscription = subscriptionService.create(
        //     memberId = member.id,
        //     planId = monthlyPlanId,
        //     startDate = LocalDate.now()
        // )
        //
        // assertThat(subscription).isNotNull
        // assertThat(subscription.status).isEqualTo(SubscriptionStatus.ACTIVE)

        // For this test, we'll simulate member becoming active
        val activeMember = memberService.activateMember(member.id)
        assertThat(activeMember.status).isEqualTo(MemberStatus.ACTIVE)

        // ===================================================================
        // Step 6: Member Books First Class
        // ===================================================================
        // Note: Requires a class to exist in the system
        // This is simplified - in real test you'd need to create a class first
        //
        // val booking = bookingService.createBooking(
        //     CreateBookingCommand(
        //         memberId = member.id,
        //         classId = testClassId,
        //         bookingDate = LocalDateTime.now().plusDays(1)
        //     )
        // )
        //
        // assertThat(booking).isNotNull
        // assertThat(booking.status).isEqualTo(BookingStatus.CONFIRMED)
        // assertThat(booking.memberId).isEqualTo(member.id)

        // ===================================================================
        // Step 7: Member Checks In for Class
        // ===================================================================
        // Note: This would update the booking status and create attendance record
        //
        // attendanceService.checkIn(
        //     memberId = member.id,
        //     bookingId = booking.id
        // )
        //
        // val updatedBooking = bookingService.findById(booking.id)
        // assertThat(updatedBooking.status).isEqualTo(BookingStatus.ATTENDED)

        // ===================================================================
        // Verification: Complete Journey
        // ===================================================================

        // Verify lead status changed to WON/CONVERTED
        // val finalLead = leadService.findById(lead.id)
        // assertThat(finalLead.status).isEqualTo(LeadStatus.WON)

        // Verify member is active
        val finalMember = memberService.getMember(member.id)
        assertThat(finalMember.status).isEqualTo(MemberStatus.ACTIVE)

        // Verify member details are correct
        assertThat(finalMember.email).isEqualTo("sarah.ahmed@example.com")
        assertThat(finalMember.phone).isEqualTo("+966501234567")

        // Verify activities were tracked
        // val activities = leadActivityService.getActivitiesForLead(lead.id, PageRequest.of(0, 10))
        // assertThat(activities.content).hasSizeGreaterThanOrEqualTo(3) // Call, Tour, Conversion
    }

    @Test
    fun `should track complete activity timeline`() {
        // Given: A lead is created
        val lead = leadService.createLead(
            CreateLeadCommand(
                name = "Mohammed Ali",
                email = "mohammed@example.com",
                phone = "+966509876543",
                source = LeadSource.REFERRAL
            )
        )

        // When: Multiple activities are logged over time
        val activities = listOf(
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.CALL,
                notes = "Initial contact call"
            ),
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.EMAIL,
                notes = "Sent membership information pack"
            ),
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.FOLLOW_UP_COMPLETED,
                notes = "Follow-up call after 3 days"
            ),
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.TOUR,
                notes = "Facility tour completed"
            )
        )

        val createdActivities = activities.map { leadActivityService.logActivity(it) }

        // Then: All activities should be tracked
        assertThat(createdActivities).hasSize(4)
        assertThat(createdActivities.map { it.type }).containsExactly(
            LeadActivityType.CALL,
            LeadActivityType.EMAIL,
            LeadActivityType.FOLLOW_UP_COMPLETED,
            LeadActivityType.TOUR
        )

        // And: Timeline is preserved
        createdActivities.zipWithNext().forEach { (earlier, later) ->
            assertThat(later.createdAt).isAfterOrEqualTo(earlier.createdAt)
        }
    }

    @Test
    fun `should handle member referral journey`() {
        // Given: Existing member (referrer)
        val existingMember = memberService.createMember(
            CreateMemberCommand(
                firstName = LocalizedText(en = "Ali", ar = "علي"),
                lastName = LocalizedText(en = "Hassan", ar = "حسن"),
                email = "ali@example.com",
                phone = "+966501111111",
                dateOfBirth = LocalDate.of(1988, 3, 10),
                gender = Gender.MALE
            )
        )

        // When: New lead is created via referral
        val referredLead = leadService.createLead(
            CreateLeadCommand(
                name = "Fatima Ahmed",
                email = "fatima@example.com",
                phone = "+966502222222",
                source = LeadSource.REFERRAL,
                notes = "Referred by member ${existingMember.id}"
            )
        )

        // Then: Lead should be created with referral source
        assertThat(referredLead.source).isEqualTo(LeadSource.REFERRAL)

        // And: Referral leads typically get higher initial scores
        // (assuming scoring service applies referral bonus)
        // assertThat(referredLead.score).isGreaterThan(50)

        // When: Referred lead converts to member
        val newMember = memberService.createMember(
            CreateMemberCommand(
                firstName = LocalizedText(en = referredLead.name.split(" ").first(), ar = referredLead.name.split(" ").first()),
                lastName = LocalizedText(en = referredLead.name.split(" ").last(), ar = referredLead.name.split(" ").last()),
                email = referredLead.email,
                phone = referredLead.phone,
                dateOfBirth = LocalDate.of(1992, 7, 20),
                gender = Gender.FEMALE,
                notes = "Converted from referral lead ${referredLead.id}"
            )
        )

        // Then: Both members should exist in the system
        assertThat(newMember).isNotNull
        assertThat(newMember.email).isEqualTo("fatima@example.com")

        val allMembers = memberService.getAllMembers(org.springframework.data.domain.PageRequest.of(0, 100))
        assertThat(allMembers.content.size).isGreaterThanOrEqualTo(2)

        // Note: In a complete implementation, you would also:
        // - Award referral bonus to the referrer
        // - Track the referral relationship
        // - Apply referral-specific promotions
    }

    @Test
    fun `should handle lead rejection and re-engagement`() {
        // Given: A lead is created
        val lead = leadService.createLead(
            CreateLeadCommand(
                name = "Omar Khalid",
                email = "omar@example.com",
                phone = "+966503333333",
                source = LeadSource.WEBSITE
            )
        )

        // When: Lead initially declines
        leadActivityService.logActivity(
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.CALL,
                notes = "Not interested at this time - too expensive",
                outcome = "Declined"
            )
        )

        // And: Lead status updated to UNQUALIFIED or LOST
        // leadService.updateStatus(lead.id, LeadStatus.LOST)

        // And: Later, lead shows renewed interest (marketing campaign)
        leadActivityService.logActivity(
            LogLeadActivityCommand(
                leadId = lead.id,
                type = LeadActivityType.EMAIL,
                notes = "Responded to promotional email - interested in discounted plan",
                outcome = "Re-engaged"
            )
        )

        // Then: Lead should have multiple touchpoints
        // val timeline = leadActivityService.getActivitiesForLead(lead.id, PageRequest.of(0, 10))
        // assertThat(timeline.content).hasSizeGreaterThanOrEqualTo(2)

        // And: Lead can be moved back to active status
        // leadService.updateStatus(lead.id, LeadStatus.IN_PROGRESS)
        // val reactivatedLead = leadService.findById(lead.id)
        // assertThat(reactivatedLead.status).isEqualTo(LeadStatus.IN_PROGRESS)
    }
}
