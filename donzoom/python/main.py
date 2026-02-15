from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import yfinance as yf
import pytz
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from pathlib import PurePosixPath
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from crawl_reports import crawl_reports  # 크롤링 모듈 임포트
from crawl_news import crawl_news 
from crawl_world_news import crawl_world_news 
from crawl_gold_news import crawl_gold_news 
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
from apscheduler.triggers.cron import CronTrigger
import pytz


# 종목과 stockId 매핑 (key-value 형태)
stock_mapping = {
    1: "005930",  # 삼성전자
    2: "066570",  # LG전자
    3: "035420",  # 네이버
    4: "035720"   # 카카오
}
world_stock_mapping = {
    6 : "AAPL",
    7:  "GOOGL",
    8: "TSLA"
}

# 종목과 stockId 매핑 (key-value 형태)
stock_mapping_report = {
    1: "005930 삼성전자",
    2: "066570 LG전자",
    3: "035420 NAVER",
    4: "035720 카카오"
}

# 종목과 stockId 매핑 (key-value 형태)
ticker_to_id_map = {
    "005930.KS": 1,  # 삼성전자
    "066570.KS": 2,  # LG전자
    "035420.KS": 3,  # 네이버
    "035720.KS": 4,  # 카카오
    "GC=F": 5,       # 금 선물
    "AAPL": 6,
    "GOOGL": 7,
    "TSLA": 8
}

# 환경 변수 로드
load_dotenv()

# 시간대 설정
KST = pytz.timezone('Asia/Seoul')
EST = pytz.timezone('America/New_York')

# Spring Boot 서버의 엔드포인트 URL
# spring_boot_url = os.getenv("SPRING_BOOT_URL", "http://donzoom:8081")
# stock_path = os.getenv("STOCK_PATH", "/stock")
# news_path = os.getenv("NEWS_PATH", "/news")
# report_path = os.getenv("REPORT_PATH", "/report")
spring_boot_url = os.getenv('SPRING_BOOT_URL')
stock_path = os.getenv('STOCK_PATH')
news_path = os.getenv('NEWS_PATH')
report_path = os.getenv('REPORT_PATH')
save_stock_history_url = spring_boot_url + stock_path


save_stock_history_url = spring_boot_url + stock_path
save_news_URL = spring_boot_url + news_path
save_report_URL = spring_boot_url + report_path

print(save_report_URL)

# 스케줄러 설정
scheduler = BackgroundScheduler()

# 특정 주식이나 금 데이터를 가져오고 Spring Boot 서버로 전송하는 함수
def fetch_and_send_data(ticker, stockId, interval):
    now_kst = datetime.now(KST)
    now_est = datetime.now(EST)
    period = "1d"
    if interval == "1m":
        period = "1d"
    elif interval == "1d":
        period = "1mo"
    elif interval == "1wk":
        period = "3mo"
    elif interval == "1mo":
        period = "1y"
  
    # 국내 주식은 한국 시간 기준 주말에 데이터 수집하지 않음
    if ticker.endswith(".KS") and now_kst.weekday() >= 5:
        print(f"{ticker} - 현재 시간 {now_kst}. 주말에는 국내 주식을 수집하지 않습니다.")
        return

    # 해외 주식 및 금의 경우 주말에 데이터 수집 안 함 (뉴욕 시간 기준)
    if ticker in ["AAPL", "GOOGL", "TSLA"]:
        if now_est.weekday() >= 5:
            print(f"{ticker} - 현재 시간 {now_est}. 주말에는 해외 주식을 수집하지 않습니다.")
            return

  
    # 국내 주식: 9시 ~ 14시 30분
    if ticker.endswith(".KS"):
        if now_kst.hour < 9 or (now_kst.hour == 14 and now_kst.minute > 30) or now_kst.hour > 14:
            print(f"{ticker} - 현재 시간 {now_kst}. 국내 주식은 거래 시간이 아닙니다.")
            return

    # 금 선물 거래 시간 및 주말 확인
    # 금 선물:한국시간 기준 오전 7시 ~ 다음날 오전 6시
    # 금 선물: 뉴욕 시간 기준 오후 6시 ~ 다음날 오후 5시
    if ticker == "GC=F":
        if now_est.weekday() == 5 and now_est.hour >= 17:
            print(f"{ticker} - 현재 시간 {now_est}. 금 선물은 거래 시간이 아닙니다.")
            return
        elif now_est.weekday() == 6 and now_est.hour < 18:
            print(f"{ticker} - 현재 시간 {now_est}. 금 선물은 거래 시간이 아닙니다.")
            return

    # 해외 주식: 한국시간 기준 새벽 12시 00분 ~ 새벽 8시59분
    # 해외 주식: 뉴욕 시간 기준 오전 11시 00분 ~ 오후 7시 59분
    if ticker in ["AAPL", "GOOGL", "TSLA"]:
        if now_est.hour < 11 or now_est.hour >= 20:
            print(f"{ticker} - 현재 뉴욕 시간 {now_est}. 해외 주식은 거래 시간이 아닙니다.")
            return


    print(f"실시간 데이터 가져오기 시작: {now_kst} - {ticker}")

    # 데이터 다운로드 (1분 간격 데이터)
    # 데이터 다운로드 (1분 간격 데이터)
    try:
        new_data = yf.download(ticker, period=period, interval=interval)
        if new_data.empty:
            print(f"{ticker}에 대한 데이터 없음. 전송 중단.")
            return
    except KeyError as e:
        print(f"{ticker} 데이터 다운로드 중 키 에러 발생: {e}")
        return
    except Exception as e:
        print(f"{ticker} 데이터 다운로드 중 예상치 못한 에러 발생: {e}")
        return

    if new_data.empty:
        print(f"{ticker}에 대한 데이터 없음. 전송 중단.")
        return
    
    # 타임존에 맞게 시간 변환
    new_data.index = new_data.index.tz_convert(KST)

    # 가격 변환 (해외 주식과 금 선물은 원화로 변환)
    conversion_rate = 1200 if ticker in ["AAPL", "GOOGL", "TSLA", "GC=F"] else 1
    
    # 가장 최신 데이터 가져오기
    if ticker in ["AAPL", "GOOGL", "TSLA","GC=F"]:
        latest_timestamp = new_data.index[-2] + timedelta(minutes=10)
    else:
         latest_timestamp = new_data.index[-2] + timedelta(minutes=20)
    latest_data = new_data.iloc[-2]
    
    # 데이터를 전송할 준비
    data = {
        "open": float(latest_data['Open']) * conversion_rate,
        "close": float(latest_data['Close']) * conversion_rate,
        "high": float(latest_data['High']) * conversion_rate,
        "low": float(latest_data['Low']) * conversion_rate,
        "createdAt": latest_timestamp.strftime('%Y-%m-%dT%H:%M:%S'),
        "interval":interval,
    }
    
    print(f"전송할 데이터: {data}")
     # Spring Boot 서버로 데이터 전송
    stockId = ticker_to_id_map.get(ticker)
    try:
        response = requests.post(save_stock_history_url+"/"+str(stockId), json=data)
        print(data)
        if response.status_code == 200:
            print(f"데이터 전송 성공: {data}")
        else:
            print(f"데이터 전송 실패: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"요청 실패: {e}")

    return data

# 모든 종목 데이터를 가져오고 전송하는 함수
def fetch_and_send_data_all(interval):
    for ticker, stockId in ticker_to_id_map.items():
        fetch_and_send_data(ticker, stockId,interval)



# 뉴스 데이터 Spring Boot 서버로 전송 (모든 stockId에 대해 반복)
def send_news_data():
    for stockId in stock_mapping.keys():
        all_articles = crawl_news(stockId)

        if not all_articles:
            print(f"stockId {stockId}에 대한 뉴스가 없습니다.")
            continue

        try:
            print(f"stockId {stockId}에 대한 뉴스 본문 전송 시작")
            response = requests.post(save_news_URL + "/" + str(stockId), json=all_articles, headers={'Content-Type': 'application/json'})

            if response.status_code == 200:
                print(f"stockId {stockId}에 대한 뉴스 본문 전송 성공: {len(all_articles)}개 기사")
            else:
                print(f"stockId {stockId}에 대한 뉴스 본문 전송 실패: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            print(f"stockId {stockId}에 대한 요청 실패: {e}")


# 월드 뉴스 데이터를 Spring Boot 서버로 전송하는 함수 (모든 stockId에 대해 반복)
def send_worldNews_data():
    for stockId in world_stock_mapping.keys():
        all_world_news = crawl_world_news(stockId)
        if not all_world_news:
            print(f"stockId {stockId}에 대한 월드 뉴스가 없습니다.")
            continue

        try:
            print(f"stockId {stockId}에 대한 월드 뉴스 본문 전송 시작")
            response = requests.post(save_news_URL + "/" + str(stockId), json=all_world_news, headers={'Content-Type': 'application/json'})

            if response.status_code == 200:
                print(f"stockId {stockId}에 대한 월드 뉴스 본문 전송 성공: {len(all_world_news)}개 기사")
            else:
                print(f"stockId {stockId}에 대한 월드 뉴스 본문 전송 실패: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            print(f"stockId {stockId}에 대한 요청 실패: {e}")

# 월드 뉴스 데이터를 Spring Boot 서버로 전송하는 함수 (모든 stockId에 대해 반복)
def send_goldNews_data():
    
    all_world_gold_news = crawl_gold_news()
    if not crawl_gold_news:
        print(f"stockId {5}에 대한 월드 뉴스가 없습니다.")
        return
    try:
        print(f"stockId {5}에 대한 월드 뉴스 본문 전송 시작")
        response = requests.post(save_news_URL + "/" + str(5), json=all_world_gold_news, headers={'Content-Type': 'application/json'})

        if response.status_code == 200:
            print(f"stockId {5}에 대한 월드 뉴스 본문 전송 성공: {len(all_world_gold_news)}개 기사")
        else:
            print(f"stockId {5}에 대한 월드 뉴스 본문 전송 실패: {response.status_code}")
    
    except requests.exceptions.RequestException as e:
        print(f"stockId {5}에 대한 요청 실패: {e}")


# 리포트 데이터를 Spring Boot 서버로 전송하는 함수
def send_reports_to_springboot():
    for stockId in stock_mapping_report.keys():
        reports = crawl_reports(stockId)

        if not reports:
            print(f"stockId {stockId}에 대한 리포트가 없습니다.")
            continue

        try:
            print(f"stockId {stockId}에 대한 리포트 본문 전송 시작")
            response = requests.post(save_report_URL + "/" + str(stockId), json=reports, headers={'Content-Type': 'application/json'})

            if response.status_code == 200:
                print(f"stockId {stockId}에 대한 리포트 본문 전송 성공: {len(reports)}개 리포트")
            else:
                print(f"stockId {stockId}에 대한 리포트 본문 전송 실패: {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"stockId {stockId}에 대한 요청 실패: {e}")

# FastAPI에서 모든 데이터를 가져오고 한꺼번에 전송하는 함수
def fetch_and_send_all_historical_data(ticker, stockId, interval):
    print(ticker);
    print(stockId);
    # 데이터 다운로드
    try:
        # 충분한 기간을 지정하여 각 주기의 모든 데이터를 가져옵니다.
        period = "max"  # 최대한 긴 기간의 데이터를 가져옵니다.
        new_data = yf.download(ticker, period=period, interval=interval)
    except ValueError as e:
        print(f"{ticker} 데이터 다운로드 중 에러 발생: {e}")
        return

    if new_data.empty:
        print(f"{ticker}에 대한 데이터 없음. 전송 중단.")
        return

    # 타임존에 맞게 시간 변환 (tz-naive인지 tz-aware인지 확인 후 처리)
    if new_data.index.tz is None:
        # tz-naive일 경우 타임존 설정
        new_data.index = new_data.index.tz_localize('UTC').tz_convert(KST)
    else:
        # 이미 tz-aware일 경우 변환만 수행
        new_data.index = new_data.index.tz_convert(KST)

    # 가격 변환 (해외 주식과 금 선물은 원화로 변환)
    conversion_rate = 1200 if ticker in ["AAPL", "GOOGL", "TSLA", "GC=F"] else 1

    # 데이터를 JSON 형태로 변환
    all_data = []
    for timestamp, row in new_data.iterrows():
        data = {
            "stockId": stockId,
            "open": float(row['Open']) * conversion_rate,
            "close": float(row['Close']) * conversion_rate,
            "high": float(row['High']) * conversion_rate,
            "low": float(row['Low']) * conversion_rate,
            "createdAt": timestamp.strftime('%Y-%m-%dT%H:%M:%S'),
            "interval": interval,
        }
        all_data.append(data)

    # Spring Boot 서버로 데이터 전송
    try:
        response = requests.post(save_stock_history_url + "/bulk", json=all_data)
        if response.status_code == 200:
            print(f"{ticker}에 대한 전체 데이터 전송 성공 (주기: {interval})")
        else:
            print(f"{ticker}에 대한 전체 데이터 전송 실패 (주기: {interval}): {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"요청 실패 (주기: {interval}): {e}")






#현재 시간 가져오기
now = datetime.now(KST)

# 1분마다 모든 종목에 대해 데이터를 가져오고 전송하는 스케줄러 설정 (1분 간격 데이터)
scheduler.add_job(fetch_and_send_data_all, 'interval', minutes=1, args=["1m"])

# 매일 데이터를 가져오고 전송하는 스케줄러 설정 (하루 간격 데이터)
scheduler.add_job(fetch_and_send_data_all, 'cron', hour=0, minute=0, args=["1d"])

# 매주 데이터를 가져오고 전송하는 스케줄러 설정 (일주일 간격 데이터)
scheduler.add_job(fetch_and_send_data_all, 'cron', day_of_week='mon', hour=0, minute=0, args=["1wk"])

# 매달 데이터를 가져오고 전송하는 스케줄러 설정 (한 달 간격 데이터)
scheduler.add_job(fetch_and_send_data_all, 'cron', day=1, hour=0, minute=0, args=["1mo"])

# 국내주식 뉴스 기사를 가져오고 바로 본문을 가져오도록 스케줄러 설정
scheduler.add_job(send_news_data,  trigger=CronTrigger(hour=9, minute=5))
#scheduler.add_job(send_news_data, trigger=DateTrigger(run_date=now))

# 리포트를 가져오고 바로 본문을 가져오도록 스케줄러 설정
scheduler.add_job(send_reports_to_springboot,  trigger=CronTrigger(hour=9, minute=10)) #'cron', hour=13, minute=24, timezone=KST)
#scheduler.add_job(send_reports_to_springboot, trigger=DateTrigger(run_date=now))

# 해외주식 뉴스기사를 가져오고 바로 본문을 가져오도록 스케줄러 설정
#scheduler.add_job(send_reports_to_springboot, trigger=DateTrigger(run_date=now))
scheduler.add_job(send_worldNews_data,  trigger=CronTrigger(hour=9, minute=15))

#금 뉴스 기사를 가져오고 바로 본문을 가져오도록 스케줄러 설정
scheduler.add_job(send_goldNews_data,  trigger=CronTrigger(hour=9, minute=20))

# Lifespan 이벤트 핸들러 사용
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    print("스케줄러가 시작되었습니다.")
    yield
    scheduler.shutdown()
    print("스케줄러가 종료되었습니다.")

app = FastAPI(root_path="/fastapi",lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "스케줄러가 실행 중입니다."}

@app.get("/bulk")
def send_bulk_data():
    intervals = ["1m", "1d", "1wk", "1mo"]  # 모든 주기
    for interval in intervals:
        for ticker, stockId in ticker_to_id_map.items():
            fetch_and_send_all_historical_data(ticker, stockId, interval)
    return {"message": "모든 주기에 대한 데이터가 Spring Boot 서버로 전송되었습니다."}
# 앱 실행 명령어
# uvicorn main:app --reload --port 8082


# 앱 실행 명령어
# uvicorn app:app --reload --port 8082
# uvicorn.run(app, host="0.0.0.0", port=8082, reload=true)
