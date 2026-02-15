package com.example.donzoom.repository;

import com.example.donzoom.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  boolean existsByEmail(String email);

  // Optional은 객체가 없으면 null 대신 빈 객체 반환
  Optional<User> findByEmail(String email);

  Optional<User> findByAccountNo(String email);

  Optional<User> findByDeviceToken(String deviceToken);


}