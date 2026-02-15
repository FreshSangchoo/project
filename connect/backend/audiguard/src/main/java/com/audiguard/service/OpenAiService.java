package com.audiguard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.MetadataMode;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class OpenAiService {
    @Value("${spring.ai.openai.api-key}")
    private OpenAiApi openaiAPIKey;

    @Value("${spring.ai.openai.embedding.options.model.embedding}")
    private String openAiEmbeddingModel;

//    @Value("${spring.ai.openai.chat.options.model}")
//    private String openAiGptModel;

//    private final GptConfig gptConfig;

    public EmbeddingResponse openAiEmbedding(String inputText) {
        EmbeddingModel embeddingModel = new OpenAiEmbeddingModel(openaiAPIKey, MetadataMode.EMBED, OpenAiEmbeddingOptions.builder().withModel(openAiEmbeddingModel).build());
        return embeddingModel.embedForResponse(List.of(inputText));
    }

//    public Map<String, List<String>> extractNounsAndVerbs(String outputText) {
//
//        String systemContent = """
//                주어진 텍스트에서 명사(Noun)와 동사(Verb)만 추출하여 JSON 형식으로 반환합니다.
//                - 동사는 원형을 유지하지 않고 원래의 형태를 그대로 유지합니다. (예: 일하느라 그대로)
//                - 명사는 조사 등 불필요한 형태를 제거하고 명사 형태만 남깁니다. (예: 친구들이랑 -> 친구들)
//                - '겸'과 같은 의존명사는 제외합니다.
//
//                출력 형식 예시:
//                {
//                    "Noun": ["Noun1", "Noun2", ...],
//                    "Verb": ["Verb1", "Verb2", ...]
//                }
//                """;
//        GptMessageDto systemMessage = new GptMessageDto("system", systemContent);
//        GptMessageDto userMessage = new GptMessageDto("user", outputText);
//        List<GptMessageDto> messages = new ArrayList<>();
//        messages.add(systemMessage);
//        messages.add(userMessage);
//        GptRequestDto gptRequest = new GptRequestDto(openAiGptModel, 500, 0.5, messages);
//
//        // [STEP1] 토큰 정보가 포함된 Header를 가져옵니다.
//        HttpHeaders headers = gptConfig.httpHeaders();
//
//        // [STEP5] 통신을 위한 RestTemplate을 구성합니다.
//        HttpEntity<GptRequestDto> requestEntity = new HttpEntity<>(gptRequest, headers);
//        ResponseEntity<String> response = gptConfig
//                .restTemplate()
//                .exchange("https://api.openai.com/v1/chat/completions", HttpMethod.POST, requestEntity, String.class);
//
//        JsonNode rootNode = null;
//        try {
//            // [STEP6] String -> HashMap 역직렬화를 구성합니다.
//            ObjectMapper objectMapper = new ObjectMapper();
//            rootNode = objectMapper.readTree(response.getBody());
//        } catch (JsonProcessingException e) {
//            log.debug("JsonMappingException :: " + e.getMessage());
//        } catch (RuntimeException e) {
//            log.debug("RuntimeException :: " + e.getMessage());
//        }
//
//        // "content" 필드 값 추출
//        JsonNode contentNode = rootNode
//                .path("choices")
//                .get(0)
//                .path("message")
//                .path("content");
//
//        String content = contentNode.asText();
//
//        Map<String, List<String>> wordsMap = null;
//        try {
//            // JSON 문자열을 Map<String, List<String>> 형태로 변환
//            ObjectMapper objectMapper = new ObjectMapper();
//            wordsMap = objectMapper.readValue(content, Map.class);
//        } catch (JsonProcessingException e) {
//            log.debug("JsonMappingException :: " + e.getMessage());
//        } catch (RuntimeException e) {
//            log.debug("RuntimeException :: " + e.getMessage());
//        }
//
//        return wordsMap;
//    }
}
