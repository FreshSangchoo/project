package com.apink.poppin.api.manager.repository;

import com.apink.poppin.api.manager.entity.Manager;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ManagerRepository extends JpaRepository<Manager, Long> {
    Optional<Manager> findByNickname(String nickname);
    Optional<Manager> findById(String id);
    Optional<Manager> findByManagerTsid(long managerTsid);
    boolean existsById(String id);
    boolean existsByNickname(String nickname);
}
