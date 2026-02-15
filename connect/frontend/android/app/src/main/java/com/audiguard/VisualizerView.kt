package com.audiguard

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import kotlin.math.max
import kotlin.math.min

class VisualizerView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val paint = Paint().apply {
        color = Color.rgb(60, 124, 242)
        isAntiAlias = true
    }

    private val numBars = 40
    private val amplitudes = MutableList(numBars) { 0f }
    private val targetAmplitudes = MutableList(numBars) { 0f }
    private val scaleFactor = 10f
    private val cornerRadius = 3f

    // 부드러운 움직임을 위한 매개변수 조정
    private val amplitudeLerpFactor = 0.15f  // 더 낮은 값으로 조정하여 더 부드럽게
    private val visualLerpFactor = 0.2f      // 시각적 업데이트 속도

    private var lastAmplitude = 0f
    private var isClearing = false
    private var clearingProgress = 1f

    // 노이즈 필터링을 위한 임계값
    private val noiseThreshold = 0.5f
    // 최대 진폭 제한
    private val maxAmplitude = 50f

    fun updateAmplitude(amplitude: Float) {
        if (isClearing) return

        // 노이즈 필터링
        val filteredAmplitude = if (amplitude < noiseThreshold) 0f else amplitude

        // 부드러운 진폭 전환
        val smoothedAmplitude = lastAmplitude + (filteredAmplitude - lastAmplitude) * amplitudeLerpFactor
        lastAmplitude = smoothedAmplitude

        // 진폭 제한 및 스케일링
        val scaledAmplitude = min(smoothedAmplitude * scaleFactor, maxAmplitude)

        if (targetAmplitudes.size >= numBars) {
            targetAmplitudes.removeAt(0)
        }
        targetAmplitudes.add(scaledAmplitude)
        postInvalidateOnAnimation()
    }

    fun clearAmplitudes() {
        isClearing = true
        clearingProgress = 1f
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        if (isClearing) {
            clearingProgress *= 0.9f // 더 부드러운 클리어링

            for (i in amplitudes.indices) {
                amplitudes[i] *= clearingProgress
                targetAmplitudes[i] *= clearingProgress
            }

            if (clearingProgress < 0.01f) {
                amplitudes.fill(0f)
                targetAmplitudes.fill(0f)
                lastAmplitude = 0f
                clearingProgress = 0f
                isClearing = false
                return
            }
        } else {
            // 더 부드러운 시각적 업데이트
            for (i in amplitudes.indices) {
                val diff = targetAmplitudes[i] - amplitudes[i]
                amplitudes[i] += diff * visualLerpFactor

                // 미세한 움직임 제거
                if (Math.abs(diff) < 0.01f) {
                    amplitudes[i] = targetAmplitudes[i]
                }
            }
        }

        val barWidth = width / (numBars * 7f)
        val top = 0f

        amplitudes.forEachIndexed { index, amplitude ->
            val x = index * barWidth * 2 + barWidth / 2
            val bottom = top + max(amplitude, 0.4f) // 최소 높이 설정
            val rect = RectF(x - barWidth / 2, top, x + barWidth / 2, bottom)
            canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint)
        }

        if (isClearing || amplitudes.any { it > 0.1f }) {
            postInvalidateOnAnimation()
        }
    }
}