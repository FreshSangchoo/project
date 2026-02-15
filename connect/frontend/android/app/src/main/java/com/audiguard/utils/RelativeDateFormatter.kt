import android.os.Build
import androidx.annotation.RequiresApi
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

class RelativeDateFormatter {
    @RequiresApi(Build.VERSION_CODES.O)
    fun format(dateTime: LocalDateTime): String {
        val now = LocalDateTime.now()
        val days = ChronoUnit.DAYS.between(dateTime.toLocalDate(), now.toLocalDate())

        return when {
            // 당일
            days == 0L -> {
                String.format("%02d:%02d", dateTime.hour, dateTime.minute)
            }
            // 1일 전 ~ 30일 전
            days in 1..30 -> {
                "${days}일 전"
            }
            // 1개월 전 ~ 12개월 전
            days in 31..365 -> {
                val months = ChronoUnit.MONTHS.between(dateTime, now)
                "${months}개월 전"
            }
            // 1년 이상
            else -> {
                val years = ChronoUnit.YEARS.between(dateTime, now)
                "${years}년 전"
            }
        }
    }
}