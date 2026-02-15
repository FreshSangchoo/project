package com.audiguard

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.ColorInt
import androidx.annotation.DrawableRes
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.lifecycle.findViewTreeLifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.audiguard.repository.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class SettingsItemView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : ConstraintLayout(context, attrs, defStyleAttr) {

    @Inject
    lateinit var repository: SettingsRepository

    private var iconView: ImageView
    private var titleView: TextView
    private var isEnabled: Boolean = true
    private var originalColor: Int = Color.TRANSPARENT
    private var settingId: String = ""

    var onToggleChanged: ((Boolean) -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.activity_settings_item_view, this, true)

        iconView = findViewById(R.id.icon)
        titleView = findViewById(R.id.title)

        setOnClickListener {
            toggleState()
        }

        context.theme.obtainStyledAttributes(
            attrs,
            R.styleable.SettingsItemView,
            0, 0
        ).apply {
            try {
                val title = getString(R.styleable.SettingsItemView_title) ?: ""
                setTitle(title)
                settingId = getString(R.styleable.SettingsItemView_settingId) ?: title
                setIcon(getResourceId(R.styleable.SettingsItemView_icon, 0))
                setBackgroundTint(
                    getColor(
                        R.styleable.SettingsItemView_backgroundTint,
                        Color.TRANSPARENT
                    )
                )
                setEnabled(getBoolean(R.styleable.SettingsItemView_isEnabled, true))
            } finally {
                recycle()
            }
        }

        // 초기 상태 로드
        loadInitialState()
    }

    private fun loadInitialState() {
        findViewTreeLifecycleOwner()?.let { lifecycleOwner ->
            lifecycleOwner.lifecycleScope.launch {
                repository.getSettingsByCategory(settingId).collect { settings ->
                    settings.firstOrNull { it.id == settingId }?.let { setting ->
                        isEnabled = setting.isEnabled
                        updateAppearance(showToast = false)
                    }
                }
            }
        }
    }

    private fun setTitle(title: String) {
        titleView.text = title
    }

    private fun setIcon(@DrawableRes iconRes: Int) {
        if (iconRes != 0) {
            iconView.setImageResource(iconRes)
        }
    }

    private fun setBackgroundTint(@ColorInt color: Int) {
        originalColor = color
        background = GradientDrawable().apply {
            setColor(color)
            cornerRadius = resources.getDimension(R.dimen.corner_radius)
        }
    }

    private fun toggleState() {
        isEnabled = !isEnabled
        updateAppearance()

        // Repository를 통해 DB 업데이트
        findViewTreeLifecycleOwner()?.lifecycleScope?.launch {
            repository.updateSetting(settingId, isEnabled)
            onToggleChanged?.invoke(isEnabled)
        }
    }

    private fun updateAppearance(showToast: Boolean = true) {
        alpha = if (isEnabled) 1.0f else 0.1f

        if (showToast) {
            val message = if (isEnabled)
                "${titleView.text} 알림이 활성화되었습니다"
            else
                "${titleView.text} 알림이 비활성화되었습니다"

            val toast = Toast(context)
            val inflater = LayoutInflater.from(context)
            val layout = inflater.inflate(R.layout.custom_toast_layout, null)

            val textView = layout.findViewById<TextView>(R.id.toast_text)
            textView.text = message

            toast.view = layout
            toast.duration = Toast.LENGTH_SHORT
            toast.show()
        }
    }

    override fun setEnabled(enabled: Boolean) {
        if (isEnabled != enabled) {
            isEnabled = enabled
            updateAppearance()

            findViewTreeLifecycleOwner()?.lifecycleScope?.launch {
                repository.updateSetting(settingId, isEnabled)
            }
        }
    }
}