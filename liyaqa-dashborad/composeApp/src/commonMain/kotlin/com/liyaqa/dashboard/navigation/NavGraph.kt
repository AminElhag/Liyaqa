package com.liyaqa.dashboard.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.liyaqa.dashboard.features.booking.presentation.list.BookingListScreen
import com.liyaqa.dashboard.features.booking.presentation.list.BookingListViewModel
import com.liyaqa.dashboard.features.employee.presentation.list.FacilityEmployeeListScreen
import com.liyaqa.dashboard.features.employee.presentation.list.FacilityEmployeeListViewModel
import com.liyaqa.dashboard.features.home.presentation.HomeScreen
import com.liyaqa.dashboard.features.member.presentation.list.MemberListScreen
import com.liyaqa.dashboard.features.member.presentation.list.MemberListViewModel
import com.liyaqa.dashboard.features.trainer.presentation.list.TrainerListScreen
import com.liyaqa.dashboard.features.trainer.presentation.list.TrainerListViewModel
import org.koin.compose.viewmodel.koinViewModel

/**
 * Main navigation graph for the facility dashboard app
 */
@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Home.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Home Screen
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToEmployees = {
                    navController.navigate(Screen.EmployeeList.route)
                },
                onNavigateToMembers = {
                    navController.navigate(Screen.MemberList.route)
                },
                onNavigateToBookings = {
                    navController.navigate(Screen.BookingList.route)
                },
                onNavigateToTrainers = {
                    navController.navigate(Screen.TrainerList.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }

        // Employee Management
        composable(Screen.EmployeeList.route) {
            val viewModel: FacilityEmployeeListViewModel = koinViewModel()
            FacilityEmployeeListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id ->
                    navController.navigate(Screen.EmployeeDetail.createRoute(id))
                },
                onNavigateToCreate = {
                    navController.navigate(Screen.EmployeeCreate.route)
                },
                onNavigateBack = {
                    navController.navigateUp()
                }
            )
        }

        // Member Management
        composable(Screen.MemberList.route) {
            val viewModel: MemberListViewModel = koinViewModel()
            MemberListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id ->
                    navController.navigate(Screen.MemberDetail.createRoute(id))
                },
                onNavigateToCreate = {
                    navController.navigate(Screen.MemberCreate.route)
                },
                onNavigateBack = {
                    navController.navigateUp()
                }
            )
        }

        // Booking Management
        composable(Screen.BookingList.route) {
            val viewModel: BookingListViewModel = koinViewModel()
            BookingListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id ->
                    navController.navigate(Screen.BookingDetail.createRoute(id))
                },
                onNavigateToCreate = {
                    navController.navigate(Screen.BookingCreate.route)
                },
                onNavigateBack = {
                    navController.navigateUp()
                }
            )
        }

        // Trainer Management
        composable(Screen.TrainerList.route) {
            val viewModel: TrainerListViewModel = koinViewModel()
            TrainerListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id ->
                    navController.navigate(Screen.TrainerDetail.createRoute(id))
                },
                onNavigateToCreate = {
                    navController.navigate(Screen.TrainerCreate.route)
                },
                onNavigateBack = {
                    navController.navigateUp()
                }
            )
        }

        // Settings Screen (placeholder)
        composable(Screen.Settings.route) {
            SettingsPlaceholderScreen(
                onNavigateBack = {
                    navController.navigateUp()
                }
            )
        }
    }
}

/**
 * Placeholder Settings Screen
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingsPlaceholderScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    Icons.Default.Settings,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    "Settings",
                    style = MaterialTheme.typography.headlineMedium
                )
                Text(
                    "Coming soon...",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
