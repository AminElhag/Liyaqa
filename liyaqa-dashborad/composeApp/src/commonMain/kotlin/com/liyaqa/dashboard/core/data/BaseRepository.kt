package com.liyaqa.dashboard.core.data

import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.network.toApiException
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Base repository class providing common API call patterns.
 * Follows backend's service layer pattern with consistent error handling.
 */
abstract class BaseRepository(
    protected val httpClient: HttpClient
) {

    /**
     * Safe API call wrapper with automatic error handling
     */
    protected suspend fun <T> safeApiCall(
        apiCall: suspend () -> T
    ): Result<T> {
        return try {
            Result.Success(apiCall())
        } catch (e: Exception) {
            Result.Error(
                exception = e.toApiException(),
                message = e.message
            )
        }
    }

    /**
     * Make a GET request
     */
    protected suspend inline fun <reified T> get(
        path: String,
        parameters: Map<String, Any?> = emptyMap(),
        headers: Map<String, String> = emptyMap()
    ): Result<T> = safeApiCall {
        httpClient.get(path) {
            parameters.forEach { (key, value) ->
                parameter(key, value)
            }
            headers.forEach { (key, value) ->
                header(key, value)
            }
        }.body()
    }

    /**
     * Make a POST request
     */
    protected suspend inline fun <reified T, reified R> post(
        path: String,
        body: R,
        headers: Map<String, String> = emptyMap()
    ): Result<T> = safeApiCall {
        httpClient.post(path) {
            contentType(ContentType.Application.Json)
            setBody(body)
            headers.forEach { (key, value) ->
                header(key, value)
            }
        }.body()
    }

    /**
     * Make a PUT request
     */
    protected suspend inline fun <reified T, reified R> put(
        path: String,
        body: R,
        headers: Map<String, String> = emptyMap()
    ): Result<T> = safeApiCall {
        httpClient.put(path) {
            contentType(ContentType.Application.Json)
            setBody(body)
            headers.forEach { (key, value) ->
                header(key, value)
            }
        }.body()
    }

    /**
     * Make a DELETE request
     */
    protected suspend inline fun <reified T> delete(
        path: String,
        headers: Map<String, String> = emptyMap()
    ): Result<T> = safeApiCall {
        httpClient.delete(path) {
            headers.forEach { (key, value) ->
                header(key, value)
            }
        }.body()
    }

    /**
     * Make a PATCH request
     */
    protected suspend inline fun <reified T, reified R> patch(
        path: String,
        body: R,
        headers: Map<String, String> = emptyMap()
    ): Result<T> = safeApiCall {
        httpClient.patch(path) {
            contentType(ContentType.Application.Json)
            setBody(body)
            headers.forEach { (key, value) ->
                header(key, value)
            }
        }.body()
    }

    /**
     * Flow-based API call for reactive updates
     */
    protected fun <T> flowApiCall(
        apiCall: suspend () -> Result<T>
    ): Flow<Result<T>> = flow {
        emit(Result.Loading)
        emit(apiCall())
    }
}
