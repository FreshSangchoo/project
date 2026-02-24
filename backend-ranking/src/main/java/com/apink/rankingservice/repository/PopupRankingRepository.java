package com.apink.rankingservice.repository;

import com.apink.rankingservice.entity.PopupRanking;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PopupRankingRepository extends JpaRepository<PopupRanking, Integer> {

}
