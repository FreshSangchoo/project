package com.audiguard.RestApi

data class GenerateWordResponse(
    val related_words: Map<String, Map<String, Int>>
)
