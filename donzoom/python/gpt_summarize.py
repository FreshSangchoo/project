import os
from dotenv import load_dotenv
import json
import requests

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
api_key = os.getenv("OPENAI_API_KEY")  # .env 파일에서 API 키 로드

# GPT 요약 함수
def summarize_news(text):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": "너는 경제뉴스 기사를 7살 이하의 아이들이 이해할 수 있게 설명해주는 역할을 맡고 있어. 금리같은 경제단어는 뜻을 같이 말해줘. 요약한 티 내지말고 자, 얘들아, 안녕 같은 말은 빼줘"},
            {"role": "user", "content": f"이 뉴스 기사를 아이들이 이해할 수 있게 쉽게 풀어주고 요약해줘: {text}"}
        ]
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()  # HTTPError 발생 시 예외 발생
        data = response.json()
        summary = data['choices'][0]['message']['content'].strip()
        return summary
    except requests.exceptions.RequestException as e:
        print(f"GPT API 요청 실패: {e}")
        return text  # 요약 실패 시 원본 텍스트 반환


# GPT 요약 함수 (필요시 사용)
def summarize_report(text):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "너는 종목분석 리포트 요약글을 아이들이 이해할 수 있도록 잘 설명해줄거야. 금리같은 경제단어는 뜻을 같이 말해줘. 자, 얘들아, 안녕 같은 말은 빼줘"},
            {"role": "user", "content": f"이 종목분석 리포트 요약글을 설명해줘: {text}"}
        ]
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()  # HTTPError 발생 시 예외 발생
        data = response.json()
        summary = data['choices'][0]['message']['content'].strip()
        return summary
    except requests.exceptions.RequestException as e:
        print(f"GPT API 요청 실패: {e}")
        return text  # 요약 실패 시 원본 텍스트 반환
    