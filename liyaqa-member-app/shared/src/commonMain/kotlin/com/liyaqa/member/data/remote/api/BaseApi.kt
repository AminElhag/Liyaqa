package com.liyaqa.member.data.remote.api

import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.util.reflect.TypeInfo
import kotlinx.serialization.json.Json

abstract class BaseApi(
    protected val client: HttpClient,
    protected val json: Json
) {
    protected suspend fun <T : Any> httpGet(path: String, type: TypeInfo): Result<T> =
        safeApiCall(type) { client.get(path) }

    protected suspend fun <T : Any> httpGet(
        path: String,
        type: TypeInfo,
        block: HttpRequestBuilder.() -> Unit
    ): Result<T> = safeApiCall(type) { client.get(path, block) }

    protected suspend fun <T : Any> httpPost(
        path: String,
        type: TypeInfo,
        body: Any? = null
    ): Result<T> = safeApiCall(type) {
        client.post(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
        }
    }

    protected suspend fun <T : Any> httpPost(
        path: String,
        type: TypeInfo,
        body: Any?,
        block: HttpRequestBuilder.() -> Unit
    ): Result<T> = safeApiCall(type) {
        client.post(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
            block()
        }
    }

    protected suspend fun <T : Any> httpPut(
        path: String,
        type: TypeInfo,
        body: Any? = null
    ): Result<T> = safeApiCall(type) {
        client.put(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
        }
    }

    protected suspend fun <T : Any> httpPut(
        path: String,
        type: TypeInfo,
        body: Any?,
        block: HttpRequestBuilder.() -> Unit
    ): Result<T> = safeApiCall(type) {
        client.put(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
            block()
        }
    }

    protected suspend fun <T : Any> httpPatch(
        path: String,
        type: TypeInfo,
        body: Any? = null
    ): Result<T> = safeApiCall(type) {
        client.patch(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
        }
    }

    protected suspend fun <T : Any> httpPatch(
        path: String,
        type: TypeInfo,
        body: Any?,
        block: HttpRequestBuilder.() -> Unit
    ): Result<T> = safeApiCall(type) {
        client.patch(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
            block()
        }
    }

    protected suspend fun <T : Any> httpDelete(path: String, type: TypeInfo): Result<T> =
        safeApiCall(type) { client.delete(path) }

    protected suspend fun <T : Any> httpDelete(
        path: String,
        type: TypeInfo,
        block: HttpRequestBuilder.() -> Unit
    ): Result<T> = safeApiCall(type) { client.delete(path, block) }

    protected suspend fun deleteUnit(
        path: String,
        block: HttpRequestBuilder.() -> Unit = {}
    ): Result<Unit> = safeApiCallUnit { client.delete(path, block) }

    protected suspend fun postUnit(
        path: String,
        body: Any? = null,
        block: HttpRequestBuilder.() -> Unit = {}
    ): Result<Unit> = safeApiCallUnit {
        client.post(path) {
            body?.let {
                contentType(ContentType.Application.Json)
                setBody(it)
            }
            block()
        }
    }

    private suspend fun <T : Any> safeApiCall(
        typeInfo: TypeInfo,
        block: suspend () -> HttpResponse
    ): Result<T> {
        return try {
            val response = block()
            if (response.status.isSuccess()) {
                @Suppress("UNCHECKED_CAST")
                Result.success(response.body(typeInfo) as T)
            } else {
                handleErrorResponse(response)
            }
        } catch (e: Exception) {
            handleException(e)
        }
    }

    private suspend fun safeApiCallUnit(block: suspend () -> HttpResponse): Result<Unit> {
        return try {
            val response = block()
            if (response.status.isSuccess()) {
                Result.success(Unit)
            } else {
                handleErrorResponse(response)
            }
        } catch (e: Exception) {
            handleException(e)
        }
    }

    private suspend fun <T> handleErrorResponse(response: HttpResponse): Result<T> {
        val errorBody = response.bodyAsText()
        val apiError = try {
            json.decodeFromString<ApiErrorResponse>(errorBody)
        } catch (e: Exception) {
            ApiErrorResponse(
                status = response.status.value,
                error = response.status.description,
                message = errorBody.ifEmpty { "Unknown error" }
            )
        }
        return Result.error(
            exception = ApiException.fromResponse(apiError),
            message = apiError.message,
            messageAr = apiError.messageAr,
            code = apiError.status
        )
    }

    private fun <T> handleException(e: Exception): Result<T> = when (e) {
        is ApiException -> Result.error(exception = e, message = e.message, messageAr = e.messageAr, code = e.code)
        else -> Result.error(exception = ApiException.unknownError(e), message = e.message)
    }
}
