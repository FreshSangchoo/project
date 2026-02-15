package com.audiguard.service;

import com.audiguard.dto.KiwiDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class Neo4jService {

    public void createRelationshipsInNeo4j(Driver driver, List<KiwiDto> words, String ssaid) {
        try (Session session = driver.session()) {
            for (int i = 0; i < words.size() - 1; i++) {
                KiwiDto word1 = words.get(i);
                KiwiDto word2 = words.get(i + 1);

                if (word1.getCg1().equals("end")) {
                    continue;
                }

                String query = String.format(
                        "MERGE (w1:%s:Word {text: '%s', type: '%s'}) " +
                                "MERGE (w2:%s:Word {text: '%s', type: '%s'}) " +
                                "MERGE (w1)-[r:RELATED_TO {userId: '%s'}]->(w2) " +
                                "ON CREATE SET r.frequency = 1 " +
                                "ON MATCH SET r.frequency = r.frequency + 1",
                        word1.getCg1(), word1.getWord(), word1.getCg2(),
                        word2.getCg1(), word2.getWord(), word2.getCg2(),
                        ssaid
                );

                session.run(query);
                log.info("Relationship created: {} -> {} (ssaid: {}, idx: {})", word1.getWord(), word2.getWord(), ssaid, i);
            }
        }
    }

}
