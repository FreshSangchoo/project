package com.audiguard.RestApi

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("generate/sentence/")
    suspend fun generateSentence(
        @Body request: GenerateSentenceRequest
    ): Response<List<GenerateSentenceResponse>>

    @POST("save/word/")
    suspend fun generateWord(
        @Body request: GenerateSentenceRequest
    ):  Response<List<GenerateWordResponse>>

    @POST("save/sentence/")
    suspend fun saveSentence(
        @Body request: SaveSentenceRequest
    ): Response<Unit>

}
