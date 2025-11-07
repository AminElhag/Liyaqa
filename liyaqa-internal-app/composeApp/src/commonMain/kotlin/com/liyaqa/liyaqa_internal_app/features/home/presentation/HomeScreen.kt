package com.liyaqa.liyaqa_internal_app.features.home.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

/**
 * Home/Dashboard screen with navigation to all features
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToEmployees: () -> Unit,
    onNavigateToTenants: () -> Unit,
    onNavigateToFacilities: () -> Unit,
    onNavigateToAuditLogs: () -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Liyaqa Internal") },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, "Settings")
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Welcome header
            Text(
                text = "Dashboard",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Text(
                text = "Internal team management portal",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            // Feature grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 16.dp)
            ) {
                items(getFeatureCards(
                    onNavigateToEmployees,
                    onNavigateToTenants,
                    onNavigateToFacilities,
                    onNavigateToAuditLogs
                )) { feature ->
                    FeatureCard(feature)
                }
            }
        }
    }
}

@Composable
private fun FeatureCard(
    feature: FeatureItem,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clickable(onClick = feature.onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = feature.icon,
                contentDescription = feature.title,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = feature.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = feature.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private data class FeatureItem(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val onClick: () -> Unit
)

private fun getFeatureCards(
    onNavigateToEmployees: () -> Unit,
    onNavigateToTenants: () -> Unit,
    onNavigateToFacilities: () -> Unit,
    onNavigateToAuditLogs: () -> Unit
): List<FeatureItem> = listOf(
    FeatureItem(
        title = "Employees",
        description = "Internal team management",
        icon = Icons.Default.Person,
        onClick = onNavigateToEmployees
    ),
    FeatureItem(
        title = "Tenants",
        description = "Customer organizations",
        icon = Icons.Default.Business,
        onClick = onNavigateToTenants
    ),
    FeatureItem(
        title = "Facilities",
        description = "Sports facilities & branches",
        icon = Icons.Default.Place,
        onClick = onNavigateToFacilities
    ),
    FeatureItem(
        title = "Audit Logs",
        description = "Security & compliance",
        icon = Icons.Default.History,
        onClick = onNavigateToAuditLogs
    )
)
