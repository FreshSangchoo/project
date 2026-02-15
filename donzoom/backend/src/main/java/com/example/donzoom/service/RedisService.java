package com.example.donzoom.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {

  private final String blackListPrefix = "blackList: ";

  private final RedisTemplate<String, Object> redisTemplate;
  private final ObjectMapper objectMapper;

  // 리스트 저장 (TTL 필수 설정)
  public <T> void saveListWithTTL(String key, List<T> list, Long ttlInSeconds) {
    try {
      String serializedList = objectMapper.writeValueAsString(list);
      redisTemplate.opsForValue().set(key, serializedList, ttlInSeconds, TimeUnit.SECONDS);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }

  // 객체 저장 (TTL 필수 설정)
  public void saveObjectWithTTL(String key, Object object, Long ttlInSeconds) {
    try {
      String serializedObject = objectMapper.writeValueAsString(object);
      redisTemplate.opsForValue().set(key, serializedObject, ttlInSeconds, TimeUnit.SECONDS);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }

  // 리스트 가져오기
  public <T> List<T> getList(String key, TypeReference<List<T>> typeReference) {
    String value = (String) redisTemplate.opsForValue().get(key);
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.readValue(value, typeReference);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }

  // 객체 가져오기
  public <T> T getObject(String key, Class<T> type) {
    String value = (String) redisTemplate.opsForValue().get(key);
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.readValue(value, type);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }

  // 객체 및 리스트 지우기
  public void deleteObject(String key) {
    redisTemplate.delete(key);
  }

  // 블랙리스트 확인하기
  public boolean isInBlackList(String accessToken) {
    Boolean isBlackList = (Boolean) redisTemplate.opsForValue().get(blackListPrefix + accessToken);
    return isBlackList != null && isBlackList;
  }

}
