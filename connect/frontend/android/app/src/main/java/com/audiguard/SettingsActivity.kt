package com.audiguard

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.hilt.navigation.compose.hiltViewModel
import com.audiguard.repository.SettingsRepository
import com.audiguard.viewmodel.SettingsViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class SettingsActivity : ComponentActivity() {

    @Inject
    lateinit var repository: SettingsRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val scope = rememberCoroutineScope()
            val viewModel: SettingsViewModel = hiltViewModel()

            AppTheme {
                SettingsScreen(
                    onBackPressed = { finish() },
                    viewModel = viewModel,
                    onToggleChanged = { setting, newState ->
                        scope.launch {
                            repository.updateSetting(setting.id, newState)
                            // 토글 변경 시에만 토스트 메시지 표시
                            val message =
                                "${setting.title} 알림이 ${if (newState) "활성화" else "비활성화"} 되었습니다"
                            showCustomToast(message)
                        }
                    }
                )
            }
        }
    }

    private fun showCustomToast(message: String) {
        val inflater = layoutInflater
        val layout = inflater.inflate(R.layout.custom_toast_layout, null)
        val textView = layout.findViewById<android.widget.TextView>(R.id.toast_text)
        textView.text = message

        Toast(applicationContext).apply {
            view = layout
            duration = Toast.LENGTH_SHORT
            show()
        }
    }
}