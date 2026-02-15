from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
from dateutil import parser  # 문자열 날짜 파싱을 위한 라이브러리
from gpt_summarize import summarize_news

# ChromeDriver 설정
chrome_options = Options()
chrome_options.add_argument("--headless=old")  # 헤드리스 모드 활성화
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# 종목과 stockId 매핑 (key-value 형태)
stock_mapping = {
    1: "005930",  # 삼성전자
    2: "066570",   # 금호전기
    3: "035420",   # 네이버
    4: "035720"   # 카카오
}

# 뉴스 기사 크롤링 함수 (특정 stockId를 받아 해당 뉴스만 크롤링)
def crawl_news(stockId):
    stock_name = stock_mapping.get(stockId)
    if not stock_name:
        print(f"존재하지 않는 stockId: {stockId}")
        return []

    print(f"뉴스 목록을 가져오기 시작: {datetime.now()}")

    # 크롬 드라이버 설정
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    # 네이버 금융 종목 뉴스 페이지 URL
    base_url = "https://finance.naver.com"

    content_list = []  # 최종 본문 데이터를 저장할 리스트

    print(base_url + f"/item/news.naver?code={stock_name}" + " 정보 가져오기")
    # 크롬 드라이버에 URL 실행
    driver.get(base_url + f"/item/news.naver?code={stock_name}")

    # 페이지 로딩 대기
    wait = WebDriverWait(driver, 20)

    try:
        # iframe으로 전환
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, 'news_frame')))
       
        # iframe 내부의 뉴스 목록에서 제목과 링크 가져오기
        news_section = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.type5")))
        articles = news_section.find_elements(By.CSS_SELECTOR, "tbody > tr")

        # 각 종목의 제목과 링크만을 임시로 저장할 리스트 (매번 초기화)
        temp_news_list = []

        inside_cluster = False  # _clusterId 태그에 들어간 상태인지 여부를 추적하는 변수

        for article in articles:
            class_name = article.get_attribute("class")

            # `_clusterId`가 포함된 `tr` 태그를 발견하면 자손 태그를 무시하기 위해 플래그 설정
            if "_clusterId" in class_name:
                inside_cluster = True
                continue  # 이 `tr` 태그는 건너뛰기

            # `inside_cluster`가 True면 자손 태그를 계속 무시
            if inside_cluster:
                if class_name.strip() == "" or "relation_lst" in class_name:
                    inside_cluster = False  # 자손 태그 무시 종료
                continue  # 자손 태그 무시

            try:
                # 제목과 링크 추출
                title_element = article.find_element(By.CLASS_NAME, 'title')
                title = title_element.text.strip()  # 제목 텍스트 추출 및 공백 제거

                # 제목이 없는 경우 건너뛰기
                if not title:
                    continue

                link = title_element.find_element(By.TAG_NAME, 'a').get_attribute('href')  # 링크 추출

                # 날짜 추출 (문자열을 datetime 객체로 변환)
                date_element = article.find_element(By.CLASS_NAME, 'date')
                date_str = date_element.text.strip()

                # 출처 추출 (info 클래스에 해당하는 태그)
                source_element = article.find_element(By.CLASS_NAME, 'info')
                source = source_element.text.strip()  # 출처 정보 추출
                
                # 문자열을 datetime 객체로 변환 (예: "2024.09.13 12:00" 형식에서 변환)
                try:
                    parsed_date = parser.parse(date_str)  # 문자열을 datetime 객체로 변환
                    formatted_date = parsed_date.strftime("%Y-%m-%dT%H:%M")  # 원하는 형식으로 변환
                except Exception as e:
                    print(f"날짜 파싱 중 오류 발생: {e}")
                    continue

                # 기사 정보를 temp_news_list에 저장
                data = {
                    "title": title,
                    "link": link,
                    "source": source,  # 출처 저장
                    "createdAt": formatted_date,  # 원하는 형식으로 변환된 날짜
                }
                temp_news_list.append(data)

                # 종목당 3개의 기사만 수집하도록 제한
                if len(temp_news_list) >= 3:
                    break

            except Exception as inner_e:
                print(f"기사 처리 중 오류 발생: {inner_e}")

        # temp_news_list에 저장된 뉴스들에 대해 본문 가져오기
        print("뉴스 본문을 가져오기 시작합니다.")

        for news in temp_news_list:
            driver.get(news['link'])  # 뉴스 링크로 이동
            try:
                # 뉴스 본문이 있는 div 태그를 찾기
                content_section = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div#newsct_article article#dic_area"))
                )
                content = content_section.text.strip()  # 본문 텍스트 추출

                # GPT API로 요약하기 (필요시 사용)
                content = summarize_news(content)

                # 새로운 딕셔너리에 제목, 날짜, 본문만 추가 (링크와 소스는 제외)
                final_data = {
                    "title": news['title'],
                    "createdAt": news['createdAt'],  # 원하는 형식으로 변환된 날짜
                    "stockId": stockId,
                    "source": news['source'],
                    "contents": content
                }

                # 최종 데이터를 content_list에 추가
                content_list.append(final_data)

            except Exception as e:
                print(f"본문을 가져오는 중 오류 발생: {e}")

    except Exception as e:
        print(f"뉴스 목록을 가져오는 중 오류 발생: {e}")
    print(content_list)

    driver.quit()

    return content_list
