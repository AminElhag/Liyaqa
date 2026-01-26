package com.liyaqa.member

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.window.ComposeUIViewController
import com.liyaqa.member.data.repository.AuthRepositoryImpl
import com.liyaqa.member.domain.model.AuthState
import com.liyaqa.member.domain.model.TenantInfo
import com.liyaqa.member.domain.repository.AuthRepository
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.navigation.AppNavigation
import com.liyaqa.member.presentation.theme.BrandingTheme
import com.liyaqa.member.presentation.theme.DynamicLiyaqaTheme
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import platform.UIKit.UIViewController

fun MainViewController(initialRoute: String? = null): UIViewController = ComposeUIViewController {
    IosApp(initialRoute = initialRoute)
}

@Composable
private fun IosApp(initialRoute: String? = null) {
    val koinComponent = remember { object : KoinComponent {} }
    val authRepository: AuthRepository by koinComponent.inject()

    val authState by authRepository.authState.collectAsState(initial = AuthState.Loading)
    var isArabic by remember { mutableStateOf(false) } // TODO: Load from preferences
    var brandingTheme by remember { mutableStateOf(BrandingTheme.DEFAULT) }

    // Initialize auth state
    LaunchedEffect(Unit) {
        (authRepository as? AuthRepositoryImpl)?.initializeAuthState()
    }

    // Fetch branding when authenticated
    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            val user = (authState as AuthState.Authenticated).user
            val tenantResult = authRepository.getTenantInfo(tenantId = user.tenantId)
            tenantResult.onSuccess { tenantInfo ->
                brandingTheme = BrandingTheme.fromTenantInfo(tenantInfo)
            }
        }
    }

    DynamicLiyaqaTheme(
        brandingTheme = brandingTheme,
        darkTheme = isSystemInDarkTheme(),
        isArabic = isArabic
    ) {
        Surface(modifier = Modifier.fillMaxSize()) {
            when (authState) {
                is AuthState.Loading -> {
                    LoadingView()
                }
                is AuthState.Authenticated -> {
                    AppNavigation(isAuthenticated = true, initialRoute = initialRoute)
                }
                is AuthState.Unauthenticated, is AuthState.Error -> {
                    AppNavigation(isAuthenticated = false)
                }
            }
        }
    }
}
