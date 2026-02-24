package com.apink.poppin.api.notice.repository;

import com.apink.poppin.api.notice.dto.NoticeDto;
import com.apink.poppin.api.notice.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByUserTsid(long userTsid);

    void deleteByUserTsid(long userTsid);
}
