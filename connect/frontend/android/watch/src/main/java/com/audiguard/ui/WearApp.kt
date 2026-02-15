package com.audiguard.ui

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.audiguard.presentation.theme.AudiGuardTheme
import com.audiguard.viewmodelfactory.AlarmListViewModelFactory

@Composable
fun WearApp(viewModelFactory: AlarmListViewModelFactory) {
    AudiGuardTheme {
        val navController = rememberNavController()
        NavHost(navController = navController, startDestination = "home") {
            composable("home") { HomeScreen(navController) }
            composable("alarm") {
                AlarmListScreen(
                    navController = navController,
                    viewModel = viewModel(factory = viewModelFactory)
                )
            }
            composable(
                "conversation/{chatRoomTitle}",
                arguments = listOf(navArgument("chatRoomTitle") { type = NavType.StringType })
            ) { backStackEntry ->
                val chatRoomTitle = backStackEntry.arguments?.getString("chatRoomTitle")
                ConversationScreen(navController = navController, chatRoomTitle = chatRoomTitle)
            }
        }
    }
}