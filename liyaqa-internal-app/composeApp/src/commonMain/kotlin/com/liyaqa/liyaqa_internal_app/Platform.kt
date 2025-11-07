package com.liyaqa.liyaqa_internal_app

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform