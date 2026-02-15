from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI, AsyncOpenAI
from pinecone import Pinecone
from typing import List, Dict
from neo4j import GraphDatabase, AsyncGraphDatabase
from collections import defaultdict
import json
from kiwipiepy import Kiwi
from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect
import aiohttp
import asyncio
from fastapi.responses import StreamingResponse
from datetime import datetime
import os
from dotenv import load_dotenv
load_dotenv()


openai_api_key = os.getenv("OPENAI_API_KEY")
pinecone_api_key = os.getenv("PINECONE_API_KEY")
domain = os.getenv("AUDIGUARD_DOMAIN")
neo4j_url = os.getenv("AUDIGUARD_GRAPH_DB_URL")
neo4j_user = os.getenv("NEO4J_USER", "neo4j")
neo4j_password = os.getenv("NEO4J_PASSWORD")
router = APIRouter()

openai_client = OpenAI(api_key=openai_api_key)
async_openai_client = AsyncOpenAI(api_key=openai_api_key)
pinecone_client = Pinecone(api_key=pinecone_api_key)
index_name = 'audiguard2'
index_dimension = 1536
pinecone_index = pinecone_client.Index(index_name)

# Neo4j 설정
neo4j_uri = f"bolt://{domain}:7687"
driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
async_driver = AsyncGraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))

kiwi = Kiwi(model_type='knlm', typos='basic')
kiwi.add_user_word('아아', 'NNP')
kiwi.add_user_word('라떼', 'NNP')
kiwi.add_user_word('자몽에이드', 'NNP')
kiwi.add_user_word('레몬에이드', 'NNP')
kiwi.add_user_word('에이드', 'NNP')
kiwi.add_user_word('바닐라크림콜드브루', 'NNP')
kiwi.add_user_word('오늘', 'NNP')
kiwi.add_user_word('놀이공원', 'NNP')
kiwi.add_user_word('강남역', 'NNP')
kiwi.add_user_word('역삼역', 'NNP')
kiwi.add_user_word('화곡역', 'NNP')
kiwi.add_user_word('삼성카드', 'NNP')
kiwi.add_user_word('12시', 'NNP')
kiwi.add_user_word('11시', 'NNP')
kiwi.add_user_word('10시', 'NNP')
kiwi.add_user_word('9시', 'NNP')
kiwi.add_user_word('8시', 'NNP')
kiwi.add_user_word('7시', 'NNP')
kiwi.add_user_word('6시', 'NNP')
kiwi.add_user_word('5시', 'NNP')
kiwi.add_user_word('4시', 'NNP')
kiwi.add_user_word('3시', 'NNP')
kiwi.add_user_word('2시', 'NNP')
kiwi.add_user_word('1시', 'NNP')
kiwi.add_user_word('라지', 'NNP')
kiwi.add_user_word('레귤러', 'NNP')

class QueryRequest(BaseModel):
    texts: List[str]
    user_id: str

class sentence_contents(BaseModel):
    sentence: str
    user_id: str

class SentenceContents(BaseModel):
    sentence: str
    user_id: str

async def pinecone_query_async(query_embedding, user_id):
    url = neo4j_url
    headers = {
        "Api-Key": "b57f1539-7a61-4705-aa44-c116bbcdbc37",
        "Content-Type": "application/json"
    }
    data = {
        "vector": query_embedding,
        "top_k": 10,
        "include_values": True,
        "include_metadata": True,
        "filter": {"ssaid": user_id}
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            res = await response.json()
            return res

def extract_words(text):
    res = []
    tokens = kiwi.tokenize(text)
    for word in tokens:
        cg1 = ''
        if word.tag in ['NNG', 'NNP', 'NR', 'NP']: 
            cg1 = 'N'
        elif word.tag in ['VV', 'VA','VV-R']: 
            cg1 = 'V'
        elif word.tag in ['MM']: 
            cg1 = 'M' 
        elif word.tag == 'EC':
            cg1 ='keep'
        elif word.tag in ['SF', 'SP', 'SS', 'SSO', 'SSC', 'SE', 'SO', 'SW', 'SB', 'EP', 'EF', 'EC', 'ETN', 'ETM']:
            cg1 = 'end' 
        if not cg1: 
            continue

        cg2 = word.tag
        res.append((word.form, cg1, cg2))
    return res

async def async_query_related_words(text: str, user_id: str) -> Dict[str, Dict[str, int]]:
    words = extract_words(text)  # 텍스트에서 단어 추출
    related_words_by_word = defaultdict(lambda: defaultdict(int))
    async with async_driver.session() as session:
        # 첫 번째 단어부터 시작하여 마지막 단어까지 반복
        for i in range(1, len(words) - 1):
            # keep 조건에 따른 이전 단어 설정
            previous_word = words[i - 1]
            current_word = words[i]
            next_word = words[i + 1]

            print(previous_word, current_word, next_word)
            if current_word[1] != 'N':
                continue


            # 각 단어의 텍스트와 카테고리 가져오기
            previous_text, previous_cg1 = previous_word[0], previous_word[1]
            current_text, current_cg1 = current_word[0], current_word[1]
            next_text, next_cg1 = next_word[0], next_word[1]

            if words[i - 1][1] == 'keep' and i - 2 >= 0:
                if words[i - 2][1] =='keep': continue
                query = f"""
                MATCH (w0:Word {{text: '{words[i-2][0]}'}}) -[r1:RELATED_TO {{userId: '{user_id}'}}] ->(w1:Word {{text: '{previous_text}'}})-[r2:RELATED_TO {{userId: '{user_id}'}}]->(w2:{current_cg1})-[r3:RELATED_TO {{userId: '{user_id}'}}]->(w3:Word {{text: '{next_text}'}})
                WHERE w2.text <> '{current_text}'
                RETURN w2.text AS word, (r1.frequency + r3.frequency) / 2 AS freq
                ORDER BY (r1.frequency + r3.frequency) / 2 DESC
                LIMIT 5
                """
            else:
                query = f"""
                MATCH (w1:Word {{text: '{previous_text}'}})-[r1:RELATED_TO {{userId: '{user_id}'}}]->(w2:{current_cg1})-[r2:RELATED_TO {{userId: '{user_id}'}}]->(w3:Word {{text: '{next_text}'}})
                WHERE w2.text <> '{current_text}'
                RETURN w2.text AS word, (r1.frequency + r2.frequency) / 2 AS freq
                ORDER BY (r1.frequency + r2.frequency) / 2 DESC
                LIMIT 5
                """

            results = await session.run(query)
            async for record in results:
                word = record["word"]
                freq = record["freq"]
                related_words_by_word[current_text][word] += freq

    return {k: dict(v) for k, v in related_words_by_word.items()}

async def stream_response(generator):
    async for item in generator:
        print("Streamed data:", item)  # 스트림으로 보낸 데이터를 서버 로그에 출력
        yield f"data: {json.dumps(item)}\n\n"

async def generate_sentence_stream(sentence_string: str, user_id: str):
    print(f"Received sentence: {sentence_string}, User ID: {user_id}")  # 입력 로그
    
    # OpenAI Embeddings 생성
    embedding_response = await async_openai_client.embeddings.create(
        input=sentence_string,
        model="text-embedding-3-small"
    )
    query_embedding = embedding_response.data[0].embedding

    res = await pinecone_query_async(query_embedding, user_id)

    previous_qa = ''
    for i, v in enumerate(res['matches']):
        previous_qa += f"Q. " + v['metadata']['input'] + f" A. " + v['metadata']['output'] + ", "
        print(v['metadata']['output'])

        # GPT-4로 문장 분석 및 답변 생성

    messages = [
        {
            "role": "system",
            "content": (
                f"""
                Use the following Q&A context for reference: {previous_qa}.
                - Q&A pairs are separated by commas and formatted as "Q" for question and "A" for answer.
                - If the new question matches the context, include the existing answer (adjusting tone or phrasing if necessary) as one of the 3 responses. 
                - If no match exists, generate exactly 3 concise and relevant answers.
                - Adapt responses to reflect the tone and speaking style of the input question or conversation context.
                - Avoid adding unnecessary commentary, explanations, or verbose details. Keep responses focused and to the point.
                - Use the structure:
                    [
                    Answer: response
                    Answer: response
                    Answer: response
                    ]
                - Responses must strictly follow the specified structure without exceptions under any circumstances.
                - Ensure all responses are clear, relevant, and consistent with the intended tone, avoiding repetitive or overly similar phrasing.
                - Do not use any prefixes like 'A.', '1.', etc., in the responses.
                - Alongside the existing answer, generate 2 additional answers that differ in tone, structure, or phrasing while maintaining relevance to the question.
                - This structure and formatting are mandatory and must be followed at all times without deviation.
                """
            )
        },
        {"role": "user", "content": sentence_string}
    ]


    print("Sending messages to GPT-4:", messages)  # GPT-4 요청 메시지 로그

    response = await async_openai_client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=messages,
        temperature=0.5,
        max_tokens=500,
        stream=True,  # 스트리밍 활성화
    )

    print("Start streaming GPT response...")  # 스트리밍 시작 로그

    current_answer_index = 0  # 현재 Answer 순서 추적
    buffer = ""  # Answer 데이터를 누적하는 버퍼
    answers = []  # 완성된 Answer를 저장할 리스트

    async for chunk in response:
        content = chunk.choices[0].delta.content

        # NoneType 반환 감지 및 처리
        if content is None or not content.strip():
            continue  # 빈 데이터를 건너뛰고 다음 청크로 진행

        print("Received chunk from GPT:", content)  # GPT 청크 데이터 로그

        # 특정 조건을 만족하면 건너뜀
        if "\n" in content:
            continue
        elif ":" in content:
            content = content.replace(":", "")
        elif "[" in content:
            content = content.replace("[", "")
        elif "]" in content:
            content = content.replace("]", "")

        # Answer의 시작을 감지
        if "Answer" == content.strip():
            if current_answer_index > 0:  # 이전 Answer가 끝난 경우
                # 완성된 Answer를 리스트에 추가
                answers.append(buffer.strip())
                yield {
                    "status": "completed",
                    "sentence_order": current_answer_index
                }
            current_answer_index += 1
            buffer = ""  # 새 Answer를 위한 버퍼 초기화
            continue

        # 데이터 스트림 전송
        yield {
            "status": "streaming",
            "data": content,
            "sentence_order": current_answer_index
        }

        # 청크 데이터를 버퍼에 누적
        buffer += content

    # 마지막 Answer에 대해 완료 상태 전송
    if current_answer_index > 0:
        # 마지막 Answer를 리스트에 추가
        answers.append(buffer.strip())
        yield {
            "status": "completed",
            "sentence_order": current_answer_index
        }

    # 완성된 Answer 세 개를 서버 로그에 출력
    print("Final Answers:", answers)

    # async_query_related_words를 병렬 처리
    async def process_answers(answer: str, sentence_order: int):
        print(f"Processing answer: {answer}")  # 각 Answer 처리 로그
        result = await async_query_related_words(answer, user_id)
        return {"status": "word", "data": result, "sentence_order": sentence_order}

    # 병렬 처리로 모든 Answers를 처리
    tasks = [process_answers(answer, idx + 1) for idx, answer in enumerate(answers)]
    for task in asyncio.as_completed(tasks):  # 병렬 처리된 결과 스트리밍
        result = await task
        yield result

    print("Streaming complete.")  # 스트리밍 완료 로그


@router.post("/sentence/stream/")
async def generate_sentence_stream_endpoint(input: SentenceContents):
    sentence_string = input.sentence
    user_id = input.user_id

    # SSE를 사용한 스트리밍 응답
    generator = generate_sentence_stream(sentence_string, user_id)
    return StreamingResponse(stream_response(generator), media_type="text/event-stream")