package com.liyaqa.platform.monitoring.service

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ErrorTrackingFilter(
    private val errorTrackingService: ErrorTrackingService
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        filterChain.doFilter(request, response)

        val status = response.status
        if (status in 400..599) {
            errorTrackingService.recordError(
                statusCode = status,
                uri = request.requestURI,
                exceptionType = request.getAttribute("jakarta.servlet.error.exception")
                    ?.let { (it as? Throwable)?.javaClass?.simpleName }
            )
        }
    }
}
