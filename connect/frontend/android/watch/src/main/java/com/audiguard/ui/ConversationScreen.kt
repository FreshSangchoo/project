package com.audiguard.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Text
import com.audiguard.R
import com.audiguard.data.Message
import com.audiguard.messageQue.WatchMessageReceiverService
import com.audiguard.utils.SpeechToText
import com.audiguard.viewmodel.NodeViewModel
import com.audiguard.viewmodel.SseSentenceViewModel
import com.audiguard.viewmodelfactory.NodeViewModelFactory
import com.google.android.gms.wearable.Wearable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

@Composable
fun ConversationScreen(navController: NavController, chatRoomTitle: String?) {
    val context = LocalContext.current
    val chatRoomId = remember { UUID.randomUUID().toString() }
    val createdAt =
        chatRoomTitle ?: SimpleDateFormat("yyyy.MM.dd HH:mm", Locale.getDefault()).format(Date())
    val conversationHistory = remember { mutableStateListOf<Message>() }
    val nodeViewModel: NodeViewModel = viewModel(factory = NodeViewModelFactory(context))
    var recognizedText by remember { mutableStateOf("") }
    val speechToText = remember { SpeechToText(context) }
    var sendText by remember { mutableStateOf<String?>(null) }
    var selectedText by remember { mutableStateOf<String?>(null) }
    var isListening by remember { mutableStateOf(true) }
    var isCreate by remember { mutableStateOf(false) }
    var isChatScreen by remember { mutableStateOf(true) }
    var completeText = ""
    val focusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current
    var isEditing by remember { mutableStateOf(false) }
    var isChoose by remember { mutableStateOf(false) }
    var isSpeaking by remember { mutableStateOf(false) }
    val nodeId by nodeViewModel.nodeId.collectAsState()

    // ssaid 받아오기
    val ssaid: String
    fun getSSaid(context: Context): String {
        Log.d("SSAID", "mobileSSAID: ${WatchMessageReceiverService.mobileSSAID}")
        return WatchMessageReceiverService.mobileSSAID ?: "Unknow"
    }
    ssaid = getSSaid(context)

    // 대화 내용 전송
    fun sendChatMessageToMobile(context: Context, nodeId: String?, message: Message) {
        val chatData =
            "content: ${message.content}, isUser: ${message.isUser}, chatRoomId: ${message.chatRoomId}, chatRoomTitle: ${message.chatRoomTitle}"
        nodeId?.let {
            val messageClient = Wearable.getMessageClient(context)
            messageClient.sendMessage(it, "/save_chat", chatData.toByteArray())
                .addOnSuccessListener { Log.d("Watch", "Message sent successfully: $chatData") }
                .addOnFailureListener { e -> Log.e("Watch", "Failed to send message", e) }
        }
    }

    // 상대방 대화 내용 저장 및 전송
    fun saveReceivedMessage(context: Context, nodeId: String?, text: String) {
        val message = Message(
            content = text,
            isUser = 1,
            chatRoomId = chatRoomId,
            chatRoomTitle = createdAt
        )
        conversationHistory.add(message)
        sendChatMessageToMobile(context, nodeId, message)
    }

    // 내가 보낸 대화 내용 저장 및 전송
    fun saveUserMessage(context: Context, nodeId: String?, text: String) {
        val message = Message(
            content = text,
            isUser = 2,
            chatRoomId = chatRoomId,
            chatRoomTitle = createdAt
        )
        conversationHistory.add(message)
        sendChatMessageToMobile(context, nodeId, message)
    }

    // 마이크 깜빡거림
    var micIconVisibility by remember { mutableStateOf(true) }
    LaunchedEffect(isListening) {
        if (isListening) {
            while (isListening) {
                micIconVisibility = !micIconVisibility
                kotlinx.coroutines.delay(500)
            }
        }
    }

    // 대화 시작
    fun startStreaming() {
        isListening = true
        completeText = ""
    }

    // 대화 중지
    fun stopStreaming() {
        isListening = false
        speechToText.stopRecording()
    }

    // 상대방이 말하는 것을 실시간으로 화면에 보여줌
    if (isListening) {
        LaunchedEffect(Unit) {
            speechToText.startRecording()
                .collect { result ->
                    if (result.text.isNotBlank()) {
                        Log.d("SpeechToTextFromScreen", result.text)
                        if (result.isFinal) {
                            // 최종 결과인 경우 finalizedText에 추가
                            completeText = result.text
                            recognizedText = result.text  // 최종 텍스트만 표시
                            stopStreaming()
                        } else if (result.stability > 0.5) {
                            // 중간 결과인 경우 currentText 업데이트
                            completeText = result.text
                            recognizedText = result.text
                        } else {
                            recognizedText = "${completeText} ${result.text}..."
                        }
                    }
                }
        }
    }

    // 권한 요청 런처 설정
    val requestPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            startStreaming()
        }
    }

    // 권환 확인 후 필요 시 요청
    fun checkPermissionAndStart() {
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            startStreaming()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    var tts: TextToSpeech? by remember { mutableStateOf(null) }

// TTS 초기화
    LaunchedEffect(context) {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.getDefault()

                // 음성 출력 완료를 감지하기 위해 OnUtteranceProgressListener 설정
                tts?.setOnUtteranceProgressListener(object : android.speech.tts.UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        // 음성 출력 시작 시 호출
                        isSpeaking = true
                    }

                    override fun onDone(utteranceId: String?) {
                        // 음성 출력 완료 시 호출
                        isSpeaking = false
                    }

                    override fun onError(utteranceId: String?) {
                        isSpeaking = false
                    }
                })
            } else {
                Log.e("TTS", "Initialization failed")
            }
        }
    }

    // 음성 출력 함수
    fun speakOut(text: String) {
        isSpeaking = true
        val params = Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "tts1")
        }
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "tts1")
    }


    // TTS 종료
    DisposableEffect(Unit) {
        onDispose {
            tts?.stop()
            tts?.shutdown()
            isSpeaking = false
        }
    }

    // 대화 생성 API 호출
    val sentenceViewModel: SseSentenceViewModel = viewModel()
//    val requestData = GenerateSentenceRequest(sentence = recognizedText, user_id = ssaid)
//    val generateSentences by sentenceViewModel.generatedSentences.collectAsState(initial = emptyList())


    val streamingText by sentenceViewModel.streamingText.collectAsState()
    val relatedWords by sentenceViewModel.relatedWords.collectAsState()
    var isLoading = sentenceViewModel.isLoading

    LaunchedEffect(isCreate) {
        if (isCreate) {
            sentenceViewModel.startStreaming(recognizedText, ssaid)
//            sentenceViewModel.generateSentence(requestData) // 답변 생성 API
        }
    }

    // 받침 유무를 판단하는 함수
    fun hasFinalConsonant(word: String): Boolean {
        val lastChar = word.lastOrNull() ?: return false
        return (lastChar.code - 0xAC00) % 28 != 0
    }
    // 단어 대체 시 조사 수정 함수 추가
    // 단어 대체 시 조사 수정 함수 추가 (띄어쓰기 포함)
    fun replaceWordWithProperPostfix(originalText: String, oldWord: String, newWord: String): String {
        val regex = Regex("""\b\w+[\p{Punct}\s]*\b""")
        val words = regex.findAll(originalText).map { it.value }.toMutableList()

        // 대체할 단어 위치 찾기
        val index = words.indexOfFirst { it.contains(oldWord) }
        if (index == -1) return originalText

        // 대체할 단어와 조사 분리 (단어 뒤에 붙어 있는 조사와 띄어쓰기를 포함하여 처리)
        val oldWordWithPostfix = words[index]
        val postfixRegex = Regex("""([을를이가은는])(.*)""")
        val matchResult = postfixRegex.find(oldWordWithPostfix)

        // 새로운 단어로 교체하고 조사를 수정
        val newPostfix = matchResult?.let { result ->
            val currentPostfix = result.groups[1]?.value ?: ""
            val hasSpace = result.groups[2]?.value?.startsWith(" ") ?: false

            val updatedPostfix = when (currentPostfix) {
                "을", "를" -> if (hasFinalConsonant(newWord)) "을" else "를"
                "이", "가" -> if (hasFinalConsonant(newWord)) "이" else "가"
                "은", "는" -> if (hasFinalConsonant(newWord)) "은" else "는"
                else -> currentPostfix
            }

            // 띄어쓰기가 있으면 추가
            if (hasSpace) "$updatedPostfix " else updatedPostfix
        } ?: ""

        // 교체된 단어와 새로운 조사로 변경
        words[index] = newWord + newPostfix
        return words.joinToString("")
    }
    // 화면 UI
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectTapGestures( // 두 번 연속 터치하면 화면 전환
                    onDoubleTap = {
                        isChatScreen = !isChatScreen
                    }
                )
            }
    ) {
        if (isChatScreen) { // 대화 진행 중
            // 깜빡이는 마이크 아이콘 표시
            if (isListening) {
                Image(
                    painter = painterResource(R.drawable.mic),
                    contentDescription = "대화",
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 16.dp)
                        .size(20.dp)
                        .clickable {
                            stopStreaming()
                        },
                    colorFilter = ColorFilter.tint(if (micIconVisibility) Color.White else Color.Black)
                )
            }
            Column(
                modifier = Modifier.align(Alignment.Center)
            ) {
                // 선택된 텍스트가 있으면 입력창에 표시
                if (selectedText != null && sendText == null) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black)
                    ) {
                        val relatedWordsMap =
                            sentenceViewModel.getRelatedWordsForSentence(selectedText ?: "")
                        Log.d("ConversationScreen", "관련 단어 맵: $relatedWordsMap")
                        var selectedWord by remember { mutableStateOf<String?>(null) }
                        if (!isChoose) {
                            if (isEditing) {
                                val textState = remember { mutableStateOf(selectedText ?: "") }
                                val scrollState = rememberScrollState()
                                DisposableEffect(Unit) {
                                    focusRequester.requestFocus()
                                    keyboardController?.show()
                                    onDispose { }
                                }
                                TextField(
                                    value = selectedText ?: "",
                                    onValueChange = { newText ->
                                        textState.value = newText
                                        selectedText = newText
                                    },
                                    textStyle = TextStyle(
                                        color = Color.White,
                                    ),
                                    modifier = Modifier
                                        .align(Alignment.Center)
                                        .padding(top = 10.dp, bottom = 60.dp)
                                        .widthIn(max = 160.dp)
                                        .focusRequester(focusRequester)
                                        .horizontalScroll(scrollState)
                                        .wrapContentHeight(),
                                    maxLines = 4,
                                    keyboardOptions = KeyboardOptions.Default.copy(
                                        imeAction = ImeAction.Done
                                    ),
                                    keyboardActions = KeyboardActions(
                                        onDone = {
                                            isEditing = false
                                            keyboardController?.hide()
                                        }
                                    )
                                )
                                LaunchedEffect(textState.value) {
                                    snapshotFlow { textState.value }
                                        .collect { updatedText ->
                                            selectedText = updatedText
                                        }
                                }
                            } else {
                                UnderlinedTextWithClickableWords(
                                    selectedText = selectedText!!,
                                    relatedWordsMap = relatedWordsMap,
                                    onWordClick = { clickedWord ->
                                        Log.d("ConversationScreen", "Clicked word: $clickedWord")
                                        selectedWord = clickedWord
                                    },
                                    onChoose = {
                                        isChoose = true // 대체 단어 목록 표시를 위해 isChoose를 true로 설정
                                    }
                                )
                            }
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .padding(bottom = 20.dp)
                            ) {
                                Button(onClick = {
                                    isEditing = true
                                }) {
                                    Image(
                                        painter = painterResource(R.drawable.keyboard),
                                        contentDescription = "답변 수정",
                                        modifier = Modifier.size(24.dp),
                                        colorFilter = ColorFilter.tint(Color.Black)
                                    )
                                }
                                Button(onClick = {
                                    sendText = selectedText ?: ""
                                    selectedText = null
                                    sentenceViewModel.saveSentenceAsync(
                                        inputText = recognizedText,
                                        outputText = sendText!!,
                                        userId = ssaid,
                                        context = context
                                    )
                                    recognizedText = ""
                                    saveUserMessage(context, nodeId, sendText!!)
                                }) {
                                    Image(
                                        painter = painterResource(R.drawable.send),
                                        contentDescription = "보내기",
                                        modifier = Modifier.size(24.dp),
                                        colorFilter = ColorFilter.tint(Color.Black)
                                    )
                                }

                            }
                        } else {
                            val alternatives =
                                relatedWordsMap?.get(selectedWord ?: "")?.keys?.toList()
                                    ?: emptyList()

                            val scrollState = rememberScrollState()
                            LaunchedEffect(selectedWord) {
                                val wordIndex = selectedText?.split(" ")?.indexOf(selectedWord) ?: 0
                                val scrollPosition = wordIndex * 100
                                scrollState.scrollTo(scrollPosition)
                            }
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color.Black),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                val rowScrollState = rememberScrollState()
                                val density = LocalDensity.current
                                val screenWidthPx =
                                    with(density) { LocalContext.current.resources.displayMetrics.widthPixels.toDp().value }
                                val selectedTextWidth = selectedText?.length ?: 0
                                val centeredPosition = (selectedTextWidth * 8) - (screenWidthPx / 2)

                                LaunchedEffect(rowScrollState.value) {
                                    if (rowScrollState.value < 0) {
                                        rowScrollState.scrollTo(0)
                                    }
                                    if (rowScrollState.value > centeredPosition) {
                                        rowScrollState.scrollTo(centeredPosition.toInt())
                                    }
                                }
                                Spacer(modifier = Modifier.height(20.dp))
                                Row(
                                    modifier = Modifier
                                        .horizontalScroll(scrollState)
                                        .padding(16.dp)
                                        .align(Alignment.CenterHorizontally)
                                ) {
                                    Spacer(modifier = Modifier.width(50.dp))
                                    var textLayoutResult: TextLayoutResult? by remember {
                                        mutableStateOf(
                                            null
                                        )
                                    }
                                    val annotatedString = buildAnnotatedString {
                                        var startIndex = 0
                                        while (startIndex < (selectedText?.length ?: 0)) {
                                            // 이미 스타일링한 단어의 끝 위치를 추적
                                            val remainingText =
                                                selectedText?.substring(startIndex) ?: ""
                                            val match = relatedWordsMap?.keys?.find { word ->
                                                remainingText.startsWith(word)
                                            }
                                            if (match != null) {
                                                // 매칭된 단어 이전의 텍스트 추가
                                                if (startIndex + match.length <= (selectedText?.length
                                                        ?: 0)
                                                ) {
                                                    // 선택된 단어에 스타일 적용
                                                    pushStringAnnotation(
                                                        tag = "CLICKABLE",
                                                        annotation = match
                                                    )
                                                    withStyle(
                                                        style = if (match == selectedWord) {
                                                            SpanStyle(
                                                                fontWeight = FontWeight.Bold,
                                                                textDecoration = TextDecoration.Underline,
                                                                fontSize = 16.sp
                                                            )
                                                        } else {
                                                            SpanStyle(
                                                                color = Color.White,
                                                                fontSize = 16.sp
                                                            )
                                                        }
                                                    ) {
                                                        append(match)
                                                    }
                                                    pop()
                                                }
                                                // startIndex를 매칭된 단어 다음으로 이동
                                                startIndex += match.length
                                            } else {
                                                // 매칭되지 않은 부분 추가 및 인덱스 증가
                                                append(
                                                    selectedText?.substring(
                                                        startIndex,
                                                        startIndex + 1
                                                    ) ?: ""
                                                )
                                                startIndex++
                                            }
                                        }
                                    }

                                    Text(
                                        text = annotatedString,
                                        style = TextStyle(color = Color.White, fontSize = 16.sp),
                                        modifier = Modifier
                                            .padding(top = 10.dp)
                                            .pointerInput(Unit) {
                                                detectTapGestures { offsetPosition ->
                                                    textLayoutResult?.let { layoutResult ->
                                                        val offset =
                                                            layoutResult.getOffsetForPosition(
                                                                offsetPosition
                                                            )
                                                        annotatedString
                                                            .getStringAnnotations(
                                                                tag = "CLICKABLE",
                                                                start = offset,
                                                                end = offset
                                                            )
                                                            .firstOrNull()
                                                            ?.let { annotation ->
                                                                selectedWord = annotation.item
                                                                isChoose = true
                                                                Log.d(
                                                                    "ConversationScreen",
                                                                    "Clicked word: ${annotation.item}"
                                                                )
                                                            }
                                                    }
                                                }
                                            },
                                        onTextLayout = { layoutResult ->
                                            textLayoutResult = layoutResult
                                        }
                                    )
                                    Spacer(modifier = Modifier.width(50.dp))
                                }
                                LazyColumn( // 교체할 수 있는 단어 목록
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(16.dp)
                                        .align(Alignment.CenterHorizontally),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    items(alternatives) { alternativeWord ->
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.CenterHorizontally)
                                                .width(160.dp)
                                                .wrapContentHeight()
                                                .background(
                                                    Color(0xFFAECBFA),
                                                    shape = RoundedCornerShape(20.dp)
                                                )
                                                .clickable {
                                                    val updatedText = replaceWordWithProperPostfix(
                                                        originalText = selectedText ?: "",
                                                        oldWord = selectedWord ?: "",
                                                        newWord = alternativeWord
                                                    )
                                                    selectedText = updatedText
                                                    isChoose = false
                                                }
                                                .padding(horizontal = 16.dp, vertical = 10.dp)
                                        ) {
                                            Text(
                                                text = alternativeWord,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier.align(Alignment.Center),
                                                color = Color.Black
                                            )
                                        }
                                    }
                                    item {
                                        Spacer(modifier = Modifier.height(30.dp))
                                    }
                                }
                            }
                        }
                    }
                } else if (selectedText == null && sendText == null) {
                    // 대화 생성 내용 화면
                    if (!isListening && isCreate) {
                        if (isLoading) {
                            Text(
                                text = "답변 생성 중...",
                                textAlign = TextAlign.Center
                            )
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            ) {
                                item {
                                    Spacer(modifier = Modifier.height(30.dp))
                                }

                                // streamingText 내용을 실시간으로 표시
                                items(streamingText.keys.sorted()) { order ->
                                    Box(
                                        modifier = Modifier
                                            .width(160.dp)
                                            .wrapContentHeight()
                                            .background(
                                                Color(0xFFAECBFA),
                                                shape = RoundedCornerShape(20.dp)
                                            )
                                            .clickable {
                                                val text = streamingText[order] ?: ""
                                                selectedText = text
                                            }
                                            .padding(horizontal = 16.dp, vertical = 10.dp)
                                    ) {
                                        val currentText = streamingText[order] ?: ""
                                        // 생성 중인 텍스트 표시
                                        Text(
                                            text = currentText,
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.align(Alignment.Center),
                                            color = Color.Black
                                        )
                                    }
                                }

                                item {
                                    Spacer(modifier = Modifier.height(30.dp))
                                }
                            }
                        }
                    }else if (isListening && !isCreate) { // 상대방 말하는 중
                        Text(
                            text = recognizedText,
                            color = Color.White,
                            modifier = Modifier
                                .verticalScroll(rememberScrollState())
                                .widthIn(max = 160.dp)
                        )
                    } else { // 상대방이 말한 것을 확인하는 화면 + 대화 생성하기 버튼
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black)
                        ) {
                            Image(
                                painter = painterResource(R.drawable.mic),
                                contentDescription = "대화",
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .padding(top = 16.dp)
                                    .size(20.dp)
                                    .clickable {
                                        startStreaming()
                                    },
                                colorFilter = ColorFilter.tint(Color.White)
                            )
                            Column(
                                modifier = Modifier
                                    .align(Alignment.Center)
                                    .padding(bottom = 30.dp)
                                    .heightIn(max = 120.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = recognizedText,
                                    color = Color.White,
                                    modifier = Modifier
                                        .verticalScroll(rememberScrollState())
                                        .widthIn(max = 160.dp)
                                )
                            }
                            Column(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .padding(bottom = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Button(onClick = {
                                    isCreate = true
                                    saveReceivedMessage(context, nodeId, recognizedText)
                                }) {
                                    Image(
                                        painter = painterResource(R.drawable.next),
                                        contentDescription = "답변 생성",
                                        modifier = Modifier.size(24.dp),
                                        colorFilter = ColorFilter.tint(Color.Black)
                                    )
                                }
                            }
                        }
                    }
                } else {
                    // 내가 입력한 문구 띄워주기
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black)
                    ) {
                        // 입력 문구
                        Column(
                            modifier = Modifier
                                .align(Alignment.Center)
                                .padding(bottom = 60.dp)
                                .heightIn(max = 100.dp)
                                .verticalScroll(rememberScrollState()),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = sendText ?: "",
                                color = Color.White,
                                modifier = Modifier.widthIn(max = 140.dp),
                                maxLines = Int.MAX_VALUE
                            )
                        }
                        // 대화 시작 버튼
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 20.dp)
                        ) {
                            Button(onClick = {
                                Log.d("send", "음성 출력!!: $sendText!!")
                                speakOut(sendText!!)
                                isSpeaking = true
                            }) {
                                Image(
                                    painter = painterResource(R.drawable.speak),
                                    contentDescription = "음성 출력",
                                    modifier = Modifier.size(24.dp),
                                    colorFilter = ColorFilter.tint(Color.Black)
                                )
                            }
                            Button(
                                onClick = {
                                    sendText = null
                                    isListening = true
                                    isCreate = false
                                    sentenceViewModel.clearStreaming()
                                    checkPermissionAndStart()
                                    Log.d("send", "대화 시작")
                                },
                                enabled = !isSpeaking,
                                colors = ButtonDefaults.buttonColors(if(isSpeaking) Color.Gray else Color(0xFFAECBFA))
                            ) {
                                Image(
                                    painter = painterResource(R.drawable.mic),
                                    contentDescription = "대화 시작",
                                    modifier = Modifier.size(24.dp),
                                    colorFilter = ColorFilter.tint(Color.Black)
                                )
                            }
                        }
                    }
                }
            }
        } else { // 대화 내용 기록 화면
            if (conversationHistory.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "지난 대화가 없습니다.",
                        color = Color.White,
                        style = TextStyle(fontSize = 16.sp)
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                ) {
                    item {
                        Spacer(modifier = Modifier.height(30.dp))
                    }
                    items(conversationHistory) { message ->
                        val isUserMessage = message.isUser == 2
                        Row(
                            modifier = Modifier
                                .fillMaxWidth(),
                            horizontalArrangement = if (isUserMessage) Arrangement.End else Arrangement.Start
                        ) {
                            Box(
                                modifier = Modifier
                                    .padding(4.dp)
                                    .background(
                                        color = if (isUserMessage) Color(0xFF05AD89) else Color.White,
                                        shape = RoundedCornerShape(10.dp)
                                    )
                                    .padding(12.dp)
                                    .widthIn(max = 200.dp)
                            ) {
                                Text(
                                    text = message.content,
                                    color = if (isUserMessage) Color.White else Color.Black,
//                                textAlign = TextAlign.Center
                                )
                            }

                        }
                    }
                    item {
                        Spacer(modifier = Modifier.height(30.dp))
                    }
                }
            }
        }
    }
}

// 밑줄 클릭 시 이벤트 처리
@Composable
fun UnderlinedTextWithClickableWords(
    selectedText: String,
    relatedWordsMap: Map<String, Map<String, Int>>?,
    onWordClick: (String) -> Unit,
    onChoose: () -> Unit
) {
    var clickedWord by remember { mutableStateOf<String?>(null) }
    var textLayoutResult: TextLayoutResult? by remember { mutableStateOf(null) }

    // density 변수를 미리 가져옴
    val density = LocalDensity.current
    val topPaddingPx = with(density) { 10.dp.toPx() }
    val bottomPaddingPx = with(density) { 60.dp.toPx() }

    // AnnotatedString 생성
    val annotatedString = buildAnnotatedString {
        var startIndex = 0
        relatedWordsMap?.keys?.forEach { keyword ->
            val keywordIndex = selectedText.indexOf(keyword, startIndex)
            if (keywordIndex != -1) {
                append(selectedText.substring(startIndex, keywordIndex))

                pushStringAnnotation(tag = "CLICKABLE", annotation = keyword)
                withStyle(
                    style = SpanStyle(
                        color = Color.White,
                        textDecoration = TextDecoration.Underline,
                        fontWeight = FontWeight.Bold
                    )
                ) {
                    append(keyword)
                }
                pop()
                startIndex = keywordIndex + keyword.length
            }
        }
        if (startIndex < selectedText.length) {
            append(selectedText.substring(startIndex))
        }
    }

    // 클릭 이벤트 처리
    Box(
        modifier = Modifier
            .fillMaxSize()
    ) {
        Text(
            text = annotatedString,
            style = TextStyle(fontSize = 16.sp, color = Color.White),
            modifier = Modifier
                .align(Alignment.Center)
                .padding(top = 10.dp, bottom = 60.dp)
                .widthIn(max = 160.dp)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        textLayoutResult?.let { result ->
                            val position = result.getOffsetForPosition(offset)
                            annotatedString
                                .getStringAnnotations(
                                    start = position,
                                    tag = "CLICKABLE",
                                    end = position
                                )
                                .firstOrNull()
                                ?.let { annotation ->
                                    clickedWord = annotation.item
                                    onWordClick(clickedWord!!)
                                    onChoose()
                                }
                        }
                    }
                },
            onTextLayout = { layoutResult ->
                textLayoutResult = layoutResult
            }
        )
    }
}

