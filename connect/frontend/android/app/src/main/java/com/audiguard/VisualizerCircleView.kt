package com.audiguard

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import kotlin.math.min

class VisualizerCircleView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : View(context, attrs) {

    private val paint = Paint().apply {
        color = Color.rgb(60, 124, 242)
        alpha = 200
        style = Paint.Style.FILL
    }

    private var radius = 0f
    private var targetRadius = 0f
    private val smoothingFactor = 0.15f  // 부드러움 정도를 줄여서 더 빠르게 반응하도록 수정
    private var lastAmplitude = 0f
    private var isClearing = false

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        if (isClearing && radius <= 0.1f) {
            radius = 0f
            targetRadius = 0f
            lastAmplitude = 0f
            isClearing = false
            return
        }

        val centerX = width / 2f
        val centerY = height / 2f

        // 알파값의 범위를 늘려서 더 선명하게 보이도록 수정
        paint.alpha = ((1 - (radius / (width / 2f))) * 255).toInt().coerceIn(0, 255)
        canvas.drawCircle(centerX, centerY, radius, paint)

        if (isClearing) {
            radius *= 0.9f
            invalidate()
        }
    }

    fun updateAmplitude(amplitude: Float) {
        if (isClearing) return

        val smoothedAmplitude = lastAmplitude + (amplitude - lastAmplitude) * 0.3f
        lastAmplitude = smoothedAmplitude

        // amplitude 배수를 25로 늘려서 더 크게 움직이도록 수정
        targetRadius = min(smoothedAmplitude * 25, width / 2f)
        radius += (targetRadius - radius) * smoothingFactor
        invalidate()
    }

    fun clearAmplitudes() {
        isClearing = true
        targetRadius = 0f
        invalidate()
    }
}