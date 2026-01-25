package com.liyaqa.member.presentation.screens.trainers

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.presentation.components.DateSelector
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.PrimaryButton
import com.liyaqa.member.presentation.components.TimeSlotGrid
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

data class PTBookingScreen(val trainerId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<PTBookingScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val language = if (isArabic) Language.ARABIC else Language.ENGLISH
        val snackbarHostState = remember { SnackbarHostState() }

        LaunchedEffect(trainerId) {
            screenModel.initialize(trainerId)
        }

        LaunchedEffect(state.error) {
            state.error?.let { error ->
                val message = if (isArabic) error.messageAr ?: error.message else error.message
                snackbarHostState.showSnackbar(message)
                screenModel.clearError()
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.bookSession.localized(),
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = if (isArabic) "رجوع" else "Back"
                            )
                        }
                    }
                )
            },
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { paddingValues ->
            when {
                state.isBookingSuccess -> {
                    // Success state
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = StatusColors.active,
                            modifier = Modifier.padding(16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (isArabic) "تم الحجز بنجاح!" else "Booking Confirmed!",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = StatusColors.active
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        state.bookedSession?.let { session ->
                            Text(
                                text = "${session.date} ${session.timeDisplay}",
                                style = MaterialTheme.typography.bodyLarge,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = session.trainerName.get(language),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                        }
                        Spacer(modifier = Modifier.height(32.dp))
                        PrimaryButton(
                            text = if (isArabic) "تم" else "Done",
                            onClick = {
                                // Pop back to trainers list
                                navigator.popUntil { it is TrainersScreen }
                            }
                        )
                    }
                }
                state.isLoading && state.trainer == null -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.error != null && state.trainer == null -> {
                    val errorMessage = if (isArabic) {
                        state.error?.messageAr ?: state.error?.message
                    } else {
                        state.error?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error",
                        onRetry = { screenModel.initialize(trainerId) },
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Trainer info
                        state.trainer?.let { trainer ->
                            Text(
                                text = if (isArabic) "الحجز مع" else "Booking with",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = trainer.name.get(language),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Date Selector
                        DateSelector(
                            selectedDate = state.selectedDate,
                            availableDates = state.availableDates,
                            onDateSelected = screenModel::selectDate,
                            onPreviousWeek = screenModel::previousWeek,
                            onNextWeek = screenModel::nextWeek
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Time Slots
                        if (state.isLoadingSlots) {
                            LoadingView(modifier = Modifier.height(200.dp))
                        } else {
                            TimeSlotGrid(
                                slots = state.timeSlots,
                                selectedSlot = state.selectedSlot,
                                onSlotSelected = screenModel::selectSlot
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Notes
                        OutlinedTextField(
                            value = state.notes,
                            onValueChange = screenModel::updateNotes,
                            label = {
                                Text(if (isArabic) "ملاحظات (اختياري)" else "Notes (optional)")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            maxLines = 5
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Book Button
                        PrimaryButton(
                            text = Strings.confirmBooking.localized(),
                            onClick = screenModel::bookSession,
                            isLoading = state.isBooking,
                            enabled = state.canBook && !state.isBooking
                        )

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
