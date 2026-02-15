package com.example.donzoom.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileUploadUtil {

  @Value("${file.upload-dir}")
  private String uploadDir;

  @Value("${backend.uri}")
  private String serverUrl;

  @Value("${server.servlet.context-path}")
  private String contextPath;

  public String saveFile(MultipartFile file, String fileName) throws IOException {
    // 파일 확장자 추가
    String fileExtension = getFileExtension(file.getOriginalFilename());
    String fullFileName = fileName + "." + fileExtension;

    // 파일 경로 설정
    Path filePath = Paths.get(uploadDir, fullFileName);

    // 디렉터리 생성 및 파일 저장
    Files.createDirectories(filePath.getParent());
    Files.copy(file.getInputStream(), filePath);

    // 저장된 파일의 전체 URL을 반환
    return serverUrl + contextPath + "/uploads/" + fullFileName;
  }

  public String saveFile(MultipartFile file) throws IOException {
    // 원래 파일 이름 가져오기
    String originalFileName = file.getOriginalFilename();
    String fileExtension = getFileExtension(originalFileName);

    // UUID를 사용하여 고유한 파일 이름 생성
    String uniqueFileName = UUID.randomUUID() + "." + fileExtension;

    // 파일 경로 설정
    Path filePath = Paths.get(uploadDir, uniqueFileName);

    // 디렉터리 생성 및 파일 저장
    Files.createDirectories(filePath.getParent());
    Files.copy(file.getInputStream(), filePath);

    // 저장된 파일의 전체 URL을 반환 (서버 URL + 파일 경로)
    return serverUrl + contextPath + "/uploads/" + uniqueFileName;
  }

  // 파일 확장자 가져오기
  private String getFileExtension(String fileName) {
    if (fileName != null && fileName.contains(".")) {
      return fileName.substring(fileName.lastIndexOf(".") + 1);
    } else {
      return "";  // 확장자가 없는 경우
    }
  }
}
