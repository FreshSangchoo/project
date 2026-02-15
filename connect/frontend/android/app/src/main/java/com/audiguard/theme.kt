package com.audiguard

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

@Composable
fun AppTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        // 필요한 경우 커스텀 색상, 타이포그래피, 모양 설정 추가
        content = content
    )
}