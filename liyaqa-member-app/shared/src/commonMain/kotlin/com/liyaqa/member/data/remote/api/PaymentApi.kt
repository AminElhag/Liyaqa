package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.PaymentInitiateResponse
import com.liyaqa.member.domain.model.PaymentVerifyResult
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

class PaymentApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun initiatePayment(invoiceId: String, returnUrl: String): Result<PaymentInitiateResponse> =
        httpPost("/api/payments/initiate/$invoiceId", typeInfo<PaymentInitiateResponse>(), PaymentInitiateRequest(returnUrl))

    suspend fun verifyPayment(paymentReference: String): Result<PaymentVerifyResult> =
        httpGet("/api/payments/verify/$paymentReference", typeInfo<PaymentVerifyResult>())
}

@Serializable
private data class PaymentInitiateRequest(
    val returnUrl: String
)
