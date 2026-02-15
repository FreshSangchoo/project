package com.audiguard.data

import android.content.Context
import android.util.Log
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.audiguard.data.converter.Converters
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.entity.NameEntity
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.data.entity.NotificationSettingEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        NotificationSettingEntity::class,
        NameEntity::class,
        NotificationHistoryEntity::class
    ],
    version = 4
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun notificationSettingDao(): NotificationSettingDao
    abstract fun notificationHistoryDao(): NotificationHistoryDao
    abstract fun nameDao(): NameDao

    companion object {
        private var INSTANCE: AppDatabase? = null

        private val INITIAL_SETTINGS = listOf(
            NotificationSettingEntity(
                id = "Fire alarm",
                category = "emergency",
                title = "화재",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Police car (siren)",
                category = "emergency",
                title = "사이렌",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Ambulance (siren)",
                category = "emergency",
                title = "구급차",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Civil defense siren",
                category = "emergency",
                title = "민방위",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Dog",
                category = "emergency",
                title = "개",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Baby cry, infant cry",
                category = "emergency",
                title = "아기 울음",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Police car (siren)",
                category = "emergency",
                title = "경찰차",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Vehicle horn, car horn, honking",
                category = "emergency",
                title = "경적",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Explosion",
                category = "emergency",
                title = "폭발음",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Knock",
                category = "life",
                title = "노크",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Doorbell",
                category = "life",
                title = "초인종",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Telephone",
                category = "life",
                title = "전화",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Sink (filling or washing)",
                category = "life",
                title = "세탁기",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Water",
                category = "life",
                title = "물소리",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Alarm",
                category = "life",
                title = "알람",
                isEnabled = true
            ),
            NotificationSettingEntity(
                id = "Microwave oven",
                category = "life",
                title = "전자레인지",
                isEnabled = true
            ),
        )

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val scope = CoroutineScope(Dispatchers.IO)
                val tempInstance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )
                    .fallbackToDestructiveMigration()
                    .addCallback(object : Callback() {
                        override fun onCreate(db: SupportSQLiteDatabase) {
                            super.onCreate(db)
                            Log.d("AppDatabase", "Database created, starting initialization...")
                            scope.launch {
                                // INSTANCE가 설정된 후에 실행되도록 보장
                                INSTANCE?.let { database ->
                                    try {
                                        val dao = database.notificationSettingDao()
                                        Log.d("AppDatabase", "Initializing database...")
                                        dao.deleteAllSettings()
                                        INITIAL_SETTINGS.forEach { setting ->
                                            dao.insertSetting(setting)
                                            Log.d(
                                                "AppDatabase",
                                                "Inserted setting: ${setting.title}"
                                            )
                                        }
                                        val count = dao.getSettingsCount()
                                        Log.d(
                                            "AppDatabase",
                                            "Database initialization completed. Total settings: $count"
                                        )
                                    } catch (e: Exception) {
                                        Log.e("AppDatabase", "Error initializing database", e)
                                    }
                                } ?: Log.e("AppDatabase", "Database instance is null")
                            }
                        }
                    })
                    .build()
                INSTANCE = tempInstance
                tempInstance
            }
        }
    }
}