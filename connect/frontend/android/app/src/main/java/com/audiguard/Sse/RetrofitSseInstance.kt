package com.audiguard.Sse

import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

object RetrofitSseInstance {
    const val BASE_URL = "http://43.202.64.159:8082"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor {
            val request = it.request().newBuilder()
                .build()
            it.proceed(request)
        }
        .build()

    val sseInstance by lazy {
        OkHttpClient.Builder()
            .connectTimeout(0, TimeUnit.SECONDS) // SSE는 무기한 연결
            .readTimeout(0, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

}