package com.liyaqa.member

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
