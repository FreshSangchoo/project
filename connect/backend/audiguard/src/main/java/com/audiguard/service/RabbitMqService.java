package com.audiguard.service;

import com.audiguard.dto.KiwiDto;
import com.audiguard.dto.RabbitMqDto;
import com.google.protobuf.ListValue;
import com.google.protobuf.Value;
import io.pinecone.proto.UpsertResponse;
import io.pinecone.unsigned_indices_model.QueryResponseWithUnsignedIndices;
import kr.pe.bab2min.Kiwi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.Driver;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

import static org.springframework.ai.vectorstore.SimpleVectorStore.EmbeddingMath.cosineSimilarity;

/**
 * Queue 로 메세지를 발핼한 때에는 RabbitTemplate 의 ConvertAndSend 메소드를 사용하고
 * Queue 에서 메세지를 구독할때는 @RabbitListener 을 사용
 *
 **/
@Slf4j
@RequiredArgsConstructor
@Service
public class RabbitMqService {

//    @Value("${rabbitmq.routing.key.1}")
//    private String routingKey;
//
//    @Value("${rabbitmq.exchange.name}")
//    private String exchangeName;
//
//    private final RabbitTemplate rabbitTemplate;
    private final OpenAiService openAiService;
    private final PineconeService pineconeService;
    private final Driver driver;
    private final Neo4jService neo4jService;
    private final Kiwi kiwi;
    private final KiwiService kiwiService;

//    public void sendMessage(RabbitMqDto rabbitMqDto) {
//        log.info("messagge send: {}", rabbitMqDto.toString());
//        this.rabbitTemplate.convertAndSend(exchangeName, routingKey, rabbitMqDto);
//    }

    @RabbitListener(queues = "${rabbitmq.queue.name.1}")
    public void receiveUpsertMessage(RabbitMqDto rabbitMqDto) {
        log.info("Received Upsert Message : {}", rabbitMqDto.toString());
        String ssaid = rabbitMqDto.getSsaid();
        String inputText = rabbitMqDto.getInputText();
        String outputText = rabbitMqDto.getOutputText();
        log.info("ssaid : {}", ssaid);
        log.info("inputText : {}", inputText);
        log.info("outputText : {}", outputText);

        if (ssaid.isEmpty() || inputText.isEmpty() || outputText.isEmpty()) {
            log.error("ssaid, inputText, outputText are all required");
            return;
        }

        // 임베딩
        EmbeddingResponse embeddingResponse = openAiService.openAiEmbedding(inputText);
        float[] inputValues = embeddingResponse.getResult().getOutput();
        log.info("embedding values : {}", Arrays.toString(inputValues));

        embeddingResponse = openAiService.openAiEmbedding(outputText);
        float[] outputValues = embeddingResponse.getResult().getOutput();
        log.info("embedding values : {}", Arrays.toString(outputValues));

        // inputText(질문) 기준으로 데이터 10개 가져오기
//        int idx = -1;
        QueryResponseWithUnsignedIndices queryResponse = pineconeService.queryVectors(ssaid, inputValues);
        String output = "";
        if (queryResponse != null && !queryResponse.getMatchesList().isEmpty()) {
            output = queryResponse.getMatches(0).getMetadata().getFieldsMap().get("output").getStringValue();
            System.out.println("output : " + output);
        }


//        for (int i = 0; i < 10; i++) {
//            ListValue listValue = queryResponse.getMatches(i).getMetadata().getFieldsMap().get("outputVector").getListValue();
//            float[] floatArray = new float[listValue.getValuesList().size()];
//
//            // 각 Value를 float로 변환하여 배열에 추가
//            int index = 0;
//            for (Value value : listValue.getValuesList()) {
//                floatArray[index++] = (float) value.getNumberValue();
//            }
//
//            if (cosineSimilarity(outputValues, floatArray) > 0.9) {
//                idx = i;
//                break;
//            }
//        }

        // Pinecone
        if (!output.equals(outputText)) {
            UpsertResponse upsertResponse = pineconeService.upsertVectors(ssaid, inputValues, inputText, outputText);
            log.info("upsert response : {}", upsertResponse.toString());
        } else {
            log.info("do not upsert response");
        }

//        Map<String, List<String>> wordsMap = openAiService.extractNounsAndVerbs(outputText);
//        log.info("명사 배열 : {}", wordsMap.get("Noun").toString());
//        log.info("명사 배열 : {}", wordsMap.get("Verb").toString());

        // Kiwi
        List<KiwiDto> words = kiwiService.extractWords(kiwi, outputText);
        log.info("words response : {}", words.toString());

        // Neo4j
        neo4jService.createRelationshipsInNeo4j(driver, words, ssaid);
    }

//    @RabbitListener(queues = "${rabbitmq.queue.name.1}")
//    public void receiveUpsertMessage(RabbitMqDto rabbitMqDto) {
//        log.info("Received Upsert Message : {}", rabbitMqDto.toString());
//        String ssaid = rabbitMqDto.getSsaid();
//        String inputText = rabbitMqDto.getInputText();
//        String outputText = rabbitMqDto.getOutputText();
//        log.info("ssaid : {}", ssaid);
//        log.info("inputText : {}", inputText);
//        log.info("outputText : {}", outputText);
//
//        if (ssaid.isEmpty() || inputText.isEmpty() || outputText.isEmpty()) {
//            log.error("ssaid, inputText, outputText are all required");
//            return;
//        }
//
//        // 임베딩
//        EmbeddingResponse embeddingResponse = openAiService.openAiEmbedding(inputText);
//        float[] values = embeddingResponse.getResult().getOutput();
//        log.info("embedding values : {}", Arrays.toString(values));
//
//        // Pinecone
//        UpsertResponse upsertResponse = pineconeService.upsertVectors(ssaid, values, inputText, outputText);
//        log.info("upsert response : {}", upsertResponse.toString());
//
////        Map<String, List<String>> wordsMap = openAiService.extractNounsAndVerbs(outputText);
////        log.info("명사 배열 : {}", wordsMap.get("Noun").toString());
////        log.info("명사 배열 : {}", wordsMap.get("Verb").toString());
//
//        // Kiwi
//        List<KiwiDto> words = kiwiService.extractWords(kiwi, outputText);
//        log.info("words response : {}", words.toString());
//
//        // Neo4j
//        neo4jService.createRelationshipsInNeo4j(driver, words, ssaid);
//    }

//    @RabbitListener(queues = "${rabbitmq.queue.name.2}")
//    public void receiveQueryMessage(QueryMessageDto queryMessageDto) {
//        log.info("Received Query Message : {}", queryMessageDto.toString());
//        String inputText = queryMessageDto.getInputText();
//        log.info("inputText : {}", inputText);
//
//        EmbeddingResponse embeddingResponse = embeddingService.doEmbedding(inputText);
//
//        String ssaid = queryMessageDto.getSsaid();
//        float[] values = embeddingResponse.getResult().getOutput();
//        log.info("embedding values : {}", Arrays.toString(values));
//
//        QueryResponseWithUnsignedIndices queryResponseWithUnsignedIndices = pineconeService.queryVectors(ssaid, values);
//        log.info("upsert response : {}", queryResponseWithUnsignedIndices.toString());
//    }
}