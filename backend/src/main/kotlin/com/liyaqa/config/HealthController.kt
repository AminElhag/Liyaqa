package com.liyaqa.config

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/health")
class HealthController {

    @GetMapping
    fun health(): ResponseEntity<HealthResponse> {
        return ResponseEntity.ok(
            HealthResponse(
                status = "UP",
                timestamp = Instant.now(),
                service = "liyaqa-backend",
                version = "0.0.1-SNAPSHOT"
            )
        )
    }
}

data class HealthResponse(
    val status: String,
    val timestamp: Instant,
    val service: String,
    val version: String
)
