package com.audiguard.viewmodel

import android.content.Context
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.audiguard.data.SaveSentenceRequest
import com.audiguard.data.SseResponse
import com.audiguard.messageQue.RabbitMqPublisher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

class SseSentenceViewModel : ViewModel() {
    private val _streamingText = MutableStateFlow<Map<Int, String>>(emptyMap())
    val streamingText: StateFlow<Map<Int, String>> = _streamingText.asStateFlow()

    private val _relatedWords = MutableStateFlow<Map<Int, Map<String, Map<String, Int>>>>(emptyMap())
    val relatedWords: StateFlow<Map<Int, Map<String, Map<String, Int>>>> = _relatedWords.asStateFlow()

    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf("")

    fun startStreaming(sentence: String, userId: String) {
        viewModelScope.launch {
            isLoading = true
            try {
                val request = Request.Builder()
                    .url("http://43.202.64.159:8082/generate/sentence/stream/")
                    .post(
                        """
                       {
                           "sentence": "$sentence",
                           "user_id": "$userId"
                       }
                       """.trimIndent().toRequestBody("application/json".toMediaType())
                    )
                    .build()

                val client = OkHttpClient.Builder()
                    .connectTimeout(0, TimeUnit.SECONDS)
                    .readTimeout(0, TimeUnit.SECONDS)
                    .build()

                client.newCall(request).enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        errorMessage = "연결 실패: ${e.message}"
                        Log.e("SSE", "Connection failed", e)
                        isLoading = false
                    }

                    override fun onResponse(call: Call, response: Response) {
                        isLoading = false
                        response.body?.source()?.let { source ->
                            while (!source.exhausted()) {
                                val line = source.readUtf8Line() ?: continue
                                if (line.startsWith("data:")) {
                                    try {
                                        val data = line.substring(5).trim()
                                        val sseResponse = Json.decodeFromString<SseResponse>(data)
                                        sseResponse.sentence_order -= 1

                                        Log.d("SSE Response", sseResponse.toString())

                                        when (sseResponse.status) {
                                            "streaming" -> {
                                                val order = sseResponse.sentence_order
                                                val cleanData = sseResponse.data.toString().trim('"')  // 따옴표 제거
                                                val currentText = _streamingText.value[order] ?: ""
                                                _streamingText.update { current ->
                                                    current + (order to currentText + cleanData)
                                                }
                                                Log.d("SSE Update", "Updating text for order $order: $currentText + $cleanData")

                                            }
                                            "word" -> {
                                                val order = sseResponse.sentence_order
                                                _relatedWords.update { current ->
                                                    current + (order to (sseResponse.data as? Map<String, Map<String, Int>> ?: emptyMap()))
                                                }
                                            }
                                            "completed" -> {
                                                if (_streamingText.value.isEmpty()) {
                                                    errorMessage = "응답이 없습니다."
                                                }
                                            }
                                        }
                                    } catch (e: Exception) {
                                        errorMessage = "데이터 처리 실패: ${e.message}"
                                        Log.e("SSE", "Error parsing data", e)
                                    }
                                }
                            }
                            isLoading = false
                        }
                    }
                })
            } catch (e: Exception) {
                errorMessage = "스트리밍 시작 실패: ${e.message}"
                Log.e("SSE", "Failed to start streaming", e)
                isLoading = false
            }
        }
    }

    fun getRelatedWordsForSentence(selectedText: String): Map<String, Map<String, Int>>? {
        val entry = _streamingText.value.entries.find { it.value == selectedText }
        return entry?.let { _relatedWords.value[it.key] }
    }

    fun clearStreaming() {
        _streamingText.value = emptyMap()
        _relatedWords.value = emptyMap()
        errorMessage = ""
    }

    fun saveSentenceAsync(inputText: String, outputText: String, userId: String, context: Context) {
        viewModelScope.launch(Dispatchers.IO) {
            val request = SaveSentenceRequest(
                input_text = inputText,
                output_text = outputText,
                user_id = userId
            )
            val publisher = RabbitMqPublisher(context)

            try {
                Log.d("SentenceViewModel", "Publishing to RabbitMQ: $inputText -> $outputText")
                publisher.publishMessage(inputText, outputText)
            } catch (e: Exception) {
                Log.e("SentenceViewModel", "Error saving sentence", e)
            } finally {
                publisher.closeConnection()
            }
        }
    }
}