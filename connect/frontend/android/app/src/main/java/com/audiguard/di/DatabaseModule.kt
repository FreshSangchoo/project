package com.audiguard.di

import android.content.Context
import com.audiguard.data.AppDatabase
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationSettingDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return AppDatabase.getDatabase(context)
    }

    @Provides
    fun provideNotificationSettingDao(appDatabase: AppDatabase): NotificationSettingDao {
        return appDatabase.notificationSettingDao()
    }

    @Provides
    fun provideNameDao(appDatabase: AppDatabase): NameDao {
        return appDatabase.nameDao()
    }
}