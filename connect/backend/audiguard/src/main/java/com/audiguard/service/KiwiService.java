package com.audiguard.service;

import com.audiguard.dto.KiwiDto;
import kr.pe.bab2min.Kiwi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class KiwiService {

    public List<KiwiDto> extractWords(Kiwi kiwi, String outputText) {

        Kiwi.Token[] tokens = kiwi.tokenize(outputText, Kiwi.Match.allWithNormalizing);
        System.out.println(Arrays.toString(tokens));

        List<KiwiDto> result = new ArrayList<>();

        for (Kiwi.Token word : tokens) {
            String cg1 = "";
            if (word.tag == Kiwi.POSTag.nng || word.tag == Kiwi.POSTag.nnp || word.tag == Kiwi.POSTag.nr || word.tag == Kiwi.POSTag.np) {
                cg1 = "N";
            } else if (word.tag == Kiwi.POSTag.vv || word.tag == Kiwi.POSTag.va) {
                cg1 = "V";
            } else if (word.tag == Kiwi.POSTag.mm) {
                cg1 = "M";
            } else if (word.tag == Kiwi.POSTag.ec) {
                cg1 = "keep";
            } else if (word.tag == Kiwi.POSTag.sf || word.tag == Kiwi.POSTag.sp || word.tag == Kiwi.POSTag.ss ||
                    word.tag == Kiwi.POSTag.sso || word.tag == Kiwi.POSTag.ssc || word.tag == Kiwi.POSTag.se ||
                    word.tag == Kiwi.POSTag.so || word.tag == Kiwi.POSTag.sw || word.tag == Kiwi.POSTag.sb ||
                    word.tag == Kiwi.POSTag.ep || word.tag == Kiwi.POSTag.ef ||
                    word.tag == Kiwi.POSTag.etn || word.tag == Kiwi.POSTag.etm) {
                cg1 = "end";
            }

            if (cg1.isEmpty()) {
                continue;
            }

            byte cg2 = word.tag;
            result.add(new KiwiDto(word.form, cg1, cg2));
        }

        return result;
    }

}
