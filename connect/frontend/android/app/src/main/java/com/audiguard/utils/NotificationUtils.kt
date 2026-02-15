package com.audiguard.utils

import com.audiguard.R

object NotificationUtils {
    fun getNotificationIconForSound(soundLabel: String): Int {
        return when (soundLabel) {
            "Fire alarm" -> R.drawable.ic_fire
            "Ambulance (siren)" -> R.drawable.ic_ambulance
            "Civil defense siren" -> R.drawable.ic_horn
            "Dog" -> R.drawable.ic_dog
            "Baby cry, infant cry" -> R.drawable.ic_baby
            "Police car (siren)" -> R.drawable.ic_police
            "Vehicle horn, car horn, honking" -> R.drawable.ic_car
            "Explosion" -> R.drawable.ic_bomb
            "Knock" -> R.drawable.ic_knock
            "Doorbell" -> R.drawable.ic_bell
            "Telephone" -> R.drawable.ic_phone
            "Sink (filling or washing)" -> R.drawable.ic_wash
            "Water" -> R.drawable.ic_water
            "Alarm" -> R.drawable.ic_alarm
            "Microwave oven" -> R.drawable.ic_microwave
            else -> R.drawable.ic_name
        }
    }
}