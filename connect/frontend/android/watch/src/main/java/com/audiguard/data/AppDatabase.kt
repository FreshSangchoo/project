package com.audiguard.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.audiguard.Converters
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.entity.NameEntity
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.data.entity.NotificationSettingEntity

@Database(
    entities = [
        NotificationHistoryEntity::class,
        NotificationSettingEntity::class,
        NameEntity::class
    ],
    version = 2,  // 버전 업데이트
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun notificationHistoryDao(): NotificationHistoryDao
    abstract fun notificationSettingDao(): NotificationSettingDao
    abstract fun nameDao(): NameDao

    companion object {
        const val DATABASE_NAME = "app_database"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigration()  // 데이터베이스 버전 변경 시 기존 데이터 삭제하고 새로 생성
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}