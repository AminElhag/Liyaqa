package com.liyaqa.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun customOpenAPI(): OpenAPI {
        val securitySchemeName = "bearerAuth"

        return OpenAPI()
            .info(
                Info()
                    .title("Liyaqa Gym Management API")
                    .description("""
                        Backend API for Liyaqa Gym Management System.

                        ## Features
                        - **Authentication**: JWT-based authentication with refresh tokens
                        - **Organization Management**: Multi-tenant organization hierarchy (Organization > Club > Location)
                        - **Membership**: Members, plans, and subscriptions management
                        - **Attendance**: Check-in/check-out tracking
                        - **Billing**: Invoice generation with VAT support
                        - **Scheduling**: Class booking and session management
                        - **Notifications**: Email and SMS notifications

                        ## Multi-Tenancy
                        Most endpoints require tenant context via headers:
                        - `X-Tenant-ID`: Club UUID for tenant-level access
                        - `X-Organization-ID`: Organization UUID for org-level access

                        ## Localization
                        The API supports bilingual responses (English/Arabic) via:
                        - `locale` query parameter (default: `en`)
                        - User's preferred language setting
                    """.trimIndent())
                    .version("1.0.0")
                    .contact(
                        Contact()
                            .name("Liyaqa Support")
                            .email("support@liyaqa.com")
                    )
                    .license(
                        License()
                            .name("Proprietary")
                    )
            )
            .addSecurityItem(SecurityRequirement().addList(securitySchemeName))
            .components(
                Components()
                    .addSecuritySchemes(
                        securitySchemeName,
                        SecurityScheme()
                            .name(securitySchemeName)
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                            .description("Enter your JWT access token obtained from /api/auth/login")
                    )
                    .addSecuritySchemes(
                        "tenantId",
                        SecurityScheme()
                            .name("X-Tenant-ID")
                            .type(SecurityScheme.Type.APIKEY)
                            .`in`(SecurityScheme.In.HEADER)
                            .description("Club UUID for tenant-level access")
                    )
                    .addSecuritySchemes(
                        "organizationId",
                        SecurityScheme()
                            .name("X-Organization-ID")
                            .type(SecurityScheme.Type.APIKEY)
                            .`in`(SecurityScheme.In.HEADER)
                            .description("Organization UUID for org-level access")
                    )
            )
    }
}
