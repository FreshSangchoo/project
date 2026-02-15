package com.audiguard.data

data class RecognitionResult(
    val text: String,
    val isFinal: Boolean,
    val stability : Float
)