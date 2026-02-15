from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime, timedelta
import pytz  # 시간대 설정을 위해 pytz 사용
import time
from dotenv import load_dotenv
import os
import requests
import json
from gpt_summarize import summarize_report

# 환경 변수 로드
load_dotenv()

# 한국 시간대 설정
KST = pytz.timezone('Asia/Seoul')

# OpenAI API 키 설정
api_key = os.getenv("OPENAI_API_KEY")  # .env 파일에서 API 키 로드

# 종목과 stockId 매핑
stock_mapping_report= {
    1: "005930 삼성전자",
    2: "066570 LG전자",   # 금호전기
    3: "035420 NAVER",   # 네이버
    4: "035720 카카오"   # 카카오
}

# Selenium 크롤링 함수 정의
def crawl_reports(stockId):

    # ChromeDriver 설정
    options = Options()
    options.add_argument("--headless=old")   # 백그라운드 모드
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # 네이버 금융 리서치 페이지로 이동
    driver.get('https://finance.naver.com/research/company_list.naver')

    wait = WebDriverWait(driver, 10)

    # 전체 데이터 리스트를 저장할 리스트
    all_data_list = []

    # 종목 처리
    stock_name = stock_mapping_report.get(stockId)
    if not stock_name:
        print(f"존재하지 않는 stockId: {stockId}")
        return []

    print(f"{stock_name}의 데이터를 처리합니다...")

    # 종목명 입력란 클릭해서 팝업 창 띄우기
    search_input = wait.until(EC.element_to_be_clickable((By.NAME, 'itemName')))
    search_input.click()

    # 팝업 창이 뜨면 해당 창으로 전환
    driver.switch_to.window(driver.window_handles[-1])

    # 선택된 stockId에 맞는 종목 검색
    search_option = wait.until(EC.element_to_be_clickable((By.XPATH, f"//option[contains(text(), '{stock_name}')]")))
    search_option.click()

    # '확인' 버튼 클릭
    choice_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[@href='javascript:choiceBtnClick()']")))
    choice_button.click()

    # 팝업 창 닫기 후 원래 창으로 전환
    driver.switch_to.window(driver.window_handles[0])

    # 페이지 로딩 대기
    time.sleep(2)

    # '검색' 버튼 클릭
    search_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@alt='검색']")))
    search_button.click()

    # 하루 전 날짜 가져오기
    #yesterday = (datetime.now(KST) - timedelta(days=1)).strftime("%y.%m.%d")  # 한국 시간대로 맞춰줌
    today = datetime.now(KST).strftime("%y.%m.%d")
    print(today)
    # 리포트 목록을 담고 있는 테이블의 행 가져오기
    report_rows = driver.find_elements(By.XPATH, "//div[@class='box_type_m']//table//tr")

    # 오늘 날짜의 리포트만 출력 및 링크 저장
    report_list = []
    for row in report_rows[2:]:
        try:
            date_time = row.find_element(By.CSS_SELECTOR, 'td:nth-child(5)').text
            if date_time == today:
                title = row.find_element(By.CSS_SELECTOR, 'td:nth-child(2) a').text
                source = row.find_element(By.CSS_SELECTOR, 'td:nth-child(3)').text
                title_link = row.find_element(By.CSS_SELECTOR, 'td:nth-child(2) a').get_attribute('href')
                report_list.append({'title': title, 'link': title_link, 'date_time': date_time, 'source': source})
        except Exception as e:
            continue

    # 상세 조회 및 데이터 생성
    for report in report_list:
        driver.get(report['link'])
        time.sleep(2)
        try:
            article_content = driver.find_element(By.CSS_SELECTOR, '.view_cnt').text
            
            # GPT API로 요약하기 (필요시 사용)
            article_content = summarize_report(article_content)

            # 현재 시간을 ISO 8601 형식으로 변환하여 createdAt 필드에 저장
            created_at = datetime.now(KST).strftime('%Y-%m-%dT%H:%M:%S')  # 한국 시간으로 설정한 현재 시간

            data = {
                "title": report['title'],
                "contents": article_content,
                "source": report['source'],
                "createdAt": created_at  # 현재 시간을 추가 (ISO 8601 형식)
            }
            all_data_list.append(data)
        except Exception as e:
            print(f"오류 발생: {e}")
    print(all_data_list)
    driver.quit()
    
    return all_data_list
