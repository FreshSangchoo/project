FROM python:3.10

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV PYTHONPATH=/app
EXPOSE 8082

# FastAPI 서버를 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]