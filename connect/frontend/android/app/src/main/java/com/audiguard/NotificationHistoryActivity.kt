package com.audiguard

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.annotation.RequiresApi
import androidx.compose.material3.Surface
import com.audiguard.ui.screen.NotificationHistoryScreen

class NotificationHistoryActivity : ComponentActivity() {
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                Surface {
                    NotificationHistoryScreen(
                        onBackPressed = { finish() }
                    )
                }
            }
        }
    }
}