package com.audiguard.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import com.audiguard.R
import com.audiguard.data.entity.NotificationHistoryEntity
import androidx.lifecycle.viewmodel.compose.viewModel
import com.audiguard.utils.NotificationUtils
import com.audiguard.viewmodel.AlarmListViewModel
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@Composable
fun AlarmListScreen(
    navController: NavController,
    viewModel: AlarmListViewModel = viewModel()
) {
    val notifications by viewModel.notifications.collectAsState(initial = emptyList())

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background),
        contentAlignment = Alignment.Center
    ) {
        if (notifications.isEmpty()) {
            Text(
                text = "알림이 없습니다",
                color = Color.Black
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .wrapContentHeight(),
                contentPadding = PaddingValues(vertical = 30.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(notifications) { notification ->
                    NotificationItem(notification)
                }
            }
        }
    }
}

@Composable
fun NotificationItem(notification: NotificationHistoryEntity) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.8f)
            .height(50.dp)
            .clip(RoundedCornerShape(30.dp))
            .background(Color(0xFFAECBFA)),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val iconResId = NotificationUtils.getNotificationIconForSound(notification.iconResId)

        Image(
            painter = painterResource(iconResId),
            contentDescription = notification.soundType,
            modifier = Modifier
                .padding(start = 20.dp)
                .size(24.dp),
            colorFilter = ColorFilter.tint(Color.Black)
        )
        Text(
            text = notification.soundType,
            style = MaterialTheme.typography.body1,
            color = Color.Black,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = formatDateTime(notification.timestamp),
            style = MaterialTheme.typography.body2,
            color = Color.Black,
            modifier = Modifier.padding(end = 12.dp)
        )
    }
}

private fun formatDateTime(timestamp: LocalDateTime): String {
    val now = LocalDateTime.now()
    val isSameDay = timestamp.toLocalDate() == now.toLocalDate()

    return if (isSameDay) {
        String.format("%02d:%02d", timestamp.hour, timestamp.minute)
    } else {
        val daysAgo = ChronoUnit.DAYS.between(timestamp.toLocalDate(), now.toLocalDate())
        when {
            daysAgo == 1L -> "1일전"
            daysAgo > 1L -> "${daysAgo}일전"
            else -> String.format("%02d:%02d", timestamp.hour, timestamp.minute)
        }
    }
}