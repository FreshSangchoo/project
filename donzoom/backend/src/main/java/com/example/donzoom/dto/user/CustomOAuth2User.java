package com.example.donzoom.dto.user;


import com.example.donzoom.entity.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

@RequiredArgsConstructor
public class CustomOAuth2User implements OAuth2User {

  private final User user;

  @Override
  public Map<String, Object> getAttributes() {
    return Map.of();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    Collection<GrantedAuthority> authorities = new ArrayList<>();
    authorities.add((GrantedAuthority) user::getRole);
    return authorities;
  }

  @Override
  public String getName() {
    return user.getEmail();
  }

  public String getEmail() {
    return user.getEmail();
  }

  public boolean hasNoRole() {
    return user.getRole() == null || user.getRole().trim().isEmpty();
  }
}
