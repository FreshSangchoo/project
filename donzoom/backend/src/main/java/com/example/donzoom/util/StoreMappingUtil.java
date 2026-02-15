package com.example.donzoom.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class StoreMappingUtil {

  // immutable map 선언 및 초기화
  private static final Map<String, String> MERCHANT_ID_TO_STORE_NAME_MAP;

  static {
    // 초기화 블록에서 매핑 데이터 설정
    Map<String, String> tempMap = new HashMap<>();
    tempMap.put("1", "코스트코");
    tempMap.put("2", "홈플러스");
    tempMap.put("3", "알리 익스프레스");
    tempMap.put("4", "아마존 익스프레스");
    tempMap.put("5", "SKT");
    tempMap.put("6", "LG 유플러스");
    tempMap.put("7", "스타벅스");
    tempMap.put("8", "김밥천국");
    tempMap.put("9", "뚜레쥬르");

    // 수정 불가능한 맵으로 변환
    MERCHANT_ID_TO_STORE_NAME_MAP = Collections.unmodifiableMap(tempMap);
  }

  private StoreMappingUtil() {
  }

  // merchantId로 storeName을 조회하는 메서드
  public static String getStoreNameByMerchantId(String merchantId) {
    return MERCHANT_ID_TO_STORE_NAME_MAP.get(merchantId);
  }
}
