package com.audiguard.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class SseResponse(
    val status: String,
    val data: JsonElement? = null,
    var sentence_order: Int
)
