package com.audiguard.viewmodel

import android.content.Context
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.audiguard.data.GenerateSentenceRequest
import com.audiguard.data.GenerateSentenceResponse
import com.audiguard.data.SaveSentenceRequest
import com.audiguard.messageQue.RabbitMqPublisher
import com.audiguard.utils.RetrofitInstance
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch


class SentenceViewModel : ViewModel() {
    private val _generatedSentences = MutableStateFlow<List<String>>(emptyList())
    val generatedSentences: StateFlow<List<String>> get() = _generatedSentences
    var wordList by mutableStateOf<List<Map<String, Map<String, Int>>>>(emptyList())
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf("")

    fun generateSentence(requestData: GenerateSentenceRequest) {
        viewModelScope.launch {
            isLoading = true
            try {
                val response = RetrofitInstance.instance.generateSentence(requestData)
                if (response.isSuccessful && response.body() != null) {
                    val responseData = response.body()!!

                    _generatedSentences.value = responseData.map { it.answer }
                    wordList = responseData.map { it.related_words }

                    Log.d("SentenceViewModel", "응답 데이터: $responseData")
                } else {
                    errorMessage = "API 호출 실패: ${response.code()}"
                    Log.e("SentenceViewModel", errorMessage)
                }
            } catch (e: Exception) {
                errorMessage = "API 호출 중 오류 발생: ${e.message}"
                Log.e("SentenceViewModel", errorMessage, e)
            } finally {
                isLoading = false
            }
        }
    }

    fun getRelatedWordsForSentence(selectedText: String): Map<String, Map<String, Int>>? {
        val index = _generatedSentences.value.indexOf(selectedText)
        return if (index != -1 && wordList.size > index) {
            wordList[index]
        } else {
            null
        }
    }

    fun clearGeneratedSentences() {
        _generatedSentences.value = emptyList()
        wordList = emptyList()
    }

//    private fun parseResponseData(responseData: List<GenerateSentenceResponse>): Pair<List<String>, List<List<List<String>?>>> {
//        val sentences = responseData.map { it.answer }
//        val wordList = responseData.map { relatedWords ->
//            if (relatedWords.related_words.isEmpty()) {
//                listOf(null)
//            } else {
//                relatedWords.related_words.map { (key, replacements) ->
//                    listOf(key) + replacements.keys.toList()
//                }
//            }
//        }
//        return Pair(sentences, wordList)
//    }

    fun saveSentenceAsync(inputText: String, outputText: String, userId: String, context: Context) {
        viewModelScope.launch(Dispatchers.IO) {
            val request = SaveSentenceRequest(
                input_text = inputText,
                output_text = outputText,
                user_id = userId
            )
            val publisher = RabbitMqPublisher(context)

            try {
                // RabbitMQ 메시지 발행
                Log.d("SentenceViewModel", "Publishing to RabbitMQ: $inputText -> $outputText")
                publisher.publishMessage(inputText, outputText)

                // Retrofit을 통해 API로 문장 저장
//                val response = RetrofitInstance.instance.saveSentence(request)
//                if (response.isSuccessful) {
//                    Log.d("SentenceViewModel", "Sentence saved successfully")
//                } else {
//                    Log.e(
//                        "SentenceViewModel",
//                        "Failed to save sentence: ${response.errorBody()?.string()}"
//                    )
//                }
            } catch (e: Exception) {
                Log.e("SentenceViewModel", "Error saving sentence", e)
            } finally {
                publisher.closeConnection()
            }
        }
    }
}