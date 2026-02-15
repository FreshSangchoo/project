package com.audiguard.viewmodelfactory

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.audiguard.viewmodel.NodeViewModel

class NodeViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(NodeViewModel::class.java)) {
            return NodeViewModel(context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
