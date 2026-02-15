FROM bellsoft/liberica-openjdk-alpine:17

# 애플리케이션 파일 복사
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar
COPY /.env .env

# 컨테이너에서 사용할 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app.jar"]
