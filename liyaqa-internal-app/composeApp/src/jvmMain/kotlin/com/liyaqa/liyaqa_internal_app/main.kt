package com.liyaqa.liyaqa_internal_app

import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "liyaqa_internal_app",
    ) {
        App()
    }
}