package com.audiguard.service;

import com.google.protobuf.Struct;
import com.google.protobuf.Value;
import io.pinecone.clients.Index;
import io.pinecone.clients.Pinecone;
import io.pinecone.proto.UpsertResponse;
import io.pinecone.unsigned_indices_model.QueryResponseWithUnsignedIndices;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PineconeService {
    @org.springframework.beans.factory.annotation.Value("${spring.ai.vectorstore.pinecone.api-key}")
    private String pineconeApiKey;

    @org.springframework.beans.factory.annotation.Value("${spring.ai.vectorstore.pinecone.index-name}")
    private String pineconeIndexName;

    public UpsertResponse upsertVectors(String ssaid, float[] values, String inputText, String outputText) {
        Pinecone pc = new Pinecone.Builder(pineconeApiKey).build();
        Index index = pc.getIndexConnection(pineconeIndexName);

        String uniqueId = UUID.randomUUID().toString();

        List<Float> valuesList = new ArrayList<>();
        for (float value : values) {
            valuesList.add(value);
        }

        Struct metaData = Struct.newBuilder()
                .putFields("ssaid", Value.newBuilder().setStringValue(ssaid).build())
                .putFields("input", Value.newBuilder().setStringValue(inputText).build())
                .putFields("output", Value.newBuilder().setStringValue(outputText).build())
                .build();

        return index.upsert(uniqueId, valuesList, null, null, metaData, null);
    }

    public QueryResponseWithUnsignedIndices queryVectors(String ssaid, float[] values) {
        Pinecone pc = new Pinecone.Builder(pineconeApiKey).build();
        Index index = pc.getIndexConnection(pineconeIndexName);

        List<Float> valuesList = new ArrayList<>();
        for (float value : values) {
            valuesList.add(value);  // float -> Float 자동 박싱
        }

        Struct filter = Struct.newBuilder()
                .putFields("ssaid", Value.newBuilder()
                        .setStructValue(Struct.newBuilder()
                                .putFields("$eq", Value.newBuilder()
                                        .setStringValue(ssaid)
                                        .build()))
                        .build())
                .build();

        return index.queryByVector(1, valuesList, null, filter, true, true);
    }
}
