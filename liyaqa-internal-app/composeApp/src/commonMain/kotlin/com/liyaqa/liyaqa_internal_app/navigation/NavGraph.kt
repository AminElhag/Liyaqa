package com.liyaqa.liyaqa_internal_app.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.liyaqa.liyaqa_internal_app.features.auth.presentation.login.LoginScreen
import com.liyaqa.liyaqa_internal_app.features.auth.presentation.login.LoginViewModel
import com.liyaqa.liyaqa_internal_app.features.audit.presentation.list.AuditLogListScreen
import com.liyaqa.liyaqa_internal_app.features.audit.presentation.list.AuditLogListViewModel
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.create.EmployeeFormScreen
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.create.EmployeeFormViewModel
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.detail.EmployeeDetailScreen
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.detail.EmployeeDetailViewModel
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.list.EmployeeListScreen
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.list.EmployeeListViewModel
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.create.FacilityFormScreen
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.create.FacilityFormViewModel
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.detail.FacilityDetailScreen
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.detail.FacilityDetailViewModel
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.list.FacilityListScreen
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.list.FacilityListViewModel
import com.liyaqa.liyaqa_internal_app.features.home.presentation.HomeScreen
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.create.TenantFormScreen
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.create.TenantFormViewModel
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.detail.TenantDetailScreen
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.detail.TenantDetailViewModel
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.list.TenantListScreen
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.list.TenantListViewModel
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

/**
 * Main navigation graph for the app.
 * Follows Jetpack Compose navigation patterns with Material 3.
 */
@Composable
fun NavGraph(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Auth Flow
        composable(route = Screen.Login.route) {
            val viewModel: LoginViewModel = koinViewModel()
            LoginScreen(
                viewModel = viewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // Home/Dashboard
        composable(route = Screen.Home.route) {
            HomeScreen(
                onNavigateToEmployees = { navController.navigate(Screen.EmployeeList.route) },
                onNavigateToTenants = { navController.navigate(Screen.TenantList.route) },
                onNavigateToFacilities = { navController.navigate(Screen.FacilityList.route) },
                onNavigateToAuditLogs = { navController.navigate(Screen.AuditLogs.route) },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
            )
        }

        // Employee Management
        composable(route = Screen.EmployeeList.route) {
            val viewModel: EmployeeListViewModel = koinViewModel()
            EmployeeListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id -> navController.navigate(Screen.EmployeeDetail.createRoute(id)) },
                onNavigateToCreate = { navController.navigate(Screen.EmployeeCreate.route) }
            )
        }

        // Tenant Management
        composable(route = Screen.TenantList.route) {
            val viewModel: TenantListViewModel = koinViewModel()
            TenantListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id -> navController.navigate(Screen.TenantDetail.createRoute(id)) },
                onNavigateToCreate = { navController.navigate(Screen.TenantCreate.route) }
            )
        }

        // Facility Management
        composable(route = Screen.FacilityList.route) {
            val viewModel: FacilityListViewModel = koinViewModel()
            FacilityListScreen(
                viewModel = viewModel,
                onNavigateToDetail = { id -> navController.navigate(Screen.FacilityDetail.createRoute(id)) },
                onNavigateToCreate = { navController.navigate(Screen.FacilityCreate.route) }
            )
        }

        // Audit Logs
        composable(route = Screen.AuditLogs.route) {
            val viewModel: AuditLogListViewModel = koinViewModel()
            AuditLogListScreen(viewModel = viewModel)
        }

        // Employee Detail
        composable(
            route = Screen.EmployeeDetail.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { navBackStackEntry ->
            // Extract ID from the route path
            val employeeId = navBackStackEntry.destination.route
                ?.substringAfterLast("/")
                ?: return@composable
            val viewModel: EmployeeDetailViewModel = koinViewModel { parametersOf(employeeId) }
            EmployeeDetailScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() },
                onNavigateToEdit = { id ->
                    navController.navigate(Screen.EmployeeEdit.createRoute(id))
                }
            )
        }

        composable(route = Screen.EmployeeCreate.route) {
            val viewModel: EmployeeFormViewModel = koinViewModel { parametersOf(null) }
            EmployeeFormScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() }
            )
        }

        composable(
            route = Screen.EmployeeEdit.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { navBackStackEntry ->
            val employeeId = navBackStackEntry.destination.route
                ?.substringAfterLast("/")
                ?.removeSuffix("/edit")
                ?: return@composable
            val viewModel: EmployeeFormViewModel = koinViewModel { parametersOf(employeeId) }
            EmployeeFormScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() }
            )
        }

        // Tenant Detail
        composable(
            route = Screen.TenantDetail.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { navBackStackEntry ->
            // Extract ID from the route path
            val tenantId = navBackStackEntry.destination.route
                ?.substringAfterLast("/")
                ?: return@composable
            val viewModel: TenantDetailViewModel = koinViewModel { parametersOf(tenantId) }
            TenantDetailScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() },
                onNavigateToEdit = { id ->
                    navController.navigate(Screen.TenantEdit.createRoute(id))
                }
            )
        }

        composable(route = Screen.TenantCreate.route) {
            val viewModel: TenantFormViewModel = koinViewModel { parametersOf(null) }
            TenantFormScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() }
            )
        }

        composable(
            route = Screen.TenantEdit.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { navBackStackEntry ->
            val tenantId = navBackStackEntry.destination.route
                ?.substringAfterLast("/")
                ?.removeSuffix("/edit")
                ?: return@composable
            val viewModel: TenantFormViewModel = koinViewModel { parametersOf(tenantId) }
            TenantFormScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() }
            )
        }

        // Facility Detail
        composable(
            route = Screen.FacilityDetail.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { navBackStackEntry ->
            // Extract ID from the route path
            val facilityId = navBackStackEntry.destination.route
                ?.substringAfterLast("/")
                ?: return@composable
            val viewModel: FacilityDetailViewModel = koinViewModel { parametersOf(facilityId) }
            FacilityDetailScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() },
                onNavigateToEdit = { id ->
                    navController.navigate(Screen.FacilityEdit.createRoute(id))
                }
            )
        }

        composable(route = Screen.FacilityCreate.route) {
            val viewModel: FacilityFormViewModel = koinViewModel { parametersOf(null) }
            FacilityFormScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() }
            )
        }

        composable(
            route = Screen.FacilityEdit.route,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) { navBackStackEntry ->
            val facilityId = navBackStackEntry.destination.route
                ?.substringAfterLast("/")
                ?.removeSuffix("/edit")
                ?: return@composable
            val viewModel: FacilityFormViewModel = koinViewModel { parametersOf(facilityId) }
            FacilityFormScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.navigateUp() }
            )
        }

        composable(route = Screen.Settings.route) {
            // TODO: SettingsScreen
        }
    }
}
