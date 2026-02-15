package com.audiguard.utils

import android.os.Build
import androidx.annotation.RequiresApi
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Serializable
@SerialName("LocalDateTime")
data class LocalDateTimeWrapper(
    val year: Int,
    val month: Int,
    val day: Int,
    val hour: Int,
    val minute: Int,
    val second: Int,
    val nano: Int
) {
    @RequiresApi(Build.VERSION_CODES.O)
    fun toLocalDateTime(): LocalDateTime =
        LocalDateTime.of(year, month, day, hour, minute, second, nano)

    companion object {
        @RequiresApi(Build.VERSION_CODES.O)
        fun fromLocalDateTime(dateTime: LocalDateTime) = LocalDateTimeWrapper(
            dateTime.year,
            dateTime.monthValue,
            dateTime.dayOfMonth,
            dateTime.hour,
            dateTime.minute,
            dateTime.second,
            dateTime.nano
        )
    }
}