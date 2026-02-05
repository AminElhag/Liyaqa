package com.liyaqa.membership.application.services

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.domain.model.Address
import com.liyaqa.membership.domain.model.Language
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.referral.application.services.ReferralCodeService
import com.liyaqa.referral.application.services.ReferralTrackingService
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.exception.DuplicateField
import com.liyaqa.shared.exception.DuplicateFieldException
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class MemberService(
    private val memberRepository: MemberRepository,
    private val notificationService: NotificationService,
    private val memberHealthService: MemberHealthService,
    private val agreementService: AgreementService,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val permissionService: PermissionService,
    private val webhookPublisher: WebhookEventPublisher,
    private val referralCodeService: ReferralCodeService,
    private val referralTrackingService: ReferralTrackingService,
    private val refreshTokenRepository: RefreshTokenRepository
) {
    private val logger = LoggerFactory.getLogger(MemberService::class.java)

    fun createMember(command: CreateMemberCommand): Member {
        // Validate uniqueness for all fields
        validateUniquenessForCreate(
            email = command.email,
            phone = command.phone,
            nationalId = command.nationalId
        )

        val member = Member(
            firstName = command.firstName,
            lastName = command.lastName,
            email = command.email,
            phone = command.phone,
            dateOfBirth = command.dateOfBirth,
            address = command.address?.let {
                Address(street = it.en, city = it.ar)  // Temporary simple mapping
            },
            emergencyContactName = command.emergencyContactName,
            emergencyContactPhone = command.emergencyContactPhone,
            notes = command.notes,
            status = MemberStatus.ACTIVE,
            // Enhanced registration fields
            gender = command.gender,
            nationality = command.nationality,
            nationalId = command.nationalId,
            registrationNotes = command.registrationNotes,
            preferredLanguage = command.preferredLanguage
        )

        val savedMember = memberRepository.save(member)

        // Create health info if provided
        command.healthInfo?.let { healthInfo ->
            try {
                memberHealthService.createOrUpdateHealth(
                    memberId = savedMember.id,
                    hasHeartCondition = healthInfo.hasHeartCondition,
                    hasChestPainDuringActivity = healthInfo.hasChestPainDuringActivity,
                    hasChestPainAtRest = healthInfo.hasChestPainAtRest,
                    hasDizzinessOrBalance = healthInfo.hasDizzinessOrBalance,
                    hasBoneJointProblem = healthInfo.hasBoneJointProblem,
                    takesBloodPressureMedication = healthInfo.takesBloodPressureMedication,
                    hasOtherReasonNotToExercise = healthInfo.hasOtherReasonNotToExercise,
                    medicalConditions = healthInfo.medicalConditions,
                    allergies = healthInfo.allergies,
                    currentMedications = healthInfo.currentMedications,
                    injuriesAndLimitations = healthInfo.injuriesAndLimitations,
                    bloodType = healthInfo.bloodType,
                    emergencyMedicalNotes = healthInfo.emergencyMedicalNotes,
                    doctorName = healthInfo.doctorName,
                    doctorPhone = healthInfo.doctorPhone,
                    medicalClearanceDate = healthInfo.medicalClearanceDate
                )
                logger.info("Created health info for member ${savedMember.id}")
            } catch (e: Exception) {
                logger.error("Failed to create health info for member ${savedMember.id}: ${e.message}", e)
            }
        }

        // Sign agreements if provided
        command.agreementIds?.let { agreementIds ->
            if (agreementIds.isNotEmpty()) {
                try {
                    agreementService.signAgreements(
                        memberId = savedMember.id,
                        agreementIds = agreementIds,
                        ipAddress = command.ipAddress,
                        userAgent = command.userAgent,
                        signatureData = command.signatureData,
                        healthData = command.healthInfo?.let {
                            // Serialize health data for agreements that require it
                            """{"parq":{"hasHeartCondition":${it.hasHeartCondition},"hasChestPainDuringActivity":${it.hasChestPainDuringActivity},"hasChestPainAtRest":${it.hasChestPainAtRest},"hasDizzinessOrBalance":${it.hasDizzinessOrBalance},"hasBoneJointProblem":${it.hasBoneJointProblem},"takesBloodPressureMedication":${it.takesBloodPressureMedication},"hasOtherReasonNotToExercise":${it.hasOtherReasonNotToExercise}}}"""
                        }
                    )
                    logger.info("Signed ${agreementIds.size} agreements for member ${savedMember.id}")
                } catch (e: Exception) {
                    logger.error("Failed to sign agreements for member ${savedMember.id}: ${e.message}", e)
                }
            }
        }

        // Send welcome notification
        try {
            sendWelcomeNotification(savedMember)
        } catch (e: Exception) {
            logger.error("Failed to send welcome notification for member ${savedMember.id}: ${e.message}", e)
        }

        // Track referral if code provided
        command.referralCode?.let { code ->
            try {
                val referral = referralTrackingService.trackClick(code)
                if (referral != null) {
                    referralTrackingService.markSignedUp(referral.id, savedMember.id)
                    logger.info("Tracked referral for member ${savedMember.id} with code $code")
                }
            } catch (e: Exception) {
                logger.error("Failed to track referral for member ${savedMember.id}: ${e.message}", e)
            }
        }

        // Auto-generate referral code for the new member
        try {
            referralCodeService.getOrCreateCode(savedMember.id)
            logger.info("Generated referral code for member ${savedMember.id}")
        } catch (e: Exception) {
            logger.error("Failed to generate referral code for member ${savedMember.id}: ${e.message}", e)
        }

        // Publish webhook event
        try {
            webhookPublisher.publishMemberCreated(savedMember)
        } catch (e: Exception) {
            logger.error("Failed to publish member created webhook for member ${savedMember.id}: ${e.message}", e)
        }

        return savedMember
    }

    @Transactional(readOnly = true)
    fun getMember(id: UUID): Member {
        return memberRepository.findById(id)
            .orElseThrow { NoSuchElementException("Member not found with id: $id") }
    }

    @Transactional(readOnly = true)
    fun getMemberByEmail(email: String): Member {
        return memberRepository.findByEmail(email)
            .orElseThrow { NoSuchElementException("Member not found with email: $email") }
    }

    @Transactional(readOnly = true)
    fun getMemberByUserId(userId: UUID): Member {
        return memberRepository.findByUserId(userId)
            .orElseThrow { NoSuchElementException("Member not found for user: $userId") }
    }

    @Transactional(readOnly = true)
    fun findMemberByUserId(userId: UUID): Member? {
        return memberRepository.findByUserId(userId).orElse(null)
    }

    @Transactional(readOnly = true)
    fun getAllMembers(pageable: Pageable): Page<Member> {
        return memberRepository.findAll(pageable)
    }

    /**
     * Search members with filters.
     */
    @Transactional(readOnly = true)
    fun searchMembers(
        search: String?,
        status: MemberStatus?,
        joinedAfter: LocalDate?,
        joinedBefore: LocalDate?,
        pageable: Pageable
    ): Page<Member> {
        return memberRepository.search(search, status, joinedAfter, joinedBefore, pageable)
    }

    fun updateMember(id: UUID, command: UpdateMemberCommand): Member {
        val member = getMember(id)

        // Defense-in-depth: Double-check tenant isolation
        val currentTenantId = TenantContext.getCurrentTenant()?.value
        require(member.tenantId == currentTenantId) {
            "Security violation: Member belongs to different tenant"
        }

        // Validate uniqueness for updated fields (excluding current member)
        validateUniquenessForUpdate(
            memberId = id,
            email = null, // Email updates not supported through this command
            phone = command.phone,
            nationalId = command.nationalId
        )

        command.firstName?.let { member.firstName = it }
        command.lastName?.let { member.lastName = it }
        command.phone?.let { member.phone = it }
        command.dateOfBirth?.let { member.dateOfBirth = it }
        command.emergencyContactName?.let { member.emergencyContactName = it }
        command.emergencyContactPhone?.let { member.emergencyContactPhone = it }
        command.notes?.let { member.notes = it }
        command.address?.let {
            member.address = Address(street = it.en, city = it.ar)
        }
        // Enhanced fields
        command.gender?.let { member.gender = it }
        command.nationality?.let { member.nationality = it }
        command.nationalId?.let { member.nationalId = it }
        command.registrationNotes?.let { member.registrationNotes = it }
        command.preferredLanguage?.let { member.preferredLanguage = it }

        val savedMember = memberRepository.save(member)

        // Publish webhook event
        try {
            webhookPublisher.publishMemberUpdated(savedMember)
        } catch (e: Exception) {
            logger.error("Failed to publish member updated webhook for member ${savedMember.id}: ${e.message}", e)
        }

        return savedMember
    }

    fun suspendMember(id: UUID): Member {
        val member = getMember(id)
        member.suspend()
        return memberRepository.save(member)
    }

    fun activateMember(id: UUID): Member {
        val member = getMember(id)
        member.activate()
        return memberRepository.save(member)
    }

    fun freezeMember(id: UUID): Member {
        val member = getMember(id)
        member.freeze()
        return memberRepository.save(member)
    }

    fun unfreezeMember(id: UUID): Member {
        val member = getMember(id)
        member.unfreeze()
        return memberRepository.save(member)
    }

    fun cancelMember(id: UUID): Member {
        val member = getMember(id)
        member.cancel()
        return memberRepository.save(member)
    }

    fun deleteMember(id: UUID) {
        val member = getMember(id)
        val tenantId = member.tenantId
        memberRepository.deleteById(id)

        // Publish webhook event
        try {
            webhookPublisher.publishMemberDeleted(id, tenantId)
        } catch (e: Exception) {
            logger.error("Failed to publish member deleted webhook for member $id: ${e.message}", e)
        }
    }

    @Transactional(readOnly = true)
    fun countMembers(): Long {
        return memberRepository.count()
    }

    @Transactional(readOnly = true)
    fun countMembersByStatus(status: MemberStatus): Long {
        return memberRepository.countByStatus(status)
    }

    // ==================== USER ACCOUNT MANAGEMENT ====================

    /**
     * Creates a user account for a member.
     * The user will have MEMBER role and can log in to access member features.
     */
    fun createUserForMember(memberId: UUID, password: String): User {
        val member = getMember(memberId)

        require(!member.hasUserAccount()) {
            "Member already has a user account"
        }

        require(!userRepository.existsByEmailAndTenantId(member.email, member.tenantId)) {
            "A user with email ${member.email} already exists"
        }

        val displayName = LocalizedText(
            en = "${member.firstName.en} ${member.lastName.en}",
            ar = member.firstName.ar?.let { "${it} ${member.lastName.ar ?: ""}" }
        )

        val user = User(
            email = member.email,
            passwordHash = passwordEncoder.encode(password)!!,
            displayName = displayName,
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )

        val savedUser = userRepository.save(user)

        // Grant default permissions for the member role
        permissionService.grantDefaultPermissionsForRole(savedUser.id, savedUser.role.name)

        // Link the member to the user
        member.linkToUser(savedUser.id)
        memberRepository.save(member)

        logger.info("Created user account ${savedUser.id} for member $memberId")
        return savedUser
    }

    /**
     * Unlinks a member from their user account.
     * Does not delete the user account.
     */
    fun unlinkUserFromMember(memberId: UUID): Member {
        val member = getMember(memberId)
        member.unlinkUser()
        return memberRepository.save(member)
    }

    /**
     * Links an existing user to a member.
     * Use this when a user already exists and you want to link them to a member record.
     */
    fun linkUserToMember(memberId: UUID, userId: UUID): Member {
        val member = getMember(memberId)

        require(!member.hasUserAccount()) {
            "Member already has a user account"
        }

        // Verify user exists
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        // Verify emails match
        require(user.email == member.email) {
            "User email (${user.email}) does not match member email (${member.email})"
        }

        member.linkToUser(userId)
        logger.info("Linked user $userId to member $memberId")
        return memberRepository.save(member)
    }

    /**
     * Resets a member's password (admin action).
     * Sets a new password and revokes all refresh tokens for security.
     */
    fun resetMemberPassword(memberId: UUID, newPassword: String) {
        val member = getMember(memberId)
        val userId = member.userId
            ?: throw IllegalStateException("Member does not have a user account")

        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found") }

        user.changePassword(passwordEncoder.encode(newPassword) ?: throw IllegalStateException("Failed to encode password"))
        userRepository.save(user)

        // Revoke all refresh tokens for security
        refreshTokenRepository.revokeAllByUserId(userId)

        logger.info("Reset password for member $memberId (user $userId)")
    }

    // ==================== NOTIFICATION HELPERS ====================

    private fun sendWelcomeNotification(member: Member) {
        val subject = LocalizedText(
            en = "Welcome to Liyaqa!",
            ar = "مرحباً بك في لياقة!"
        )

        val body = LocalizedText(
            en = """
                <h2>Welcome to Liyaqa!</h2>
                <p>Dear ${member.fullName.get("en")},</p>
                <p>We are thrilled to have you as a member of our fitness family!</p>
                <p>Your membership journey starts now. Here's what you can do:</p>
                <ul>
                    <li>Book classes and training sessions</li>
                    <li>Track your attendance and progress</li>
                    <li>Manage your subscription and invoices</li>
                </ul>
                <p>If you have any questions, our team is always here to help.</p>
                <p>Let's achieve your fitness goals together!</p>
                <p>Best regards,<br>The Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>مرحباً بك في لياقة!</h2>
                <p>عزيزي ${member.fullName.get("ar")}،</p>
                <p>يسعدنا انضمامك إلى عائلة اللياقة البدنية لدينا!</p>
                <p>تبدأ رحلة عضويتك الآن. إليك ما يمكنك القيام به:</p>
                <ul>
                    <li>حجز الحصص والجلسات التدريبية</li>
                    <li>تتبع حضورك وتقدمك</li>
                    <li>إدارة اشتراكك وفواتيرك</li>
                </ul>
                <p>إذا كان لديك أي أسئلة، فريقنا دائماً هنا لمساعدتك.</p>
                <p>دعونا نحقق أهداف لياقتك معاً!</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendMultiChannel(
            memberId = member.id,
            email = member.email,
            phone = member.phone,
            type = NotificationType.WELCOME,
            subject = subject,
            body = body,
            priority = NotificationPriority.NORMAL,
            referenceId = member.id,
            referenceType = "member"
        )
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk suspend members.
     * Uses batch fetch to avoid N+1 queries.
     * @return Map of member ID to success/failure status
     */
    fun bulkSuspendMembers(memberIds: List<UUID>): Map<UUID, Result<Member>> {
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }
        return memberIds.associateWith { id ->
            runCatching {
                val member = members[id] ?: throw NoSuchElementException("Member not found: $id")
                member.suspend()
                memberRepository.save(member)
            }
        }
    }

    /**
     * Bulk activate members.
     * Uses batch fetch to avoid N+1 queries.
     * @return Map of member ID to success/failure status
     */
    fun bulkActivateMembers(memberIds: List<UUID>): Map<UUID, Result<Member>> {
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }
        return memberIds.associateWith { id ->
            runCatching {
                val member = members[id] ?: throw NoSuchElementException("Member not found: $id")
                member.activate()
                memberRepository.save(member)
            }
        }
    }

    /**
     * Bulk freeze members.
     * Uses batch fetch to avoid N+1 queries.
     * @return Map of member ID to success/failure status
     */
    fun bulkFreezeMembers(memberIds: List<UUID>): Map<UUID, Result<Member>> {
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }
        return memberIds.associateWith { id ->
            runCatching {
                val member = members[id] ?: throw NoSuchElementException("Member not found: $id")
                member.freeze()
                memberRepository.save(member)
            }
        }
    }

    /**
     * Bulk unfreeze members.
     * Uses batch fetch to avoid N+1 queries.
     * @return Map of member ID to success/failure status
     */
    fun bulkUnfreezeMembers(memberIds: List<UUID>): Map<UUID, Result<Member>> {
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }
        return memberIds.associateWith { id ->
            runCatching {
                val member = members[id] ?: throw NoSuchElementException("Member not found: $id")
                member.unfreeze()
                memberRepository.save(member)
            }
        }
    }

    /**
     * Bulk cancel members.
     * Uses batch fetch to avoid N+1 queries.
     * @return Map of member ID to success/failure status
     */
    fun bulkCancelMembers(memberIds: List<UUID>): Map<UUID, Result<Member>> {
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }
        return memberIds.associateWith { id ->
            runCatching {
                val member = members[id] ?: throw NoSuchElementException("Member not found: $id")
                member.cancel()
                memberRepository.save(member)
            }
        }
    }

    /**
     * Bulk delete members.
     * @return Map of member ID to success/failure status
     */
    fun bulkDeleteMembers(memberIds: List<UUID>): Map<UUID, Result<Unit>> {
        return memberIds.associateWith { id ->
            runCatching {
                memberRepository.deleteById(id)
            }
        }
    }

    // ==================== UNIQUENESS VALIDATION ====================

    /**
     * Validates uniqueness constraints for creating a new member.
     * Checks email, phone, and nationalId against existing members.
     * @throws DuplicateFieldException if any field already exists
     */
    private fun validateUniquenessForCreate(
        email: String,
        phone: String?,
        nationalId: String?
    ) {
        // Email is always required and must be unique
        if (memberRepository.existsByEmail(email)) {
            throw DuplicateFieldException(
                field = DuplicateField.EMAIL,
                message = "A member with this email already exists"
            )
        }

        // Phone must be unique if provided and not blank
        if (!phone.isNullOrBlank() && memberRepository.existsByPhone(phone)) {
            throw DuplicateFieldException(
                field = DuplicateField.PHONE,
                message = "A member with this phone number already exists"
            )
        }

        // National ID must be unique if provided and not blank
        if (!nationalId.isNullOrBlank() && memberRepository.existsByNationalId(nationalId)) {
            throw DuplicateFieldException(
                field = DuplicateField.NATIONAL_ID,
                message = "A member with this national ID already exists"
            )
        }
    }

    /**
     * Validates uniqueness constraints for updating an existing member.
     * Excludes the member being updated from the uniqueness check.
     * @throws DuplicateFieldException if any field conflicts with another member
     */
    private fun validateUniquenessForUpdate(
        memberId: UUID,
        email: String?,
        phone: String?,
        nationalId: String?
    ) {
        // Email must be unique if being changed
        if (!email.isNullOrBlank() && memberRepository.existsByEmailAndIdNot(email, memberId)) {
            throw DuplicateFieldException(
                field = DuplicateField.EMAIL,
                message = "A member with this email already exists"
            )
        }

        // Phone must be unique if provided and not blank
        if (!phone.isNullOrBlank() && memberRepository.existsByPhoneAndIdNot(phone, memberId)) {
            throw DuplicateFieldException(
                field = DuplicateField.PHONE,
                message = "A member with this phone number already exists"
            )
        }

        // National ID must be unique if provided and not blank
        if (!nationalId.isNullOrBlank() && memberRepository.existsByNationalIdAndIdNot(nationalId, memberId)) {
            throw DuplicateFieldException(
                field = DuplicateField.NATIONAL_ID,
                message = "A member with this national ID already exists"
            )
        }
    }
}
