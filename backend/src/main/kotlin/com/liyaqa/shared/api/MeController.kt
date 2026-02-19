package com.liyaqa.shared.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.auth.application.commands.ChangePasswordCommand
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.api.AgreementSummaryResponse
import com.liyaqa.membership.api.MemberAgreementResponse
import com.liyaqa.membership.api.MemberAgreementStatusResponse
import com.liyaqa.membership.api.SignAgreementDetailsRequest
import com.liyaqa.membership.api.SignAgreementsRequest
import com.liyaqa.membership.api.WalletResponse
import com.liyaqa.membership.api.WalletTransactionResponse
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.application.services.AgreementService
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.application.services.MembershipPlanService
import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.application.services.WalletService
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.WalletTransactionType
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.application.services.ClassService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Self-service endpoints for authenticated members.
 * All endpoints use the authenticated user's context.
 */
@RestController
@RequestMapping("/api/me")
@Tag(name = "My Profile", description = "Self-service endpoints for authenticated members")
class MeController(
    private val memberService: MemberService,
    private val subscriptionService: SubscriptionService,
    private val membershipPlanService: MembershipPlanService,
    private val bookingService: BookingService,
    private val classService: ClassService,
    private val attendanceService: AttendanceService,
    private val invoiceService: InvoiceService,
    private val notificationService: NotificationService,
    private val authService: AuthService,
    private val userRepository: UserRepository,
    private val walletService: WalletService,
    private val agreementService: AgreementService
) {
    private val logger = LoggerFactory.getLogger(MeController::class.java)

    /**
     * Helper method to validate member belongs to current tenant.
     * Implements defense-in-depth security by adding explicit tenant check
     * beyond repository-level filtering.
     *
     * @param member The member to validate
     * @param userId The authenticated user ID (for logging)
     * @return true if validation passes, false otherwise
     */
    private fun validateMemberTenant(member: com.liyaqa.membership.domain.model.Member, userId: UUID): Boolean {
        val currentTenantId = TenantContext.getCurrentTenant()?.value
        if (currentTenantId == null || member.tenantId != currentTenantId) {
            logger.warn(
                "Tenant validation failed: user=$userId, " +
                "memberTenant=${member.tenantId}, currentTenant=$currentTenantId"
            )
            return false
        }
        return true
    }

    // ==================== PROFILE ====================

    /**
     * Get authenticated user's profile.
     * Returns member profile if user is a member, otherwise returns basic user info.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my profile", description = "Get the authenticated user's profile")
    fun getMyProfile(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MyProfileResponse> {
        // Try to find member profile first
        val member = memberService.findMemberByUserId(principal.userId)

        if (member != null) {
            // Tenant validation: Ensure member belongs to current tenant
            val currentTenantId = TenantContext.getCurrentTenant()?.value
            if (currentTenantId == null || member.tenantId != currentTenantId) {
                logger.warn(
                    "Tenant validation failed in getMyProfile: user=${principal.userId}, " +
                    "memberTenant=${member.tenantId}, currentTenant=$currentTenantId"
                )
                // Return 404 instead of 403 to prevent tenant enumeration
                return ResponseEntity.notFound().build()
            }

            return ResponseEntity.ok(
                MyProfileResponse(
                    id = member.id,
                    firstName = member.firstName.en,
                    lastName = member.lastName.en,
                    fullName = member.fullName.en,
                    email = member.email,
                    phone = member.phone,
                    dateOfBirth = member.dateOfBirth,
                    address = member.address?.let {
                        AddressResponse(
                            street = it.street,
                            city = it.city,
                            state = it.state,
                            postalCode = it.postalCode,
                            country = it.country
                        )
                    },
                    emergencyContactName = member.emergencyContactName,
                    emergencyContactPhone = member.emergencyContactPhone,
                    status = member.status,
                    createdAt = member.createdAt,
                    updatedAt = member.updatedAt
                )
            )
        }

        // Fallback: Return basic user info for admin/staff users without member profile
        val user = userRepository.findById(principal.userId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        // Tenant validation: Ensure user belongs to current tenant
        val currentTenantId = TenantContext.getCurrentTenant()?.value
        if (currentTenantId == null || user.tenantId != currentTenantId) {
            logger.warn(
                "Tenant validation failed in getMyProfile (user fallback): user=${principal.userId}, " +
                "userTenant=${user.tenantId}, currentTenant=$currentTenantId"
            )
            // Return 404 instead of 403 to prevent tenant enumeration
            return ResponseEntity.notFound().build()
        }

        return ResponseEntity.ok(
            MyProfileResponse(
                id = user.id,
                firstName = user.displayName.en,
                lastName = "",
                fullName = user.displayName.en,
                email = user.email,
                phone = null,
                dateOfBirth = null,
                address = null,
                emergencyContactName = null,
                emergencyContactPhone = null,
                status = MemberStatus.ACTIVE,
                createdAt = user.createdAt,
                updatedAt = user.updatedAt
            )
        )
    }

    /**
     * Update authenticated member's profile.
     */
    @PatchMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update my profile", description = "Update the authenticated member's profile")
    fun updateMyProfile(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: UpdateMyProfileRequest
    ): ResponseEntity<MyProfileResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Tenant validation: Ensure member belongs to current tenant
        val currentTenantId = TenantContext.getCurrentTenant()?.value
        if (currentTenantId == null || member.tenantId != currentTenantId) {
            logger.warn(
                "Tenant validation failed: user=${principal.userId}, " +
                "memberTenant=${member.tenantId}, currentTenant=$currentTenantId"
            )
            // Return 404 instead of 403 to prevent tenant enumeration
            return ResponseEntity.notFound().build()
        }

        val command = UpdateMemberCommand(
            firstName = request.firstName?.let { LocalizedText(it) },
            lastName = request.lastName?.let { LocalizedText(it) },
            phone = request.phone,
            dateOfBirth = request.dateOfBirth,
            address = null,  // Address update simplified
            emergencyContactName = request.emergencyContactName,
            emergencyContactPhone = request.emergencyContactPhone,
            notes = null
        )

        val updatedMember = memberService.updateMember(member.id, command)

        return ResponseEntity.ok(
            MyProfileResponse(
                id = updatedMember.id,
                firstName = updatedMember.firstName.en,
                lastName = updatedMember.lastName.en,
                fullName = updatedMember.fullName.en,
                email = updatedMember.email,
                phone = updatedMember.phone,
                dateOfBirth = updatedMember.dateOfBirth,
                address = updatedMember.address?.let {
                    AddressResponse(
                        street = it.street,
                        city = it.city,
                        state = it.state,
                        postalCode = it.postalCode,
                        country = it.country
                    )
                },
                emergencyContactName = updatedMember.emergencyContactName,
                emergencyContactPhone = updatedMember.emergencyContactPhone,
                status = updatedMember.status,
                createdAt = updatedMember.createdAt,
                updatedAt = updatedMember.updatedAt
            )
        )
    }

    /**
     * Change password for authenticated user.
     */
    @PostMapping("/password/change")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password", description = "Change the authenticated user's password")
    fun changePassword(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<Map<String, Any>> {
        authService.changePassword(
            ChangePasswordCommand(
                userId = principal.userId,
                currentPassword = request.currentPassword,
                newPassword = request.newPassword
            )
        )
        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "message" to "Password changed successfully",
                "messageAr" to "تم تغيير كلمة المرور بنجاح"
            )
        )
    }

    // ==================== SUBSCRIPTION ====================

    /**
     * Get my current subscription status.
     */
    @GetMapping("/subscription")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my subscription", description = "Get the authenticated member's subscription status")
    fun getMySubscription(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MySubscriptionResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Tenant validation
        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val subscription = subscriptionService.getActiveSubscription(member.id)
            ?: return ResponseEntity.ok(
                MySubscriptionResponse(
                    hasSubscription = false,
                    subscription = null
                )
            )

        val plan = membershipPlanService.getPlan(subscription.planId)

        return ResponseEntity.ok(
            MySubscriptionResponse(
                hasSubscription = true,
                subscription = SubscriptionLiteResponse.from(subscription, plan.name)
            )
        )
    }

    // ==================== BOOKINGS ====================

    /**
     * Get my upcoming bookings.
     */
    @GetMapping("/bookings/upcoming")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my upcoming bookings", description = "Get the authenticated member's upcoming bookings")
    fun getMyUpcomingBookings(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<MobilePageResponse<BookingLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val bookingsPage = bookingService.getUpcomingBookingsByMember(
            member.id,
            PageRequest.of(page, size.coerceAtMost(50))
        )

        val bookings = bookingsPage.content.mapNotNull { booking ->
            try {
                val session = classService.getSession(booking.sessionId)
                val gymClass = classService.getGymClass(session.gymClassId)
                BookingLiteResponse.from(booking, session, gymClass)
            } catch (e: Exception) {
                null
            }
        }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = bookings,
                itemCount = bookings.size,
                hasMore = !bookingsPage.isLast,
                totalCount = bookingsPage.totalElements
            )
        )
    }

    /**
     * Get my past bookings.
     */
    @GetMapping("/bookings/past")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my past bookings", description = "Get the authenticated member's past bookings")
    fun getMyPastBookings(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<MobilePageResponse<BookingLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val bookingsPage = bookingService.getPastBookingsByMember(
            member.id,
            PageRequest.of(page, size.coerceAtMost(50))
        )

        val bookings = bookingsPage.content.mapNotNull { booking ->
            try {
                val session = classService.getSession(booking.sessionId)
                val gymClass = classService.getGymClass(session.gymClassId)
                BookingLiteResponse.from(booking, session, gymClass)
            } catch (e: Exception) {
                null
            }
        }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = bookings,
                itemCount = bookings.size,
                hasMore = !bookingsPage.isLast,
                totalCount = bookingsPage.totalElements
            )
        )
    }

    // ==================== ATTENDANCE ====================

    /**
     * Get my attendance history.
     */
    @GetMapping("/attendance")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my attendance", description = "Get the authenticated member's attendance history")
    fun getMyAttendance(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<MobilePageResponse<AttendanceLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val attendancePage = attendanceService.getAttendanceByMember(
            member.id,
            PageRequest.of(page, size.coerceAtMost(50), Sort.by(Sort.Direction.DESC, "checkInTime"))
        )

        val attendance = attendancePage.content.map { AttendanceLiteResponse.from(it) }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = attendance,
                itemCount = attendance.size,
                hasMore = !attendancePage.isLast,
                totalCount = attendancePage.totalElements
            )
        )
    }

    /**
     * Get my attendance by date range.
     */
    @GetMapping("/attendance/range")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my attendance by date range", description = "Get attendance history within a date range")
    fun getMyAttendanceByDateRange(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<MobilePageResponse<AttendanceLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val attendancePage = attendanceService.getMemberAttendanceByDateRange(
            member.id,
            startDate,
            endDate,
            PageRequest.of(page, size.coerceAtMost(100))
        )

        val attendance = attendancePage.content.map { AttendanceLiteResponse.from(it) }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = attendance,
                itemCount = attendance.size,
                hasMore = !attendancePage.isLast,
                totalCount = attendancePage.totalElements
            )
        )
    }

    // ==================== INVOICES ====================

    /**
     * Get my invoices.
     */
    @GetMapping("/invoices")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my invoices", description = "Get the authenticated member's invoices")
    fun getMyInvoices(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) status: InvoiceStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<MobilePageResponse<InvoiceLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Tenant validation
        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val invoicesPage = if (status != null) {
            invoiceService.searchInvoices(null, status, member.id, null, null, PageRequest.of(page, size))
        } else {
            invoiceService.getInvoicesByMember(member.id, PageRequest.of(page, size.coerceAtMost(50)))
        }

        val invoices = invoicesPage.content.map { InvoiceLiteResponse.from(it) }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = invoices,
                itemCount = invoices.size,
                hasMore = !invoicesPage.isLast,
                totalCount = invoicesPage.totalElements
            )
        )
    }

    /**
     * Get my pending invoices.
     */
    @GetMapping("/invoices/pending")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my pending invoices", description = "Get unpaid and overdue invoices")
    fun getMyPendingInvoices(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<List<InvoiceLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val issued = invoiceService.searchInvoices(
            null, InvoiceStatus.ISSUED, member.id, null, null, PageRequest.of(0, 20)
        ).content

        val overdue = invoiceService.searchInvoices(
            null, InvoiceStatus.OVERDUE, member.id, null, null, PageRequest.of(0, 20)
        ).content

        val partiallyPaid = invoiceService.searchInvoices(
            null, InvoiceStatus.PARTIALLY_PAID, member.id, null, null, PageRequest.of(0, 20)
        ).content

        val allPending = (issued + overdue + partiallyPaid)
            .distinctBy { it.id }
            .sortedBy { it.dueDate }
            .map { InvoiceLiteResponse.from(it) }

        return ResponseEntity.ok(allPending)
    }

    // ==================== NOTIFICATIONS ====================

    /**
     * Get my notifications.
     */
    @GetMapping("/notifications")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my notifications", description = "Get the authenticated member's notifications")
    fun getMyNotifications(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "false") unreadOnly: Boolean,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<MobilePageResponse<NotificationLiteResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val notificationsPage = notificationService.getNotificationsByMember(
            member.id,
            PageRequest.of(page, size.coerceAtMost(50))
        )

        val notifications = notificationsPage.content
            .filter { !unreadOnly || it.readAt == null }
            .map { NotificationLiteResponse.from(it) }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = notifications,
                itemCount = notifications.size,
                hasMore = !notificationsPage.isLast,
                totalCount = notificationsPage.totalElements
            )
        )
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/notifications/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread notification count", description = "Get count of unread notifications")
    fun getUnreadNotificationCount(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, Long>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val count = notificationService.getUnreadCount(member.id)
        return ResponseEntity.ok(mapOf("unreadCount" to count))
    }

    /**
     * Mark all notifications as read.
     */
    @PostMapping("/notifications/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all notifications as read", description = "Mark all notifications as read")
    fun markAllNotificationsAsRead(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, Any>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        notificationService.markAllAsRead(member.id)
        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "message" to "All notifications marked as read",
                "messageAr" to "تم تعليم جميع الإشعارات كمقروءة"
            )
        )
    }

    // ==================== WALLET ====================

    /**
     * Get my wallet balance.
     */
    @GetMapping("/wallet")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my wallet", description = "Get the authenticated member's wallet balance")
    fun getMyWallet(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<WalletResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Tenant validation
        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val wallet = walletService.getWallet(member.id)
        return if (wallet != null) {
            ResponseEntity.ok(WalletResponse.from(wallet))
        } else {
            ResponseEntity.ok(WalletResponse.empty(member.id))
        }
    }

    /**
     * Get my wallet transaction history.
     */
    @GetMapping("/wallet/transactions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my wallet transactions", description = "Get the authenticated member's wallet transaction history")
    fun getMyWalletTransactions(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) type: WalletTransactionType?
    ): ResponseEntity<MobilePageResponse<WalletTransactionResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val pageable = PageRequest.of(page, size.coerceAtMost(50), Sort.by(Sort.Direction.DESC, "createdAt"))

        val transactionsPage = if (type != null) {
            walletService.getTransactionsByType(member.id, type, pageable)
        } else {
            walletService.getTransactionHistory(member.id, pageable)
        }

        val transactions = transactionsPage.content.map { WalletTransactionResponse.from(it) }

        return ResponseEntity.ok(
            MobilePageResponse(
                items = transactions,
                itemCount = transactions.size,
                hasMore = !transactionsPage.isLast,
                totalCount = transactionsPage.totalElements
            )
        )
    }

    // ==================== AGREEMENTS ====================

    /**
     * Get my signed agreements.
     */
    @GetMapping("/agreements")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my agreements", description = "Get the authenticated member's signed agreements")
    fun getMyAgreements(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<List<MemberAgreementResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val memberAgreements = agreementService.getMemberAgreements(member.id)
        val responses = memberAgreements.map { ma ->
            val agreement = try {
                agreementService.getAgreement(ma.agreementId)
            } catch (e: NoSuchElementException) {
                null
            }
            MemberAgreementResponse.from(ma, agreement)
        }
        return ResponseEntity.ok(responses)
    }

    /**
     * Get my agreement status (signed + pending mandatory).
     */
    @GetMapping("/agreements/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my agreement status", description = "Get signed and pending mandatory agreements")
    fun getMyAgreementStatus(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MemberAgreementStatusResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val signedAgreements = agreementService.getMemberAgreements(member.id)
        val pendingMandatory = agreementService.getPendingMandatoryAgreements(member.id)
        val allMandatorySigned = agreementService.hasSignedAllMandatoryAgreements(member.id)

        val response = MemberAgreementStatusResponse(
            memberId = member.id,
            signedAgreements = signedAgreements.map { ma ->
                val agreement = try {
                    agreementService.getAgreement(ma.agreementId)
                } catch (e: NoSuchElementException) {
                    null
                }
                MemberAgreementResponse.from(ma, agreement)
            },
            pendingMandatoryAgreements = pendingMandatory.map { AgreementSummaryResponse.from(it) },
            allMandatorySigned = allMandatorySigned
        )

        return ResponseEntity.ok(response)
    }

    /**
     * Sign a specific agreement.
     */
    @PostMapping("/agreements/{agreementId}/sign")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Sign an agreement", description = "Sign a specific agreement for the authenticated member")
    fun signMyAgreement(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @PathVariable agreementId: UUID,
        @RequestBody(required = false) request: SignAgreementDetailsRequest?
    ): ResponseEntity<MemberAgreementResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val memberAgreement = agreementService.signAgreement(
            memberId = member.id,
            agreementId = agreementId,
            ipAddress = request?.ipAddress,
            userAgent = request?.userAgent,
            signatureData = request?.signatureData,
            healthData = request?.healthData
        )
        val agreement = agreementService.getAgreement(agreementId)
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
            .body(MemberAgreementResponse.from(memberAgreement, agreement))
    }

    /**
     * Sign multiple agreements at once.
     */
    @PostMapping("/agreements/bulk")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Sign multiple agreements", description = "Sign multiple agreements for the authenticated member")
    fun signMyAgreementsBulk(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: SignAgreementsRequest
    ): ResponseEntity<List<MemberAgreementResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        if (!validateMemberTenant(member, principal.userId)) {
            return ResponseEntity.notFound().build()
        }

        val memberAgreements = agreementService.signAgreements(
            memberId = member.id,
            agreementIds = request.agreementIds,
            ipAddress = request.ipAddress,
            userAgent = request.userAgent,
            signatureData = request.signatureData,
            healthData = request.healthData
        )
        val responses = memberAgreements.map { ma ->
            val agreement = agreementService.getAgreement(ma.agreementId)
            MemberAgreementResponse.from(ma, agreement)
        }
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(responses)
    }

    // ==================== SELF-SERVICE BOOKINGS ====================

    /**
     * Book a class session for the authenticated member.
     */
    @PostMapping("/bookings")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Book a session", description = "Book a class session for the authenticated member")
    fun bookSession(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: SelfServiceBookingRequest
    ): ResponseEntity<BookingLiteResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val command = com.liyaqa.scheduling.application.commands.CreateBookingCommand(
            sessionId = request.sessionId,
            memberId = member.id,
            subscriptionId = null,
            notes = request.notes,
            bookedBy = principal.userId
        )

        val booking = bookingService.createBooking(command)
        val session = classService.getSession(booking.sessionId)
        val gymClass = classService.getGymClass(session.gymClassId)

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(
            BookingLiteResponse.from(booking, session, gymClass)
        )
    }

    /**
     * Cancel a booking for the authenticated member.
     */
    @PostMapping("/bookings/{bookingId}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel a booking", description = "Cancel a booking for the authenticated member")
    fun cancelMyBooking(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @PathVariable bookingId: UUID
    ): ResponseEntity<Map<String, Any>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Verify the booking belongs to this member
        val booking = try {
            bookingService.getBooking(bookingId)
        } catch (e: NoSuchElementException) {
            return ResponseEntity.notFound().build()
        }

        if (booking.memberId != member.id) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(
                mapOf(
                    "success" to false,
                    "message" to "You can only cancel your own bookings",
                    "messageAr" to "يمكنك إلغاء حجوزاتك فقط"
                )
            )
        }

        val command = com.liyaqa.scheduling.application.commands.CancelBookingCommand(
            bookingId = bookingId,
            reason = "Cancelled by member"
        )
        bookingService.cancelBooking(command, principal.userId)

        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "message" to "Booking cancelled successfully",
                "messageAr" to "تم إلغاء الحجز بنجاح"
            )
        )
    }
}

// ==================== REQUEST/RESPONSE DTOs ====================

data class SelfServiceBookingRequest(
    @field:jakarta.validation.constraints.NotNull(message = "Session ID is required")
    val sessionId: UUID,
    val notes: String? = null
)

data class MyProfileResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val phone: String?,
    val dateOfBirth: LocalDate?,
    val address: AddressResponse?,
    val emergencyContactName: String?,
    val emergencyContactPhone: String?,
    val status: MemberStatus,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class AddressResponse(
    val street: String?,
    val city: String?,
    val state: String?,
    val postalCode: String?,
    val country: String?
)

data class UpdateMyProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    @field:DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    val dateOfBirth: LocalDate? = null,
    val street: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null
)

data class ChangePasswordRequest(
    @field:NotBlank(message = "Current password is required")
    val currentPassword: String,

    @field:NotBlank(message = "New password is required")
    @field:Size(min = 8, message = "New password must be at least 8 characters")
    val newPassword: String
)

data class MySubscriptionResponse(
    val hasSubscription: Boolean,
    val subscription: SubscriptionLiteResponse?
)
