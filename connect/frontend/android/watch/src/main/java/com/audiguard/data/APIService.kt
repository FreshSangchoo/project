package com.audiguard.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface APIService {
    @POST("generate/sentence/")
    suspend fun generateSentence(
        @Body request: GenerateSentenceRequest
    ): Response<List<GenerateSentenceResponse>>

    @POST("save/sentence/")
    suspend fun saveSentence(
        @Body request: SaveSentenceRequest
    ): Response<Unit>
}