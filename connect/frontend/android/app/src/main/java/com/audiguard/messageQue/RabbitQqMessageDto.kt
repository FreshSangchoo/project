package com.audiguard.messageQue

data class RabbitMqMessageDto(
    val ssaid: String,
    val inputText: String,
    val outputText: String
)