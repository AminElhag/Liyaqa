package com.liyaqa.member.util

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlin.test.assertFailsWith

class ResultTest {

    @Test
    fun `success result contains data`() {
        val result = Result.success("test data")

        assertTrue(result.isSuccess)
        assertFalse(result.isError)
        assertEquals("test data", result.getOrNull())
        assertEquals("test data", result.getOrThrow())
    }

    @Test
    fun `error result contains error information`() {
        val result = Result.error<String>(
            message = "Error message",
            messageAr = "رسالة خطأ",
            code = 400
        )

        assertTrue(result.isError)
        assertFalse(result.isSuccess)
        assertNull(result.getOrNull())
    }

    @Test
    fun `getOrDefault returns data for success`() {
        val result = Result.success(42)

        assertEquals(42, result.getOrDefault(0))
    }

    @Test
    fun `getOrDefault returns default for error`() {
        val result = Result.error<Int>(message = "Error")

        assertEquals(0, result.getOrDefault(0))
    }

    @Test
    fun `getOrThrow throws for error result`() {
        val result = Result.error<String>(
            exception = IllegalArgumentException("Test error"),
            message = "Test error"
        )

        assertFailsWith<IllegalArgumentException> {
            result.getOrThrow()
        }
    }

    @Test
    fun `map transforms success value`() {
        val result = Result.success(10)
        val mapped = result.map { it * 2 }

        assertTrue(mapped.isSuccess)
        assertEquals(20, mapped.getOrNull())
    }

    @Test
    fun `map preserves error`() {
        val result = Result.error<Int>(message = "Error")
        val mapped = result.map { it * 2 }

        assertTrue(mapped.isError)
    }

    @Test
    fun `flatMap chains success results`() {
        val result = Result.success(10)
        val flatMapped = result.flatMap { value ->
            Result.success(value.toString())
        }

        assertTrue(flatMapped.isSuccess)
        assertEquals("10", flatMapped.getOrNull())
    }

    @Test
    fun `flatMap preserves first error`() {
        val result = Result.error<Int>(message = "First error")
        val flatMapped = result.flatMap { value ->
            Result.success(value.toString())
        }

        assertTrue(flatMapped.isError)
    }

    @Test
    fun `onSuccess executes action for success`() {
        var executed = false
        val result = Result.success("data")

        result.onSuccess {
            executed = true
            assertEquals("data", it)
        }

        assertTrue(executed)
    }

    @Test
    fun `onSuccess does not execute action for error`() {
        var executed = false
        val result = Result.error<String>(message = "Error")

        result.onSuccess { executed = true }

        assertFalse(executed)
    }

    @Test
    fun `onError executes action for error`() {
        var executed = false
        val result = Result.error<String>(message = "Test error", code = 500)

        result.onError { error ->
            executed = true
            assertEquals("Test error", error.message)
            assertEquals(500, error.code)
        }

        assertTrue(executed)
    }

    @Test
    fun `onError does not execute action for success`() {
        var executed = false
        val result = Result.success("data")

        result.onError { executed = true }

        assertFalse(executed)
    }

    @Test
    fun `runCatching returns success for successful block`() {
        val result = Result.runCatching { 42 }

        assertTrue(result.isSuccess)
        assertEquals(42, result.getOrNull())
    }

    @Test
    fun `runCatching returns error for throwing block`() {
        val result = Result.runCatching<Int> {
            throw IllegalStateException("Test exception")
        }

        assertTrue(result.isError)
        val error = result as Result.Error
        assertTrue(error.exception is IllegalStateException)
    }

    @Test
    fun `chaining onSuccess and onError preserves result`() {
        val success = Result.success(100)
        var successExecuted = false
        var errorExecuted = false

        val returned = success
            .onSuccess { successExecuted = true }
            .onError { errorExecuted = true }

        assertTrue(successExecuted)
        assertFalse(errorExecuted)
        assertEquals(100, returned.getOrNull())
    }
}
