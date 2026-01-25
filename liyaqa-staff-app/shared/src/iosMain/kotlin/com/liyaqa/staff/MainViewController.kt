package com.liyaqa.staff

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.window.ComposeUIViewController
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.liyaqa.staff.presentation.screens.login.LoginScreen
import com.liyaqa.staff.presentation.theme.LiyaqaStaffTheme

fun MainViewController() = ComposeUIViewController {
    val isArabic by remember { mutableStateOf(false) }

    LiyaqaStaffTheme(isArabic = isArabic) {
        Navigator(LoginScreen) { navigator ->
            SlideTransition(navigator)
        }
    }
}
