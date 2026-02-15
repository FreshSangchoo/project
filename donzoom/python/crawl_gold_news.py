from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from datetime import datetime, timedelta
from gpt_summarize import summarize_news

def crawl_gold_news():
    # 오늘 날짜를 가져옴 (형식: YYYY.MM.DD)
    today = datetime.now().strftime("%y.%m.%d")

    # Selenium 설정
    chrome_options = Options()
    chrome_options.add_argument("--headless=old")  # 헤드리스 모드로 실행
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.get("https://www.koreagoldx.co.kr/board/list.php?page=1&bdId=news")  # 뉴스 페이지 URL

    try:
        # 뉴스 테이블이 로드될 때까지 기다림
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "board_list_table"))
        )

        # 모든 뉴스 항목을 가져옴
        rows = driver.find_elements(By.CSS_SELECTOR, ".board_list_table tbody tr")

        today_articles = []

        for row in rows:
            # 날짜를 가져옴
            date_text = row.find_element(By.CSS_SELECTOR, "td:nth-child(3)").text.strip()

            # 어제 날짜와 일치하는 경우
            if date_text == today:
                # 제목과 링크 가져오기
                title_element = row.find_element(By.CSS_SELECTOR, "td.board_tit a")
                title = title_element.text.strip()
                onclick_attribute = title_element.get_attribute("href")

                # 뉴스 ID 추출 (href 링크로부터 추출)
                news_id = onclick_attribute.split(",")[1].strip().replace("'", "")

                # 새로운 탭 열기
                article_url = f"https://www.koreagoldx.co.kr/board/view.php?page=1&bdId=news&sno={news_id}"
                driver.execute_script("window.open(arguments[0]);", article_url)
                driver.switch_to.window(driver.window_handles[-1])

                # 본문이 로드될 때까지 대기
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".seem_cont"))
                )
                
                # 본문 가져오기
                content_div = driver.find_element(By.CSS_SELECTOR, ".seem_cont")
                content = content_div.text.strip()

                # 날짜 형식을 ISO 8601 형식으로 변환
                parsed_date = datetime.strptime(date_text, "%Y.%m.%d")
                formatted_date = parsed_date.strftime("%Y-%m-%dT%H:%M")

                # GPT API로 요약하기 (필요시 사용)
                content = summarize_news(content)
                # 결과 저장
                article = {
                    "title": title,
                    "createdAt": formatted_date,
                    "contents": content,
                    "source" : "한국금거래소"
                }
                today_articles.append(article)
                print(today_articles)
                # 현재 탭 닫고 원래 탭으로 전환
                driver.close()
                driver.switch_to.window(driver.window_handles[0])

        return today_articles

    except Exception as e:
        print(f"오류 발생: {e}")
        return []
    finally:
        driver.quit()