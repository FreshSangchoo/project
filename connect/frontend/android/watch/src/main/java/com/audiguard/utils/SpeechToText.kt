package com.audiguard.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.app.ActivityCompat
import com.audiguard.data.RecognitionResult
import com.google.api.gax.rpc.ClientStream
import com.google.api.gax.rpc.ResponseObserver
import com.google.api.gax.rpc.StreamController
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.speech.v1.*
import com.google.protobuf.ByteString
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.launch

class SpeechToText(private val context: Context) {
    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private lateinit var speechClient: SpeechClient

    companion object {
        private const val SAMPLE_RATE = 16000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val TAG = "SpeechToText"
    }

    init {
        initializeSpeechClient()
    }

    private fun initializeSpeechClient() {
        val credentials = context.assets.open("a502-440808-dc54a437639a.json").use {
            GoogleCredentials.fromStream(it)
        }

        val speechSettings = SpeechSettings.newBuilder()
            .setCredentialsProvider { credentials }
            .build()

        speechClient = SpeechClient.create(speechSettings)
    }
    fun startRecording(): Flow<RecognitionResult> = flow {
        coroutineScope {  // 추가: coroutineScope
            val bufferSize = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT
            )

            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                emit(RecognitionResult("오디오 권한이 필요합니다", true, 0.0f))  // RecognitionResult로 감싸서 반환

                return@coroutineScope
            }

            val recognitionChannel = Channel<RecognitionResult>()


            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            // 스트리밍 설정

            val streamingConfig = StreamingRecognitionConfig.newBuilder()
                .setConfig(
                    RecognitionConfig.newBuilder()
                        .setEncoding(RecognitionConfig.AudioEncoding.LINEAR16)
                        .setSampleRateHertz(SAMPLE_RATE)
                        .setLanguageCode("ko-KR")
                        .setEnableAutomaticPunctuation(true)  // 구두점 자동 추가
                        .setModel("command_and_search")        // 짧은 발화에 최적화된 모델
                        .setMaxAlternatives(1)                 // 대체 결과 최소화
                        .build()
                )
                .setInterimResults(true)  // 중간 결과 활성화
//                .setSingleUtterance(true)                     // 연속 발화 중단하기

            val responseObserver = object : ResponseObserver<StreamingRecognizeResponse> {
                override fun onStart(controller: StreamController) {
                    Log.d(TAG, "Streaming started")
                }

                override fun onResponse(response: StreamingRecognizeResponse) {
                    response.resultsList.forEach { result ->
                        result.alternativesList.firstOrNull()?.let { alternative ->
                            val transcript = alternative.transcript

                            Log.d(
                                TAG,
                                "Streaming transcript: $transcript (isFinal: ${result.isFinal}, ${result.stability})"
                            )

                            recognitionChannel.trySend(
                                RecognitionResult(
                                    text = transcript,
                                    isFinal = result.isFinal,
                                    stability = result.stability
                                )
                            )

                            if (result.isFinal) {
                                // 최종 결과를 받으면 녹음 중지
                                isRecording = false
                            }
                        }
                    }
                }

                override fun onError(t: Throwable) {
                    Log.e(TAG, "Streaming error: ${t.message}")
                    isRecording = false
                    recognitionChannel.close(t)
                }

                override fun onComplete() {
                    Log.d(TAG, "Streaming completed")
                    recognitionChannel.close()
                }
            }

            val clientStream: ClientStream<StreamingRecognizeRequest> =
                speechClient.streamingRecognizeCallable().splitCall(responseObserver)

            // 초기 설정 전송
            clientStream.send(
                StreamingRecognizeRequest.newBuilder()
                    .setStreamingConfig(streamingConfig)
                    .build()
            )

            val buffer = ByteArray(bufferSize)
            isRecording = true
            audioRecord?.startRecording()

            launch {
                try {
                    while (isRecording) {
                        val readSize = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                        if (readSize > 0) {
                            clientStream.send(
                                StreamingRecognizeRequest.newBuilder()
                                    .setAudioContent(ByteString.copyFrom(buffer, 0, readSize))
                                    .build()
                            )
                        }
                    }
                } finally {
                    clientStream.closeSend()
                    audioRecord?.stop()
                    audioRecord?.release()
                }
            }

            // Channel에서 결과 수신 및 emit
            for (result in recognitionChannel) {
                emit(result)
            }
        }
    }.flowOn(Dispatchers.IO)

    fun stopRecording() {
        isRecording = false
    }
}