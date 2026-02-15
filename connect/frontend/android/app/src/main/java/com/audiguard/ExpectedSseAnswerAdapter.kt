package com.audiguard

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class ExpectedSseAnswerAdapter(
    private val context: Context,
    private val answerList: MutableList<Pair<Int, String>>,  // (답변번호, 텍스트) 쌍으로 저장
    private val listener: onAnswerClickListener
) : RecyclerView.Adapter<ExpectedSseAnswerAdapter.AnswerSseViewHolder>() {

    fun updateOrAddAnswer(answerNumber: Int, text: String) {
        val position = answerList.indexOfFirst { it.first == answerNumber }
        if (position >= 0) {
            answerList[position] = answerNumber to text
            notifyItemChanged(position)
        } else {
            answerList.add(answerNumber to text)
            notifyItemInserted(answerList.size - 1)
        }
    }

    inner class AnswerSseViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val textView: TextView = view.findViewById(R.id.answer)

        fun bind(answerPair: Pair<Int, String>, position: Int) {
            val (_, answer) = answerPair
            textView.text = answer

            itemView.setOnClickListener {
                listener.onAnswerClick(answer, position)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AnswerSseViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_answer, parent, false)
        return AnswerSseViewHolder(view)
    }

    override fun onBindViewHolder(holder: AnswerSseViewHolder, position: Int) {
        holder.bind(answerList[position], position)
    }

    override fun getItemCount(): Int = answerList.size
}