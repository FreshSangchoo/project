package com.example.donzoom.security;

import com.example.donzoom.dto.user.CustomUserDetails;
import com.example.donzoom.entity.User;
import com.example.donzoom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  // authn
  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

    User userData = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("요청한 이메일에 해당하는 유저가 없습니다: " + email));
    log.info("요청한 유저 데이터: {}", userData.getEmail());

    return new CustomUserDetails(userData); // AuthenticationManger 에게 보냄
  }
}

