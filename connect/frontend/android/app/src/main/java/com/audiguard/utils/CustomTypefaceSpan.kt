package com.audiguard.utils

import android.graphics.Paint
import android.text.TextPaint
import android.text.style.MetricAffectingSpan

class CustomTypefaceSpan(private val scaleFactor: Float) : MetricAffectingSpan() {
    override fun updateDrawState(ds: TextPaint) {
        applyCustomSize(ds)
    }

    override fun updateMeasureState(paint: TextPaint) {
        applyCustomSize(paint)
    }

    private fun applyCustomSize(paint: TextPaint) {
        paint.textSize = paint.textSize * scaleFactor // 텍스트 크기만 확대
    }
}