package com.audiguard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.launch
import androidx.annotation.DrawableRes
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.ui.draw.paint
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.TextUnitType
import com.audiguard.data.entity.NotificationSettingEntity
import com.audiguard.viewmodel.SettingsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBackPressed: () -> Unit,
    viewModel: SettingsViewModel,
    onToggleChanged: (NotificationSettingEntity, Boolean) -> Unit
) {
    val scope = rememberCoroutineScope()
    val settings by viewModel.settings.collectAsStateWithLifecycle(initialValue = emptyList())
    val names by viewModel.names.collectAsStateWithLifecycle(initialValue = emptyList())
    var showAddNameDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar( // TopAppBar를 CenterAlignedTopAppBar로 변경
                title = { Text("알림 유형") },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.Transparent // 배경색을 투명하게 설정
                )
            )
        }
    ) { paddingValues ->
        Column(
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // 응급 상황 섹션
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp)),
                color = Color.White.copy(alpha = 0.5f) // 흰색 배경에 50% 투명도
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    CategorySection(
                        title = "응급 상황",
                        items = listOf(
                            SettingItem(
                                "Fire alarm",
                                R.drawable.ic_fire,
                                "화재경보",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem(
                                "Ambulance (siren)",
                                R.drawable.ic_ambulance,
                                "구급차",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem(
                                "Civil defense siren",
                                R.drawable.ic_horn,
                                "민방위",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem("Dog", R.drawable.ic_dog, "개", Color(0xFFFFFFFF)),
                            SettingItem(
                                "Baby cry, infant cry",
                                R.drawable.ic_baby,
                                "아기 울음",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem(
                                "Police car (siren)",
                                R.drawable.ic_police,
                                "경찰차",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem(
                                "Vehicle horn, car horn, honking",
                                R.drawable.ic_car,
                                "경적",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem("Explosion", R.drawable.ic_bomb, "폭발음", Color(0xFFFFFFFF))
                        ),
                        settings = settings,
                        onToggle = { id, enabled ->
                            settings.find { it.id == id }?.let { setting ->
                                onToggleChanged(setting, enabled)  // onToggleChanged 호출
                            }
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 생활 섹션
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp)),
                color = Color.White.copy(alpha = 0.5f) // 흰색 배경에 50% 투명도
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    CategorySection(
                        title = "생활",
                        items = listOf(
                            SettingItem("Knock", R.drawable.ic_knock, "노크", Color(0xFFFFFFFF)),
                            SettingItem("Doorbell", R.drawable.ic_bell, "초인종", Color(0xFFFFFFFF)),
                            SettingItem("Telephone", R.drawable.ic_phone, "전화", Color(0xFFFFFFFF)),
                            SettingItem(
                                "Sink (filling or washing)",
                                R.drawable.ic_wash,
                                "세탁기",
                                Color(0xFFFFFFFF)
                            ),
                            SettingItem("Water", R.drawable.ic_water, "물소리", Color(0xFFFFFFFF)),
                            SettingItem("Alarm", R.drawable.ic_alarm, "알람", Color(0xFFFFFFFF)),
                            SettingItem(
                                "Microwave oven",
                                R.drawable.ic_microwave,
                                "전자레인지",
                                Color(0xFFFFFFFF)
                            )
                        ),
                        settings = settings,
                        onToggle = { id, enabled ->
                            settings.find { it.id == id }?.let { setting ->
                                onToggleChanged(setting, enabled)  // onToggleChanged 호출
                            }
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 호칭 섹션
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp)),
                color = Color.White.copy(alpha = 0.5f) // 흰색 배경에 50% 투명도
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "호칭",
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    Row(
                        modifier = Modifier
                            .horizontalScroll(rememberScrollState())
                            .padding(4.dp)
                    ) {
                        names.forEach { name ->
                            NameButton(
                                name = name.name,
                                onDelete = {
                                    scope.launch {
                                        viewModel.deleteName(name)
                                    }
                                }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }

                        // Plus 버튼
                        IconButton(
                            onClick = { showAddNameDialog = true },
                            modifier = Modifier
                                .size(90.dp)
                                .shadow(
                                    elevation = 4.dp,  // 그림자의 높이
                                    shape = RoundedCornerShape(20.dp),  // 그림자의 shape
                                    ambientColor = Color.Gray,  // 주변 그림자 색상 (선택사항)
                                    spotColor = Color.Gray  // 직접 그림자 색상 (선택사항)
                                )
                                .clip(RoundedCornerShape(20.dp))
                                .background(MaterialTheme.colorScheme.surface)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_plus),
                                contentDescription = "Add name",
                                modifier = Modifier.size(30.dp)
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAddNameDialog) {
        AddNameDialog(
            onDismiss = { showAddNameDialog = false },
            onConfirm = { name ->
                scope.launch {
                    viewModel.addName(name)
                }
            }
        )
    }
}

@Composable
private fun CategorySection(
    title: String,
    items: List<SettingItem>,
    settings: List<NotificationSettingEntity>,
    onToggle: (String, Boolean) -> Unit
) {
    Text(
        text = title,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(bottom = 8.dp)
    )

    Row(
        modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(4.dp)
    ) {
        items.forEach { item ->
            val isEnabled = settings.find { it.id == item.id }?.isEnabled ?: true
            SettingItemCard(
                item = item,
                isEnabled = isEnabled,
                onToggle = { onToggle(item.id, !isEnabled) }
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}

@Composable
private fun SettingItemCard(
    item: SettingItem,
    isEnabled: Boolean,
    onToggle: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(90.dp)
                .alpha(if (isEnabled) 1f else 0.4f)
                .shadow(
                    elevation = 4.dp,
                    shape = RoundedCornerShape(20.dp),
                    ambientColor = Color.Gray,
                    spotColor = Color.Gray
                )
                .clip(RoundedCornerShape(20.dp))
                .background(
                    color = item.backgroundColor,
                    shape = RoundedCornerShape(20.dp)
                )
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = rememberRipple(bounded = true),
                    onClick = onToggle
                )
        ) {
            Icon(
                painter = painterResource(id = item.iconRes),
                contentDescription = item.title,
                modifier = Modifier
                    .size(40.dp)
                    .align(Alignment.Center),
                tint = if (isEnabled) Color.Unspecified else Color.Gray  // isEnabled 상태에 따라 색상 변경
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = item.title,
            fontSize = 12.sp,
            modifier = Modifier.padding(bottom = 4.dp)
        )
    }
}

@Composable
private fun NameButton(
    name: String,
    onDelete: () -> Unit
) {
    var showDeleteDialog by remember { mutableStateOf(false) }

    Button(
        onClick = { showDeleteDialog = true },
        modifier = Modifier
            .size(90.dp)
            .shadow(
                elevation = 4.dp,
                shape = RoundedCornerShape(20.dp),
                ambientColor = Color.Gray,
                spotColor = Color.Gray
            ),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFFFFF)),
        shape = RoundedCornerShape(20.dp),
    ) {
        Text(text = name, color = Color.Black, fontSize = 20.sp)
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("삭제") },
            text = { Text("'$name'를 삭제하시겠습니까?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    }
                ) {
                    Text("삭제")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("취소")
                }
            }
        )
    }
}

@Composable
private fun AddNameDialog(
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var name by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("이름 등록") },
        text = {
            TextField(
                value = name,
                onValueChange = { name = it },
                label = {
                    Text(
                        "성을 제외한 이름을 입력해주세요",
                        fontSize = TextUnit(14f, TextUnitType.Sp),
                        fontFamily = FontFamily.Default
                    )
                }
            )
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (name.isNotEmpty()) {
                        onConfirm(name)
                    }
                    onDismiss()
                }
            ) {
                Text("확인")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    )
}

private data class SettingItem(
    val id: String,
    @DrawableRes val iconRes: Int,
    val title: String,
    val backgroundColor: Color
)