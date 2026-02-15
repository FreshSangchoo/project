package com.audiguard.ui

import android.speech.tts.TextToSpeech
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.wear.compose.material.*
import com.audiguard.R
import com.audiguard.viewmodel.NodeViewModel
import com.audiguard.viewmodelfactory.NodeViewModelFactory
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale


@Composable
fun HomeScreen(navController: NavController) {
    val context = LocalContext.current
    val nodeViewModel: NodeViewModel = viewModel(factory = NodeViewModelFactory(context))
    val nodeId by nodeViewModel.nodeId.collectAsState()

    // TTS 초기화 및 관리
    var tts: TextToSpeech? by remember { mutableStateOf(null) }
    var isSpeaking by remember { mutableStateOf(false) }

    LaunchedEffect(context) {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.getDefault()
            } else {
                tts = null // 초기화 실패 시 null로 설정
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            tts?.stop()
            tts?.shutdown()
            isSpeaking = false
        }
    }

    // TTS 음성 출력 함수
    fun speakOut(text: String) {
        if (tts != null && !isSpeaking) {
            isSpeaking = true
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts1")
            tts?.setOnUtteranceProgressListener(object :
                android.speech.tts.UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    isSpeaking = true
                }

                override fun onDone(utteranceId: String?) {
                    isSpeaking = false
                }

                override fun onError(utteranceId: String?) {
                    isSpeaking = false
                }
            })
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background),
    ) {
//        TimeText(
//            modifier = Modifier
//                .align(Alignment.TopCenter)
//                .offset(y = 20.dp),
//            timeTextStyle = TextStyle(fontSize = 18.sp)
//        )
        val scrollState = rememberScrollState()
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.width(50.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Button(
                    onClick = { navController.navigate("alarm") },
                    colors = ButtonDefaults.buttonColors(
//                        backgroundColor = Color(0xFF0F208B),
                        contentColor = Color.Black
                    ),
                    shape = RoundedCornerShape(50.dp),
                    modifier = Modifier
                        .width(160.dp)
                        .height(60.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(R.drawable.alarm),
                            contentDescription = "알림",
                            modifier = Modifier.size(28.dp),
                            colorFilter = ColorFilter.tint(Color.Black)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = "알림 목록", textAlign = TextAlign.Center)
                    }
                }
            }
            Spacer(modifier = Modifier.width(10.dp))

            // 대화 시작 버튼
            Row(verticalAlignment = Alignment.CenterVertically) {
                Button(
                    onClick = {
                        val chatRoomTitle =
                            SimpleDateFormat("yyyy.MM.dd HH:mm", Locale.getDefault()).format(
                                Date()
                            )
                        navController.navigate("conversation/$chatRoomTitle")
                    },
                    colors = ButtonDefaults.buttonColors(
//                        backgroundColor = Color(0xFFFF6E06),
                        contentColor = Color.Black
                    ),
                    shape = RoundedCornerShape(50.dp),
                    modifier = Modifier
                        .width(160.dp)
                        .height(60.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(R.drawable.mic),
                            contentDescription = "대화",
                            modifier = Modifier.size(32.dp),
                            colorFilter = ColorFilter.tint(Color.Black)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = "대화 시작", textAlign = TextAlign.Center)
                    }

                }
            }
            Spacer(modifier = Modifier.width(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Button(
                    onClick = {
                        speakOut("안녕하세요. 저는 청각장애를 가지고 있습니다. 잠시 후 마이크가 인식되오니 말씀 부탁드립니다.")
                    },
                    colors = ButtonDefaults.buttonColors(
                        contentColor = Color.Black
                    ),
                    shape = RoundedCornerShape(50.dp),
                    modifier = Modifier
                        .width(160.dp)
                        .height(60.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(R.drawable.speak),
                            contentDescription = "TTS",
                            modifier = Modifier.size(32.dp),
                            colorFilter = ColorFilter.tint(Color.Black)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = "안내 음성", textAlign = TextAlign.Center)
                    }
                }
            }
            Spacer(modifier = Modifier.width(50.dp))
        }
    }
}