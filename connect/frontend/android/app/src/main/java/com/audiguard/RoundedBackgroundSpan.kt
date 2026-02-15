package com.audiguard

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.text.style.ReplacementSpan

class RoundedBackgroundSpan(
    private val backgroundColor: Int,
    private val radius: Float = 8f, // 모서리 둥글기
    private val padding: Float = 8f // 텍스트 주변 여백
) : ReplacementSpan() {

    override fun getSize(
        paint: Paint,
        text: CharSequence,
        start: Int,
        end: Int,
        fm: Paint.FontMetricsInt?
    ): Int {
        // 텍스트의 폭을 계산하여 padding을 추가
        return (padding + paint.measureText(text, start, end) + padding).toInt()
    }

    override fun draw(
        canvas: Canvas,
        text: CharSequence,
        start: Int,
        end: Int,
        x: Float,
        top: Int,
        y: Int,
        bottom: Int,
        paint: Paint
    ) {
        // 원래 텍스트 색상을 저장
        val originalColor = paint.color

        // 배경 그리기
        paint.color = backgroundColor
        val rect = RectF(x, top.toFloat(), x + getSize(paint, text, start, end, null), bottom.toFloat())
        canvas.drawRoundRect(rect, radius, radius, paint)

        // 텍스트 그리기 (원래 색상 사용)
        paint.color = originalColor
        canvas.drawText(text, start, end, x + padding, y.toFloat(), paint)
    }
}
