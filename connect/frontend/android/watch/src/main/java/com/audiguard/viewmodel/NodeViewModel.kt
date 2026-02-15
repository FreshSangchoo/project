package com.audiguard.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class NodeViewModel(context: Context) : ViewModel() {
    private val _nodeId = MutableStateFlow<String?>(null)
    val nodeId: StateFlow<String?> get() = _nodeId

    init {
        // Node ID 가져오기 초기화
        viewModelScope.launch {
            _nodeId.value = getMobileNodeId(context)
        }
    }

    private suspend fun getMobileNodeId(context: Context): String? {
        val nodeClient = Wearable.getNodeClient(context)
        val nodes = nodeClient.connectedNodes.await()
        return nodes.firstOrNull()?.id
    }
}
