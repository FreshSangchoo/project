package com.audiguard.Sse

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class GenerateSseSentenceResponse(
    val status: String,
    val data: JsonElement? = null,
    var sentence_order: Int,
)