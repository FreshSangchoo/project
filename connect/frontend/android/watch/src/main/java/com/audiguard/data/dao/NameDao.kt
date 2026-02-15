package com.audiguard.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.audiguard.data.entity.NameEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface NameDao {
    @Query("SELECT * FROM names")
    fun getAllNames(): Flow<List<NameEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertName(name: NameEntity)

    @Delete
    suspend fun deleteName(name: NameEntity)
}