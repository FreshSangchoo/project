package com.audiguard

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.provider.Settings
import android.view.View
import android.view.ViewTreeObserver
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.audiguard.data.AppDatabase
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.audiguard.ChatData.ChatDatabase
import com.audiguard.databinding.ActivityMainBinding
import com.audiguard.messageQue.RabbitMqPublisher
import com.audiguard.utils.MobileNotificationReceiver
import com.audiguard.utils.NotificationSyncManager
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.audiguard.viewmodel.NotificationViewModel
import com.audiguard.viewmodel.NotificationViewModelFactory
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.Wearable
import kotlin.math.cos
import kotlin.math.sin
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.threeten.bp.Duration
import org.threeten.bp.LocalDateTime
import org.threeten.bp.format.DateTimeFormatter
import java.util.UUID

@AndroidEntryPoint
class MainActivity : AppCompatActivity(), OnChatRoomItemClickListener {
    private lateinit var binding: ActivityMainBinding

    private lateinit var permissionManager: PermissionManager
    private lateinit var bottomSheetBehavior: BottomSheetBehavior<View>
    private lateinit var chatRoomAdapter: ChatRoomAdapter
    private lateinit var notificationSyncManager: NotificationSyncManager

    private lateinit var mobileNotificationReceiver: MobileNotificationReceiver
    private lateinit var dataClient: DataClient

    private var isServiceBound = false

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 초기화
        permissionManager = PermissionManager(this)

        binding.star.bringToFront()

        binding.btnMoveToChat.setOnClickListener {
            val chatRoomId = UUID.randomUUID().toString()

            val intent = Intent(this, ChatActivity::class.java).apply {
                putExtra("CHAT_ROOM_ID", chatRoomId)
            }
            startActivity(intent)
        }

        // Bottom Sheet 초기화
        val bottomSheet = binding.bottomSheet
        bottomSheetBehavior = BottomSheetBehavior.from(bottomSheet)

        // RecyclerView 초기화
        setupRecyclerView()
        // 채팅방 observer 설정
        setupChatRoomObserver()

        // 제일 작은 원 초기화
        binding.imageView3.alpha = 0f
        binding.imageView4.alpha = 0f

        // 제일 작은 원들 딜레이 시작.
        binding.imageView3.postDelayed({
            binding.imageView3.alpha = 0.6f
            startOrbitAnimations(
                listOf(
                    Triple(binding.imageView3, Triple(Pair(70f, 250f), 80f, 9000L), false)
                ),
                mapOf(binding.imageView3 to 10000L)
            )
        }, 2000)

        binding.imageView4.postDelayed({
            binding.imageView4.alpha = 0.6f
            startOrbitAnimations(
                listOf(
                    Triple(binding.imageView4, Triple(Pair(70f, 250f), 100f, 9000L), true)
                ),
                mapOf(binding.imageView4 to 10000L)
            )
        }, 2000)

        //중간 원들 애니메이션
        binding.imageView.viewTreeObserver.addOnGlobalLayoutListener(object :
            ViewTreeObserver.OnGlobalLayoutListener {
            override fun onGlobalLayout() {
                startOrbitAnimations(
                    listOf(
                        Triple(binding.imageView6, Triple(Pair(70f, 240f), 80f, 8000L), false),
                        Triple(binding.imageView5, Triple(Pair(70f, 240f), 100f, 8000L), true)
                    ),
                    //제자리 회전
                    mapOf(
                        binding.imageView5 to 10000L,
                        binding.imageView6 to 10000L
                    )
                )
                //별 회전
                startHorizontalOrbitAnimation(binding.star, 9000L, 16000L)
                binding.imageView.viewTreeObserver.removeOnGlobalLayoutListener(this)
            }
        })
        // Compose View를 레이아웃에 추가
        val composeView = ComposeView(this).apply {
            setContent {
                CustomTopBar(
                    onLeftButtonClick = {
                        // 왼쪽 버튼 클릭 시 MenuActivity로 이동
                        startActivity(
                            Intent(
                                this@MainActivity,
                                NotificationHistoryActivity::class.java
                            )
                        )
                    },
                    onRightButtonClick = {
                        // 오른쪽 버튼 클릭 시 SettingsActivity로 이동
                        startActivity(Intent(this@MainActivity, SettingsActivity::class.java))
                    }
                )
            }
        }

        // Room Database 초기화
        val database = AppDatabase.getDatabase(applicationContext)
        val notificationDao = database.notificationHistoryDao()

        // 데이터 변경 시 워치로 동기화
        lifecycleScope.launch {
            notificationDao.getAllHistory().collect { notifications ->
                Log.d("MainActivity", "전송할 데이터 개수: ${notifications.size}")
                Log.d("MainActivity", "전송할 데이터 내용: $notifications") // 실제 데이터 내용 확인
                try {
                    notificationSyncManager.syncNotifications(notifications)
                    Log.d("MainActivity", "워치로 데이터 동기화 시도 완료")
                } catch (e: Exception) {
                    Log.e("MainActivity", "워치 동기화 실패: ${e.message}", e)
                }
            }
        }

        // 워치 연결 상태 확인
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                Log.d("MainActivity", "연결된 워치 노드 수: ${nodes.size}")
                nodes.forEach { node ->
                    Log.d("MainActivity", "연결된 워치 정보 - ID: ${node.id}, 이름: ${node.displayName}")
                }
            }
            .addOnFailureListener { e ->
                Log.e("MainActivity", "워치 연결 상태 확인 실패", e)
            }

        // DataClient 초기화
        dataClient = Wearable.getDataClient(this)

        // SyncManager 초기화
        notificationSyncManager = NotificationSyncManager(this)

        // Receiver 초기화
        mobileNotificationReceiver = MobileNotificationReceiver(
            dataClient = dataClient,
            notificationDao = AppDatabase.getDatabase(this).notificationHistoryDao(),
            settingDao = AppDatabase.getDatabase(this).notificationSettingDao(),
            nameDao = AppDatabase.getDatabase(this).nameDao()
        )

        // 초기 데이터 동기화
        lifecycleScope.launch {
            mobileNotificationReceiver.syncExistingData()
        }

        // DataClient 리스너 등록
        dataClient.addListener(mobileNotificationReceiver)

        // 한 번 더 동기화 시도
        mobileNotificationReceiver.syncExistingData()

        // 기존 레이아웃에 ComposeView 추가
        binding.root.addView(composeView, 0) // 최상단에 추가

        // 워치에 SSAID 전달
        sendSSAIDToConnectedNodes()
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun CustomTopBar(
        onLeftButtonClick: () -> Unit,
        onRightButtonClick: () -> Unit
    ) {
        TopAppBar(
            title = {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                     Icon(
                         painter = painterResource(id = R.drawable.logo), // 아이콘 리소스
                         contentDescription = "이어주다",
                         tint = MaterialTheme.colorScheme.onBackground,
                         modifier = Modifier.size(65.dp)
                     )
                }
            },
            navigationIcon = {
                IconButton(onClick = onLeftButtonClick) {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = "Menu",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
            },
            actions = {
                IconButton(onClick = onRightButtonClick) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Settings",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent,
                navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                titleContentColor = MaterialTheme.colorScheme.onBackground,
                actionIconContentColor = MaterialTheme.colorScheme.onBackground
            )
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isServiceBound) {
            try {
                isServiceBound = false
            } catch (e: IllegalArgumentException) {
                Log.e("MainActivity", "Service not registered: ${e.message}")
            }
        }
        dataClient.removeListener(mobileNotificationReceiver)
        mobileNotificationReceiver.cleanup()
    }

    private fun startHorizontalOrbitAnimation(
        smallSphereView: View,
        duration: Long,
        rotationDuration: Long
    ) {
        val centerX = binding.imageView.x + binding.imageView.width / 2f
        val centerY = binding.imageView.y + binding.imageView.height / 2f
        val radiusX = 100f
        val radiusY = 100f

        ValueAnimator.ofFloat(0f, 360f).apply {
            this.duration = rotationDuration
            repeatCount = ValueAnimator.INFINITE
            interpolator = null
            addUpdateListener { animation ->
                smallSphereView.rotation = animation.animatedValue as Float
            }
        }.start()
    }

    private fun startOrbitAnimations(
        sphereData: List<Triple<View, Triple<Pair<Float, Float>, Float, Long>, Boolean>>,
        rotationDurations: Map<View, Long>
    ) {
        val centerX = binding.imageView.x + binding.imageView.width / 2f
        val centerY = binding.imageView.y + binding.imageView.height / 2f - 30

        sphereData.forEach { (view, data, clockwise) ->
            val (radiusPair, tiltAngleDeg, duration) = data
            val (radiusX, radiusY) = radiusPair
            val tiltAngle = Math.toRadians(tiltAngleDeg.toDouble()).toFloat()
            val startAngle = if (clockwise) 0f else 360f
            val endAngle = if (clockwise) 360f else 0f

            ValueAnimator.ofFloat(startAngle, endAngle).apply {
                this.duration = duration
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.RESTART
                interpolator = null
                addUpdateListener { animation ->
                    val angle =
                        Math.toRadians((animation.animatedValue as Float).toDouble()).toFloat()
                    val x =
                        centerX + radiusX * cos(angle) * cos(tiltAngle) - radiusY * sin(angle) * sin(
                            tiltAngle
                        )
                    val y =
                        centerY + radiusX * cos(angle) * sin(tiltAngle) + radiusY * sin(angle) * cos(
                            tiltAngle
                        )

                    view.x = x - view.width / 2
                    view.y = y - view.height / 2
                    view.translationZ = if (cos(angle) > 0) -1f else 1f
                }
            }.start()

            rotationDurations[view]?.let { rotationDuration ->
                ValueAnimator.ofFloat(360f, 0f).apply {
                    this.duration = rotationDuration
                    repeatCount = ValueAnimator.INFINITE
                    addUpdateListener { animation ->
                        view.rotation = animation.animatedValue as Float
                    }
                }.start()
            }
        }
//        // 알림 설정 버튼 클릭 리스너
//        findViewById<MaterialButton>(R.id.btnNotificationSettings).setOnClickListener {
//            // SettingsActivity로 이동
//            val intent = Intent(this, SettingsActivity::class.java)
//            startActivity(intent)
//        }
//        // 알림 내역 버튼 클릭 리스너
//        findViewById<MaterialButton>(R.id.btnNotificationHistory).setOnClickListener {
//            val intent = Intent(this, NotificationHistoryActivity::class.java)
//            startActivity(intent)
//        }
    }

    private fun startAudioDetectionService() {
        if (!AudioDetectionService.isRunning()) {
            val intent = Intent(this, AudioDetectionService::class.java)
            startForegroundService(intent)
        }
    }

    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("권한 필요")
            .setMessage("이 앱은 오디오 감지와 알림 기능을 위해 마이크와 알림 권한이 필요합니다. 권한이 없으면 앱을 사용할 수 없습니다.")
            .setPositiveButton("설정") { _, _ ->
                permissionManager.openAppSettings(this)
            }
            .setNegativeButton("종료") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }

    override fun onResume() {
        super.onResume()
        if (!permissionManager.hasAllPermissions()) {
            if (!permissionManager.isFirstPermissionRequest()) {
                // 최초 실행이 아닐 때만 권한 거부 다이얼로그 표시
                showPermissionDeniedDialog()
            } else {
                // 최초 실행시에는 시스템 권한 요청
                permissionManager.requestPermissions(this)
            }
        } else if (!AudioDetectionService.isRunning()) {
            startAudioDetectionService()
        }
        mobileNotificationReceiver.syncExistingData()
    }

    // OnItemClickListener 인터페이스 구현
    override fun onChatRoomClick(roomId: String) {
        val intent = Intent(this, HistoryActivity::class.java).apply {
            putExtra("CHAT_ROOM_ID", roomId)
        }
        startActivity(intent)
    }

    // RecyclerView 설정에 추가할 코드
    private fun setupRecyclerView() {

        // RecyclerView 설정
        val recyclerView = binding.chatRoomRecyclerView
        recyclerView.layoutManager = LinearLayoutManager(this)

        // 어댑터 설정
        chatRoomAdapter = ChatRoomAdapter(mutableListOf(), this)
        binding.chatRoomRecyclerView.layoutManager = LinearLayoutManager(this@MainActivity)
        binding.chatRoomRecyclerView.adapter = chatRoomAdapter

        val itemTouchHelperCallback =
            object : ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.RIGHT) {
                private val deleteIcon: Drawable? = ContextCompat.getDrawable(
                    this@MainActivity,
                    R.drawable.baseline_delete_forever_24
                )
                private val background = ColorDrawable()
                private val backgroundColor = android.graphics.Color.parseColor("#90C1D8EF")

                override fun onMove(
                    recyclerView: RecyclerView,
                    viewHolder: RecyclerView.ViewHolder,
                    target: RecyclerView.ViewHolder
                ): Boolean {
                    return false
                }

                override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                    val position = viewHolder.adapterPosition
                    deleteChatRoom(position)
                }

                override fun onChildDraw(
                    c: Canvas,
                    recyclerView: RecyclerView,
                    viewHolder: RecyclerView.ViewHolder,
                    dX: Float,
                    dY: Float,
                    actionState: Int,
                    isCurrentlyActive: Boolean
                ) {
                    val itemView = viewHolder.itemView

                    // 아이템 자체를 먼저 그려서 항상 최상단에 표시되도록 함
                    super.onChildDraw(
                        c,
                        recyclerView,
                        viewHolder,
                        dX,
                        dY,
                        actionState,
                        isCurrentlyActive
                    )

                    // dX가 음수일 때(왼쪽으로 드래그할 때)는 배경과 아이콘을 그리지 않음
                    if (dX <= 0) return

                    val itemHeight = itemView.height

                    // 배경 그리기
                    background.color = backgroundColor
                    background.setBounds(
                        itemView.left,
                        itemView.top,
                        itemView.left + dX.toInt(),
                        itemView.bottom
                    )
                    background.draw(c)

                    // 아이콘 위치 설정 및 그리기
                    val deleteIconTop =
                        itemView.top + (itemHeight - deleteIcon!!.intrinsicHeight) / 2
                    val deleteIconMargin = (itemHeight - deleteIcon.intrinsicHeight) / 2
                    val deleteIconLeft = itemView.left + deleteIconMargin
                    val deleteIconRight = deleteIconLeft + deleteIcon.intrinsicWidth
                    val deleteIconBottom = deleteIconTop + deleteIcon.intrinsicHeight

                    deleteIcon.setBounds(
                        deleteIconLeft,
                        deleteIconTop,
                        deleteIconRight,
                        deleteIconBottom
                    )
                    deleteIcon.draw(c)

                    // 텍스트 그리기
                    val paint = Paint().apply {
                        color = android.graphics.Color.parseColor("#90FF0000")
                        textSize = 48f
                        isAntiAlias = true
                    }

                    val text = "삭제"
                    val textLeft = deleteIconRight + deleteIconMargin
                    val textBaseline = deleteIconTop + deleteIcon.intrinsicHeight / 2f -
                            (paint.descent() + paint.ascent()) / 2

                    c.drawText(text, textLeft.toFloat(), textBaseline, paint)
                }
            }
        val itemTouchHelper = ItemTouchHelper(itemTouchHelperCallback)
        itemTouchHelper.attachToRecyclerView(recyclerView)
    }

    private fun deleteChatRoom(position: Int) {
        val chatRooms = chatRoomAdapter.chatRooms.toMutableList()
        val removedChatRoom = chatRooms[position]

        lifecycleScope.launch {
            val db = ChatDatabase.getDatabase(applicationContext)
            db.messageDao().deleteChatRoom(removedChatRoom.roomId) // DB에서 대화방 삭제

            // UI 업데이트
            chatRooms.removeAt(position)
            chatRoomAdapter.chatRooms = chatRooms
            chatRoomAdapter.notifyItemRemoved(position)

            Log.d("MainActivity", "Chat room deleted: Room ID ${removedChatRoom.roomId}")
        }
    }

    // 시간 차이를 계산하여 문자열로 반환하는 함수
    fun formatTimeDifference(targetTime: String): String {
        val formatter =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm") // chatRoomTitle의 시간 형식에 맞게 조정
        val targetDateTime = LocalDateTime.parse(targetTime, formatter)
        val now = LocalDateTime.now()

        val duration = Duration.between(targetDateTime, now)
        val days = duration.toDays()
        val hours = duration.toHours()
        val minutes = duration.toMinutes()

        return when {
            days >= 1 -> "${days}일 전"
            hours >= 1 -> "${hours}시간 전"
            else -> "${minutes}분 전"
        }
    }

    private fun setupChatRoomObserver() {
        val db = ChatDatabase.getDatabase(applicationContext)

        lifecycleScope.launch {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                //모든 roomId를 가져오기
                db.messageDao().getAllRoomIds().collect { roomIds ->
                    // roomIds가 비어있지 않은 경우에만 처리
                    if (roomIds.isNotEmpty()) {
                        val chatRooms = roomIds.map { roomId ->
                            val messages = db.messageDao().getMessageForRoom(roomId).firstOrNull()
                                ?: emptyList()
                            if (messages.isNotEmpty()) {
                                var time = messages[0].chatRoomTitle
                                Log.d("ChatDataReceiver", "message:${messages} ")
                                Log.d("ChatDataReceiver", "setupChatRoomObserver:${time} ")
                                var timediff = formatTimeDifference(time)
                                ChatRoomAdapter.ChatRoom(
                                    roomId = roomId,
                                    title = messages[0].content.trimEnd('\n'),
                                    time = timediff
                                )
                            } else null
                        }.filterNotNull()

                        // UI 업데이트
                        withContext(Dispatchers.Main) {
                            chatRoomAdapter = ChatRoomAdapter(chatRooms, this@MainActivity)
                            binding.chatRoomRecyclerView.adapter = chatRoomAdapter

                            // 어댑터가 설정된 후 데이터가 있는지 로그로 확인
                            Log.d("MainActivity", "Chat rooms loaded: ${chatRooms.size}")
                            chatRooms.forEach { room ->
                                Log.d(
                                    "MainActivity",
                                    "Room ID: ${room.roomId}, Title: ${room.title}"
                                )
                            }
                        }
                    } else {
                        Log.d("MainActivity", "No chat rooms found")
                    }
                }
            }
        }
    }
    // 워치에 SSAID 전달
    private fun sendSSAIDToConnectedNodes() {
        val nodeClient = Wearable.getNodeClient(this)

        nodeClient.connectedNodes
            .addOnSuccessListener { nodes ->
                Log.d("MainActivity", "연결된 워치 노드 수: ${nodes.size}")

                // 연결된 모든 노드에 SSAID 전송
                nodes.forEach { node ->
                    Log.d("MainActivity", "노드 ID: ${node.id}, 이름: ${node.displayName}")

                    // SSAID 가져오기
                    val ssaid = getSSAID()
                    val messageClient = Wearable.getMessageClient(this)
                    messageClient.sendMessage(node.id, "/send_ssaid", ssaid.toByteArray())
                        .addOnSuccessListener {
                            Log.d("SSAID", "SSAID 전송 성공: 노드 ID - ${node.id}")
                        }
                        .addOnFailureListener { e ->
                            Log.e("SSAID", "SSAID 전송 실패: ${e.message}")
                        }
                }
            }
            .addOnFailureListener { e ->
                Log.e("SSAID", "워치 노드 가져오기 실패", e)
            }
    }

    @SuppressLint("HardwareIds")
    private fun getSSAID(): String {
        return Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "Unknown"
    }

}