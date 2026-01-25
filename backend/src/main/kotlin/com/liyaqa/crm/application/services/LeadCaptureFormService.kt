package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.CreateLeadCaptureFormCommand
import com.liyaqa.crm.application.commands.CreateLeadCommand
import com.liyaqa.crm.application.commands.SubmitLeadFormCommand
import com.liyaqa.crm.application.commands.UpdateLeadCaptureFormCommand
import com.liyaqa.crm.domain.model.FormFieldType
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadCaptureForm
import com.liyaqa.crm.domain.model.LeadCaptureFormConfig
import com.liyaqa.crm.domain.model.LeadCaptureFormStyling
import com.liyaqa.crm.domain.ports.LeadCaptureFormRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class LeadCaptureFormService(
    private val formRepository: LeadCaptureFormRepository,
    private val leadService: LeadService
) {
    private val logger = LoggerFactory.getLogger(LeadCaptureFormService::class.java)

    /**
     * Create a new lead capture form.
     */
    fun createForm(command: CreateLeadCaptureFormCommand): LeadCaptureForm {
        // Validate slug uniqueness
        if (formRepository.existsBySlug(command.slug)) {
            throw IllegalArgumentException("A form with slug '${command.slug}' already exists")
        }

        // Validate slug format
        require(command.slug.matches(Regex("^[a-z0-9-]+$"))) {
            "Slug must contain only lowercase letters, numbers, and hyphens"
        }

        val form = LeadCaptureForm(
            name = command.name,
            slug = command.slug,
            description = command.description,
            config = command.config ?: LeadCaptureFormConfig(),
            styling = command.styling ?: LeadCaptureFormStyling(),
            redirectUrl = command.redirectUrl,
            thankYouMessageEn = command.thankYouMessageEn ?: "Thank you for your interest! We will contact you soon.",
            thankYouMessageAr = command.thankYouMessageAr ?: "شكراً لاهتمامك! سنتواصل معك قريباً."
        )

        logger.info("Created lead capture form: ${form.id} with slug ${form.slug}")
        return formRepository.save(form)
    }

    /**
     * Get a form by ID.
     */
    @Transactional(readOnly = true)
    fun getForm(id: UUID): LeadCaptureForm {
        return formRepository.findById(id)
            .orElseThrow { NoSuchElementException("Form not found: $id") }
    }

    /**
     * Get a form by slug.
     */
    @Transactional(readOnly = true)
    fun getFormBySlug(slug: String): LeadCaptureForm {
        return formRepository.findBySlug(slug)
            .orElseThrow { NoSuchElementException("Form not found: $slug") }
    }

    /**
     * Get an active form by slug (for public submission).
     */
    @Transactional(readOnly = true)
    fun getActiveFormBySlug(slug: String): LeadCaptureForm {
        return formRepository.findActiveBySlug(slug)
            .orElseThrow { NoSuchElementException("Form not found or inactive: $slug") }
    }

    /**
     * Get all forms with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllForms(pageable: Pageable): Page<LeadCaptureForm> {
        return formRepository.findAll(pageable)
    }

    /**
     * Search forms.
     */
    @Transactional(readOnly = true)
    fun searchForms(
        search: String?,
        isActive: Boolean?,
        pageable: Pageable
    ): Page<LeadCaptureForm> {
        return formRepository.search(search, isActive, pageable)
    }

    /**
     * Update a form.
     */
    fun updateForm(id: UUID, command: UpdateLeadCaptureFormCommand): LeadCaptureForm {
        val form = getForm(id)

        command.name?.let { form.name = it }
        command.description?.let { form.description = it }
        command.config?.let { form.config = it }
        command.styling?.let { form.styling = it }
        command.redirectUrl?.let { form.redirectUrl = it }
        command.thankYouMessageEn?.let { form.thankYouMessageEn = it }
        command.thankYouMessageAr?.let { form.thankYouMessageAr = it }

        logger.info("Updated lead capture form: ${form.id}")
        return formRepository.save(form)
    }

    /**
     * Activate a form.
     */
    fun activateForm(id: UUID): LeadCaptureForm {
        val form = getForm(id)
        form.activate()
        logger.info("Activated lead capture form: ${form.id}")
        return formRepository.save(form)
    }

    /**
     * Deactivate a form.
     */
    fun deactivateForm(id: UUID): LeadCaptureForm {
        val form = getForm(id)
        form.deactivate()
        logger.info("Deactivated lead capture form: ${form.id}")
        return formRepository.save(form)
    }

    /**
     * Delete a form.
     */
    fun deleteForm(id: UUID) {
        if (!formRepository.existsById(id)) {
            throw NoSuchElementException("Form not found: $id")
        }
        formRepository.deleteById(id)
        logger.info("Deleted lead capture form: $id")
    }

    /**
     * Submit a form and create a lead.
     */
    fun submitForm(command: SubmitLeadFormCommand): Lead {
        // Find the form
        val form = when {
            command.formId != null -> getForm(command.formId)
            command.formSlug != null -> getActiveFormBySlug(command.formSlug)
            else -> throw IllegalArgumentException("Either formId or formSlug required")
        }

        // Validate required fields
        validateFormSubmission(form, command.data)

        // Extract standard lead fields from submitted data
        val firstName = command.data["firstName"]?.toString() ?: ""
        val lastName = command.data["lastName"]?.toString() ?: ""
        val email = command.data["email"]?.toString()
            ?: throw IllegalArgumentException("Email is required")
        val phone = command.data["phone"]?.toString()

        // Build notes from additional fields
        val additionalNotes = buildNotesFromExtraFields(form, command.data)

        // Create the lead
        val createLeadCommand = CreateLeadCommand(
            name = "$firstName $lastName".trim(),
            email = email,
            phone = phone,
            source = form.config.defaultSource,
            assignedToUserId = if (form.config.autoAssign) form.config.assignToUserId else null,
            notes = additionalNotes.ifEmpty { null },
            campaignSource = command.utmSource,
            campaignMedium = command.utmMedium,
            campaignName = command.utmCampaign,
            formId = form.id
        )

        val lead = leadService.createLead(createLeadCommand)
        logger.info("Created lead ${lead.id} from form ${form.id}")

        // TODO: Send notification if configured
        if (form.config.notifyOnSubmission) {
            logger.debug("Form ${form.id} has notifications enabled")
            // notificationService.notifyFormSubmission(form, lead)
        }

        return lead
    }

    /**
     * Validate that all required fields are present.
     */
    private fun validateFormSubmission(form: LeadCaptureForm, data: Map<String, Any>) {
        val missingFields = form.config.fields
            .filter { it.required }
            .filter { field ->
                val value = data[field.name]
                value == null || value.toString().isBlank()
            }
            .map { it.name }

        if (missingFields.isNotEmpty()) {
            throw IllegalArgumentException("Missing required fields: ${missingFields.joinToString(", ")}")
        }

        // Validate email format if present
        val email = data["email"]?.toString()
        if (email != null && !email.matches(Regex("^[^@]+@[^@]+\\.[^@]+$"))) {
            throw IllegalArgumentException("Invalid email format")
        }
    }

    /**
     * Build notes string from extra fields not mapped to standard Lead properties.
     */
    private fun buildNotesFromExtraFields(form: LeadCaptureForm, data: Map<String, Any>): String {
        val standardFields = setOf("firstName", "lastName", "email", "phone")
        val extraFields = data.filter { it.key !in standardFields && it.value.toString().isNotBlank() }

        if (extraFields.isEmpty()) return ""

        return extraFields.entries.joinToString("\n") { (key, value) ->
            val field = form.config.fields.find { it.name == key }
            val label = field?.label?.en ?: key
            "$label: $value"
        }
    }

    /**
     * Get top performing forms by submission count.
     */
    @Transactional(readOnly = true)
    fun getTopForms(limit: Int = 5): List<LeadCaptureForm> {
        return formRepository.findTopBySubmissions(limit)
    }

    /**
     * Generate embed code for a form.
     */
    @Transactional(readOnly = true)
    fun generateEmbedCode(id: UUID, baseUrl: String): String {
        val form = getForm(id)
        return form.generateEmbedCode(baseUrl)
    }
}
