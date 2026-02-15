package com.audiguard.messageQue

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

class WatchMessageReceiverService : WearableListenerService() {

    companion object {
        var mobileSSAID: String? = null
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("SSAID", "Message received")
        if (messageEvent.path == "/send_ssaid") {
            mobileSSAID = String(messageEvent.data)
            Log.d("SSAID", "Received mobile SSAID: $mobileSSAID")
        } else {
            Log.d("SSAID", "Unexpected path: ${messageEvent.path}")
        }
    }
}
