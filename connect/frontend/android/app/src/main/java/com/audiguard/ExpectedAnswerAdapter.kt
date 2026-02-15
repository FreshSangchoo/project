package com.audiguard

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ExpectedAnswerAdapter(
    private val context: Context,
    private val answerList: MutableList<String>,
    private val listener: onAnswerClickListener
) : RecyclerView.Adapter<ExpectedAnswerAdapter.AnswerViewHolder>() {

    inner class AnswerViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val textView: TextView = view.findViewById(R.id.answer)

        private var currentWord: String = ""
        private var start: Int = 0
        private var end: Int = 0
        private var selectedPosition: Int = 0
        // 글자 하나씩 출력하는 애니메이션 함수
        private fun animateText(answer: String, position:Int) {
            textView.text = answer
            selectedPosition = position

            val stringBuilder = StringBuilder()
            textView.text = "" // 초기화

            // 코루틴을 통해 애니메이션 적용
            (context as AppCompatActivity).lifecycleScope.launch(Dispatchers.Default) {
                for (letter in answer) {
                    stringBuilder.append(letter)
                    delay(100) // 한 글자씩 출력 간격
                    withContext(Dispatchers.Main) {
                        textView.text = stringBuilder.toString()
                    }
                }
            }
        }
        fun bind(answer: String, position: Int) {
            animateText(answer,position) // 애니메이션 시작


            // 클릭 리스너 설정
            itemView.setOnClickListener {
                listener.onAnswerClick(answer, position)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AnswerViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_answer, parent, false)
        return AnswerViewHolder(view)
    }

    override fun onBindViewHolder(holder: AnswerViewHolder, position: Int) {
        holder.bind(answerList[position], position)
    }

    override fun getItemCount(): Int = answerList.size


}
