from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
from gpt_summarize import summarize_news
import re

# 종목과 stockId 매핑 (key-value 형태)
stock_mapping = {
    6: "AAPL.O",   # 애플
    7: "GOOGL.O",  # 구글
    8: "TSLA.O"    # 테슬라
}

def parse_korean_date(date_str):
    # 정규표현식을 사용하여 날짜와 시간 추출
    match = re.match(r'(\d{4})\.(\d{2})\.(\d{2})\.\s+(오전|오후)\s+(\d{1,2}):(\d{2})', date_str)
    if match:
        year, month, day, am_pm, hour, minute = match.groups()
        hour = int(hour)
        
        # 오후이고 시간이 12 미만인 경우 12를 더함
        if am_pm == '오후' and hour < 12:
            hour += 12
        # 오전이고 시간이 12인 경우 0으로 설정
        elif am_pm == '오전' and hour == 12:
            hour = 0
        
        # datetime 객체 생성 및 형식화된 문자열 반환
        dt = datetime(int(year), int(month), int(day), hour, int(minute))
        return dt
    else:
        raise ValueError(f"날짜 형식을 파싱할 수 없습니다: {date_str}")

# 오늘 날짜 비교 함수
def is_today(date_obj):
    today = datetime.now()
    return date_obj.date() == today.date()

# 뉴스 URL을 리스트에 저장하고 각 URL에서 본문과 제목을 추출하는 함수
def crawl_world_news(stockId):
    
    # stockId에 따른 URL 결정
    stock_symbol = stock_mapping.get(stockId)
    if not stock_symbol:
        print(f"stockId {stockId}에 대한 매핑을 찾을 수 없습니다.")
        return []

    # URL 생성
    url = f"https://m.stock.naver.com/worldstock/stock/{stock_symbol}/localNews"
    
    # Chrome WebDriver 설정
    chrome_options = Options()
    chrome_options.add_argument("--headless=old")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.get(url)

    # 뉴스 리스트 항목을 기다림
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.NewsList_inner__kSzOg")))

    # 뉴스 URL을 저장할 리스트
    news_urls = []

    # 뉴스 리스트에서 각 뉴스 항목을 클릭하여 URL을 수집
    news_links = driver.find_elements(By.CSS_SELECTOR, "div.NewsList_inner__kSzOg a.NewsList_link__q7jtl")

    for i, news in enumerate(news_links[:3]):
        try:
            # 현재 창 저장 (원래 창)
            main_window = driver.current_window_handle
            
            # 링크 클릭 (새 창이나 탭이 열림)
            news.click()

            # 새로운 창이 열리기를 대기
            WebDriverWait(driver, 10).until(EC.new_window_is_opened)

            # 모든 창의 핸들 가져오기
            all_windows = driver.window_handles

            # 새 창으로 전환
            for window in all_windows:
                if window != main_window:
                    driver.switch_to.window(window)
                    break

            # 현재 URL 가져오기
            current_url = driver.current_url
            print(f"클릭 후 이동한 URL: {current_url}")

            # URL을 리스트에 저장
            news_urls.append(current_url)

            # 새 창 닫기
            driver.close()

            # 원래 창으로 다시 전환
            driver.switch_to.window(main_window)

            # 다시 뉴스 리스트로 돌아오기까지 대기
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.NewsList_inner__kSzOg")))

        except Exception as e:
            print(f"에러 발생: {e}")
            continue

    # 저장된 URL 리스트 출력
    print("저장된 뉴스 URL 리스트:", news_urls)

    # URL 리스트를 돌면서 각 뉴스의 제목과 본문을 가져옴
    final_data_list = []
    
    for news_url in news_urls:
        try:
            # URL로 이동
            driver.get(news_url)

            # 본문 추출 (HTML 구조에 맞게 수정)
            content_section = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div#newsct_article article#dic_area"))
            )
            content = content_section.text.strip()

            # 제목 추출 (HTML 구조에 맞게 수정)
            title_section = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.media_end_head_title h2.media_end_head_headline span"))
            )
            title = title_section.text.strip()

            # 날짜 추출 (네이버 뉴스 구조에 맞추어 조정)
            date_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "span.media_end_head_info_datestamp_time"))
            )
            date_str = date_element.text.strip()
            
            print(f"추출한 원본 날짜: {date_str}")  # 날짜 디버깅

            # 날짜 문자열 파싱 및 형식 변경
            news_date = parse_korean_date(date_str)

            # 오늘 날짜인지 확인
            if not is_today(news_date):
                print(f"오늘 날짜가 아님: {news_date}")
                continue

            print(f"변환된 날짜: {news_date.strftime('%Y-%m-%dT%H:%M:%S')}")  # 변환된 날짜 디버깅
            
            # 출처(meta 정보에서 'twitter:creator'의 content 속성)
            meta_source = driver.find_element(By.CSS_SELECTOR, 'meta[name="twitter:creator"]')
            source = meta_source.get_attribute("content")
            
             # GPT API로 요약하기 (필요시 사용)
            content = summarize_news(content)
            
            # 최종 데이터 생성
            final_data = {
                "title": title,
                "createdAt": news_date.strftime('%Y-%m-%dT%H:%M:%S'),
                "source": source,  # source 추가
                "contents": content
            }

            # 결과 리스트에 추가
            final_data_list.append(final_data)

        except Exception as e:
            print(f"본문을 가져오는 중 오류 발생: {e}")
            continue
    
    # 수집한 뉴스 데이터 출력
    print("최종 뉴스 데이터:", final_data_list)

    # 드라이버 종료
    driver.quit()
    
    return final_data_list
