package com.liyaqa.member.data.api

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Unit tests for [ApiResult] and its extensions.
 *
 * Tests cover:
 * - ApiResult state properties (isSuccess, isError)
 * - Data access methods (getOrNull, getOrThrow, getOrDefault, getOrElse)
 * - Transformation methods (map, flatMap)
 * - Callback methods (onSuccess, onError, onNetworkError, onFailure)
 * - toResult() extension for repository pattern
 * - ApiException creation
 */
class ApiResultTest {

    // ==================== State Properties ====================

    @Test
    fun `Success isSuccess returns true`() {
        val result: ApiResult<String> = ApiResult.Success("data")

        assertTrue(result.isSuccess)
        assertFalse(result.isError)
    }

    @Test
    fun `Error isError returns true`() {
        val result: ApiResult<String> = ApiResult.Error(404, "Not found")

        assertFalse(result.isSuccess)
        assertTrue(result.isError)
    }

    @Test
    fun `NetworkError isError returns true`() {
        val result: ApiResult<String> = ApiResult.NetworkError(RuntimeException("Network failed"))

        assertFalse(result.isSuccess)
        assertTrue(result.isError)
    }

    // ==================== Data Access Methods ====================

    @Test
    fun `getOrNull returns data for Success`() {
        val result: ApiResult<String> = ApiResult.Success("test data")

        assertEquals("test data", result.getOrNull())
    }

    @Test
    fun `getOrNull returns null for Error`() {
        val result: ApiResult<String> = ApiResult.Error(500, "Server error")

        assertNull(result.getOrNull())
    }

    @Test
    fun `getOrNull returns null for NetworkError`() {
        val result: ApiResult<String> = ApiResult.NetworkError(RuntimeException())

        assertNull(result.getOrNull())
    }

    @Test
    fun `getOrThrow returns data for Success`() {
        val result: ApiResult<String> = ApiResult.Success("success data")

        assertEquals("success data", result.getOrThrow())
    }

    @Test
    fun `getOrThrow throws ApiException for Error`() {
        val result: ApiResult<String> = ApiResult.Error(401, "Unauthorized")

        try {
            result.getOrThrow()
            assertTrue(false, "Should have thrown")
        } catch (e: ApiException) {
            assertEquals(401, e.code)
            assertEquals("Unauthorized", e.message)
        }
    }

    @Test
    fun `getOrThrow throws original exception for NetworkError`() {
        val originalException = RuntimeException("Connection lost")
        val result: ApiResult<String> = ApiResult.NetworkError(originalException)

        try {
            result.getOrThrow()
            assertTrue(false, "Should have thrown")
        } catch (e: RuntimeException) {
            assertEquals("Connection lost", e.message)
        }
    }

    @Test
    fun `getOrDefault returns data for Success`() {
        val result: ApiResult<String> = ApiResult.Success("actual")

        assertEquals("actual", result.getOrDefault("default"))
    }

    @Test
    fun `getOrDefault returns default for Error`() {
        val result: ApiResult<String> = ApiResult.Error(404, "Not found")

        assertEquals("default", result.getOrDefault("default"))
    }

    @Test
    fun `getOrDefault returns default for NetworkError`() {
        val result: ApiResult<String> = ApiResult.NetworkError(RuntimeException())

        assertEquals("fallback", result.getOrDefault("fallback"))
    }

    @Test
    fun `getOrElse returns data for Success`() {
        val result: ApiResult<String> = ApiResult.Success("success")

        assertEquals("success", result.getOrElse { "else value" })
    }

    @Test
    fun `getOrElse returns block result for Error`() {
        val result: ApiResult<String> = ApiResult.Error(500, "Error")

        val value = result.getOrElse { error ->
            assertIs<ApiResult.Error>(error)
            "recovered from ${(error as ApiResult.Error).code}"
        }
        assertEquals("recovered from 500", value)
    }

    @Test
    fun `getOrElse returns block result for NetworkError`() {
        val result: ApiResult<String> = ApiResult.NetworkError(RuntimeException("net error"))

        val value = result.getOrElse { error ->
            assertIs<ApiResult.NetworkError>(error)
            "network recovery"
        }
        assertEquals("network recovery", value)
    }

    // ==================== Transformation Methods ====================

    @Test
    fun `map transforms Success data`() {
        val result: ApiResult<Int> = ApiResult.Success(5)

        val mapped = result.map { it * 2 }

        assertIs<ApiResult.Success<Int>>(mapped)
        assertEquals(10, mapped.data)
    }

    @Test
    fun `map preserves Error`() {
        val result: ApiResult<Int> = ApiResult.Error(400, "Bad request")

        val mapped = result.map { it * 2 }

        assertIs<ApiResult.Error>(mapped)
        assertEquals(400, mapped.code)
    }

    @Test
    fun `map preserves NetworkError`() {
        val result: ApiResult<Int> = ApiResult.NetworkError(RuntimeException("Failed"))

        val mapped = result.map { it * 2 }

        assertIs<ApiResult.NetworkError>(mapped)
    }

    @Test
    fun `flatMap transforms Success to new ApiResult`() {
        val result: ApiResult<Int> = ApiResult.Success(10)

        val flatMapped = result.flatMap { ApiResult.Success(it.toString()) }

        assertIs<ApiResult.Success<String>>(flatMapped)
        assertEquals("10", flatMapped.data)
    }

    @Test
    fun `flatMap can return Error from Success`() {
        val result: ApiResult<Int> = ApiResult.Success(0)

        val flatMapped = result.flatMap { value ->
            if (value == 0) ApiResult.Error(400, "Cannot be zero")
            else ApiResult.Success(value)
        }

        assertIs<ApiResult.Error>(flatMapped)
        assertEquals("Cannot be zero", flatMapped.message)
    }

    @Test
    fun `flatMap preserves Error`() {
        val result: ApiResult<Int> = ApiResult.Error(404, "Not found")

        val flatMapped = result.flatMap { ApiResult.Success(it.toString()) }

        assertIs<ApiResult.Error>(flatMapped)
        assertEquals(404, flatMapped.code)
    }

    // ==================== Callback Methods ====================

    @Test
    fun `onSuccess executes block for Success`() {
        val result: ApiResult<String> = ApiResult.Success("data")
        var called = false

        result.onSuccess {
            called = true
            assertEquals("data", it)
        }

        assertTrue(called)
    }

    @Test
    fun `onSuccess does not execute block for Error`() {
        val result: ApiResult<String> = ApiResult.Error(500, "Error")
        var called = false

        result.onSuccess { called = true }

        assertFalse(called)
    }

    @Test
    fun `onError executes block for Error`() {
        val result: ApiResult<String> = ApiResult.Error(403, "Forbidden")
        var called = false

        result.onError { error ->
            called = true
            assertEquals(403, error.code)
            assertEquals("Forbidden", error.message)
        }

        assertTrue(called)
    }

    @Test
    fun `onError does not execute block for Success`() {
        val result: ApiResult<String> = ApiResult.Success("ok")
        var called = false

        result.onError { called = true }

        assertFalse(called)
    }

    @Test
    fun `onNetworkError executes block for NetworkError`() {
        val exception = RuntimeException("Connection timeout")
        val result: ApiResult<String> = ApiResult.NetworkError(exception)
        var called = false

        result.onNetworkError { error ->
            called = true
            assertEquals("Connection timeout", error.throwable.message)
        }

        assertTrue(called)
    }

    @Test
    fun `onNetworkError does not execute block for Error`() {
        val result: ApiResult<String> = ApiResult.Error(500, "Server")
        var called = false

        result.onNetworkError { called = true }

        assertFalse(called)
    }

    @Test
    fun `onFailure executes for Error`() {
        val result: ApiResult<String> = ApiResult.Error(400, "Bad")
        var called = false

        result.onFailure {
            called = true
            assertIs<ApiResult.Error>(it)
        }

        assertTrue(called)
    }

    @Test
    fun `onFailure executes for NetworkError`() {
        val result: ApiResult<String> = ApiResult.NetworkError(RuntimeException())
        var called = false

        result.onFailure {
            called = true
            assertIs<ApiResult.NetworkError>(it)
        }

        assertTrue(called)
    }

    @Test
    fun `onFailure does not execute for Success`() {
        val result: ApiResult<String> = ApiResult.Success("ok")
        var called = false

        result.onFailure { called = true }

        assertFalse(called)
    }

    // ==================== toResult Extension ====================

    @Test
    fun `toResult with mapper converts Success to Result success`() {
        val apiResult: ApiResult<Int> = ApiResult.Success(42)

        val result = apiResult.toResult { "Value: $it" }

        assertTrue(result.isSuccess)
        assertEquals("Value: 42", result.getOrNull())
    }

    @Test
    fun `toResult with mapper converts Error to Result failure with ApiException`() {
        val apiResult: ApiResult<Int> = ApiResult.Error(404, "Resource not found")

        val result = apiResult.toResult { "mapped" }

        assertTrue(result.isFailure)
        val exception = result.exceptionOrNull()
        assertIs<ApiException>(exception)
        assertEquals(404, exception.code)
        assertEquals("Resource not found", exception.message)
    }

    @Test
    fun `toResult with mapper converts NetworkError to Result failure`() {
        val networkException = RuntimeException("No internet")
        val apiResult: ApiResult<Int> = ApiResult.NetworkError(networkException)

        val result = apiResult.toResult { "mapped" }

        assertTrue(result.isFailure)
        val exception = result.exceptionOrNull()
        assertEquals(networkException, exception)
    }

    @Test
    fun `toResult without mapper converts Success to Result`() {
        val apiResult: ApiResult<String> = ApiResult.Success("direct")

        val result = apiResult.toResult()

        assertTrue(result.isSuccess)
        assertEquals("direct", result.getOrNull())
    }

    @Test
    fun `toResult without mapper converts Error to Result failure`() {
        val apiResult: ApiResult<String> = ApiResult.Error(401, "Unauthorized")

        val result = apiResult.toResult()

        assertTrue(result.isFailure)
        val exception = result.exceptionOrNull()
        assertIs<ApiException>(exception)
        assertEquals(401, exception.code)
    }

    // ==================== Companion Object Factory Methods ====================

    @Test
    fun `success factory creates Success`() {
        val result = ApiResult.success("factory data")

        assertIs<ApiResult.Success<String>>(result)
        assertEquals("factory data", result.data)
    }

    @Test
    fun `error factory creates Error`() {
        val result = ApiResult.error(500, "Internal error", "detailed body")

        assertIs<ApiResult.Error>(result)
        assertEquals(500, result.code)
        assertEquals("Internal error", result.message)
        assertEquals("detailed body", result.errorBody)
    }

    @Test
    fun `networkError factory creates NetworkError`() {
        val exception = RuntimeException("Timeout")
        val result = ApiResult.networkError(exception)

        assertIs<ApiResult.NetworkError>(result)
        assertEquals(exception, result.throwable)
    }

    // ==================== ApiException ====================

    @Test
    fun `ApiException contains code and message`() {
        val exception = ApiException(422, "Validation failed")

        assertEquals(422, exception.code)
        assertEquals("Validation failed", exception.message)
    }

    // ==================== Chaining Methods ====================

    @Test
    fun `methods can be chained`() {
        var successCalled = false
        var errorCalled = false
        var failureCalled = false

        val result: ApiResult<String> = ApiResult.Success("test")

        result
            .onSuccess { successCalled = true }
            .onError { errorCalled = true }
            .onFailure { failureCalled = true }

        assertTrue(successCalled)
        assertFalse(errorCalled)
        assertFalse(failureCalled)
    }

    @Test
    fun `map and onSuccess can be chained`() {
        var finalValue: String? = null

        ApiResult.Success(5)
            .map { it * 10 }
            .map { "Result: $it" }
            .onSuccess { finalValue = it }

        assertEquals("Result: 50", finalValue)
    }
}
