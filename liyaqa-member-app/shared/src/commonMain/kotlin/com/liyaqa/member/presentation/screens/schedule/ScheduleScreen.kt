package com.liyaqa.member.presentation.screens.schedule

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.SectionHeader
import com.liyaqa.member.presentation.components.SessionCard
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized
import kotlinx.datetime.toLocalDateTime

object ScheduleScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<ScheduleScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val language = if (isArabic) Language.ARABIC else Language.ENGLISH

        LaunchedEffect(Unit) {
            screenModel.loadSessions()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.schedule.localized(),
                            fontWeight = FontWeight.Bold
                        )
                    }
                )
            }
        ) { paddingValues ->
            when {
                state.isLoading -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.error != null -> {
                    val errorMessage = if (isArabic) {
                        state.error?.messageAr ?: state.error?.message
                    } else {
                        state.error?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error loading schedule",
                        onRetry = screenModel::loadSessions,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Group sessions by date
                        val groupedSessions = state.sessions.groupBy { it.date }

                        groupedSessions.forEach { (date, sessions) ->
                            item(key = "header_$date") {
                                SectionHeader(
                                    title = formatDate(date, isArabic),
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }

                            items(
                                items = sessions,
                                key = { it.id }
                            ) { session ->
                                SessionCard(
                                    session = session,
                                    language = language,
                                    onBookClick = { screenModel.bookSession(session.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    private fun formatDate(date: String, isArabic: Boolean): String {
        // Simple date formatting - in production, use proper date formatting
        return when {
            date == kotlinx.datetime.Clock.System.now()
                .toLocalDateTime(kotlinx.datetime.TimeZone.currentSystemDefault())
                .date.toString() -> if (isArabic) "اليوم" else "Today"
            else -> date
        }
    }
}
