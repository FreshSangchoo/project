package com.apink.poppin.api.user.repository;

import com.apink.poppin.api.user.entity.UserConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {
}
