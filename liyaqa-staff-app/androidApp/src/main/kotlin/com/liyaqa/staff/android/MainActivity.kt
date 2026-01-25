package com.liyaqa.staff.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.liyaqa.staff.presentation.screens.login.LoginScreen
import com.liyaqa.staff.presentation.theme.LiyaqaStaffTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val isArabic by remember { mutableStateOf(false) }

            LiyaqaStaffTheme(isArabic = isArabic) {
                Navigator(LoginScreen) { navigator ->
                    SlideTransition(navigator)
                }
            }
        }
    }
}
