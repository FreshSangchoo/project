package com.audiguard.config;

import kr.pe.bab2min.Kiwi;
import kr.pe.bab2min.KiwiBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KiwiConfig {

    @Bean
    public Kiwi kiwi() {
        Kiwi kiwi = null;

        // 현재 프로젝트의 루트 경로 가져오기
        String projectRoot = System.getProperty("user.dir");
        String path = projectRoot + "/models/base";
        try(KiwiBuilder builder = new KiwiBuilder(path)) {
            // 사용자 단어 추가
            builder.addWord("아아", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("라떼", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("자몽에이드", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("레몬에이드", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("에이드", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("바닐라크림콜드브루", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("오늘", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("쌀국수", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("물냉면", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("비빔냉면", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("놀이공원", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("강남역", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("역삼역", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("화곡역", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("삼성카드", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("12시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("11시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("10시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("9시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("8시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("7시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("6시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("5시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("4시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("3시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("2시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("1시", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("라지", Kiwi.POSTag.nnp, 2.f);
            builder.addWord("레귤러", Kiwi.POSTag.nnp, 2.f);

            // Kiwi 인스턴스 생성
            kiwi = builder.build();

            // 오타 교정 기능을 사용하여 Kiwi 인스턴스 생성
            kiwi = builder.build(KiwiBuilder.basicTypoSet, 2.0f);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return kiwi;
    }
}
