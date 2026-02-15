# crawl_news.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
import time
import requests
import os
from dotenv import load_dotenv
import json

# 환경 변수 로드
load_dotenv()

# 종목과 stockId 매핑 (key-value 형태)
stock_mapping = {
    1: "005930 삼성전자"
}

# OpenAI API 키 설정
api_key = os.getenv("OPENAI_API_KEY")  # .env 파일에서 API 키 로드

# Spring Boot 서버의 엔드포인트 URL
spring_boot_url = os.getenv("SPRING_BOOT_URL")
news_path = os.getenv("NEWS_PATH")
save_news_URL = spring_boot_url + news_path

# ChromeDriver 설정
chrome_options = Options()
chrome_options.add_argument("--headless")  # 헤드리스 모드 활성화
chrome_options.add_argument("--no-sandbox")  # 필요 시 추가
chrome_options.add_argument("--disable-dev-shm-usage")  # 필요 시 추가

# GPT 요약 함수
def summarize_text(text):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": "너는 경제뉴스 기사를 7살 이하의 아이들이 이해할 수 있게 설명해주는 역할을 맡고 있어. 금리같은 경제단어는 뜻을 같이 말해줘. 요약한 티 내지말고"},
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

# 뉴스 기사 크롤링 함수
def crawl_news():
    print(f"뉴스 기사를 가져오기 시작: {datetime.now()}")

    # 크롬 드라이버 설정
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    # 오늘 날짜를 YYYYMMDD 형식으로 생성
    today = datetime.now().strftime('%Y%m%d')

    # 뉴스 목록 페이지 URL
    base_url = "https://finance.naver.com"
    topics = [
        {"id": 401, "name": "시황,전망"},
        {"id": 404, "name": "채권,선물"}
    ]

    all_news_data = []

    for topic in topics:
        url = f"{base_url}/news/news_list.naver?mode=LSS3D&section_id=101&section_id2=258&section_id3={topic['id']}&date={today}"
        print(f"URL: {url}")

        # 크롬 드라이버에 URL 주소 넣고 실행
        driver.get(url)

        # 페이지가 완전히 로딩되도록 대기
        time.sleep(3)

        # 기사 목록 가져오기
        articles = driver.find_elements(By.CSS_SELECTOR, 'li.newsList.top')

        # 상위 5개의 dd.articleSubject 가져오기
        for article in articles:
            dl_tag = article.find_element(By.TAG_NAME, 'dl')

            # 제목과 링크 가져오기
            subject_dd = dl_tag.find_elements(By.CSS_SELECTOR, 'dd.articleSubject')

            # 상위 5개 dd.articleSubject 가져오기
            for subject in subject_dd[:5]:
                link_tag = subject.find_element(By.TAG_NAME, 'a')
                article_title = link_tag.text
                article_url = link_tag.get_attribute('href')

                # 뉴스 링크를 리스트에 저장 (주제 ID 포함)
                all_news_data.append({
                    "topicId": topic["id"],
                    "title": article_title,
                    "url": article_url
                })

                # 기사 정보 출력
                print(f"Title: {article_title}")
                print(f"URL: {article_url}")
                print("-" * 40)

    # 기사 본문 가져오기
    print(f"기사 본문 가져오기 시작: {datetime.now()}")

    all_articles = []

    for news in all_news_data:
        title = news["title"]
        url = news["url"]
        topicId = news["topicId"]

        # 기사 본문 페이지로 이동
        driver.get(url)

        # 새로운 페이지가 완전히 로드될 때까지 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'div.newsct_article'))
        )

        # 본문 추출
        article_div = driver.find_element(By.CSS_SELECTOR, 'div.newsct_article')
        article_content = article_div.find_element(By.CSS_SELECTOR, 'article.go_trans').text

        # 날짜와 시간 추출
        date_time_element = driver.find_element(By.CSS_SELECTOR, 'div.media_end_head_info_datestamp_bunch span.media_end_head_info_datestamp_time._ARTICLE_DATE_TIME')
        date_time_str = date_time_element.get_attribute('data-date-time')  # data-date-time 속성에서 값을 가져옴
        date_time = datetime.strptime(date_time_str, "%Y-%m-%d %H:%M:%S")  # 날짜와 시간 문자열을 datetime 객체로 변환

        # GPT API로 요약하기 (필요시 사용)
        # article_content = summarize_text(article_content)

        # 데이터 생성
        data = {
            "title": title,
            "summary": article_content,
            "date_time": date_time,
            "topicId": topicId  # 주제 ID 포함
        }

        # 기사 정보를 리스트에 추가
        all_articles.append(data)

        # 기사 정보 출력
        print(f"Title: {title}")
        print(f"Summary: {article_content}")
        print(f"DateTime: {date_time}")
        print(f"Topic ID: {topicId}")
        print("-" * 40)

    # 드라이버 종료
    driver.quit()

    return all_articles
