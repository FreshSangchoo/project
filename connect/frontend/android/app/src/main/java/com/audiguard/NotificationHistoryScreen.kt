package com.audiguard.ui.screen

import RelativeDateFormatter
import android.app.Application
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.paint
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.audiguard.R
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.utils.NotificationUtils.getNotificationIconForSound
import com.audiguard.viewmodel.NotificationHistoryViewModel

@RequiresApi(Build.VERSION_CODES.O)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationHistoryScreen(
    onBackPressed: () -> Unit,
    application: Application = LocalContext.current.applicationContext as Application,
    viewModel: NotificationHistoryViewModel = viewModel(
        factory = NotificationHistoryViewModel.Factory(application)
    )
) {
    val historyItems by viewModel.historyItems.collectAsStateWithLifecycle(initialValue = emptyList())

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("알림 목록") },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        }
    ) { paddingValues ->
        if (historyItems.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Transparent
                            )
                        ),
                        alpha = 1f
                    )
                    .paint(
                        painter = painterResource(id = R.drawable.background_blue),
                        contentScale = ContentScale.FillBounds // 화면에 맞게 이미지 크기 조절
                    )
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Text("최근 14일 이내의 알림 기록이 없습니다")
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Transparent
                            )
                        ),
                        alpha = 1f
                    )
                    .paint(
                        painter = painterResource(id = R.drawable.background_blue),
                        contentScale = ContentScale.FillBounds // 화면에 맞게 이미지 크기 조절
                    )
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Text(
                        text = "최근 14일 이내의 알림만 표시됩니다",
                        modifier = Modifier.padding(vertical = 14.dp),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                items(historyItems) { item ->
                    HistoryCard(item)
                }
            }
        }
    }
}

@RequiresApi(Build.VERSION_CODES.O)
@Composable
private fun HistoryCard(history: NotificationHistoryEntity) {
    val formatter = RelativeDateFormatter()

    val backgroundColor = when (history.soundType) {
        "화재경보" -> Color(0x1AFF0000)
        "구급차" -> Color(0x1AFF0000)
        "민방위" -> Color(0x1AFF6E06)
        "개" -> Color(0x1AD2722D)
        "아기 울음" -> Color(0x1AFFDCC3)
        "경찰차" -> Color(0x1A0023FF)
        "경적" -> Color(0x1A0F208B)
        "폭발음" -> Color(0x1A000000)
        "노크" -> Color(0x1AC5713D)
        "초인종" -> Color(0x1AEDEDA7)
        "전화" -> Color(0x1A31C353)
        "세탁기" -> Color(0x1A80F6FF)
        "물소리" -> Color(0x1A00AEFF)
        "알람" -> Color(0x1AC2C2C2)
        "전자레인지" -> Color(0x1A000000)
        else -> Color(0x1A000000)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .shadow(
                elevation = 4.dp,
                shape = RoundedCornerShape(20.dp),
                ambientColor = Color.Gray,
                spotColor = Color.Gray
            )
            .clip(RoundedCornerShape(8.dp))
            .background(
                color = Color.White,
                shape = RoundedCornerShape(8.dp)
            )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 아이콘
            Icon(
                painter = painterResource(id = getNotificationIconForSound(history.iconResId)),
                contentDescription = history.soundType,
                modifier = Modifier.size(30.dp),
                tint = Color.Unspecified
            )

            Spacer(modifier = Modifier.width(16.dp))

            // 텍스트 정보
            Row {
                Text(
                    text = if (history.iconResId == "name_detection") {
                        "누군가 ${history.soundType}님을 불렀어요."
                    } else {
                        "${history.soundType} 소리가 들려요."
                    },
                    fontWeight = FontWeight.Medium,
                    fontSize = 16.sp
                )
                Text(
                    text = formatter.format(history.timestamp),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End
                )
            }
        }
    }
}