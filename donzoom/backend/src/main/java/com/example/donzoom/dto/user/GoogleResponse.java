package com.example.donzoom.dto.user;

import java.util.Map;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GoogleResponse implements OAuth2Response {

  private final Map<String, Object> attribute; // JSON 형식

  public GoogleResponse(final Map<String, Object> attribute) {
    log.info(attribute.toString());
    this.attribute = attribute;
  }

  @Override
  public String getProvider() {
    return "google";
  }

  @Override
  public String getProviderId() {
    return attribute.get("sub").toString();
  }

  @Override
  public String getEmail() {
    return (String) attribute.get("email");
  }

  @Override
  public String getName() {
    return attribute.get("name").toString();
  }
}
