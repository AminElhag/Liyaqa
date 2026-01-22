package com.liyaqa.trainer.application.services

import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Security service for trainer authorization checks.
 *
 * Used in @PreAuthorize expressions to check if the current user
 * is the owner of a trainer profile.
 */
@Service("trainerSecurityService")
class TrainerSecurityService(
    private val trainerRepository: TrainerRepository
) {

    /**
     * Check if the current authenticated user owns the trainer profile.
     *
     * @param trainerId The trainer ID to check
     * @return true if the current user owns this trainer profile
     */
    fun isOwnProfile(trainerId: UUID): Boolean {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: return false

        val userId = try {
            UUID.fromString(authentication.name)
        } catch (e: Exception) {
            return false
        }

        return trainerRepository.findById(trainerId)
            .map { it.userId == userId }
            .orElse(false)
    }

    /**
     * Check if the current authenticated user is a trainer.
     *
     * @return true if the current user has a trainer profile
     */
    fun isTrainer(): Boolean {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: return false

        val userId = try {
            UUID.fromString(authentication.name)
        } catch (e: Exception) {
            return false
        }

        return trainerRepository.existsByUserId(userId)
    }

    /**
     * Get the trainer ID for the current authenticated user.
     *
     * @return The trainer ID if exists, null otherwise
     */
    fun getCurrentTrainerId(): UUID? {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: return null

        val userId = try {
            UUID.fromString(authentication.name)
        } catch (e: Exception) {
            return null
        }

        return trainerRepository.findByUserId(userId)
            .map { it.id }
            .orElse(null)
    }
}
