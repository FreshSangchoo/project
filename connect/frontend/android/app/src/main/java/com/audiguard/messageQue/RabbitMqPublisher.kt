package com.audiguard.messageQue

import android.annotation.SuppressLint
import android.content.Context
import android.provider.Settings
import android.util.Log
import com.google.android.gms.wearable.Wearable
import com.google.gson.Gson
import com.rabbitmq.client.Connection
import com.rabbitmq.client.ConnectionFactory

class RabbitMqPublisher(private val context: Context) {

    private val gson = Gson()
    private val queueName = "upsert.queue"
    private val exchangeName = "message.exchange"
    private val routingKey = "upsert.key"

    @SuppressLint("HardwareIds")
    private fun getSSAID(): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "Unknown"
    }



    private val factory = ConnectionFactory().apply {
        host = "k11a502.p.ssafy.io"
        port = 5672
        username = "a502"
        password = "a502a502"
        connectionTimeout = 10000  // 10초 타임아웃 설정
    }

    private var connection: Connection? = null

    init {
        // 연결을 한 번만 생성하여 재사용
        connection = factory.newConnection()
    }

    fun publishMessage(input: String, output: String) {
        val rabbitMqMessage = RabbitMqMessageDto(
            ssaid = getSSAID(),
            inputText = input,
            outputText = output
        )

        try {
            connection?.createChannel()?.use { channel ->
                channel.queueDeclare(queueName, false, false, false, null)

                val jsonMessage = gson.toJson(rabbitMqMessage)
                val messageBytes = jsonMessage.toByteArray(Charsets.UTF_8)

                val startTime = System.currentTimeMillis()
                Log.d("RabbitMQ", "Before Message published: $startTime")

                channel.basicPublish(exchangeName, routingKey, null, messageBytes)
                Log.d("RabbitMQ", "Message published: $input, $output")

                val endTime = System.currentTimeMillis()
                Log.d("RabbitMQ", "After Message published: $endTime")
                val elapsedTime = endTime - startTime
                Log.d("RabbitMQ", "Spend Message published: $elapsedTime")
            }
        } catch (e: Exception) {
            Log.e("RabbitMQ", "Failed to publish message", e)
        }
    }

    fun closeConnection() {
        connection?.close()
    }
}
