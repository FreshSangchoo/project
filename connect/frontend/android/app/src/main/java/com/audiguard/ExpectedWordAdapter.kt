package com.audiguard

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class ExpectedWordAdapter(
    private val context: Context,
    private var wordList: List<String>,
    private val listener: onWordClickListener // 멤버 변수로 선언
) : RecyclerView.Adapter<ExpectedWordAdapter.ViewHolder>() {

    // 데이터 초기화 함수 추가
    fun clearData() {
        wordList = emptyList()
    }

    // ViewHolder 클래스 정의
    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val answerTextView: TextView = itemView.findViewById(R.id.word)

        fun bind(text: String) {
            answerTextView.text = text
            // 클릭 리스너 설정
            itemView.setOnClickListener {
                listener.onWordClick(text) // listener 접근 가능
            }

        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_word, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(wordList[position])
    }

    override fun getItemCount(): Int {
        return wordList.size
    }

}
