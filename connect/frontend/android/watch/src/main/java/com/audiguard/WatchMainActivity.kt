package com.audiguard

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.speech.SpeechRecognizer
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleCoroutineScope
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.database.DatabaseProvider
import androidx.navigation.compose.rememberNavController
import androidx.room.Room
import androidx.wear.tooling.preview.devices.WearDevices
import com.audiguard.data.AppDatabase
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.ui.AlarmListScreen
import com.audiguard.ui.WearApp
import kotlinx.coroutines.launch
import com.audiguard.utils.AudioCapture
import com.audiguard.utils.NotificationWearReceiver
import com.audiguard.viewmodelfactory.AlarmListViewModelFactory
import com.audiguard.wear.utils.WearNotificationSyncManager
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.cancel

class WatchMainActivity : ComponentActivity() {
    private lateinit var viewModelFactory: AlarmListViewModelFactory
    private lateinit var notificationReceiver: NotificationWearReceiver
    private lateinit var permissionManager: PermissionManager

    private lateinit var wearNotificationSyncManager: WearNotificationSyncManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        installSplashScreen()
        permissionManager = PermissionManager(this)
        val isRecognitionAvailable = SpeechRecognizer.isRecognitionAvailable(this)
        Log.d("SpeechRecognition", "음성 인식 가능 여부: $isRecognitionAvailable")

        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestMicrophonePermission()
        } else {
            startAudioCapture()
        }
        setTheme(android.R.style.Theme_DeviceDefault)

        // Room 데이터베이스와 DAO 인스턴스 생성
        val database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            AppDatabase.DATABASE_NAME
        ).build()

        // SyncManager 초기화
        wearNotificationSyncManager = WearNotificationSyncManager(this)
        
        // Receiver 초기화
        notificationReceiver = NotificationWearReceiver(
            dataClient = Wearable.getDataClient(this),
            notificationDao = database.notificationHistoryDao(),
            settingDao = database.notificationSettingDao(),
            nameDao = database.nameDao()
        )


        // 데이터 모니터링 시작
        wearNotificationSyncManager.startAllDataMonitoring(
            scope = lifecycleScope,
            notificationDao = AppDatabase.getDatabase(this).notificationHistoryDao(),
            settingDao = AppDatabase.getDatabase(this).notificationSettingDao(),
            nameDao = AppDatabase.getDatabase(this).nameDao()
        )

        // 초기 데이터 동기화
        lifecycleScope.launch {
            notificationReceiver.syncExistingData()
        }

        // 리시버 등록
        Wearable.getDataClient(this).addListener(notificationReceiver)

        // 기존 데이터 동기화
        notificationReceiver.syncExistingData()

        val notificationDao = database.notificationHistoryDao()
        viewModelFactory = AlarmListViewModelFactory(notificationDao)

        // 알림 목록 로그
        lifecycleScope.launch {
            notificationDao.getAllHistory().collect { notifications ->
                notifications.forEach { notification ->
                    Log.d("Database", "Notification: $notification")
                }
            }
        }

        setContent {
            val view = LocalView.current
            // 화면 켜짐상태 유지
            DisposableEffect(Unit) {
                view.keepScreenOn = true
                // 화면을 벗어나면 onDispose 실행
                onDispose {
                    view.keepScreenOn = false
                }
            }
            WearApp(viewModelFactory = viewModelFactory)
        }
    }

    // 마이크 권한 확인
    private fun requestMicrophonePermission() {
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                startAudioCapture()
            } else {
                Toast.makeText(this, "마이크 권한이 필요합니다.", Toast.LENGTH_LONG).show()
            }
        }.launch(Manifest.permission.RECORD_AUDIO)
    }

    private fun startAudioCapture() {
        lifecycleScope.launch {
//            AudioCapture().startRecording()
        }
    }

    private var bound = false  // 클래스 멤버 변수로 추가

    override fun onDestroy() {
        super.onDestroy()
        if (bound) {
            try {
                unbindService(serviceConnection)
                bound = false
            } catch (e: Exception) {
                Log.e("AudioService", "Service unbinding failed", e)
            }
        }
        Wearable.getDataClient(this).removeListener(notificationReceiver)
        notificationReceiver.cleanup()
        lifecycleScope.cancel()
    }

    private var audioService: AudioDetectionService? = null

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            Log.d("AudioServiceLifecycle", "Service connected")
            val binder = service as AudioDetectionService.LocalBinder
            audioService = binder.getService()
            bound = true

            // 서비스 연결 후 Flow 구독
            lifecycleScope.launch {
                Log.d("AudioServiceLifecycle", "Setting up STT result flow collection")
                lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                    audioService?.sttResultFlow?.collect { result ->
                        Log.d("AudioServiceLifecycle", "Received STT result: $result")
                    }
                }
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            Log.d("AudioServiceLifecycle", "Service disconnected")
            audioService = null
            bound = false
        }
    }

    private fun startAudioDetectionService() {
        val intent = Intent(this, AudioDetectionService::class.java)

        Log.d("AudioServiceLifecycle", "Attempting to start AudioDetectionService")
        Log.d(
            "AudioServiceLifecycle",
            "Current service running state: ${AudioDetectionService.isRunning()}"
        )

        // 서비스가 실행중이 아닐 때만 시작
        if (!AudioDetectionService.isRunning()) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Log.d("AudioServiceLifecycle", "Starting foreground service (Android O+)")
                    startForegroundService(intent)
                } else {
                    Log.d("AudioServiceLifecycle", "Starting regular service (Pre-Android O)")
                    startService(intent)
                }
            } catch (e: Exception) {
                Log.e("AudioServiceLifecycle", "Failed to start service", e)
            }
        }

        // 바인딩 시도
        try {
            Log.d("AudioServiceLifecycle", "Attempting to bind service")
            bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
            bound = true
            Log.d("AudioServiceLifecycle", "Service bound successfully")
        } catch (e: Exception) {
            Log.e("AudioServiceLifecycle", "Service binding failed", e)
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
        Log.d("AudioServiceLifecycle", "Activity onResume")
        notificationReceiver.syncExistingData()
        if (!permissionManager.hasAllPermissions()) {
            Log.d("AudioServiceLifecycle", "Missing permissions, checking first request")
            if (!permissionManager.isFirstPermissionRequest()) {
                Log.d("AudioServiceLifecycle", "Showing permission denied dialog")
                showPermissionDeniedDialog()
            } else {
                Log.d("AudioServiceLifecycle", "Requesting permissions")
                permissionManager.requestPermissions(this)
            }
        } else if (!AudioDetectionService.isRunning()) {
            Log.d("AudioServiceLifecycle", "Permissions granted, starting service")
            startAudioDetectionService()
        } else {
            Log.d("AudioServiceLifecycle", "Service already running")
        }
    }
}

//@Preview(device = WearDevices.SMALL_ROUND, showSystemUi = true)
//@Composable
//fun DefaultPreview() {
//    WearApp()
//}