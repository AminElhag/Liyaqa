package com.liyaqa.member.presentation.screens.trainers

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.PrimaryButton
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

data class TrainerDetailScreen(val trainerId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<TrainerDetailScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val language = if (isArabic) Language.ARABIC else Language.ENGLISH

        LaunchedEffect(trainerId) {
            screenModel.loadTrainer(trainerId)
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = state.trainer?.name?.get(language)
                                ?: Strings.personalTraining.localized(),
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
            }
        ) { paddingValues ->
            when {
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
                        message = errorMessage ?: "Error loading trainer",
                        onRetry = { screenModel.loadTrainer(trainerId) },
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                state.trainer != null -> {
                    val trainer = state.trainer!!

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Trainer Profile Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = CustomShapes.card,
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                // Photo
                                Surface(
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(CircleShape),
                                    color = MaterialTheme.colorScheme.primary
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = null,
                                        modifier = Modifier.padding(24.dp),
                                        tint = MaterialTheme.colorScheme.onPrimary
                                    )
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Name
                                Text(
                                    text = trainer.name.get(language),
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )

                                // Rating
                                trainer.rating?.let { rating ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        repeat(5) { index ->
                                            Icon(
                                                imageVector = Icons.Default.Star,
                                                contentDescription = null,
                                                modifier = Modifier.size(20.dp),
                                                tint = if (index < rating.toInt()) {
                                                    StatusColors.pending
                                                } else {
                                                    MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.3f)
                                                }
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = rating.let { r ->
                                                val formatted = ((r * 10).toLong() / 10.0).toString()
                                                if (formatted.contains(".")) formatted else "$formatted.0"
                                            },
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Text(
                                            text = "(${trainer.reviewCount} ${if (isArabic) "تقييم" else "reviews"})",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Specializations
                        if (trainer.specializations.isNotEmpty()) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = CustomShapes.card
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp)
                                ) {
                                    Text(
                                        text = if (isArabic) "التخصصات" else "Specializations",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    com.liyaqa.member.presentation.components.FlowRow(
                                        horizontalSpacing = 8.dp,
                                        verticalSpacing = 8.dp
                                    ) {
                                        trainer.specializations.forEach { spec ->
                                            com.liyaqa.member.presentation.components.StatusChip(
                                                text = spec.get(language),
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // Bio
                        trainer.bio?.let { bio ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = CustomShapes.card
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp)
                                ) {
                                    Text(
                                        text = if (isArabic) "نبذة" else "About",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = bio.get(language),
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(24.dp))
                        }

                        // Book Button
                        PrimaryButton(
                            text = Strings.bookSession.localized(),
                            onClick = {
                                navigator.push(PTBookingScreen(trainerId))
                            }
                        )

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
