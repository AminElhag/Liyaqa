package com.liyaqa.liyaqa_internal_app.core.domain

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

/**
 * Base class for all use cases.
 * Follows clean architecture principles with separation of concerns.
 * Inspired by backend's service layer pattern.
 */
abstract class BaseUseCase<in Params, out T>(
    private val dispatcher: CoroutineDispatcher = Dispatchers.Default
) {
    /**
     * Execute the use case with given parameters
     */
    suspend operator fun invoke(params: Params): Result<T> {
        return try {
            withContext(dispatcher) {
                execute(params)
            }
        } catch (e: Exception) {
            Result.Error(e, e.message)
        }
    }

    /**
     * Override this method to implement the use case logic
     */
    protected abstract suspend fun execute(params: Params): Result<T>
}

/**
 * Base class for use cases that don't require parameters
 */
abstract class BaseUseCaseNoParams<out T>(
    private val dispatcher: CoroutineDispatcher = Dispatchers.Default
) {
    suspend operator fun invoke(): Result<T> {
        return try {
            withContext(dispatcher) {
                execute()
            }
        } catch (e: Exception) {
            Result.Error(e, e.message)
        }
    }

    protected abstract suspend fun execute(): Result<T>
}

/**
 * Base class for use cases that return Flow (for real-time updates)
 */
abstract class BaseFlowUseCase<in Params, out T>(
    private val dispatcher: CoroutineDispatcher = Dispatchers.Default
) {
    operator fun invoke(params: Params): Flow<Result<T>> {
        return execute(params)
            .catch { e -> emit(Result.Error(e as Throwable, e.message)) }
            .flowOn(dispatcher)
    }

    protected abstract fun execute(params: Params): Flow<Result<T>>
}
