package com.audiguard.data

data class SaveSentenceRequest (
    val input_text: String,
    val output_text: String,
    val user_id: String
)