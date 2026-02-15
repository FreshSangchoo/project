package com.audiguard.RestApi

data class GenerateSentenceResponse(
    val answer: String,
    val related_words: Map<String, Map<String, Int>>
)
