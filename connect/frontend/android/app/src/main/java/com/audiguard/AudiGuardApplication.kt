package com.audiguard

import android.app.Application
import androidx.room.Room
import com.audiguard.data.AppDatabase
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class AudiGuardApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "notification-settings-db"
        ).build()
    }
}