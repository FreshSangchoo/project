# Step 1: Amazon Corretto 17을 베이스 이미지로 선택
FROM amazoncorretto:17

# Step 2: 작업 디렉토리 설정
WORKDIR /app

# Step 3: 빌드된 JAR 파일을 Docker 이미지에 복사
COPY build/libs/donzoom.jar /app/donzoom.jar

# Step 4: 컨테이너 포트 노출
EXPOSE 8081

# Step 5: config 파일을 위한 볼륨 마운트 설정
VOLUME /config

# Step 6: 컨테이너가 실행될 때 JAR 파일을 실행하고 /config 경로의 설정 파일을 사용하도록 설정
ENTRYPOINT ["java", "-jar", "/app/donzoom.jar", "--spring.config.location=/config/application.properties"]
