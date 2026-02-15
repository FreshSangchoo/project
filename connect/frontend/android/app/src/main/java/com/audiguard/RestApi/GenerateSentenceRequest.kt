package com.audiguard.RestApi

import kotlinx.serialization.Serializable

@Serializable
data class GenerateSentenceRequest(
    val sentence: String,
    val user_id: String
)
