package com.liyaqa.dashboard

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
