package com.audiguard

import android.Manifest
import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.text.SpannableString
import android.text.Spanned
import android.text.method.LinkMovementMethod
import android.text.method.ScrollingMovementMethod
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.util.Log
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.ui.graphics.vector.VectorProperty
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.room.Room
import com.audiguard.ChatData.ChatDatabase
import com.audiguard.ChatData.Message
import com.audiguard.RestApi.GenerateSentenceRequest
import com.audiguard.RestApi.GenerateSentenceResponse
import com.audiguard.RestApi.RetrofitInstance
import com.audiguard.RestApi.SaveSentenceRequest
import com.audiguard.databinding.ActivityChatBinding
import com.audiguard.messageQue.RabbitMqPublisher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import android.speech.tts.UtteranceProgressListener
import com.google.android.flexbox.FlexDirection
import com.google.android.flexbox.FlexWrap
import com.google.android.flexbox.FlexboxLayoutManager
import android.provider.Settings
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.text.style.StyleSpan
import com.audiguard.Sse.GenerateSseSentenceResponse
import com.audiguard.Sse.RetrofitSseInstance
import com.audiguard.Sse.RetrofitSseInstance.BASE_URL
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response

class ChatActivity : AppCompatActivity(), onAnswerClickListener ,onWordClickListener{

    private lateinit var binding: ActivityChatBinding
    private lateinit var db: ChatDatabase
    private lateinit var chatRoomId: String
    private var createdAt: String =""
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private var partialResult = ""
    private var result = ""
    private var wordStart : Int = 0
    private var wordEnd :Int = 0
    private var answerPosition : Int = 0
    private var voiceData : String = ""
    private var textData : String = ""
    private var isRotated : Boolean = false
    private var isTextviewRotated : Boolean = false
    private lateinit var answerSseAdapter : ExpectedSseAnswerAdapter
    private var ismute : Boolean = false
    private var tts: TextToSpeech? = null // TTS 객체 추가
    private var isPlayingTTS = false // TTS 재생 중인지 여부 확인
    private var isSend = false
    private var lastAmplitude = 0f
    private lateinit var ssaid : String
    private var isMicOn: Boolean = false

    private var answerBuilders = mutableMapOf<Int, StringBuilder>()  // 답변별 텍스트 빌더
    private var relatedWords = mutableMapOf<Int, Map<String, Map<String, Int>>>()  // 답변별 관련 단어

    @RequiresApi(Build.VERSION_CODES.S)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.expectedRecyclerView.layoutManager = LinearLayoutManager(this)
       // binding.wordRecyclerView.layoutManager = LinearLayoutManager(this,LinearLayoutManager.HORIZONTAL,false)
        //binding.wordRecyclerView.layoutManager = GridLayoutManager(this, 2)
        binding.wordRecyclerView.layoutManager = FlexboxLayoutManager(this).apply {
            flexDirection = FlexDirection.ROW // 수평으로 아이템을 배치
            flexWrap = FlexWrap.WRAP // 아이템이 화면을 초과하면 줄바꿈
        }
//        binding.wordRecyclerView.addItemDecoration(object : RecyclerView.ItemDecoration() {
//            override fun getItemOffsets(
//                outRect: Rect, view: View, parent: RecyclerView, state: RecyclerView.State
//            ) {
//                outRect.right = -20
//            }
//        })

        // SSaid 가져오기
        ssaid = getSSaid(this)
        Log.d("SSAID", "${ssaid}")

        //현재의 채팅방 id
        chatRoomId = intent.getStringExtra("CHAT_ROOM_ID") ?: ""
        // 현재 시간 가져오기 및 포맷팅
        createdAt  = SimpleDateFormat("yyyy.MM.dd HH:mm", Locale.getDefault()).format(Date())


        db = Room.databaseBuilder(
            applicationContext,
            ChatDatabase::class.java,"chat-database"
        ).build()


        binding.bottomTextview.movementMethod = ScrollingMovementMethod.getInstance()
        binding.topTextview.movementMethod = ScrollingMovementMethod.getInstance()
        val keyboardOverlay = binding.keyboardOverlay
        val rootLayout = binding.rootLayout

        binding.topTextview.hint="상대방의 음성을 입력해주세요."

        binding.btnMoveToHistory.setOnClickListener {
            val intent = Intent(this, HistoryActivity::class.java).apply {
                putExtra("CHAT_ROOM_ID", chatRoomId)
            }
            startActivity(intent)
        }
        // 회전버튼 동작
        binding.rotation.setOnClickListener {
            //원상태로.
            if(isRotated){
                //binding.rotation.setBackgroundResource(R.drawable.baseline_text_rotate_up_24)
                //텍스트뷰가 돌아가있는경우 원상태로.
                binding.topTextview.rotation=0f
                //binding.layoutTop.rotation = 0f
//                isRotated = false
//                binding.bottomTextview.rotation=0f
                binding.layoutTop.animate()
                    .rotation(0f)
                    .setDuration(500)
                    .withEndAction{
                        isRotated = false
                    }.start()

                binding.bottomTextview.animate()
                    .rotation(0f)
                    .setDuration(500)
                    .withEndAction{
                    }.start()
                
                //회전
            }else {
                //binding.rotation.setBackgroundResource(R.drawable.baseline_text_rotation_none_24)
                //binding.layoutTop.rotation = 180f
                binding.layoutTop.animate()
                    .rotation(180f)
                    .setDuration(500)
                    .withEndAction{
                        isRotated = true
                    }.start()

//                if(!isListening && binding.topTextview.text.isNotEmpty()){
//                    binding.topTextview.rotation=180f
//                }


                binding.bottomTextview.animate()
                    .rotation(180f)
                    .setDuration(500)
                    .withEndAction{
                    }.start()

            }
        }
        // 음소거 토글동작
        binding.mute.setOnClickListener {
            if(ismute){
                ismute = false
                binding.mute.setBackgroundResource(R.drawable.round_volume_up_24)
            }else{
                ismute = true
                binding.mute.setBackgroundResource(R.drawable.round_volume_off_24)
            }
            //Toast.makeText(this, "${ismute}", Toast.LENGTH_SHORT).show()
        }

        checkPermission()
        setupSpeechRecognizer()

        // 토글 버튼 동작
        binding.btnRecording.setOnClickListener {
            if (isListening) {
                binding.layoutTop.setBackgroundResource(R.drawable.radius_textview_blue)
                binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview)

                stopSpeechRecognition()
            } else {
                binding.topTextview.hint = ""
                //음성입력받기 시작할때는 상대방이 똑바로 보이도록.
                if(isRotated){
                    binding.topTextview.rotation = 0f
                }
                result=""
                binding.topTextview.text=""
                isListening = true
                binding.btnRecording.setBackgroundResource(R.drawable.baseline_mic_24)
                startSpeechRecognition()
            }
        }

        // EditText에 포커스가 갔을 때 TextView가 다시 나에게 보이도록 회전 설정
        binding.text.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                binding.bottomTextview.rotation = 0f
            }
        }


        rootLayout.viewTreeObserver.addOnGlobalLayoutListener {
            val rect = Rect()
            rootLayout.getWindowVisibleDisplayFrame(rect)
            val screenHeight = rootLayout.height
            val keypadHeight = screenHeight - rect.bottom

            if (keypadHeight > screenHeight * 0.15) {
                keyboardOverlay.translationY = -keypadHeight.toFloat()
            } else {
                keyboardOverlay.translationY = 0f
            }
        }
        //로고 버튼
        binding.logo.setOnClickListener {
            finish()  // 현재 액티비티 종료
        }
        //clear버튼
        binding.clear.setOnClickListener {
            binding.topTextview.text=""
            result=""
        }
        //tts재생 버튼
        binding.play.setOnClickListener{
            if (isPlayingTTS) {
                stopTTS()
            } else {
                startTTS(binding.bottomTextview.text.toString())
            }
        }

        //텍스트 전송
        binding.send.setOnClickListener {

            val inputText = binding.text.text.toString()

            //회전상태면 아래텍스트 회전시켜주기.
            if(isRotated){
                binding.bottomTextview.rotation=180f
            }



            binding.bottomTextview.text = inputText

            //텍스트 입력했으면
            if(inputText.isNotEmpty()) {
                saveData(2)
                //듣고있는 상태에서는 초기화하면 안됨
                if(!isListening) {
                    binding.topTextview.text = "" //이거 없으면 계쏙쌓임.
                    result = ""
                }
                //play버튼 보이도록
                binding.play.visibility = View.VISIBLE

                //뮤트아니면
                if(!ismute){
                    //tts동작.
                    isSend = true
                    startTTS(inputText) // TTS로 텍스트 읽기.
                }else{
                    if (!isListening) {
                        lifecycleScope.launch {
                            isListening=true
                            if(isRotated){
                                binding.topTextview.rotation = 0f
                            }
                            startSpeechRecognition()
                            binding.btnRecording.setBackgroundResource(R.drawable.baseline_mic_24)
                        }
                    }
                }

            }else{
                //입력된 값이 없으면.
                binding.play.visibility = View.GONE
            }

            // 데이터가 없을 때 recyclerview 대신 TextView 표시
            binding.bottomTextview.visibility = View.VISIBLE
            binding.expectedRecyclerView.visibility = View.GONE

            binding.text.text = null

            hideWordLayer()
        }

        // TTS 초기화
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val result = tts?.setLanguage(Locale.KOREAN)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e("TTS", "언어 지원하지 않음")
                } else {
                    Log.d("TTS", "TTS 초기화 성공")
                }

                // TTS UtteranceProgressListener 설정
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        runOnUiThread {
                            if (isListening) {
                                lifecycleScope.launch {
                                    binding.btnRecording.isEnabled=false
                                    //stop대신 잠깐 멈추기.
                                    delay(100)
                                    speechRecognizer?.cancel() // 현재 작업 취소
                                    isListening = false
                                    binding.layoutTop.setBackgroundResource(R.drawable.radius_textview_blue)
                                    binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview)
                                    binding.btnRecording.setBackgroundResource(R.drawable.baseline_mic_none_24)
                                    binding.visualizerView.clearAmplitudes()
                                    binding.visualizerCircleView.clearAmplitudes()
                                }
                            }
                            binding.play.setBackgroundResource(R.drawable.round_stop_24)
                        }
                    }

                    override fun onDone(utteranceId: String?) {
                        runOnUiThread {
                            binding.play.setBackgroundResource(R.drawable.round_play_arrow_24)
                            isPlayingTTS = false
                            if (!isListening) {
                                lifecycleScope.launch {
                                    binding.btnRecording.isEnabled=true
                                    delay(100)
                                    isListening=true
                                    if(isRotated){
                                        binding.topTextview.rotation = 0f
                                    }
                                    startSpeechRecognition()
                                    binding.layoutTop.setBackgroundResource(R.drawable.radius_textview)
                                    binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview_blue)
                                    binding.btnRecording.setBackgroundResource(R.drawable.baseline_mic_24)
                                }
                            }
//                            if (isSend) {
//                                // 음성 입력 자동 시작
//                                resetSpeechRecognizer()
//                                startContinuousSpeechRecognition()
//                                isSend = false
//                            }
                        }
                    }

                    override fun onError(utteranceId: String?) {
                        runOnUiThread {
                            binding.play.setBackgroundResource(R.drawable.round_play_arrow_24)
                            isPlayingTTS = false
                        }
                    }
                })
            } else {
                Log.e("TTS", "TTS 초기화 실패")

            }
        }


    }
    // TTS로 텍스트 읽기 함수
    private fun startTTS(text: String) {
        val params = Bundle()
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "UniqueID")
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "UniqueID")
        isPlayingTTS = true
        binding.play.setBackgroundResource(R.drawable.round_stop_24) // 버튼 텍스트를 Stop으로 변경
    }

    // TTS 정지 함수
    private fun stopTTS() {
        tts?.stop()
        isPlayingTTS = false
        binding.play.setBackgroundResource(R.drawable.round_play_arrow_24)// 버튼 텍스트를 Play로 변경
    }

    private fun checkPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    fun saveSentenceAsync(userId: String) {
        lifecycleScope.launch(Dispatchers.IO)  {
            val publisher = RabbitMqPublisher(this@ChatActivity)
            try {
                lifecycleScope.launch(Dispatchers.IO)  {
                    Log.d("API_RESPONSE", " ${voiceData} ${textData}" )
                    publisher.publishMessage(voiceData, textData)
                    voiceData=""
                    textData=""
                }
            } catch (e: Exception) {
                Log.e("API_SAVE_ERROR", "API 호출 중 에러 발생", e)
            }
        }

    }

    private fun getSSaid(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
    }
    @RequiresApi(Build.VERSION_CODES.S)
    private fun setupSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            try {
                if (SpeechRecognizer.isOnDeviceRecognitionAvailable(this)) {
                    speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(this)
                } else {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
                }
            } catch (e: UnsupportedOperationException) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            }
        } else {
            return
        }
        setupRecognitionListener()
    }

    //음성관련
    private fun setupRecognitionListener() {

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                //binding.topTextview.text = "듣고 있습니다..."
            }

            override fun onBeginningOfSpeech() {}

            override fun onRmsChanged(rmsdB: Float) {
                val targetAmplitude = if (rmsdB < 0) 0f else rmsdB
                // 현재 amplitude와 목표 amplitude 사이를 부드럽게 보간
                val smoothedAmplitude = lastAmplitude + (targetAmplitude - lastAmplitude) * 0.3f
                lastAmplitude = smoothedAmplitude

                binding.visualizerView.updateAmplitude(smoothedAmplitude)
                binding.visualizerCircleView.updateAmplitude(smoothedAmplitude)
            }

            override fun onBufferReceived(p0: ByteArray?) {}

            override fun onEndOfSpeech() {
                if (isListening) {
                    startSpeechRecognition()
                }
            }

            @RequiresApi(Build.VERSION_CODES.O)
            @SuppressLint("SetTextI18n")
            override fun onError(error: Int) {
                when (error) {
                    SpeechRecognizer.ERROR_NO_MATCH -> {
                        if (isListening) {
                            lifecycleScope.launch {
                                delay(100)
                                startSpeechRecognition()
                            }
                        }
                    }
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> {
                        if (isListening) {
                            lifecycleScope.launch {
                                delay(100)
                                speechRecognizer?.cancel() // 현재 작업 취소
                                delay(100)
                                startSpeechRecognition()
                            }
                        }
                    }
                    SpeechRecognizer.ERROR_CLIENT -> {
                        if (isListening) {
                            lifecycleScope.launch {
                                delay(100)
                                startSpeechRecognition()
                            }
                        }
                    }
                    else -> {
                        if (isListening) {
                            lifecycleScope.launch {
                                delay(100)
                                startSpeechRecognition()
                            }
                        }
                    }
                }
                // 오류 발생해도 시각화가 계속되도록
                if (isListening) {
                    val decayRate = 0.95f  // 95%씩 감소
                    lastAmplitude *= decayRate  // 부드럽게 감소
                    binding.visualizerView.updateAmplitude(lastAmplitude)
                    binding.visualizerCircleView.updateAmplitude(lastAmplitude)
                }


                val message = when (error) {
                    SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "언어 모델이 사용 불가"
                    SpeechRecognizer.ERROR_AUDIO -> "오디오 에러"
                    SpeechRecognizer.ERROR_CLIENT -> "클라이언트 에러"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "권한 없음"
                    SpeechRecognizer.ERROR_NETWORK -> "네트워크 에러"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "네트워크 타임아웃"
                    SpeechRecognizer.ERROR_NO_MATCH -> "음성 인식 실패"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RECOGNIZER가 바쁨"
                    SpeechRecognizer.ERROR_SERVER -> "서버 에러"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "말하는 시간 초과"
                    else -> "알 수 없는 에러 ($error)"
                }
                Log.d("SpeechRecognizer", "Error: $message")
            }
            override fun onPartialResults(partialResults: Bundle?) {
                val partial = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!partial.isNullOrEmpty()) {
                    partialResult = partial[0]
                    binding.topTextview.text = result + partialResult // 전체 + 부분 결과 표시

                    // 스크롤을 최신 텍스트로 자동으로 내리기
                    binding.topTextview.post {
                        val scrollAmount = binding.topTextview.layout.getLineTop(binding.topTextview.lineCount) - binding.topTextview.height + (binding.topTextview.lineHeight * 1.5).toInt()
                        if (scrollAmount > 0) {
                            binding.topTextview.scrollTo(0, scrollAmount)
                        } else {
                            binding.topTextview.scrollTo(0, 0)
                        }
                    }
                }
                Log.d("ERRRRR", "Partial: $partialResult")
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val text = matches[0]
                    result += "$text\n" // 전체 결과 업데이트
                    partialResult = "" // partialResult 초기화
                    binding.topTextview.text = result

                    // 스크롤을 최신 텍스트로 자동으로 내리기
                    binding.topTextview.post {
                        val scrollAmount = binding.topTextview.layout.getLineTop(binding.topTextview.lineCount) - binding.topTextview.height + (binding.topTextview.lineHeight * 1.5).toInt()
                        if (scrollAmount > 0) {
                            binding.topTextview.scrollTo(0, scrollAmount)
                        } else {
                            binding.topTextview.scrollTo(0, 0)
                        }
                    }
                    Log.d("ERRRRR", binding.topTextview.text.toString())
                }
                if (isListening) {
                    startSpeechRecognition()
                }
            }

            override fun onEvent(p0: Int, p1: Bundle?) {}
        })
    }

    private fun startSpeechRecognition() {

        // 마이크 리소스가 완전히 해제되도록 짧은 대기
        lifecycleScope.launch {
            AudioDetectionService.pauseAudioDetection() // 백그라운드 오디오 감지 일시 중지
            if (isListening) {
                isMicOn = true
                binding.layoutTop.setBackgroundResource(R.drawable.radius_textview)
                binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview_blue)
            }
            delay(200) // 200ms 대기



            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            }

            try {
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                Log.e("SpeechRecognition", "Error starting speech recognition", e)
                if (isListening) {
                    lifecycleScope.launch {
                        delay(500)
                        startSpeechRecognition()
                    }
                }
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun stopSpeechRecognition(isError: Boolean = false) {
        //음성인식이 진행중인데 멈춤버튼 클릭했거나 오류상황인경우에만 멈추는 동작.
        //중복호출 방지.
        binding.layoutTop.setBackgroundResource(R.drawable.radius_textview_blue)
        binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview)
        if (!isListening && !isError) return
        if (isError) {
            binding.layoutTop.setBackgroundResource(R.drawable.radius_textview_blue)
            binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview)
        }
//        binding.layoutTop.setBackgroundResource(R.drawable.radius_textview_blue)
//        binding.layoutBottom.setBackgroundResource(R.drawable.radius_textview)

        isMicOn = false
        try {

            lifecycleScope.launch {

                delay(200) // 마이크 리소스가 완전히 해제되도록 짧은 대기
                AudioDetectionService.resumeAudioDetection()

            }

            //binding.topTextview.text = "음성 인식이 중지되었습니다"

            //회전이면 텍스트를 사용자가 볼수 있게 다시 회전회주기.
            if(isRotated) {
                // 텍스트뷰를 180도 회전시켜서 정상적으로 보이게 함
                binding.topTextview.rotation = 180f
            }

            binding.visualizerView.clearAmplitudes()
            binding.visualizerCircleView.clearAmplitudes()

            isListening = false
            Log.d("ERRRRR", "stopSpeechRecognition: ${isListening}이게 false여야함")
            speechRecognizer?.stopListening()

            binding.btnRecording.setBackgroundResource(R.drawable.baseline_mic_none_24)

            //새로운 단어 띄우기 위해서 리사이클러뷰(단어 목록) 초기화해주기.
            (binding.wordRecyclerView.adapter as? ExpectedWordAdapter)?.apply {
                clearData() // 어댑터에서 데이터 리스트를 비우는 메서드 호출
                notifyDataSetChanged() // RecyclerView 갱신
            }
            var contentText = binding.topTextview.text.toString().trimEnd('\n')
//            contentText = "뭐 먹을래?"

            if (contentText.isNotEmpty()) {
                saveData(1)

                //답변 생성중에는 재생버튼 없애기.
                binding.play.visibility=View.GONE

                // coroutine으로 비동기 처리.
                lifecycleScope.launch {
                    try {

                        // 네트워크 연결 상태 확인
                        if (isNetworkAvailable()) {
                            showAnswer()
                        } else {
                            // 네트워크 연결이 없을 때의 처리
                            withContext(Dispatchers.Main) {

                                binding.loadingLayout.visibility = View.GONE
                                binding.bottomTextview.visibility = View.VISIBLE
                                binding.expectedRecyclerView.visibility = View.GONE
                                binding.wordLayout.visibility = View.GONE
                                //binding.bottomTextview.text = "인터넷 연결이 없습니다. 네트워크 상태를 확인해주세요."
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("SpeechRecognition", "답변 생성 중 오류 발생", e)

                    }
                }
            }
        } catch (e: Exception) {
            Log.e("SpeechRecognition", "음성 인식 중지 중 오류 발생", e)
            isListening = false
            binding.btnRecording.setBackgroundResource(R.drawable.baseline_mic_none_24)
        }
    }
    // 네트워크 연결 상태 확인 함수
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            return networkInfo.isConnected
        }
    }
    private suspend fun showAnswer() = withContext(Dispatchers.Main) {
        try {
            // 네트워크 연결 상태 한번 더 확인
            if (!isNetworkAvailable()) {
                binding.loadingLayout.visibility = View.GONE
                binding.bottomTextview.visibility = View.VISIBLE
                binding.expectedRecyclerView.visibility = View.GONE
                binding.wordLayout.visibility = View.GONE
                //binding.bottomTextview.text = "인터넷 연결이 없습니다. 네트워크 상태를 확인해주세요."
                return@withContext
            }
            // 로딩 표시
            binding.loadingLayout.visibility = View.VISIBLE
            binding.bottomTextview.visibility = View.GONE
            binding.expectedRecyclerView.visibility = View.GONE
            binding.wordLayout.visibility = View.GONE

            answerSseAdapter = ExpectedSseAnswerAdapter(this@ChatActivity, mutableListOf(), this@ChatActivity)
            binding.expectedRecyclerView.adapter = answerSseAdapter

            startSseConnection() // API 호출이 완료될 때까지 대기

        } catch (e: Exception) {
            Log.e("ChatActivity", "showAnswer 에러", e)
            // 에러 시 UI 처리
            withContext(Dispatchers.Main) {
                binding.loadingLayout.visibility = View.GONE
                binding.bottomTextview.visibility = View.VISIBLE
                binding.expectedRecyclerView.visibility = View.GONE
                binding.wordLayout.visibility = View.GONE
                //Toast.makeText(this@ChatActivity, "답변 생성에 실패했습니다", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun startSseConnection() {
        answerBuilders = mutableMapOf()  // 답변별 텍스트 빌더
        relatedWords = mutableMapOf()  // 답변별 관련 단어

        val requestBody = Json.encodeToString(
            GenerateSentenceRequest(
                sentence = binding.topTextview.text.toString(),
                user_id = ssaid
            )
        )

        val mediaType = "application/json; charset=utf-8".toMediaType()
        val body = requestBody.toRequestBody(mediaType)

        val request = Request.Builder()
            .url("${BASE_URL}/generate/sentence/stream/")
            .post(body)  // POST 메서드로 변경
            .addHeader("Accept", "text/event-stream")  // SSE 헤더 추가
            .build()

        Log.d("SSE", "Try Connection")

        RetrofitSseInstance.sseInstance.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("SSE", "Connection failed", e)
                runOnUiThread {
                    // 에러 처리
                    binding.loadingLayout.visibility = View.GONE
                    binding.bottomTextview.visibility = View.VISIBLE
                    binding.expectedRecyclerView.visibility = View.GONE
                    binding.wordLayout.visibility = View.GONE
                }
            }

            override fun onResponse(call: Call, response: Response) {
                var isFirstResponse = true  // 첫 응답 체크용 flag

                response.body?.source()?.let { source ->
                    while (!source.exhausted()) {
                        val line = source.readUtf8Line() ?: continue
                        if (line.startsWith("data:")) {
                            Log.d("SSE Response line ", line)
                            val data = line.substring(5).trim()

                            try {
                                val answer = Json.decodeFromString<GenerateSseSentenceResponse>(data)

                                if (isFirstResponse) {
                                    Log.d("SSE", "isFirstResponse")
                                    runOnUiThread {
                                        binding.loadingLayout.visibility = View.GONE
                                        binding.bottomTextview.visibility = View.GONE
                                        binding.expectedRecyclerView.visibility = View.VISIBLE
                                        binding.wordLayout.visibility = View.GONE
                                    }
                                    isFirstResponse = false
                                }

                                runOnUiThread {
                                    handleSseResponse(answer)
                                }
                            } catch (e: Exception) {
                                Log.e("SSE", "Error parsing data: $data", e)
                            }
                        }
                    }
                }
            }
        })
    }

    private fun handleSseResponse(response: GenerateSseSentenceResponse) {
        response.sentence_order -= 1
        when (response.status) {
            "streaming" -> {
                val order = response.sentence_order
                val answerBuilder = answerBuilders.getOrPut(order) { StringBuilder() }
                response.data?.let {
                    answerBuilder.append(it.jsonPrimitive.content)
                    answerSseAdapter.updateOrAddAnswer(order, answerBuilder.toString())
                }
            }
            "completed" -> {
                val order = response.sentence_order
                val finalAnswer = answerBuilders[order]?.toString() ?: return
                Log.d("SSE", "Answer $order completed: $finalAnswer")
            }
            "word" -> {
                val order = response.sentence_order
                response.data?.let { jsonElement ->
                    val wordsMap = jsonElement.jsonObject.map { (key, value) ->
                        key to value.jsonObject.map { (k, v) ->
                            k to v.jsonPrimitive.int
                        }.toMap()
                    }.toMap()
                    relatedWords[order] = wordsMap
                }
            }
        }
    }

    // 관련 단어 Map을 List<List<String>> 형식으로 변환
    private fun convertToWordList(words: Map<String, Map<String, Int>>): List<List<String>> {
        return words.map { (key, alternatives) ->
            listOf(key) + alternatives.keys.toList()
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        tts?.stop()
        tts?.shutdown()
        AudioDetectionService.resumeAudioDetection()
    }

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }

    //기록보기 위한 데이터 저장.
    private fun saveData(isUser : Int) {
        val contentText:String
        //1이면 음성, 2면 텍스트.
        if(isUser==1){
            //대답하기 전까지만 음성데이터 저장하기.
            if(textData.isEmpty()) {
                voiceData += binding.topTextview.text.toString()
            }
            contentText = binding.topTextview.text.toString().trimEnd('\n')
        }
        else {
            //질문이 들어와있을때 대답 저장하기.
            if(voiceData.isNotEmpty()){
                textData += binding.bottomTextview.text.toString()
                if(isNetworkAvailable()) {
                        //대답 저장api
                        saveSentenceAsync(ssaid)
                    }
            }
            contentText = binding.bottomTextview.text.toString().trimEnd('\n')
        }
        Log.d("dddd",contentText)
        if(contentText.isNotEmpty()) {
            val message = Message(
                content = contentText,
                isUser = isUser,
                chatRoomId = chatRoomId,
                chatRoomTitle = createdAt
            )
            lifecycleScope.launch(Dispatchers.IO){
                try {
                    db.messageDao().insertMessage(message)
                    Log.d("Database", "Message inserted successfully")
                } catch (e: Exception) {
                    Log.e("Database", "Error inserting message: ${e.message}")
                }
            }
        }
    }

    // 예상 답변 클릭 시 호출
    override fun onAnswerClick(answer: String, position: Int) {
        answerPosition = position
        binding.text.setText(answer) // 선택한 답변을 EditText에 설정
        binding.text.setSelection(answer.length) // 커서를 텍스트 끝으로 이동

        val words = relatedWords[position]
        val wordGroups = if (words != null) {
            convertToWordList(words)
        } else {
            emptyList() // 관련 단어가 없으면 빈 리스트 전달
        }

        Log.d("SSE Click", position.toString())
        Log.d("SSE Click", words.toString())
        Log.d("SSE Click", wordGroups.toString())

        makeSpannableString(answer, wordGroups)
        showWordLayer(answer)
    }

    private fun makeSpannableString(sentence: String, wordGroups: List<List<String>?>, selectedWord: String? = null): SpannableString {
        val spannable = SpannableString(sentence)

        wordGroups.forEachIndexed { groupIndex, wordGroup ->
            wordGroup?.forEach { word ->
                var startIndex = sentence.indexOf(word)
                while (startIndex != -1) {  // 유효한 위치를 찾을 때만 실행
                    val endIndex = startIndex + word.length

                    spannable.setSpan(object : ClickableSpan() {
                        private val clickedStart = startIndex
                        private val clickedEnd = endIndex

                        override fun onClick(widget: View) {
                            wordStart = clickedStart
                            wordEnd = clickedEnd
                            Log.e("ClickableSpan", "Clicked word: $word, start: $wordStart, end: $wordEnd")

                            val alternativeWord = wordGroup.filter { it != word }
                            updateAlternativeWord(alternativeWord, groupIndex)

                            // 이전의 모든 RelativeSizeSpan 제거
                            val relativeSizeSpans = spannable.getSpans(0, spannable.length, RelativeSizeSpan::class.java)
                            for (span in relativeSizeSpans) {
                                spannable.removeSpan(span)
                            }

                            // 클릭된 단어에만 크기 조정 적용
                            spannable.setSpan(
                                RelativeSizeSpan(1.2f),
                                wordStart,
                                wordEnd,
                                Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                            )

                            binding.selectedAnswer.text = spannable
                        }

                        override fun updateDrawState(ds: android.text.TextPaint) {
                            ds.isUnderlineText = true // 밑줄만 적용
                            ds.bgColor = Color.TRANSPARENT // 터치다운 시 배경색 없음
                        }
                    }, startIndex, endIndex, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

                    // 변경가능한 모든 단어에 Bold style 추가
                    spannable.setSpan(
                        StyleSpan(android.graphics.Typeface.BOLD),
                        startIndex,
                        endIndex,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                    // `selectedWord`가 설정되어 있고 현재 단어가 동일한 경우 `wordStart`, `wordEnd`로 일치 위치 강조
                    if (selectedWord == word && startIndex == wordStart) {
                        spannable.setSpan(
                            RelativeSizeSpan(1.2f),
                            startIndex,
                            endIndex,
                            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                        )

                    }

                    startIndex = sentence.indexOf(word, endIndex)
                }
            }
        }
        binding.selectedAnswer.text = spannable
        binding.selectedAnswer.movementMethod = LinkMovementMethod.getInstance()
        binding.selectedAnswer.isClickable = true
        binding.selectedAnswer.isFocusable = false

        return spannable
    }

    private fun updateAlternativeWord(alternativeWords: List<String>, groupIndex: Int) {
        val words = relatedWords[answerPosition] ?: return  // relatedWords 사용
        val wordGroups = convertToWordList(words)
        if (groupIndex >= wordGroups.size) return

        val allWords = wordGroups[groupIndex]?.toMutableList() ?: mutableListOf()
        allWords.addAll(alternativeWords.filter { it !in allWords })

        val wordAdapter = ExpectedWordAdapter(this, allWords, this)
        binding.wordRecyclerView.adapter = wordAdapter
        binding.wordLayout.visibility = View.VISIBLE
    }

    // wordLayer에 단어 목록을 표시하는 함수
    private fun showWordLayer(selectedAnswer:String) {
        binding.bottomTextview.visibility = View.GONE
        binding.expectedRecyclerView.visibility = View.GONE
        binding.wordLayout.visibility = View.VISIBLE

    }

    // wordLayout을 숨기고 다른 뷰를 다시 보이게 하는 함수
    private fun hideWordLayer() {
        (binding.wordRecyclerView.adapter as? ExpectedWordAdapter)?.apply {
            clearData() // 어댑터에서 데이터 리스트를 비우는 메서드 호출
            notifyDataSetChanged() // RecyclerView 갱신
        }
        binding.wordLayout.visibility = View.GONE
        binding.bottomTextview.visibility = View.VISIBLE
    }

    // 단어의 받침 유무를 확인하는 함수
    fun hasFinalConsonant(word: String): Boolean {
        val lastChar = word.last()
        return (lastChar.code - 0xAC00) % 28 != 0  // 받침 유무 확인
    }

    // 조사 맞춤법을 적용하는 함수
    fun getCorrectParticle(word: String, particleType: String): String {
        val hasFinalConsonant = hasFinalConsonant(word)

        return when (particleType) {
            "을 ", "를 " -> if (hasFinalConsonant) "을 " else "를 "
            "이 ", "가 " -> if (hasFinalConsonant) "이 " else "가 "
            "은 ", "는 " -> if (hasFinalConsonant) "은 " else "는 "
            else -> particleType // 조사가 없거나 변경이 필요 없는 경우
        }
    }

    // 대체어 클릭 시 문장에서 단어 교체 및 대체어 목록 유지
    override fun onWordClick(selectedWord: String) {
        try {
            val currentText = binding.selectedAnswer.text.toString()
            if (wordStart in 0 until currentText.length && wordEnd in wordStart..currentText.length) {
                // 선택된 단어로 문장 업데이트
                var updatedText = currentText.substring(0, wordStart) + selectedWord + currentText.substring(wordEnd)

                // 조사 처리: 선택된 단어 뒤에 조사 "을", "를", "이", "가", "은", "는"이 있으면 맞는 조사로 변경
                val remainingText = updatedText.substring(wordStart + selectedWord.length)
                val particleMatch = Regex("^(을 |를 |이 |가 |은 |는 )").find(remainingText)

                if (particleMatch != null) {
                    val originalParticle = particleMatch.value
                    val correctParticle = getCorrectParticle(selectedWord, originalParticle)
                    // 문장에서 첫 번째로 발견된 해당 조사를 바꾸기
                    updatedText = updatedText.substring(0, wordStart + selectedWord.length) +
                            correctParticle +
                            updatedText.substring(wordStart + selectedWord.length + originalParticle.length)
                }

                wordEnd = wordStart + selectedWord.length

                // 업데이트된 문장을 다시 SpannableString으로 설정
                val words = relatedWords[answerPosition]
                val wordGroups = if (words != null) {
                    convertToWordList(words)
                } else {
                    emptyList() // 관련 단어가 없으면 빈 리스트 전달
                }

                val newAnswer = makeSpannableString(updatedText, wordGroups, selectedWord)
                binding.selectedAnswer.text = newAnswer
                binding.text.setText(newAnswer.toString())

                // 대체어 목록을 그대로 유지하므로, updateAlternativeWord를 호출하지 않음
            }
        } catch (e: Exception) {
            Log.e("onWordClick", "Error replacing word: ${e.message}")
        }
    }

}
