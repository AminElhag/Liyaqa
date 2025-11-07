package com.liyaqa.liyaqa_internal_app.features.auth.presentation.login

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.ui.tooling.preview.Preview

/**
 * Login Screen with Material 3 design.
 * Follows MVVM pattern and Material 3 guidelines.
 */
@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    // Navigate on successful login
    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }

    LoginContent(
        uiState = uiState,
        onEvent = viewModel::onEvent,
        modifier = modifier
    )
}

@Composable
private fun LoginContent(
    uiState: LoginUiState,
    onEvent: (LoginUiEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        snackbarHost = {
            if (uiState.error != null) {
                Snackbar(
                    action = {
                        TextButton(onClick = { onEvent(LoginUiEvent.ClearError) }) {
                            Text("Dismiss")
                        }
                    },
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(uiState.error)
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // App Title/Logo
            Text(
                text = "Liyaqa Internal",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Email TextField
            OutlinedTextField(
                value = uiState.email,
                onValueChange = { onEvent(LoginUiEvent.EmailChanged(it)) },
                label = { Text("Email") },
                singleLine = true,
                isError = uiState.emailError != null,
                supportingText = {
                    if (uiState.emailError != null) {
                        Text(uiState.emailError)
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password TextField
            OutlinedTextField(
                value = uiState.password,
                onValueChange = { onEvent(LoginUiEvent.PasswordChanged(it)) },
                label = { Text("Password") },
                singleLine = true,
                isError = uiState.passwordError != null,
                supportingText = {
                    if (uiState.passwordError != null) {
                        Text(uiState.passwordError)
                    }
                },
                visualTransformation = if (uiState.isPasswordVisible) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                trailingIcon = {
                    IconButton(
                        onClick = { onEvent(LoginUiEvent.TogglePasswordVisibility) }
                    ) {
                        Icon(
                            imageVector = if (uiState.isPasswordVisible) {
                                Icons.Default.VisibilityOff
                            } else {
                                Icons.Default.Visibility
                            },
                            contentDescription = if (uiState.isPasswordVisible) {
                                "Hide password"
                            } else {
                                "Show password"
                            }
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = { onEvent(LoginUiEvent.LoginClicked) }
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Login Button
            Button(
                onClick = { onEvent(LoginUiEvent.LoginClicked) },
                enabled = !uiState.isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Login")
                }
            }
        }
    }
}

@Preview
@Composable
private fun LoginScreenPreview() {
    MaterialTheme {
        LoginContent(
            uiState = LoginUiState(
                email = "test@example.com",
                password = "password"
            ),
            onEvent = {}
        )
    }
}

@Preview
@Composable
private fun LoginScreenLoadingPreview() {
    MaterialTheme {
        LoginContent(
            uiState = LoginUiState(
                email = "test@example.com",
                password = "password",
                isLoading = true
            ),
            onEvent = {}
        )
    }
}

@Preview
@Composable
private fun LoginScreenErrorPreview() {
    MaterialTheme {
        LoginContent(
            uiState = LoginUiState(
                email = "test@example.com",
                password = "",
                passwordError = "Password cannot be empty"
            ),
            onEvent = {}
        )
    }
}
